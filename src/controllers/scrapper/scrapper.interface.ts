export interface IScrapedRow {
	company: string;
	date: string;
	time: string;
	reason: string;
	origin: string;
	places: IPlace[]
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

export interface IConvertedStreet {
	street_id: number;
	city: string;
	street_name: string;
	street_old_name: string;
	street_origin: string;
	date: string;
	time: string;
	reason: string
}

export interface IConvertedNumber {
	street_id: number;
	number: string;
	origin_numbers: string;
}

export interface IConvertedDBStructure {
	streets: IConvertedStreet[];
	numbers: IConvertedNumber[]
}

