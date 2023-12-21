export function styleTopBar(element: LuaGuiElement) {
	element.style.height = 40;
	element.style.vertical_align = "center";
	element.style.horizontally_stretchable = true;
}

export function stylePricesTable(element: LuaGuiElement) {
	element.style.horizontally_stretchable = true;
	element.style.horizontally_squashable = true;
	element.style.column_alignments[1] = "left";
	element.style.column_alignments[2] = "right";

}
