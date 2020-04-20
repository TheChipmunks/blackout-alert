import { Request, Response } from 'express';
import moment = require('moment');

const loggerMiddleware = (req: Request, resp: Response, next) => {
	console.log('Request logged:', req.method, req.path);
	next();
};

export default loggerMiddleware;

class Logger {
	private time: Date;
	private startTime: Date;
	private processingTimer: NodeJS.Timer;

	constructor() {
		this.time = null;
		this.startTime = null;
		this.processingTimer = null;
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

	startProcessing = (eventName: string) => {
		const P = ['\\', '|', '/', '-'];
		let x = 0;
		console.log(`${eventName} started in ${moment().format('hh:mm:ss')}`);
		this.processingTimer = setInterval(() => {
			process.stdout.write('\r' + P[x++]);
			x &= 3;
		}, 300);
	};

	stopProcessing = (eventName: string) => {
		clearInterval(this.processingTimer);
		process.stdout.write('\r' + '');
		console.log(`${eventName} ended in ${moment().format('hh:mm:ss')}`);
	};
}

export const logger = new Logger();
