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
	let to: string;
	if (!+end) to = parseIrregularNumber(end);
	const array = range(+start, +to, 1);
	array.push(end);
	return array;
};

function parseIrregularNumber(number: string) {
	return number.replace(/(^\d+)(.+$)/i,'$1');
}

export function mysql_real_escape_string (str) {
	return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
		switch (char) {
			case "\0":
				return "\\0";
			case "\x08":
				return "\\b";
			case "\x09":
				return "\\t";
			case "\x1a":
				return "\\z";
			case "\n":
				return "\\n";
			case "\r":
				return "\\r";
			case "\"":
			case "'":
			case "\\":
			case "%":
				return "\\"+char; // prepends a backslash to backslash, percent,
		                      // and double/single quotes
			default:
				return char;
		}
	});
}
