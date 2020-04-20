import * as mysql from 'mysql';
import config from './config';
import { IConvertedDBStructure } from '../controllers/scrapper/scrapper.interface';
import { mysql_real_escape_string } from '../utilits';
import moment = require('moment');

const { HOST, USER, PORT, PASS, NAME, CONNECTION_LIMIT } = config;


export interface DBResponse {
	success: boolean;
	data?: object;
	error?: object;
}

class DB {
	public pool: any;

	constructor() {
		this.pool = null;
		this.getCompany = this.getCompany.bind(this);
		this.saveScrapedData = this.saveScrapedData.bind(this);
	}

	createDBPool() {
		this.pool = mysql.createPool({
			timezone: 'UTC',
			dateStrings: true,
			host: HOST,
			user: USER,
			port: PORT,
			password: PASS,
			database: NAME,
			connectionLimit: CONNECTION_LIMIT
		});
	}

	saveScrapedData(data: IConvertedDBStructure, callback: (response: DBResponse) => void) {
		const eventSQL = 'INSERT INTO events (region, city, street, type, date, time, reason) VALUES ?';

		this.pool.getConnection(async (err, connection) => {
			for await (let event of data.events) {
				if (moment(event.date).diff(moment(), 'days') === 0) continue;
				const region = await this.getCompany(connection, event.region);
				const city = await this.getCity(connection, event.city);

				const response = await new Promise((resolve, reject) => {
					connection.query(eventSQL, [[[region, city, 1, event.type, event.date, event.time, event.reason]]], (error, result) => {
						// console.log(error);
						resolve();
					});
				});
				// console.log({ city, name: event.city, response });

			}
			callback({ success: true });
		});
	}

	async getCompany(connection, region: string) {
		return new Promise(async (resolve, rej) => {
			let selected = await new Promise((resolve, reject) => {
				connection.query(`SELECT id FROM regions WHERE name LIKE '${region}'`, '', (error, res) => {
					if (!res.length) {
						resolve(undefined);
						return;
					}
					resolve(res[0].id);
				});
			});
			if (!selected) {
				selected = await new Promise((resolve, reject) => {
					connection.query(`INSERT INTO regions (name) VALUES ('${region}')`, '', (error, res) => {
						resolve(res.insertId);
					});
				});
			}
			resolve(selected);
		});
	}

	async getCity(connection, city: string) {
		return new Promise(async (resolve, rej) => {
			let selected = await new Promise((resolve, reject) => {
				connection.query(`SELECT id FROM cities WHERE name LIKE '${mysql_real_escape_string(city)}'`, '', (error, res) => {
					if (error) console.error(error);
					if (!res.length) {
						resolve(undefined);
						return;
					}
					resolve(res[0].id);
				});
			});
			if (!selected) {
				selected = await new Promise((resolve, reject) => {
					connection.query(`INSERT INTO cities (name) VALUES ('${mysql_real_escape_string(city)}')`, '', (error, res) => {
						resolve(res.insertId);
					});
				});
			}
			resolve(selected);
		});
	}

	findStreet(req: { city?: string, street: string }, callback: (response: DBResponse) => void) {
		this.pool.query('SELECT * FROM some', '', (error, _data) => {
			let data = [];
			for (let item of _data) {
				if (data.find(el => el[0] === item.name_1)) continue;
				data.push([item.name_1, item.name_5, item.name_2, item.name_4, item.name_3]);
			}


			// const uniqueArray = data.filter((thing, index) => {
			// 	const _thing = JSON.stringify(thing);
			// 	return index === thing.findIndex(obj => {
			// 		return JSON.stringify(obj) === _thing;
			// 	});
			// });
			callback({ success: true, data });
		});
		return;
		const conditions = {
			onlyStreet: `WHERE street_name LIKE '${req.street}%' OR street_old_name LIKE '${req.street}%'`,
			cityAndStreet: `WHERE city LIKE '${req.city}' AND (street_name LIKE '${req.street}%' OR street_old_name LIKE '${req.street}%')`
		};
		const sql = `SELECT streets.*, GROUP_CONCAT(numbers.number SEPARATOR ', ') as houses FROM streets 
											LEFT JOIN numbers ON streets.street_id = numbers.street_id 
											${!req.city ? conditions.onlyStreet : conditions.cityAndStreet}
											GROUP BY streets.street_id`;
		this.pool.query(sql, '', (error, data) => {
			if (error) {
				callback({ success: false, error });
				return;
			}
			callback({ success: true, data: data });
		});
	}

}

const database = new DB();

export default database;
