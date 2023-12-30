import * as modGui from "mod-gui";
import {MainWindow} from "./scripts/gui/mainwindow";
import {reloadEventHandlers, subscribeEvent} from "./utils/events";

let didInit = false;

function init() {
	if (didInit) return;
	didInit = true;

	for (let key in game.players) {
		const player = game.players[key];
		initPlayer(player);
	}
}

subscribeEvent(defines.events.on_player_joined_game, ev => initPlayer(game.players[ev.player_index]));

function initPlayer(player: LuaPlayer) {
	let button = modGui.get_button_flow(player)[MainWindow.OpenName];

	if (button === undefined) {
		button = modGui.get_button_flow(player).add({type: "button", name: MainWindow.OpenName});
	}

	button.caption = "EEP";

	if (player.opened !== undefined && "name" in player.opened && player.opened.name === MainWindow.WindowName) {
		MainWindow.getOrCreate(player);
	}
}

script.on_configuration_changed(ev => {
	if (ev.mod_changes[script.mod_name] === undefined) return;
	init();
})

subscribeEvent(defines.events.on_tick, init);

subscribeEvent(defines.events.on_gui_click, event => {
	if (event.element?.name !== MainWindow.OpenName) return;

	const player = game.players[event.player_index];
	const [window, created] = MainWindow.getOrCreate(player);

	if (!created) window.dispose();
});

reloadEventHandlers();
