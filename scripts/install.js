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
var baseInfo = {
    name: "",
    version: "0.0.1",
    title: "",
    author: "",
    homepage: "",
    dependencies: [],
    description: "",
    factorio_version: "1.1"
};
function CreateSymlink() {
    return __awaiter(this, void 0, void 0, function () {
        var factorioPath, modName, sourcePath, version, modPath, answer, copyPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!process.env.APPDATA) {
                        end(false, "Appdata/Roaming  directory not found");
                    }
                    factorioPath = path.join(process.env.APPDATA, "Factorio/mods");
                    if (!fs.existsSync(factorioPath)) {
                        end(false, "Factorio mod directory not found");
                    }
                    modName = (0, util_1.getModName)();
                    sourcePath = path.resolve(__dirname, "..", "mod");
                    version = (0, util_1.getCurrentVersion)();
                    modPath = path.join(factorioPath, modName + "_" + version);
                    if (!fs.existsSync(modPath)) return [3 /*break*/, 3];
                    if (!!isSymlinkCorrect(modPath, sourcePath)) return [3 /*break*/, 2];
                    console.log("mod '".concat(modPath, "' already exists."));
                    return [4 /*yield*/, (0, util_1.getUserPermission)("Do you want to delete that directory and relink it?")];
                case 1:
                    answer = _a.sent();
                    if (answer) {
                        console.log("Removing ", modPath);
                        fs.rmSync(modPath, {
                            recursive: true
                        });
                    }
                    else {
                        end(false, "Could not create and link directory, as it already exists");
                    }
                    return [3 /*break*/, 3];
                case 2:
                    end();
                    _a.label = 3;
                case 3:
                    copyPath = path.resolve(__dirname, "..", "mod");
                    if (!fs.existsSync(copyPath)) {
                        end(false, "'mod' path does not exist");
                    }
                    baseInfo.name = modName;
                    baseInfo.title = modName.charAt(0).toUpperCase() + modName.slice(1).replace("_", " ");
                    fs.writeFileSync(path.join(copyPath, "info.json"), JSON.stringify(baseInfo, undefined, 4));
                    fs.moveSync(copyPath, modPath);
                    fs.symlinkSync(modPath, sourcePath, "junction");
                    console.log("Linked ".concat(sourcePath, " <==> ").concat(modPath));
                    end();
                    return [2 /*return*/];
            }
        });
    });
}
function isSymlinkCorrect(modPath, sourcePath) {
    if (fs.existsSync(sourcePath)) {
        var isCorrect = fs.lstatSync(sourcePath).isSymbolicLink() && fs.realpathSync(sourcePath) === modPath;
        if (isCorrect) {
            console.log("mod is already correctly linked.");
            return true;
        }
    }
    return false;
}
function end(success, reason) {
    if (success === void 0) { success = true; }
    if (success)
        console.log("\x1b[32m%s\x1b[0m", "\nInstallation successfull!");
    else {
        console.log("\x1b[31m%s\x1b[0m", "\nSomething went wrong...");
        if (reason)
            console.log(reason);
    }
    process.exit(0);
}
CreateSymlink();
