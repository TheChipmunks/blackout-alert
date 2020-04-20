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
		const eventSQL = 'INSERT INTO events (company, city, street, date, time, reason) VALUES ?';

		this.pool.query(`DELETE FROM events`, '', (error, res) => {
			if (error) {
				callback({ success: false, error });
				return;
			}
			this.pool.getConnection((err, connection) => {
				data.events.map(async event => {
					const region = await this.getCompany(connection, event.region);
					console.log({ region });
				});
				callback({ success: true });
			});
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
					console.log(res[0].id);
					resolve(res[0].id);
				});
			});
			if (!selected) {
				selected = await new Promise((resolve, reject) => {
					connection.query(`INSERT INTO regions (name) VALUES ('${region}')`, '', (error, res) => {
						console.log({ insertId: res.insertId });
						resolve(res.insertId);
					});
				});
			}
			console.log(selected);
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
