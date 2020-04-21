import * as moment from 'moment';
import _date = moment.unitOfTime._date;

export interface IScrapedRow {
	region: string;
	date: _date;
	time: string;
	publish_time: string;
	reason: string;
	origin: string;
	type: EventType;
	places: IPlace[];
}

export interface IPlace {
	city: string;
	streets: IStreet[]
	origin: string;
}

export interface IStreet {
	name: string;
	oldName: string;
	numbers: string[];
	originNumbers: string[];
}

export enum EventType {
	planned,
	outages
}

export interface IConvertedEvent {
	region: string;
	city: string;
	street_name: string;
	street_old_name: string;
	street_origin: string;
	date: _date;
	time: string;
	publish_time: string;
	reason: string;
	houses: IConvertedHouse[];
	type: EventType
}

export interface IConvertedHouse {
	number: string;
	origin_numbers: string;
}

export interface IConvertedDBStructure {
	events: IConvertedEvent[];
}

