import TextField from "../../utils/gui/elements/TextField";

export function styleTopBar(element: LuaGuiElement) {
	element.style.height = 40;
	element.style.vertical_align = "center";
}

export function stylePricesTable(element: LuaGuiElement) {
	element.style.horizontally_stretchable = true;
	element.style.horizontally_squashable = true;
	element.style.column_alignments[1] = "left";
	element.style.column_alignments[2] = "right";
}

export function createTopBar(parent: LuaGuiElement): {
	top: LuaGuiElement,
	topLeft: LuaGuiElement,
	topRight: LuaGuiElement
} {
	const top = parent.add({type: "flow", name: "top", direction: "horizontal"});
	const topLeft = top.add({type: "flow", name: "left", direction: "horizontal"});
	const topRight = top.add({type: "flow", name: "right", direction: "horizontal"});

	styleTopBar(top);
	styleTopBar(topLeft);
	styleTopBar(topRight);

	topLeft.style.horizontally_stretchable = true;
	topRight.style.horizontally_squashable = true;

	return {top, topLeft, topRight};
}

export function createPriceField(parent: LuaGuiElement): TextField {
	const field = new TextField(parent, {
		name: "custom-price",
		numeric: true,
		allow_decimal: true,
		allow_negative: false
	});
	field.element.style.width = 100;

	return field;
}
