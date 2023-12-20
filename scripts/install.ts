import * as fs from "fs-extra";
import * as path from "path";
import { ModInfo, getCurrentVersion, getModName, getUserPermission, setModPath } from "./util";

const baseInfo: ModInfo = {
	name: "",
	version: "0.0.1",
	title: "",
	author: "",
	homepage: "",
	dependencies: [],
	description: "",
	factorio_version: "1.1"
};

async function CreateSymlink() {
	if (!process.env.APPDATA) {
		end(false, "Appdata/Roaming  directory not found");
	}
	const factorioPath = path.join(process.env.APPDATA, "Factorio/mods");
	if (!fs.existsSync(factorioPath)) {
		end(false, "Factorio mod directory not found");
	}
	const modName = getModName();
	const sourcePath = path.resolve(__dirname, "..", "mod");
	const version = getCurrentVersion();
	const modPath = path.join(factorioPath, modName + "_" + version);
	if (fs.existsSync(modPath)) {
		if (!isSymlinkCorrect(modPath, sourcePath)) {
			console.log(`mod '${modPath}' already exists.`);
			const answer = await getUserPermission("Do you want to delete that directory and relink it?");
			if (answer) {
				console.log("Removing ", modPath);
				fs.rmSync(modPath, {
					recursive: true
				});
			} else {
				end(false, "Could not create and link directory, as it already exists");
			}
		} else {
			end();
		}
	}
	const copyPath = path.resolve(__dirname, "..", "mod");
	if (!fs.existsSync(copyPath)) {
		end(false, "'mod' path does not exist");
	}
	baseInfo.name = modName;
	baseInfo.title = modName.charAt(0).toUpperCase() + modName.slice(1).replace("_", " ");
	fs.writeFileSync(path.join(copyPath, "info.json"), JSON.stringify(baseInfo, undefined, 4));
	fs.moveSync(copyPath, modPath);
	fs.symlinkSync(modPath, sourcePath, "junction");
	console.log(`Linked ${sourcePath} <==> ${modPath}`);
	end();
}

function isSymlinkCorrect(modPath: string, sourcePath: string) {
	if (fs.existsSync(sourcePath)) {
		const isCorrect = fs.lstatSync(sourcePath).isSymbolicLink() && fs.realpathSync(sourcePath) === modPath;
		if (isCorrect) {
			console.log("mod is already correctly linked.");
			return true;
		}
	}
	return false;
}

function end(success = true, reason?: string): never {
	if (success) console.log("\x1b[32m%s\x1b[0m", `\nInstallation successfull!`);
	else {
		console.log("\x1b[31m%s\x1b[0m", `\nSomething went wrong...`);
		if (reason) console.log(reason);
	}
	process.exit(0);
}

CreateSymlink();
