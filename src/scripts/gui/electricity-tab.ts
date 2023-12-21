import {Countries, CountryData, CustomCountryName} from "../countries";
import {ElectricityData, getElectricityData, Timescale, Timescales} from "../electricity-data";
import {EventHandlerResult, subscribeEvent} from "../../utils/events";
import {toWattageString} from "../conversions";
import {formatForDisplay} from "../util";
import {MainWindow} from "./mainwindow";
import Button from "../../utils/gui/elements/Button";
import Dropdown from "../../utils/gui/elements/Dropdown";
import {styleTopBar} from "./shared";

type State = {
	players: Record<number, PlayerState>;
}

type PlayerState = {
	selectedCountry: string;
	customPrice: number;
}

class PriceRow {
	public constructor(
		public readonly timescale: Timescale,
		private readonly timescaleLabel: LuaGuiElement,
		private readonly wattsLabel: LuaGuiElement,
		private readonly priceLabel: LuaGuiElement
	) {
		this.timescaleLabel.caption = timescale.name;
	}

	/**
	 * Updates the price row with the given values.
	 *
	 * @param watts The number of watts used per tick.
	 * @param price The price per kWh.
	 * @param currency The currency symbol.
	 */
	public update(watts: number, price: number, currency: string) {
		const timescaleToHoursConverter = this.timescale.ticks / 60 / 60 / 60;
		const normalizedWatts = watts * 60;
		const wattHours = normalizedWatts * timescaleToHoursConverter;
		const finalPrice = wattHours / 1000 * price;

		this.wattsLabel.caption = `${toWattageString(wattHours)}/h`;
		this.priceLabel.caption = `${formatForDisplay(finalPrice, 2)} ${currency}`;
	}
}

export class ElectricityTab {
	public static readonly TabName: string = "ekranos-electricity-prices.main-window.tabs.electricity-tab";

	private static readonly PricesTableName: string = "ekranos-electricity-prices.main-window.tabs.electricity-tab.prices-table";
	private static readonly CustomPriceName: string = "ekranos-electricity-prices.main-window.tabs.electricity-tab.custom-price";

	private readonly priceField: TextFieldGuiElement;
	private readonly priceRows: PriceRow[] = [];
	private readonly state: State;
	private readonly countryDropdown: Dropdown;

	private selectedCountry: CountryData;
	private electricityData: ElectricityData;

	public constructor(private readonly player: LuaPlayer, window: MainWindow, private readonly frame: LuaGuiElement, state: Partial<State>) {
		if (state.players === undefined) state.players = {};
		this.state = state as State;
		this.electricityData = getElectricityData(player);
		this.selectedCountry = Countries[this.getPlayerState().selectedCountry];
		// TODO: This does not belong here.
		Countries[CustomCountryName].price = this.getPlayerState().customPrice;

		// Create the top
		const top = this.frame.add({type: "flow", direction: "horizontal"});
		styleTopBar(top);
		this.countryDropdown = new Dropdown(top, {
			items: Object.keys(Countries)
		});
		this.countryDropdown.onSelectionStateChanged(ev => this.selectCountry(ev.selectedValue))

		this.priceField = top.add({
			type: "textfield",
			numeric: true,
			allow_decimal: true,
			allow_negative: false,
			name: ElectricityTab.CustomPriceName
		});
		const refreshButton = new Button(top, {caption: "Refresh data"});
		refreshButton.onClick(() => this.updateElectricityData());

		// Create the content area
		const content = this.frame.add({type: "flow", direction: "vertical"});

		// Create the prices table
		const pricesTable = content.add({type: "table", name: ElectricityTab.PricesTableName, column_count: 3});
		pricesTable.add({type: "label", caption: "Timeframe"});
		pricesTable.add({type: "label", caption: "Amount"});
		pricesTable.add({type: "label", caption: "Price"});

		pricesTable.style.horizontal_spacing = 50;
		pricesTable.style.column_alignments[1] = "left";
		pricesTable.style.column_alignments[2] = "right";
		pricesTable.style.column_alignments[3] = "right";

		// Create the price rows
		for (const timescale of Timescales) {
			const timescaleLabel = pricesTable.add({type: "label"});
			const wattsLabel = pricesTable.add({type: "label"});
			const priceLabel = pricesTable.add({type: "label"});

			[timescaleLabel, wattsLabel, priceLabel].forEach(label => label.style.horizontally_stretchable = true);
			this.priceRows.push(new PriceRow(timescale, timescaleLabel, wattsLabel, priceLabel));
		}

		subscribeEvent(defines.events.on_gui_text_changed, ev => this.onCustomPriceChanged(ev), window.eventPredicates);

		// Initialize the UI state
		this.selectCountry(this.selectedCountry.name);
	}

	private updateElectricityData() {
		this.electricityData = getElectricityData(this.player);
		this.updatePriceRows();
	}

	private updatePriceRows() {
		const currency = this.selectedCountry.currency;
		const price = this.selectedCountry.price;

		for (const row of this.priceRows) {
			const watts = this.electricityData.flowData[row.timescale.flowPrecisionIndex];
			row.update(watts, price, currency);
		}
	}

	private selectCountry(name: string) {
		this.selectedCountry = Countries[name];
		this.getPlayerState().selectedCountry = name;
		this.priceField.text = this.selectedCountry.price.toString();
		this.countryDropdown.selectedValue = name;

		this.updatePriceRows();
	}

	private onCustomPriceChanged(event: OnGuiTextChangedEvent): EventHandlerResult {
		if (event.element?.name !== ElectricityTab.CustomPriceName) return;

		const price = tonumber(event.text.replace(",", "."));
		if (price === undefined) return;

		if (this.selectedCountry.name !== CustomCountryName) {
			this.selectCountry(CustomCountryName);
			this.priceField.text = event.text;
		}

		this.getPlayerState().customPrice = price;
		this.selectedCountry.price = price;
		this.updatePriceRows();
	}

	private getPlayerState(): PlayerState {
		const index = this.player.index;
		return this.state.players[index] = this.state.players[index] || {
			selectedCountry: CustomCountryName,
			customPrice: 0
		};
	}
}
