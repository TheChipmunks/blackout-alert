import App from './app';
import * as bodyParser from 'body-parser';
import loggerMiddleware from './middleware/logger';

import ScrapperController from './controllers/scrapper/scrapper.controller';

const app = new App({
	port: 5000,
	controllers: [
		new ScrapperController()
	],
	middleWares: [
		bodyParser.json(),
		bodyParser.urlencoded({ extended: true }),
		loggerMiddleware
	]
});

app.listen();
