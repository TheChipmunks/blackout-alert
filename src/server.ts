import App from './app';
import * as bodyParser from 'body-parser';
import loggerMiddleware from './middleware/logger';
import ScrapperController from './controllers/scrapper/scrapper.controller';
import database from './database';
import SearchController from './controllers/search/search.controller';
import * as dotenv from "dotenv";
dotenv.config();

const app = new App({
	port: process.env.PORT || '5000',
	controllers: [
		new ScrapperController(),
		new SearchController()
	],
	middleWares: [
		bodyParser.json(),
		bodyParser.urlencoded({ extended: true }),
		loggerMiddleware
	]
});

database.createDBPool();
app.listen();
