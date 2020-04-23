import express, { Request, Response } from 'express';
import IControllerBase from 'interfaces/IControllerBase.interface';
import { range, rangeFromIrregularNumbers } from '../../utilits';
import database, { DBResponse } from '../../database';
import { EventType, IConvertedDBStructure, IConvertedEvent, IConvertedHouse, IPlace, IScrapedRow, IStreet } from './scrapper.interface';
import { logger } from '../../middleware/logger';
import axios from 'axios';
// MOCKS
import plannedHTML from './mocks/plannedHTML.json';
import outagesHTML from './mocks/outagesHTML.json';
import content from './mocks/parseMainContent.json';

import moment = require('moment');

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

class ScrapperController implements IControllerBase {
	public path = '/scraper';
	public router = express.Router();

	constructor() {
		this.initRoutes();
		this.scrape();
	}

	public initRoutes() {
		this.router.get(this.path, this.scrape);
	}

	scrape = async (req?: Request, res?: Response) => {
		logger.startTimeEvents();
		const planned_response = await axios.get('https://ksoe.com.ua/disconnection/planned/');
		const outages_response = await axios.get('https://ksoe.com.ua/disconnection/outages/');
		logger.timeEvent('fetch HTML');
		const planned_dom = new JSDOM(planned_response.data);
		const planned_html = planned_dom.window.document;
		const outages_dom = new JSDOM(outages_response.data);
		const outages_html = outages_dom.window.document;
		logger.timeEvent('create DOM');
		const planned_content = planned_html.querySelector('.table').querySelector('tbody').querySelectorAll(' tr');
		const outages_content = outages_html.querySelector('.table').querySelector('tbody').querySelectorAll(' tr');
		const planned_rows = Array.apply(null, planned_content);
		const outages_rows = Array.apply(null, outages_content);
		const rows = planned_rows.concat(outages_rows);
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
						data.places = this.parseMainContentFrom(td.innerHTML);
						break;
					case 2:
						data.reason = td.textContent;
						break;
					case 3:
						data.time = td.textContent;
						break;
					case 4:
						data.type = EventType.outages;
						data.publish_time = td.textContent;
						break;
				}
				return data;
			}, {});
			scrapedRow.date = prevDate;
			if (!scrapedRow.type) scrapedRow.type = EventType.planned;
			return scrapedRow;
		}).filter(el => !!el);
		logger.timeEvent('parse HTML');
		const convertedData = this.convertStructure(dates);
		logger.timeEvent('convert data');
		database.saveScrapedData(convertedData, (response: DBResponse) => {
			logger.timeEvent('save in database');
			// res && res.status(response.success ? 200 : 409).send({ response });
			logger.endTimeEvents();
			process.exit();
		});
	};

	parseMainContentFrom(origin: string): IPlace[] {
		let splitted = origin.split(/<br>/);
		splitted = splitted.filter((item, index, array) => {
			if (item === '') return false;
			return !(!!item.match('<b>(.*)</b>') && array[index + 1] && !!array[index + 1].match('<b>(.*)</b>'));
		});
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
			const name = item.match(/(^\d*['`"\. А-ЩЬЮЯҐЄІЇа-щьюяґєіїA-Za-z]{2,}([А-ЩЬЮЯҐЄІЇа-щьюяґєіїA-Za-z]\d*))+/ig);
			const numbers = item.match(/(\ \d{1,}[А-ЩЬЮЯҐЄІЇа-щьюяґєії]?-{0,2}\d*\/?\d*[А-ЩЬЮЯҐЄІЇа-щьюяґєії]?)+/ig);
			const oldName = item.match(/(\([ А-ЩЬЮЯҐЄІЇа-щьюяґєії]{2,}\))+/ig);
			if (!numbers) return;
			return {
				name: name && name[0] ? name[0].trim() : null,
				oldName: oldName && oldName[0] ? oldName[0].replace('(', '').replace(')', '').trim() : null,
				numbers: numbers.map(el => {
					let number = el.trim();
					if (number.includes('--')) number = number.replace('--', '-');
					const matches = number.match(/(.*)-(.*)/);
					if (matches && matches.length > 2) {
						if (+matches[2] && +matches[2] > 1000) return number;
						return rangeFromIrregularNumbers(matches[1], matches[2]);
					}
					return number;
				}).flat(),
				originNumbers: item
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
							origin_numbers: `${street.originNumbers}`
						};
						return num;
					});
					const event: IConvertedEvent = {
						region: row.region,
						city: place.city,
						date: row.date,
						time: row.time,
						publish_time: row.publish_time,
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
