import { Request, Response } from 'express';

const loggerMiddleware = (req: Request, resp: Response, next) => {
	console.log('Request logged:', req.method, req.path);
	next();
};

export default loggerMiddleware;

class Logger {
	private time: Date;
	private startTime: Date;

	constructor() {
		this.time = null;
		this.startTime = null;
	}

	startTimeEvents() {
		this.time = new Date();
		this.startTime = new Date();
	}

	endTimeEvents() {
		console.log(`Total spent ${+new Date() - +this.startTime} ms `);
		this.time = null;
		this.startTime = null;
	}

	timeEvent(message: string) {
		console.log(`Took ${+new Date() - +this.time} ms to ${message}`);
		this.time = new Date();
	}
}

export const logger = new Logger();
