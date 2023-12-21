import {SettingDefinition} from "typed-factorio/settings/types";

export type SettingName = "ekranos:eep:custom-currency" | "ekranos:eep:units-per-litre";

export const SettingDefinitions: (SettingDefinition & { name: SettingName })[] = [
	{
		type: "string-setting",
		name: "ekranos:eep:custom-currency",
		setting_type: "runtime-per-user",
		default_value: "€"
	},
	{
		type: "double-setting",
		name: "ekranos:eep:units-per-litre",
		setting_type: "runtime-per-user",
		default_value: 3,
		minimum_value: 0.0001,
	}
];

export function getPlayerSetting(playerIndex: PlayerIdentification, name: SettingName) {
	return settings.get_player_settings(playerIndex)[name].value;
}
