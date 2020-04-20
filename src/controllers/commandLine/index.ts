import database from '../../database';
import ScrapperController from '../scrapper/scrapper.controller';

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (text) => {
	switch (text.trim()) {
		case 'quit':
			done();
			break;
		case 'scrape':
			scrape();
			break;

	}

});

function scrape() {
	console.log('Start scrapping');
	const scraper = new ScrapperController()
	console.log(scraper)
	scraper.scrape(scraper);
}

function done() {
	console.log('Now that process.stdin is paused, there is nothing more to do.');
	process.exit();
}
