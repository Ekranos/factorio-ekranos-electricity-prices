import {subscribeEvent} from "../../events";

export type ChooseElemButtonGuiSpecExt = {
	initialValue?: string;
}

export type OnGuiElemChangedEventExt = {
	value: string | undefined;
}

export default class ChooseElemButton {
	public readonly element: ChooseElemButtonGuiElement;

	public constructor(parent: LuaGuiElement, settings: Omit<ChooseElemButtonGuiSpec, "type"> & ChooseElemButtonGuiSpecExt) {
		this.element = parent.add({...settings, type: "choose-elem-button"} as ChooseElemButtonGuiSpec);

		if (settings.initialValue !== undefined) {
			this.element.elem_value = settings.initialValue;
		}
	}

	public get elemValue(): string | undefined {
		return this.element.elem_value;
	}

	public set elemValue(value: string | undefined) {
		this.element.elem_value = value;
	}

	public onElemChanged(handler: (ev: OnGuiElemChangedEvent & OnGuiElemChangedEventExt) => void) {
		const isValid = () => this.element.valid || "invalid";
		const isPlayer = (ev: OnGuiElemChangedEvent) => ev.player_index === this.element.player_index;
		const isButton = (ev: OnGuiElemChangedEvent) => ev.element === this.element;

		subscribeEvent(defines.events.on_gui_elem_changed, ev => handler({
			...ev,
			value: this.elemValue
		}), [isValid, isPlayer, isButton]);
	}
}
