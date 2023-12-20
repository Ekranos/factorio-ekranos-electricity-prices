import * as fs from "fs-extra";
import * as path from "path";
import { ModInfo, getModName, setModPath } from "./util";

const modName = getModName();
const modPath = path.resolve(__dirname, "..", "mod");
if (!process.env.APPDATA) {
	console.log("Mod path not found!");
	process.exit();
}
const factorioPath = path.join(process.env.APPDATA, "Factorio/mods");
const tempPath = path.join(path.resolve(__dirname, ".."), "_temp");
let targetPath = "";

function CreateBackup() {
	fs.copySync(modPath, tempPath, { dereference: true });
}

function RemoveBackup() {
	if (!fs.existsSync(tempPath)) {
		return;
	}
	fs.rmSync(tempPath, { recursive: true });
}

function RestoreBackup() {
	if (!fs.existsSync(tempPath)) {
		return;
	}
	console.log("Restoring backup...");
	const newPath = path.join(path.resolve(__dirname, ".."), "mod");
	fs.renameSync(tempPath, newPath);
	// setModPath("mod");
	console.log(`Backup restored under: '${newPath}'`);
}

function CheckVersion(): { newVersion: string; oldVersion: string } | undefined {
	const args = process.argv;
	if (args.length < 4) {
		console.log("Not enough parameters!");
		return;
	}
	const newVersion = args[3];
	const infoPath = path.join(modPath, "info.json");
	if (!fs.existsSync(infoPath)) {
		console.log("'info.json' not found!");
		return;
	}
	const info: ModInfo = require(infoPath);
	const oldVersion = info.version;
	if (oldVersion == newVersion) {
		console.log(`Version ${oldVersion} already exists!`);
		return;
	}
	info.version = newVersion;
	fs.writeFileSync(infoPath, JSON.stringify(info, undefined, 4));
	targetPath = path.join(factorioPath, modName + "_" + newVersion);
	fs.copySync(modPath, targetPath, { dereference: true });
	fs.rmSync(fs.realpathSync(modPath), { recursive: true });
	fs.unlinkSync(modPath);
	fs.symlinkSync(targetPath, modPath, "junction");
	return { newVersion, oldVersion };
}

function sleep(ms: number) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

(async () => {
	console.log("\x1b[36m%s\x1b[0m", "PLEASE DO NOT INTERRUPT THE FOLLOWING PROCEDURE MANUALLY!");
	await sleep(3000);

	let versions: { newVersion: string; oldVersion: string } | undefined = undefined;
	try {
		console.log("Creating backup before proceeding...");
		CreateBackup();
		versions = CheckVersion();
	} catch (exception) {
		console.log("\x1b[31m%s\x1b[0m", "Something went wrong while changing the version! See error log below:");
		console.log(exception);
		RestoreBackup();
	} finally {
		console.log("Removing backup and cleaning up...");
		try {
			RemoveBackup();
		} catch (exception2) {
			console.log("Error on backup removal!");
		}
	}

	if (versions) {
		console.log("\x1b[32m%s\x1b[0m", `\nVersion changed successfully from ${versions.oldVersion} ==> ${versions.newVersion}`);
	} else {
		console.log("\x1b[31m%s\x1b[0m", "\nVersion change was not successfull");
	}
})();
