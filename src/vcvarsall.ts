'use strict';

import { exec, execFile } from "child_process";
import { promises as fs } from "fs";
import { vswhere } from "node-vswhere";
import * as tmp from "tmp";
import { setEnvironmentData } from "worker_threads";

export namespace vcvars {

    export enum Architecture {
        x86 = 'x86',
        x86_x64 = 'x86_amd64',
        x86_ARM = 'x86_arm',
        x86_ARM64 = 'x86_arm64',
        x64 = 'amd64',
        x64_x86 = 'amd64_x86',
        x64_ARM = 'amd64_arm',
        x64_ARM64 = 'amd64_arm64',
    }
    export enum PlatformType {
        store = 'store',
        uwp = 'uwp',
    }
    export interface HostTarget {
        /**
         * The architecture of the compiler and linker.
         */
        host: 'x86' | 'x64';
        /**
         * The architecture of the compiled binaries.
         */
        target: 'x86' | 'x64' | 'ARM' | 'ARM64';
    }
    export function getHostTarget(arch: Architecture): HostTarget {
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
    export function getArchitecture(hostTarget: HostTarget): Architecture {
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
    export interface Options {
        /**
         * specifies the host and target architecture to use. If architecture isn't specified, the default build environment is used.
         */
        arch?: Architecture;
        /**
         * Allows you to specify `store` or `uwp` as the platform type. By default, the environment is set to build desktop or console apps.
         */
        platformType?: PlatformType;
        /**
         * The version of the Windows SDK to use. By default, the latest installed Windows SDK is used. To specify the Windows SDK version, you can use a full Windows SDK number such as 10.0.10240.0, or specify 8.1 to use the Windows 8.1 SDK.
         */
        windowsSdkVersion?: string;
        /**
         * The Visual Studio compiler toolset to use. By default, the environment is set to use the current Visual Studio compiler toolset.
         */
        vcVersion?: string;
        /**
         * Specifies whether to enable Spectre mitigations.
         */
        spectre?: boolean;
    }
    export type Vars = { [key: string]: string };

    /**
     * Get the environment variables set by the vcvarsall.bat script for a given Visual Studio installation.
     * @param vsInstallation A Visual Studio installation description (use 'node-vswhere's `getVSInstallations` API).
     * @param options Arguments to pass to the vcvarall.bat script.
     */
    export async function getVCVars(vsInstallation: vswhere.Installation, options?: Options): Promise<Vars> {
        tmp.setGracefulCleanup();
        const args = getArgs(options);
        const vcvarsall = await findVCVarsAll(vsInstallation);
        const sentinel = '--------';
        const script = [
            `@echo off`,
            `set`,
            `echo ${sentinel}`,
            `call "${vcvarsall}" ${args.join(' ')}`,
            `set`,
        ];
        const batFile = await getTempFileName() + '.bat';
        await fs.writeFile(batFile, script.join('\n'));
        return new Promise<Vars>((resolve, reject) => {
            exec(batFile, (err, stdout, stderr) => {
                if (err) {
                    reject(new Error(err.toString()));
                    return;
                }
                const env: Vars = {};
                const devEnv: Vars = {};
                let envDone = false;
                const addEnvVar = (line: string, env: Vars) => {
                    const keyVal = line.split('=');
                    if (keyVal.length > 1) {
                        env[keyVal[0]] = keyVal.slice(1).join('=');
                    }
                };
    
                for (const line of stdout.split('\n')) {
                    let data = line.trim();
                    if (envDone) {
                        addEnvVar(data, devEnv);
                    } else if (data === sentinel) {
                        envDone = true;
                    } else {
                        addEnvVar(data, env);
                    }
                }
                fs.unlink(batFile);
                resolve(diff(env, devEnv));
            });
        });
    }

    function getTempFileName(): Promise<string> {
        return new Promise<string>((resolve, reject) => tmp.tmpName({}, (err, path) => {
            if (err) {
                return reject(new Error('Unable to create temporary file for environment variables: ' + err.message));
            }
            resolve(path);
        }));
    }

    function getArgs(options?: Options): string[] {
        const args: string[] = [];
        if (!options) {
            if (process.arch === 'arm64') {
                options = { arch: Architecture.x64_ARM64 };
            } else if (process.arch === 'ia32') {
                options = { arch: Architecture.x86 };
            } else {
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

    async function findVCVarsAll(vsInstallation: vswhere.Installation): Promise<string> {
        const vcvarsall = vsInstallation.installationPath + '\\VC\\Auxiliary\\Build\\vcvarsall.bat';
        try {
            await fs.stat(vcvarsall);
            return vcvarsall;
        } catch (e) {
            throw new Error(`Could not find vcvarsall.bat in ${vcvarsall}`);
        }
    }

    function diff(env: Vars, devEnv: Vars): Vars {
        for (const key in env) {
            if (devEnv[key]) {
                if (env[key] === devEnv[key]) {
                    delete devEnv[key];
                } else {
                    devEnv[key] = devEnv[key].replace(env[key], `%${key}%`);
                }
            }
        }
        return devEnv;
    }    
}