import {Data, SettingDefinition} from "typed-factorio/settings/types";

declare const data: Data;

const settings: SettingDefinition[] = [
	{
		type: "string-setting",
		name: "ekranos:eep:custom-currency",
		setting_type: "runtime-per-user",
		default_value: "€"
	},
	{
		type: "double-setting",
		name: "ekranos:eep:custom-price",
		setting_type: "runtime-per-user",
		default_value: 0
	}
];

data.extend(settings);
