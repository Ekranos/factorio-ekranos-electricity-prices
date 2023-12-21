import {subscribeEvent} from "../../events";

export default class TextField {
	public readonly element: TextFieldGuiElement;

	public constructor(parent: LuaGuiElement, settings: Omit<TextFieldGuiSpec, "type">) {
		this.element = parent.add({...settings, type: "textfield"});
	}

	public get text(): string {
		return this.element.text;
	}

	public set text(value: string) {
		this.element.text = value;
	}

	public onTextChanged(handler: (ev: OnGuiTextChangedEvent) => void) {
		const isValid = () => this.element.valid || "invalid";
		const isPlayer = (ev: OnGuiTextChangedEvent) => ev.player_index === this.element.player_index;
		const isSelf = (ev: OnGuiTextChangedEvent) => ev.element === this.element;

		subscribeEvent(defines.events.on_gui_text_changed, ev => handler(ev), [isValid, isPlayer, isSelf]);
	}
}
