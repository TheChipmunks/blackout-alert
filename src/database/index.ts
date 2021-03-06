import * as mysql from 'mysql';
import config from './config';
import { IConvertedDBStructure } from '../controllers/scrapper/scrapper.interface';
import { mysqlString } from '../utilits';
import moment = require('moment');
import { logger } from '../middleware/logger';
import crypto from 'crypto';

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
		this.pool.getConnection((err, connection) => {
			logger.startProcessing('Import', data.events.length);
			connection.query('DELETE FROM events WHERE date >= NOW()', '', async error => {
				if (error) throw error;
				for await (let event of data.events) {
					if (moment(event.date).diff(moment(), 'days') < 0) {
						logger.increaseProgress();
						continue;
					}

					const region = await this.setValue(connection,
						`SELECT id FROM regions WHERE name LIKE '${event.region}'`,
						`INSERT INTO regions (name) VALUES ('${event.region}')`,
						'');

					const city = await this.setValue(connection,
						`SELECT id FROM cities WHERE name LIKE '${mysqlString(event.city)}' AND region_id LIKE '${region}'`,
						`INSERT INTO cities (region_id, name) VALUES ?`,
						[[[region, event.city]]]);

					const street = await this.setValue(connection,
						`SELECT id FROM streets WHERE name LIKE '${mysqlString(event.street_name)}' AND city_id LIKE '${city}'`,
						`INSERT INTO streets (name, city_id, old_name, origin) VALUES ?`,
						[[[event.street_name, city, event.street_old_name, event.street_origin]]]
					);
					const reason_hash = crypto.createHash('md5').update(event.reason).digest('hex');
					const reason_id = await this.setValue(connection,
						`SELECT id FROM reasons WHERE hash LIKE '${reason_hash}'`,
						`INSERT INTO reasons (reason, hash) VALUES ?`,
						[[[event.reason, reason_hash]]]
					);
					const event_id = await this.setValue(connection,
						`SELECT id FROM events WHERE 
						city_id LIKE ${city} AND
						type LIKE ${event.type} AND 
						date LIKE '${moment(event.date).format('YYYY-MM-DD')}' AND 
						time LIKE '${event.time}' AND 
						reason_id LIKE '${reason_id}'`,
						'INSERT INTO events (city_id, type, publish_time, date, time, reason_id) VALUES ?',
						[[[city, event.type, event.publish_time, event.date, event.time, reason_id]]]);

					for await (let house of event.houses) {
						const house_id = await this.setValue(connection,
							`SELECT id FROM houses WHERE street_id LIKE '${street}' AND number LIKE '${house.number}'`,
							`INSERT INTO houses (street_id, number, origin) VALUES ?`,
							[[[street, house.number, house.origin_numbers]]]
						);
						await this.setValue(connection,
							`SELECT house_id as id FROM house_events WHERE house_id LIKE '${house_id}' AND event_id LIKE '${event_id}'`,
							`INSERT INTO house_events (house_id, event_id) VALUES ?`,
							[[[house_id, event_id]]]
						);
					}
					logger.increaseProgress();
				}
				logger.stopProcessing('Import');
				callback({ success: true });
			});

		});
	}


	selectValue(connection, selectSQL) {
		return new Promise(async (resolve, rej) => {
			let selected = await new Promise((resolve, reject) => {
				connection.query(selectSQL, '', (error, res) => {
					if (error) console.log(error);
					if (!res.length) {
						resolve(undefined);
						return;
					}
					resolve(res[0]);
				});
			});
			resolve(selected);
		});
	}

	setValue(connection, selectSQL, insertSQL, insertData) {
		return new Promise(async (resolve, rej) => {
			let selected = await new Promise((resolve, reject) => {
				connection.query(selectSQL, '', (error, res) => {
					if (error) console.log(error);
					if (!res.length) {
						resolve(undefined);
						return;
					}
					resolve(res[0].id);
				});
			});
			if (!selected) {
				selected = await new Promise((resolve, reject) => {
					connection.query(insertSQL, insertData, (error, res) => {
						if (error) console.log(error);
						resolve(res.insertId);
					});
				});
			}
			resolve(selected);
		});
	}


	findStreet(req: { city?: string, street: string }, callback: (response: DBResponse) => void) {
		// 	this.pool.query('SELECT * FROM some', '', (error, _data) => {
		// 		let data = [];
		// 		for (let item of _data) {
		// 			if (data.find(el => el[0] === item.name_1)) continue;
		// 			data.push([item.name_1, item.name_5, item.name_2, item.name_4, item.name_3]);
		// 		}
		//
		//
		// 		// const uniqueArray = data.filter((thing, index) => {
		// 		// 	const _thing = JSON.stringify(thing);
		// 		// 	return index === thing.findIndex(obj => {
		// 		// 		return JSON.stringify(obj) === _thing;
		// 		// 	});
		// 		// });
		// 		callback({ success: true, data });
		// 	});
		// 	return;
		// 	const conditions = {
		// 		onlyStreet:
		// 			`WHERE street_name LIKE '${req.street}%' OR street_old_name LIKE '${req.street}%'`
		// 		,
		// 		cityAndStreet:
		// 			`WHERE city LIKE '${req.city}' AND (street_name LIKE '${req.street}%' OR street_old_name LIKE '${req.street}%')`
		//
		//
		// 	};
		// 	const sql =
		//
		//
		// 		`SELECT streets.*, GROUP_CONCAT(numbers.number SEPARATOR ', ') as houses FROM streets
		// 				LEFT JOIN numbers ON streets.street_id = numbers.street_id
		// 				${!req.city ? conditions.onlyStreet : conditions.cityAndStreet}
		// 				GROUP BY streets.street_id`
		//
		//
		// 	;
		// 	this.pool.query(sql, '', (error, data) => {
		// 		if (error) {
		// 			callback({ success: false, error });
		// 			return;
		// 		}
		// 		callback({ success: true, data: data });
		// 	});
	}

}

const database = new DB();

export default database;
