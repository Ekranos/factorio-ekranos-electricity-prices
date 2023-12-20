export type CountryData = {
	name: string;
	/**
	 * Price per kWh
	 */
	price: number;
	currency: string;
}

export const CustomCountryName = "Custom";

const countries: CountryData[] = [
	{
		name: CustomCountryName,
		price: 0,
		currency: settings.player["ekranos:eep:custom-currency"].value as string
	},
	{name: "Germany", price: 0.3714, currency: "€"},
	{name: "France", price: 0.2062, currency: "€"},
	{name: "Poland", price: 0.1769, currency: "€"}
];

export const Countries: Record<string, CountryData> = {};
export const CountryNames: string[] = [];

for (const country of countries) {
	Countries[country.name] = country;
}

for (const country of countries) {
	CountryNames.push(country.name);
}
