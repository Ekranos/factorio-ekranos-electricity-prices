import {MainWindow} from "./mainwindow";
import {Timescale, Timescales} from "../electricity-data";
import {formatForDisplay} from "../util";
import {reloadEventHandlers, subscribeEvent} from "../../utils/events";
import Button from "../../utils/gui/elements/Button";
import Dropdown from "../../utils/gui/elements/Dropdown";
import ChooseElemButton from "../../utils/gui/elements/ChooseElemButton";
import TextField from "../../utils/gui/elements/TextField";
import {getPlayerSetting} from "../../utils/settingsData";
import Checkbox from "../../utils/gui/elements/Checkbox";
import {styleTopBar} from "./shared";

export class PriceRow {
	public constructor(
		public readonly timescale: Timescale,
		private readonly timescaleLabel: LuaGuiElement,
		private readonly litreLabel: LuaGuiElement,
		private readonly priceLabel: LuaGuiElement
	) {
		this.timescaleLabel.caption = timescale.name;
	}

	public update(itemsPerMinute: number, price: number, currency: string) {
		const items = itemsPerMinute * this.timescale.ticks / 60 / 60;
		const finalPrice = items * price;

		this.litreLabel.caption = `${formatForDisplay(items, 2)} L`;
		this.priceLabel.caption = `${formatForDisplay(finalPrice, 2)} ${currency}`;
	}
}

type State = {
	players: Record<number, PlayerState>;
};

type PlayerState = {
	fluidPrices: Record<string, number>;
	lastSelectedFluid: string | undefined;
	lastSelectedProductionConsumption: ProductionOrConsumption;
	autoUpdate: boolean;
};

type ProductionOrConsumption = "Production" | "Consumption";

// TODO: Make this generally for fluids
export class FluidTab {
	public static readonly TabName: string = "ekranos-electricity-prices.main-window.tabs.fluid-tab";
	private static readonly DefaultFluid: string = "crude-oil";

	private readonly productionConsumptionDropdown: Dropdown;
	private readonly fluidChooser: ChooseElemButton;
	private readonly priceRows: PriceRow[] = [];
	private readonly state: State;
	private readonly priceField: TextField;
	private autoUpdate: boolean = true;
	private fluid: string = FluidTab.DefaultFluid;

	public constructor(private readonly player: LuaPlayer, window: MainWindow, private readonly frame: LuaGuiElement, state: Partial<State>) {
		if (state.players === undefined) state.players = {};
		this.state = state as State;

		const top = frame.add({type: "flow", direction: "horizontal"});
		styleTopBar(top);
		this.productionConsumptionDropdown = new Dropdown(top, {
			items: ["Production", "Consumption"] as ProductionOrConsumption[],
			selected_index: 1
		});
		this.productionConsumptionDropdown.onSelectionStateChanged(ev => this.onSelectionStateChanged(ev));

		this.fluidChooser = new ChooseElemButton(top, {elem_type: "fluid", initialValue: "crude-oil"});
		this.fluidChooser.onElemChanged(ev => this.changeFluid(ev.value));

		this.priceField = new TextField(top, {
			text: this.getPlayerState().fluidPrices[this.fluid]?.toString() ?? "0",
			numeric: true,
			allow_negative: false,
			allow_decimal: true
		});
		this.priceField.onTextChanged(ev => this.onPriceFieldChanged(ev));

		const refreshDataButton = new Button(top, {caption: "Refresh data"});
		refreshDataButton.onClick(() => this.update());

		const autoUpdateCheckbox = new Checkbox(top, {
			state: this.autoUpdate = this.getPlayerState().autoUpdate ?? true,
			caption: "Auto update"
		});
		autoUpdateCheckbox.onChanged(ev => this.getPlayerState().autoUpdate = this.autoUpdate = ev.state);

		const table = frame.add({type: "table", column_count: 3});
		table.add({type: "label", caption: "Timeframe"});
		table.add({type: "label", caption: "Amount"});
		table.add({type: "label", caption: "Price"});

		table.style.horizontal_spacing = 50;
		table.style.column_alignments[1] = "left";
		table.style.column_alignments[2] = "right";
		table.style.column_alignments[3] = "right";

		for (const timescale of Timescales) {
			const timescaleLabel = table.add({type: "label"});
			const litreLabel = table.add({type: "label"});
			const priceLabel = table.add({type: "label"});

			[timescaleLabel, litreLabel, priceLabel].forEach(label => label.style.horizontally_stretchable = true);
			this.priceRows.push(new PriceRow(timescale, timescaleLabel, litreLabel, priceLabel));
		}

		this.changeFluid(this.getPlayerState().lastSelectedFluid);
		this.productionConsumptionDropdown.selectedValue = this.getPlayerState().lastSelectedProductionConsumption || "Production";
		this.update();

		subscribeEvent(defines.events.on_tick, () => this.update(), [() => this.frame.valid || "invalid", ev => this.autoUpdate && ev.tick % 60 === 0]);

		reloadEventHandlers();
	}

	private onSelectionStateChanged(ev: OnGuiSelectionStateChangedEvent) {
		const selected = this.productionConsumptionDropdown.selectedValue;
		this.getPlayerState().lastSelectedProductionConsumption = selected as ProductionOrConsumption;

		this.update();
	}

	private changeFluid(fluid: string | undefined) {
		this.fluid = fluid ?? FluidTab.DefaultFluid;
		this.getPlayerState().lastSelectedFluid = this.fluid;
		this.fluidChooser.elemValue = this.fluid;
		this.priceField.text = this.getPlayerState().fluidPrices[this.fluid]?.toString() ?? "0";
		this.update();
	}

	private onPriceFieldChanged(ev: OnGuiTextChangedEvent) {
		const price = tonumber(ev.text);
		if (price === undefined) return;

		this.getPlayerState().fluidPrices[this.fluid] = price;
		this.update();
	}

	private getPlayerState(): PlayerState {
		const playerState = this.state.players[this.player.index] = this.state.players[this.player.index] || {};
		if (playerState.fluidPrices === undefined) playerState.fluidPrices = {};
		return playerState;
	}

	private update() {
		const stats = this.player.force.fluid_production_statistics;

		const input = this.productionConsumptionDropdown.selectedValue === "Production";
		const counts = input ? stats.input_counts : stats.output_counts;
		const price = tonumber(this.getPlayerState().fluidPrices[this.fluid]) ?? 0;

		for (const row of this.priceRows) {
			if (counts[this.fluid] === undefined) {
				row.update(0, 0, "€");
			}

			const flow = stats.get_flow_count({
				name: this.fluid,
				input: input,
				precision_index: row.timescale.flowPrecisionIndex
			});

			row.update(flow, price, getPlayerSetting(this.player, "ekranos:eep:custom-currency") as string);
		}
	}
}
