import { vswhere } from "node-vswhere";
export declare namespace vcvars {
    enum Architecture {
        x86 = "x86",
        x86_x64 = "x86_amd64",
        x86_ARM = "x86_arm",
        x86_ARM64 = "x86_arm64",
        x64 = "amd64",
        x64_x86 = "amd64_x86",
        x64_ARM = "amd64_arm",
        x64_ARM64 = "amd64_arm64"
    }
    enum PlatformType {
        store = "store",
        uwp = "uwp"
    }
    interface HostTarget {
        /**
         * The architecture of the compiler and linker.
         */
        host: 'x86' | 'x64';
        /**
         * The architecture of the compiled binaries.
         */
        target: 'x86' | 'x64' | 'ARM' | 'ARM64';
    }
    function getHostTarget(arch: Architecture): HostTarget;
    function getArchitecture(hostTarget: HostTarget): Architecture;
    interface Options {
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
    type Vars = {
        [key: string]: string;
    };
    /**
     * Get the environment variables set by the vcvarsall.bat script for a given Visual Studio installation.
     * @param vsInstallation A Visual Studio installation description (use 'node-vswhere's `getVSInstallations` API).
     * @param options Arguments to pass to the vcvarall.bat script.
     */
    function getVCVars(vsInstallation: vswhere.Installation, options?: Options): Promise<Vars>;
}
