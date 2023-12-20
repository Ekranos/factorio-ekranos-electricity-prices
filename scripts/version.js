"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs-extra"));
var path = __importStar(require("path"));
var util_1 = require("./util");
var modName = (0, util_1.getModName)();
var modPath = path.resolve(__dirname, "..", "mod");
if (!process.env.APPDATA) {
    console.log("Mod path not found!");
    process.exit();
}
var factorioPath = path.join(process.env.APPDATA, "Factorio/mods");
var tempPath = path.join(path.resolve(__dirname, ".."), "_temp");
var targetPath = "";
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
    var newPath = path.join(path.resolve(__dirname, ".."), "mod");
    fs.renameSync(tempPath, newPath);
    // setModPath("mod");
    console.log("Backup restored under: '".concat(newPath, "'"));
}
function CheckVersion() {
    var args = process.argv;
    if (args.length < 4) {
        console.log("Not enough parameters!");
        return;
    }
    var newVersion = args[3];
    var infoPath = path.join(modPath, "info.json");
    if (!fs.existsSync(infoPath)) {
        console.log("'info.json' not found!");
        return;
    }
    var info = require(infoPath);
    var oldVersion = info.version;
    if (oldVersion == newVersion) {
        console.log("Version ".concat(oldVersion, " already exists!"));
        return;
    }
    info.version = newVersion;
    fs.writeFileSync(infoPath, JSON.stringify(info, undefined, 4));
    targetPath = path.join(factorioPath, modName + "_" + newVersion);
    fs.copySync(modPath, targetPath, { dereference: true });
    fs.rmSync(fs.realpathSync(modPath), { recursive: true });
    fs.unlinkSync(modPath);
    fs.symlinkSync(targetPath, modPath, "junction");
    return { newVersion: newVersion, oldVersion: oldVersion };
}
function sleep(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var versions;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("\x1b[36m%s\x1b[0m", "PLEASE DO NOT INTERRUPT THE FOLLOWING PROCEDURE MANUALLY!");
                return [4 /*yield*/, sleep(3000)];
            case 1:
                _a.sent();
                versions = undefined;
                try {
                    console.log("Creating backup before proceeding...");
                    CreateBackup();
                    versions = CheckVersion();
                }
                catch (exception) {
                    console.log("\x1b[31m%s\x1b[0m", "Something went wrong while changing the version! See error log below:");
                    console.log(exception);
                    RestoreBackup();
                }
                finally {
                    console.log("Removing backup and cleaning up...");
                    try {
                        RemoveBackup();
                    }
                    catch (exception2) {
                        console.log("Error on backup removal!");
                    }
                }
                if (versions) {
                    console.log("\x1b[32m%s\x1b[0m", "\nVersion changed successfully from ".concat(versions.oldVersion, " ==> ").concat(versions.newVersion));
                }
                else {
                    console.log("\x1b[31m%s\x1b[0m", "\nVersion change was not successfull");
                }
                return [2 /*return*/];
        }
    });
}); })();
