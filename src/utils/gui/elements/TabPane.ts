import {subscribeEvent} from "../../events";

export type OnGuiSelectedTabChangedEventExt = {
	pane: TabPane;
} & OnGuiSelectedTabChangedEvent;

export default class TabPane {
	public readonly element: TabbedPaneGuiElement;

	public constructor(parent: LuaGuiElement, settings: Omit<OtherGuiSpec, "type">) {
		this.element = parent.add({...settings, type: "tabbed-pane"});
	}

	public addTab(tabSpec: Omit<TabGuiSpec, "type">, contentSpec: GuiSpec) {
		const tab = this.element.add({...tabSpec, type: "tab"});
		const content = this.element.add(contentSpec);

		this.element.add_tab(tab, content);

		return {tab, content};
	}

	public onTabChanged(handler: (ev: OnGuiSelectedTabChangedEventExt) => void) {
		const isValid = () => this.element.valid || "invalid";
		const isPlayer = (ev: OnGuiSelectedTabChangedEvent) => ev.player_index === this.element.player_index;
		const isButton = (ev: OnGuiSelectedTabChangedEvent) => ev.element === this.element;

		subscribeEvent(defines.events.on_gui_selected_tab_changed, ev => handler({
			...ev,
			pane: this
		}), [isValid, isPlayer, isButton]);
	}

	public get selectedTabIndex(): number | undefined {
		const index = this.element.selected_tab_index;
		if (index === undefined) return undefined;

		return index - 1;
	}

	public set selectedTabIndex(index: number | undefined) {
		if (index === undefined) {
			this.element.selected_tab_index = undefined;
			return;
		}

		this.element.selected_tab_index = index + 1;
	}

	public set selectedTab(name: string | undefined) {
		if (name === undefined) {
			this.selectedTabIndex = undefined;
			return;
		}

		const index = this.element.tabs.findIndex(tab => tab.tab.name === name);
		if (index === -1) return;

		this.selectedTabIndex = index;
	}

	public get selectedTab(): string | undefined {
		const index = this.selectedTabIndex;
		if (index === undefined) return undefined;

		return this.element.tabs[index].tab.name;
	}
}
