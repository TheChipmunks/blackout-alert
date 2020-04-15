import * as dotenv from "dotenv";

dotenv.config();

export default {
	HOST: process.env.DB_HOST || '127.0.0.1',
	USER: process.env.DB_USER || 'root',
	PORT: process.env.DB_PORT || 3306,
	PASS: process.env.DB_PASS || '',
	NAME: process.env.DB_NAME || 'blackout',
	CONNECTION_LIMIT: process.env.DB_CONNECTION_LIMIT || 100
};
