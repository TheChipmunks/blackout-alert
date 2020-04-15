import { Request, Response } from 'express';

const loggerMiddleware = (req: Request, resp: Response, next) => {
	console.log('Request logged:', req.method, req.path);
	next();
};

export default loggerMiddleware;

class Logger {
	private time: Date;

	constructor() {
		this.time = null;
	}

	startTimeEvents() {
		this.time = new Date();
	}

	endTimeEvents() {
		this.time = null;
	}

	timeEvent(message: string) {
		console.log(`Took ${+new Date() - +this.time} ms to ${message}`);
		this.time = new Date();
	}
}

export const logger = new Logger();
