import {Data} from "typed-factorio/settings/types";
import {SettingDefinitions} from "./utils/settingsData";

declare const data: Data;


data.extend(SettingDefinitions);
