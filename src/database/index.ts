import * as mysql from 'mysql';
import config from './config';

const { HOST, USER, PORT, PASS, NAME, CONNECTION_LIMIT } = config;


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
	async clearTable(tableName: string) {
		this.pool.query(`DELETE FROM ${tableName}`, (error) => {
			return !error
		})
	}
}

const database = new DB();

export default database;
