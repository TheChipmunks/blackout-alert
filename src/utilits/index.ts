export const range = (start, end, step) => {
	let range = [];
	const typeofStart = typeof start;
	const typeofEnd = typeof end;

	if (step === 0) {
		throw TypeError('Step cannot be zero.');
	}

	if (typeofStart == 'undefined' || typeofEnd == 'undefined') {
		throw TypeError('Must pass start and end arguments.');
	} else if (typeofStart != typeofEnd) {
		throw TypeError('Start and end arguments must be of same type.');
	}

	typeof step == 'undefined' && (step = 1);

	if (end < start) {
		step = -step;
	}

	if (typeofStart == 'number') {

		while (step > 0 ? end >= start : end <= start) {
			range.push(`${start}`);
			start += step;
		}

	} else if (typeofStart == 'string') {

		if (start.length != 1 || end.length != 1) {
			throw TypeError('Only strings with one character are supported.');
		}

		start = start.charCodeAt(0);
		end = end.charCodeAt(0);

		while (step > 0 ? end >= start : end <= start) {
			range.push(String.fromCharCode(start));
			start += step;
		}

	} else {
		throw TypeError('Only string and number types are supported');
	}

	return range;

};

export const rangeFromIrregularNumbers = (start, end) => {
	let from = start;
	let to = end;
	if (!+end) to = parseIrregularNumber(end);
	if (!+start) from = parseIrregularNumber(start);
	const array = range(+from, +to, 1);
	if (!+end) array.push(end);
	if (!+start) array.unshift(start);
	return array;
};

function parseIrregularNumber(number: string) {
	return number.replace(/(^\d+)(.+$)/i, '$1');
}

export function mysqlString(str) {
	if (!str) return str;
	return str.replace('\'', '\\\'');
}
