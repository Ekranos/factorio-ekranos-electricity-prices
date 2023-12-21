import {subscribeEvent} from "../../events";

export default class Button {
	public readonly element: ButtonGuiElement;

	public constructor(parent: LuaGuiElement, settings: Omit<ButtonGuiSpec, "type">) {
		this.element = parent.add({...settings, type: "button"});
	}

	public onClick(handler: (ev: OnGuiClickEvent) => void) {
		const isValid = () => this.element.valid || "invalid";
		const isPlayer = (ev: OnGuiClickEvent) => ev.player_index === this.element.player_index;
		const isSelf = (ev: OnGuiClickEvent) => ev.element === this.element;

		subscribeEvent(defines.events.on_gui_click, ev => handler(ev), [isValid, isPlayer, isSelf]);
	}
}
