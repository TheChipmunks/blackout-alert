import * as mysql from 'mysql';
import config from './config';
import { IConvertedDBStructure } from '../controllers/scrapper/scrapper.interface';

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
		const streets = data.streets.map(item => [item.street_id, item.company, item.city, item.street_name, item.street_old_name, item.street_origin, item.date, item.time, item.reason]);
		const numbers = data.numbers.map(item => [item.street_id, item.number, item.origin_numbers]);
		const streetsSQL = 'INSERT INTO streets (street_id, company, city, street_name, street_old_name, street_origin, date, time, reason) VALUES ?';
		const numbersSQL = 'INSERT INTO numbers (street_id, number, origin_numbers) VALUES ?';

		this.pool.query(`DELETE FROM numbers`, '', (error, res) => {
			if (error) {
				callback({ success: false, error });
				return;
			}
			this.pool.query(`DELETE FROM streets`, '', (error, res) => {
				if (error) {
					callback({ success: false, error });
					return;
				}
				this.pool.query(streetsSQL, [streets], (error, result) => {
					if (error) {
						callback({ success: false, error });
						return;
					}
					this.pool.query(numbersSQL, [numbers], (error, result) => {
						if (error) {
							callback({ success: false, error });
							return;
						}
						callback({ success: true });
					});
				});
			});
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
			return
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
