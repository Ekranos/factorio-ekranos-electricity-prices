import {EventHandlerResult, reloadEventHandlers, subscribeEvent} from "../../utils/events";
import {PlayerEvent} from "../../utils/event_types";
import {ElectricityTab} from "./electricity-tab";
import {FluidTab} from "./fluid-tab";
import TabPane, {OnGuiSelectedTabChangedEventExt} from "../../utils/gui/elements/TabPane";

declare const global: {
	mainWindow?: State;
}

type State = {
	tabs: Record<string, any>;
	selectedTab: Partial<Record<number, string>>;
}

type Tab = {
	name: string;
	caption: string;
	factory: (frame: LuaGuiElement, state: any) => any;
}

export class MainWindow {
	public static readonly OpenName: string = "ekranos-electricity-prices.top.open-main-window";
	public static readonly WindowName: string = "ekranos-electricity-prices.main-window";

	private static readonly Instances = new Map<number, MainWindow>();

	private readonly frame: FrameGuiElement;
	private readonly tabs: Record<string, Tab> = {};

	public readonly eventPredicates = [
		() => this.frame.valid || "invalid",
		(ev: PlayerEvent) => ev.player_index === this.player.index
	];

	public constructor(private readonly player: LuaPlayer) {
		this.frame = player.gui.screen[MainWindow.WindowName] as FrameGuiElement;
		if (this.frame !== undefined) this.frame.destroy();

		this.frame = this.player.gui.screen.add({
			type: "frame",
			name: MainWindow.WindowName,
			direction: "vertical",
			caption: "Electricity Prices",
			style: "inside_shallow_frame_with_padding",
		});

		this.frame.style.width = 600;
		this.frame.auto_center = true;

		player.opened = this.frame;

		const tabs: Tab[] = [
			{
				name: ElectricityTab.TabName,
				caption: "Electricity",
				factory: (frame, state) => new ElectricityTab(player, this, frame, state)
			},
			{
				name: FluidTab.TabName,
				caption: "Fluids",
				factory: (frame, state) => new FluidTab(player, this, frame, state)
			}
		]

		const pane = new TabPane(this.frame, {name: "my-tabs", style: "tabbed_pane_with_no_side_padding"});

		for (const tab of tabs) {
			const {content} = pane.addTab(
				{name: tab.name, caption: tab.caption},
				{type: "frame", name: `tab-frame-${tab.name}`, direction: "vertical"}
			);
			content.style.vertically_stretchable = true;
			content.style.horizontally_stretchable = true;
			// frame.style.horizontally_squashable = true;

			tab.factory(content, this.getTabState(tab.name));
			this.tabs[tab.name] = tab;
		}

		// Set the selected tab
		pane.selectedTab = this.getWindowState().selectedTab[player.index];
		pane.onTabChanged(ev => this.onGuiSelectedTabChanged(ev));

		subscribeEvent(defines.events.on_gui_closed, ev => this.onGuiClosed(ev), this.eventPredicates);

		reloadEventHandlers();
	}

	private getTabState(tabName: string): any {
		const windowState = this.getWindowState();
		windowState.tabs[tabName] = windowState.tabs[tabName] || {};

		return windowState.tabs[tabName];
	}

	private getWindowState(): State {
		const windowState = global.mainWindow = global.mainWindow || {} as any as State;
		windowState.selectedTab = windowState.tabs || {};
		windowState.tabs = windowState.tabs || {};
		return windowState;
	}

	private onGuiSelectedTabChanged(ev: OnGuiSelectedTabChangedEventExt) {
		const windowState = this.getWindowState();
		windowState.selectedTab[this.player.index] = ev.pane.selectedTab;
	}

	private onGuiClosed(event: OnGuiClosedEvent): EventHandlerResult {
		if (event.element?.name !== MainWindow.WindowName) return;

		this.dispose();
	}

	public dispose() {
		MainWindow.Instances.delete(this.player.index);
		this.frame.destroy();
	}

	/**
	 * Retrieves or creates a MainWindow instance for the given player.
	 *
	 * @param {LuaPlayer} player - The player for whom to retrieve or create the MainWindow.
	 * @returns {[MainWindow, boolean]} - A tuple containing the MainWindow instance and a boolean indicating whether the instance was newly created (true) or retrieved (false).
	 */
	public static getOrCreate(player: LuaPlayer): [MainWindow, boolean] {
		let window = MainWindow.Instances.get(player.index);

		if (window === undefined) {
			window = new MainWindow(player);
			MainWindow.Instances.set(player.index, window);
			return [window, true];
		}

		return [window, false];
	}
}

reloadEventHandlers();
