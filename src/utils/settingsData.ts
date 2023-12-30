import {SettingDefinition} from "typed-factorio/settings/types";

export type SettingName = "ekranos:eep:custom-currency" | "ekranos:eep:liquid-units-per-uom" | "ekranos:eep:liquid-uom";

export const SettingDefinitions: (SettingDefinition & { name: SettingName })[] = [
	{
		type: "string-setting",
		name: "ekranos:eep:custom-currency",
		setting_type: "runtime-per-user",
		default_value: "€"
	},
	{
		type: "double-setting",
		name: "ekranos:eep:liquid-units-per-uom",
		setting_type: "runtime-per-user",
		default_value: 3,
	},
	{
		type: "string-setting",
		name: "ekranos:eep:liquid-uom",
		setting_type: "runtime-per-user",
		default_value: "l"
	}
];

export function getPlayerSetting(playerIndex: PlayerIdentification, name: SettingName) {
	return settings.get_player_settings(playerIndex)[name].value;
}
