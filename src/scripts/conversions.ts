import {round} from "./util";

export function toWattageString(watts: number) {
	const conversions = [
		{value: 1000000000000, unit: "TW"},
		{value: 1000000000, unit: "GW"},
		{value: 1000000, unit: "MW"},
		{value: 1000, unit: "kW"},
		{value: 1, unit: "W"},
		{value: 0, unit: "mW"},
	]

	for (const conversion of conversions) {
		if (watts >= conversion.value) {
			return `${round(watts / conversion.value, 2).toFixed(2)} ${conversion.unit}`;
		}
	}
}
