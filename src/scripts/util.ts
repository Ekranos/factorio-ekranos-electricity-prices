// Round and also display the number with the given number of digits after the decimal point.
export function round(num: number, digits: number) {
	const factor = 10 ** digits;
	return math.floor(num * factor) / factor;
}


// Format the given number by rounding it and putting a space between every 3 digits from the right before the fraction.
// Unable to use regex cause of TypeScript to Lua conversion.
export function formatForDisplay(num: number, digits: number) {
	const rounded = round(num, digits).toFixed(digits);
	const parts = rounded.split(".");
	const whole = parts[0];
	const fraction = parts[1] || "";

	let result = "";

	for (let i = 0; i < whole.length; i++) {
		const index = whole.length - i - 1;
		const char = whole[index];

		if (i % 3 === 0 && i !== 0) {
			result = " " + result;
		}

		result = char + result;
	}

	if (fraction.length > 0) {
		result += "." + fraction;

		if (fraction.length < digits) {
			result += "0".repeat(digits - fraction.length);
		}
	}

	return result;
}
