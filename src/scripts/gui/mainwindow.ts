import {Countries, CountryData, CountryNames, CustomCountryName} from "../countries";
import {ElectricityData, getElectricityData, Timescale, Timescales} from "../electricity-data";
import {toWattageString} from "../conversions";
import {formatForDisplay} from "../util";
import {EventHandlerResult, reloadEventHandlers, subscribeEvent} from "../../utils/events";
import {PlayerEvent} from "../../utils/event_types";

declare const global: {
	mainWindow?: Record<number, MainWindowState>;
};

export type MainWindowState = {
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

export class MainWindow {
	public static readonly OpenName: string = "ekranos-electricity-prices.top.open-main-window";
	public static readonly WindowName: string = "ekranos-electricity-prices.main-window";
	private static readonly CountryDropdownName: string = "ekranos-electricity-prices.main-window.country-dropdown";
	private static readonly PricesTableName: string = "ekranos-electricity-prices.main-window.prices-table";
	private static readonly CustomPriceName: string = "ekranos-electricity-prices.main-window.custom-price";
	private static readonly RefreshDataName: string = "ekranos-electricity-prices.main-window.refresh-data";
	private static readonly Instances = new Map<number, MainWindow>();

	private readonly frame: FrameGuiElement;
	private readonly priceField: TextFieldGuiElement;
	private readonly priceRows: PriceRow[] = [];
	private readonly countryDropdown: DropDownGuiElement;

	private selectedCountry: CountryData;
	private electricityData: ElectricityData;

	public constructor(private readonly player: LuaPlayer) {
		this.frame = player.gui.center[MainWindow.WindowName] as FrameGuiElement;
		if (this.frame === undefined) {
			this.frame = this.player.gui.center.add({
				type: "frame",
				name: MainWindow.WindowName,
				direction: "vertical",
				caption: "Electricity Prices",
				style: "inner_frame_in_outer_frame"
			});
		}

		player.opened = this.frame;

		this.electricityData = getElectricityData(player);
		this.selectedCountry = Countries[this.getState().selectedCountry];
		// TODO: This does not belong here.
		Countries[CustomCountryName].price = this.getState().customPrice;

		this.frame.clear();

		// Create the toolbar
		const toolbar = this.frame.add({type: "flow", direction: "horizontal"});
		this.countryDropdown = toolbar.add({
			type: "drop-down",
			name: MainWindow.CountryDropdownName,
			items: Object.keys(Countries)
		});

		this.priceField = toolbar.add({
			type: "textfield",
			numeric: true,
			allow_decimal: true,
			allow_negative: false,
			name: MainWindow.CustomPriceName
		});
		toolbar.add({type: "button", name: MainWindow.RefreshDataName, caption: "Refresh data"});

		// Create the content area
		const content = this.frame.add({type: "flow", direction: "vertical"});

		// Create the prices table
		const pricesTable = content.add({type: "table", name: MainWindow.PricesTableName, column_count: 3});
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
			this.priceRows.push(new PriceRow(timescale, timescaleLabel, wattsLabel, priceLabel));
		}

		// Define the predicates
		const isWindowValid = () => this.frame.valid || "invalid";
		const isCurrentPlayer = (ev: PlayerEvent) => ev.player_index === this.player.index;
		const predicates = [isWindowValid, isCurrentPlayer];

		// Define the events
		subscribeEvent(defines.events.on_gui_click, ev => this.onClickRefreshData(ev), predicates);
		subscribeEvent(defines.events.on_gui_closed, ev => this.onGuiClosed(ev), predicates);
		subscribeEvent(defines.events.on_gui_selection_state_changed, ev => this.onCountrySelectionChanged(ev), predicates);
		subscribeEvent(defines.events.on_gui_text_changed, ev => this.onCustomPriceChanged(ev), predicates);

		// Initialize the UI state
		this.selectCountry(this.selectedCountry.name);

		reloadEventHandlers();
	}

	private updateElectricityData() {
		this.electricityData = getElectricityData(this.player);
	}

	private updatePriceRows() {
		const currency = this.selectedCountry.currency;
		const price = this.selectedCountry.price;

		for (const row of this.priceRows) {
			const watts = this.electricityData.flowData[row.timescale.flowPrecisionIndex];
			row.update(watts, price, currency);
		}
	}

	private onCountrySelectionChanged(event: OnGuiSelectionStateChangedEvent): EventHandlerResult {
		if (event.element === undefined) return;
		if (event.element.name !== MainWindow.CountryDropdownName) return;

		const name = CountryNames[event.element.selected_index as number - 1];
		this.selectCountry(name);
	}

	private selectCountry(name: string) {
		this.selectedCountry = Countries[name];
		this.getState().selectedCountry = name;
		this.priceField.text = this.selectedCountry.price.toString();
		this.countryDropdown.selected_index = CountryNames.indexOf(name) + 1;

		this.updatePriceRows();
	}

	private onClickRefreshData(event: OnGuiClickEvent): EventHandlerResult {
		if (event.element?.name !== MainWindow.RefreshDataName) return;

		this.updateElectricityData();
		this.updatePriceRows();
	}

	private onCustomPriceChanged(event: OnGuiTextChangedEvent): EventHandlerResult {
		if (event.element?.name !== MainWindow.CustomPriceName) return;

		const price = tonumber(event.text.replace(",", "."));
		if (price === undefined) return;

		if (this.selectedCountry.name !== CustomCountryName) {
			this.selectCountry(CustomCountryName);
			this.priceField.text = event.text;
		}

		this.getState().customPrice = price;
		this.selectedCountry.price = price;
		this.updatePriceRows();
	}

	private getState(): MainWindowState {
		global.mainWindow = global.mainWindow || {};

		const index = this.player.index;
		return global.mainWindow[index] = global.mainWindow[index] || {
			selectedCountry: CustomCountryName,
			customPrice: 0
		};
	}

	private onGuiClosed(event: OnGuiClosedEvent): EventHandlerResult {
		if (event.element?.name !== MainWindow.WindowName) return;

		this.dispose();
	}

	private dispose() {
		MainWindow.Instances.delete(this.player.index);
		this.frame.destroy();
	}

	/**
	 * Returns the main window for the given player. If the window does not exist, creates a new instance.
	 *
	 * @param {LuaPlayer} player - The player for whom to retrieve or create the main window.
	 * @returns {MainWindow} The main window for the given player.
	 */
	public static getOrCreate(player: LuaPlayer): MainWindow {
		let window = MainWindow.Instances.get(player.index);

		if (window === undefined) {
			window = new MainWindow(player);
			MainWindow.Instances.set(player.index, window);
		}

		return window;
	}
}

reloadEventHandlers();
