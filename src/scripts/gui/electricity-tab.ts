import {Countries, CountryData, CustomCountryName} from "../countries";
import {ElectricityData, getElectricityData, Timescale, Timescales} from "../electricity-data";
import {EventHandlerResult} from "../../utils/events";
import {toWattageString} from "../conversions";
import {formatForDisplay} from "../util";
import {MainWindow} from "./mainwindow";
import Button from "../../utils/gui/elements/Button";
import Dropdown from "../../utils/gui/elements/Dropdown";
import {createPriceField, createTopBar, stylePricesTable} from "./shared";
import {getPlayerSetting} from "../../utils/settingsData";
import TextField from "../../utils/gui/elements/TextField";

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

	private readonly priceField: TextField;
	private readonly currencyLabel: LabelGuiElement;
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
		Countries[CustomCountryName].currency = getPlayerSetting(player, "ekranos:eep:custom-currency") as string;

		const {topLeft, topRight} = createTopBar(frame);

		this.countryDropdown = new Dropdown(topLeft, {
			name: "country",
			items: Object.keys(Countries)
		});
		this.countryDropdown.onSelectionStateChanged(ev => this.selectCountry(ev.selectedValue))

		this.priceField = createPriceField(topRight);
		this.priceField.onTextChanged(ev => this.onCustomPriceChanged(ev));
		this.currencyLabel = topRight.add({type: "label", name: "currency"});
		const refreshButton = new Button(topRight, {name: "refresh", caption: "Refresh data"});
		refreshButton.onClick(() => this.updateElectricityData());

		// Create the content area
		const content = this.frame.add({type: "flow", name: "content", direction: "vertical"});

		// Create the prices table
		const pricesTable = content.add({type: "table", name: "prices", column_count: 3});
		stylePricesTable(pricesTable);
		pricesTable.add({type: "label", caption: "Timeframe"});
		pricesTable.add({type: "label", caption: "Amount"});
		pricesTable.add({type: "label", caption: "Price"});

		pricesTable.style.horizontal_spacing = 50;
		pricesTable.style.column_alignments[1] = "left";
		pricesTable.style.column_alignments[2] = "right";
		pricesTable.style.column_alignments[3] = "right";

		// Create the price rows
		for (const timescale of Timescales) {
			const labelName = (name: string) => `${timescale.name}-${name}`;
			const timescaleLabel = pricesTable.add({type: "label", name: labelName("timescale")});
			const wattsLabel = pricesTable.add({type: "label", name: labelName("watts")});
			const priceLabel = pricesTable.add({type: "label", name: labelName("price")});

			[timescaleLabel, wattsLabel, priceLabel].forEach(label => label.style.horizontally_stretchable = true);
			this.priceRows.push(new PriceRow(timescale, timescaleLabel, wattsLabel, priceLabel));
		}

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
		this.currencyLabel.caption = `${this.selectedCountry.currency} / kW/h`;

		this.updatePriceRows();
	}

	private onCustomPriceChanged(event: OnGuiTextChangedEvent): EventHandlerResult {
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
