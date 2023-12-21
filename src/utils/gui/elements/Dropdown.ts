import {subscribeEvent} from "../../events";

export type OnGuiSelectionStateChangedEventExt = {
	selectedValue: string;
	selectedIndex: number;
}

export default class Dropdown {
	public readonly element: DropDownGuiElement;

	public constructor(parent: LuaGuiElement, settings: Omit<DropDownGuiSpec, "type">) {
		this.element = parent.add({...settings, type: "drop-down"});
	}

	public get selectedValue(): string | undefined {
		const index = this.element.selected_index;
		if (index === undefined) return undefined;

		return this.element.items[index - 1] as string;
	}

	public set selectedValue(value: string | undefined) {
		if (value === undefined) {
			this.selectedIndex = undefined;
			return;
		}

		const index = this.element.items.findIndex(item => item === value);
		if (index === -1) return;

		this.element.selected_index = index + 1;
	}

	public get selectedIndex(): number | undefined {
		const index = this.element.selected_index;
		if (index === 0) return undefined;

		return index - 1;
	}

	public set selectedIndex(index: number | undefined) {
		if (index === undefined) {
			this.element.selected_index = 0;
			return;
		}
		this.element.selected_index = index + 1;
	}

	public onSelectionStateChanged(handler: (ev: OnGuiSelectionStateChangedEvent & OnGuiSelectionStateChangedEventExt) => void) {
		const isValid = () => this.element.valid || "invalid";
		const isPlayer = (ev: OnGuiSelectionStateChangedEvent) => ev.player_index === this.element.player_index;
		const isButton = (ev: OnGuiSelectionStateChangedEvent) => ev.element === this.element;

		subscribeEvent(defines.events.on_gui_selection_state_changed,
			ev => handler({...ev, selectedIndex: this.selectedIndex!, selectedValue: this.selectedValue!}),
			[isValid, isPlayer, isButton]);
	}
}
