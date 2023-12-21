import {subscribeEvent} from "../../events";

export type OnGuiCheckedStateChangedEventExt = {
	state: boolean;
} & OnGuiCheckedStateChangedEvent;

export default class Checkbox {
	public readonly element: CheckboxGuiElement;

	constructor(parent: LuaGuiElement, settings: Omit<CheckboxGuiSpec, "type">) {
		this.element = parent.add({...settings, type: "checkbox"});
	}

	get state() {
		return this.element.state;
	}

	set state(value) {
		this.element.state = value;
	}

	onChanged(handler: (ev: OnGuiCheckedStateChangedEventExt) => void) {
		const isValid = () => this.element.valid || "invalid";
		const isPlayer = (ev: OnGuiCheckedStateChangedEvent) => ev.player_index === this.element.player_index;
		const isSelf = (ev: OnGuiCheckedStateChangedEvent) => ev.element === this.element;

		subscribeEvent(defines.events.on_gui_checked_state_changed, ev => handler({
			...ev,
			state: this.element.state,
		}), [isValid, isPlayer, isSelf]);
	}
}
