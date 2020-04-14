import * as express from 'express';
import { Request, Response } from 'express';
import IControllerBase from 'interfaces/IControllerBase.interface';
import { range } from '../../utilits';
import axios from 'axios';
import moment = require('moment');

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

class ScrapperController implements IControllerBase {
	public path = '/scrapper';
	public router = express.Router();

	constructor() {
		this.initRoutes();
	}

	public initRoutes() {
		this.router.get(this.path, this.scrape(this));
	}

	scrape = (that: ScrapperController) => async (req: Request, res: Response) => {
		const response = await axios.get('https://ksoe.com.ua/disconnection/planned/');

		const dom = new JSDOM(response.data);

		const html = dom.window.document;
		const content = html.querySelector('.table').querySelector('tbody').querySelectorAll(' tr');
		const array = Array.apply(null, content);
		let prevDate = null;
		const dates = array.reduce((acc, item) => {
			if (item.cells.length === 1) {
				const date = moment(item.querySelector('td').innerHTML, "D.M.YYYY").format('YYYY-MM-DD');
				acc[date] = [];
				prevDate = date;
				return acc;
			}
			if (item.querySelector('td').innerHTML !== 'Херсонські РЕМ') return acc;


			const data = Array.apply(null, item.querySelectorAll('td')).reduce((acc, item, index) => {
				switch (index) {
					case 0:
						acc['company'] = item.innerHTML;
						break;
					case 1:
						acc['place'] = {
							city: item.querySelector('b').innerHTML,
							streets: that.getStreets(item)
						};
						break;
					case 2:
						acc['reason'] = item.innerHTML;
						break;
					case 3:
						acc['time'] = item.innerHTML;
						break;

				}
				return acc;
			}, {});
			if (data.place.city === 'Херсон' && data.place.streets.length) {
				acc[prevDate].push(data);
			}
			return acc;
		}, {});

		res.send(dates);
		// console.log(JSON.stringify(dates));
	};


	getStreets = (td) => {
		const inner = td.innerHTML;

		if (!inner.includes('Херсон')) {
			// console.log(`Don't includes Херсон in`, td);
			return [];
		}
		function check(result) {
			return Boolean(result && result[1]);
		}

		let reg = '';
		let regAlt = '';
		const val = td.querySelectorAll('br').length;
		switch (val) {
			case 4:
				reg = '<br><br>(.*)<br><br>';
				break;
			case 2:
				reg = '<br>(.*)<br>';
				regAlt = '<br><br>(.*)';
				break;
			case 1:
				reg = '<br>(.*)';
				break;
			case 0 :
				break;
			default:
				reg = '<b>Херсон</b>: <br>(.*)<br>';
				break;
		}

		if (!reg) {
			console.log(`Can't find reg of ${td.innerHTML}`);
			return [];
		}
		let result = inner.match(reg);

		if (!check(result)) {
			result = inner.match(regAlt);
			if (!check(result)) return [];
		}


		const streets = result[1].split(';').map(item => {
			if (!item || item === ' ') return;
			const name = item.match(/(^\d*['`" А-ЩЬЮЯҐЄІЇа-щьюяґєії]{2,}([А-ЩЬЮЯҐЄІЇа-щьюяґєії]\d*))+/ig);
			const numbers = item.match(/(\ \d{1,}-{0,2}\d*\/?\d*[А-ЩЬЮЯҐЄІЇа-щьюяґєії]?)+/ig);
			const oldName = item.match(/(\([ А-ЩЬЮЯҐЄІЇа-щьюяґєії]{2,}\))+/ig);
			if (!numbers) return;
			return {
				name: name && name[0] ? name[0].trim() : null,
				oldName: oldName && oldName[0] ? oldName[0].replace('(', '').replace(')', '').trim() : null,
				numbers: numbers.map(el => {
					const number = el.trim();
					if (number.includes('-')) {
						const points = number.split('-');
						const start = Number(points[0]);
						const end = Number(points[1]);
						if (start && end && end < 1000) {
							return range(start, end, 1);
						}
						return number;
					} else {
						return number;
					}
				}).flat()
			};
		});

		return streets;
	};
}

export default ScrapperController;
