import * as express from 'express';
import { Request, Response } from 'express';
import IControllerBase from 'interfaces/IControllerBase.interface';
import { range, rangeFromIrregularNumbers } from '../../utilits';
import axios from 'axios';
import database, { DBResponse } from '../../database';
import { EventType, IConvertedDBStructure, IConvertedEvent, IConvertedHouse, IPlace, IScrapedRow, IStreet } from './scrapper.interface';
import { logger } from '../../middleware/logger';
import moment = require('moment');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

class ScrapperController implements IControllerBase {
	public path = '/scraper';
	public router = express.Router();

	constructor() {
		this.initRoutes();
	}

	public initRoutes() {
		this.router.get(this.path, this.scrape(this));
	}

	scrape = (that: ScrapperController) => async (req: Request, res: Response) => {
		logger.startTimeEvents();
		const response = await axios.get('https://ksoe.com.ua/disconnection/planned/');
		logger.timeEvent('fetch HTML');
		const dom = new JSDOM(response.data);
		const html = dom.window.document;
		logger.timeEvent('create DOM');
		const content = html.querySelector('.table').querySelector('tbody').querySelectorAll(' tr');
		const rows = Array.apply(null, content);
		let prevDate = null;
		const dates: IScrapedRow[] = rows.map(tr => {
			if (tr.cells.length === 1) {
				prevDate = moment(tr.querySelector('td').textContent, 'D.M.YYYY').format('YYYY-MM-DD hh:mm:ss');
				return;
			}
			let scrapedRow = Array.apply(null, tr.getElementsByTagName('td')).reduce((data: IScrapedRow, td, index) => {
				switch (index) {
					case 0:
						data.region = td.textContent;
						break;
					case 1:
						data.origin = td.textContent;
						data.places = that.parseMainContentFrom(td.innerHTML);
						break;
					case 2:
						data.reason = td.textContent;
						break;
					case 3:
						data.time = td.textContent;
						break;
				}
				return data;
			}, {});
			scrapedRow.date = prevDate;
			scrapedRow.type = EventType.planned;
			return scrapedRow;
		}).filter(el => !!el);
		logger.timeEvent('parse HTML');
		const convertedData = that.convertStructure(dates);
		logger.timeEvent('convert data');
		database.saveScrapedData(convertedData, (response: DBResponse) => {
			logger.timeEvent('save in database');
			res.status(response.success ? 200 : 409).send({ response });
			logger.endTimeEvents();
		});
	};

	parseMainContentFrom(origin: string): IPlace[] {
		let splitted = origin.split(/<br>/);
		splitted = splitted.filter(el => el !== '');
		if (splitted.length % 2) splitted.pop();
		const places: IPlace[] = splitted.reduce((acc: IPlace[], item, index, array) => {
			if (index % 2) return acc;
			const streets = this.getStreetsFrom(array[index + 1]).filter(el => el !== null);
			const city = array[index].replace('<b>', '').replace(':', '').replace('</b>', '').trim();
			if (!streets.length) return acc;
			acc.push({ city, streets: streets, origin });
			return acc;
		}, []);
		return places;
	}

	getStreetsFrom(string: string): IStreet[] {
		return string.split(';').map(item => {
			if (!item || item === ' ') return;
			const name = item.match(/(^\d*['`"\. А-ЩЬЮЯҐЄІЇа-щьюяґєії]{2,}([А-ЩЬЮЯҐЄІЇа-щьюяґєії]\d*))+/ig);
			const numbers = item.match(/(\ \d{1,}-{0,2}\d*\/?\d*[А-ЩЬЮЯҐЄІЇа-щьюяґєії]?)+/ig);
			const oldName = item.match(/(\([ А-ЩЬЮЯҐЄІЇа-щьюяґєії]{2,}\))+/ig);
			if (!numbers) return;
			return {
				name: name && name[0] ? name[0].trim() : null,
				oldName: oldName && oldName[0] ? oldName[0].replace('(', '').replace(')', '').trim() : null,
				numbers: numbers.map(el => {
					let number = el.trim();
					if (number.includes('--')) number = number.replace('--', '-');
					if (number.includes('-')) {
						const points = number.split('-');
						const start = points[0];
						const end = points[1];
						if (+start && +end && +end < 1000) {
							return range(+start, +end, 1);
						}
						const matches = number.match(/(.*)-(.*)/);
						if (matches && matches.length > 2) {
							return rangeFromIrregularNumbers(matches[1], matches[2]);
						}
						return number;
					} else {
						return number;
					}
				}).flat(),
				originNumbers: numbers.map(el => el.trim())
			};
		}).filter(el => !!el);
	}

	convertStructure(scrapedRow: IScrapedRow[]): IConvertedDBStructure {
		return scrapedRow.reduce((acc: IConvertedDBStructure, row) => {
			const places = row.places.reduce((acc: IConvertedDBStructure, place) => {
				const events = place.streets.reduce((acc: IConvertedDBStructure, street) => {
					if (!street) return acc;
					const houses: IConvertedHouse[] = street.numbers.map((number) => {
						const num: IConvertedHouse = {
							number,
							origin_numbers: `${street.numbers}`
						};
						return num;
					});
					const event: IConvertedEvent = {
						region: row.region,
						city: place.city,
						date: row.date,
						time: row.time,
						street_name: street.name,
						street_old_name: street.oldName,
						street_origin: place.origin,
						reason: row.reason,
						houses,
						type: row.type
					};

					return { events: [...acc.events, event] };
				}, { events: [] });
				return { events: [...acc.events, ...events.events] };
			}, { events: [] });
			return { events: [...acc.events, ...places.events] };
		}, { events: [] });
	}
}

export default ScrapperController;
