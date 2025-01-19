'use strict';
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vcvars = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const tmp = __importStar(require("tmp"));
var vcvars;
(function (vcvars) {
    let Architecture;
    (function (Architecture) {
        Architecture["x86"] = "x86";
        Architecture["x86_x64"] = "x86_amd64";
        Architecture["x86_ARM"] = "x86_arm";
        Architecture["x86_ARM64"] = "x86_arm64";
        Architecture["x64"] = "amd64";
        Architecture["x64_x86"] = "amd64_x86";
        Architecture["x64_ARM"] = "amd64_arm";
        Architecture["x64_ARM64"] = "amd64_arm64";
    })(Architecture = vcvars.Architecture || (vcvars.Architecture = {}));
    let PlatformType;
    (function (PlatformType) {
        PlatformType["store"] = "store";
        PlatformType["uwp"] = "uwp";
    })(PlatformType = vcvars.PlatformType || (vcvars.PlatformType = {}));
    function getHostTarget(arch) {
        switch (arch) {
            case Architecture.x86: return { host: 'x86', target: 'x86' };
            case Architecture.x86_x64: return { host: 'x86', target: 'x64' };
            case Architecture.x86_ARM: return { host: 'x86', target: 'ARM' };
            case Architecture.x86_ARM64: return { host: 'x86', target: 'ARM64' };
            case Architecture.x64: return { host: 'x64', target: 'x64' };
            case Architecture.x64_x86: return { host: 'x64', target: 'x86' };
            case Architecture.x64_ARM: return { host: 'x64', target: 'ARM' };
            case Architecture.x64_ARM64: return { host: 'x64', target: 'ARM64' };
        }
        throw new Error('Unknown architecture');
    }
    vcvars.getHostTarget = getHostTarget;
    function getArchitecture(hostTarget) {
        switch (hostTarget.host) {
            case 'x86':
                switch (hostTarget.target) {
                    case 'x86': return Architecture.x86;
                    case 'x64': return Architecture.x86_x64;
                    case 'ARM': return Architecture.x86_ARM;
                    case 'ARM64': return Architecture.x86_ARM64;
                }
                break;
            case 'x64':
                switch (hostTarget.target) {
                    case 'x86': return Architecture.x64_x86;
                    case 'x64': return Architecture.x64;
                    case 'ARM': return Architecture.x64_ARM;
                    case 'ARM64': return Architecture.x64_ARM64;
                }
                break;
        }
        throw new Error('Unknown architecture');
    }
    vcvars.getArchitecture = getArchitecture;
    /**
     * Get the environment variables set by the vcvarsall.bat script for a given Visual Studio installation.
     * @param vsInstallation A Visual Studio installation description (use 'node-vswhere's `getVSInstallations` API).
     * @param options Arguments to pass to the vcvarall.bat script.
     */
    function getVCVars(vsInstallation, options) {
        return __awaiter(this, void 0, void 0, function* () {
            tmp.setGracefulCleanup();
            const args = getArgs(options);
            const vcvarsall = yield findVCVarsAll(vsInstallation);
            const sentinel = '--------';
            const script = [
                `@echo off`,
                `set`,
                `echo ${sentinel}`,
                `call "${vcvarsall}" ${args.join(' ')}`,
                `set`,
            ];
            const batFile = (yield getTempFileName()) + '.bat';
            yield fs_1.promises.writeFile(batFile, script.join('\n'));
            return new Promise((resolve, reject) => {
                (0, child_process_1.exec)(batFile, (err, stdout, stderr) => {
                    if (err) {
                        reject(new Error(err.toString()));
                        return;
                    }
                    const env = {};
                    const devEnv = {};
                    let envDone = false;
                    const addEnvVar = (line, env) => {
                        const keyVal = line.split('=');
                        if (keyVal.length > 1) {
                            env[keyVal[0]] = keyVal.slice(1).join('=');
                        }
                    };
                    for (const line of stdout.split('\n')) {
                        let data = line.trim();
                        if (envDone) {
                            addEnvVar(data, devEnv);
                        }
                        else if (data === sentinel) {
                            envDone = true;
                        }
                        else {
                            addEnvVar(data, env);
                        }
                    }
                    fs_1.promises.unlink(batFile);
                    resolve(diff(env, devEnv));
                });
            });
        });
    }
    vcvars.getVCVars = getVCVars;
    function getTempFileName() {
        return new Promise((resolve, reject) => tmp.tmpName({}, (err, path) => {
            if (err) {
                return reject(new Error('Unable to create temporary file for environment variables: ' + err.message));
            }
            resolve(path);
        }));
    }
    function getArgs(options) {
        const args = [];
        if (!options) {
            if (process.arch === 'arm64') {
                options = { arch: Architecture.x64_ARM64 };
            }
            else if (process.arch === 'ia32') {
                options = { arch: Architecture.x86 };
            }
            else {
                options = { arch: Architecture.x64 };
            }
        }
        if (options.arch) {
            args.push(options.arch);
        }
        if (options.platformType) {
            args.push(options.platformType);
        }
        if (options.windowsSdkVersion) {
            args.push(options.windowsSdkVersion);
        }
        if (options.vcVersion) {
            args.push(`-vcvars_ver=${options.vcVersion}`);
        }
        if (options.spectre) {
            args.push('spectre');
        }
        return args;
    }
    function findVCVarsAll(vsInstallation) {
        return __awaiter(this, void 0, void 0, function* () {
            const vcvarsall = vsInstallation.installationPath + '\\VC\\Auxiliary\\Build\\vcvarsall.bat';
            try {
                yield fs_1.promises.stat(vcvarsall);
                return vcvarsall;
            }
            catch (e) {
                throw new Error(`Could not find vcvarsall.bat in ${vcvarsall}`);
            }
        });
    }
    function diff(env, devEnv) {
        for (const key in env) {
            if (devEnv[key]) {
                if (env[key] === devEnv[key]) {
                    delete devEnv[key];
                }
                else {
                    devEnv[key] = devEnv[key].replace(env[key], `%${key}%`);
                }
            }
        }
        return devEnv;
    }
})(vcvars || (exports.vcvars = vcvars = {}));
