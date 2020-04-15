export interface IScrappedTr {
	company: string;
	place: IPlace;
	reason: string;
	time: string;
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
