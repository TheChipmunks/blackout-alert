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

	saveScrappedData(data: IConvertedDBStructure, callback: (response: DBResponse) => void) {
		const streets = data.streets.map(item => [item.street_id, item.street_name, item.street_old_name, item.street_origin, item.date, item.time, item.reason]);
		const numbers = data.numbers.map(item => [item.street_id, item.number, item.origin_numbers]);
		const streetsSQL = 'INSERT INTO streets (street_id, street_name, street_old_name, street_origin, date, time, reason) VALUES ?';
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

	searchByStreetName(text: string, callback: (response: DBResponse) => void) {
		this.pool.query(`SELECT streets.*, GROUP_CONCAT(numbers.number SEPARATOR ', ') as houses 
											FROM streets 
											LEFT JOIN numbers ON streets.street_id = numbers.street_id 
											WHERE street_name LIKE '${text}%' OR street_old_name LIKE '${text}%'
											GROUP BY streets.street_id `, '', (error, data) => {
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
