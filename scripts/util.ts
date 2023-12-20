import * as fs from "fs-extra";
import * as path from "path";
import * as readline from "readline";

export interface ModInfo {
	name: string;
	version: string;
	title: string;
	author?: string;
	homepage?: string;
	dependencies?: string[];
	description?: string;
	factorio_version: string;
}

interface packageSnippet {
	name: string;
	scripts?: {
		dev?: string;
	};
}
const packageJson: packageSnippet = require("../package.json");

export function getModName(): string {
	const modPath = path.resolve(__dirname, "..", "mod");
	const infoPath = path.join(modPath, "info.json");
	if (!fs.existsSync(infoPath)) {
		throw Error("'info.json' not found!");
	}
	const info: ModInfo = require(infoPath);
	return info.name;
}

export function setModPath(sourcePath: string) {
	if (packageJson.scripts) {
		if (packageJson.scripts.dev) {
			const devScript = packageJson.scripts.dev;
			let newScript = devScript;
			let match = devScript.match(/tstl\s+--project\s+(.*?)\s+--watch/);
			if (match) {
				const newPath = path.join(sourcePath, "tsconfig.json");
				newScript = `tstl --project ${newPath} --watch`;
			}
			packageJson.scripts.dev = newScript;
			fs.writeFileSync(path.resolve(__dirname, "..", "package.json"), JSON.stringify(packageJson, undefined, 4));
		}
	}
}

export function getCurrentVersion(): string {
	const modPath = path.resolve(__dirname, "..", "mod");
	const infoPath = path.join(modPath, "info.json");
	if (!fs.existsSync(infoPath)) {
		throw Error("'info.json' not found!");
	}
	const info: ModInfo = require(infoPath);
	return info.version;
}

const rlInterface = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

export function getUserPermission(msg: string): Promise<boolean> {
	return new Promise(resolve => {
		rlInterface.setPrompt(`${msg} [y/n] `);
		rlInterface.prompt();
		rlInterface.on("line", answer => {
			switch (answer.toLowerCase()) {
				case "y":
					rlInterface.close();
					resolve(true);
					break;
				case "n":
					rlInterface.close();
					resolve(false);
					break;
				default:
					process.stdout.write(`${msg} [y/n] `); // Try again
			}
		});
	});
}
