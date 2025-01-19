# node-vcvarsall

Retreives the environment variables set by running the `vcvarsall.bat` script.

The resulting object represents the delta between the system environment and a Developer Command Prompt's
environment. Variables that are modified by the `vcvarsall.bat` script are returned without the value from
the original environment - instead using `%varName%` (e.g. `%Path%` for variable `Path`) as a placeholder
for the variable's original value.

## Usage

### definition
```ts
namespace vcvars {

    function getVCVars(vsInstallation: vswhere.Installation, options?: Options): Promise<Vars>;

}
```

### example
```ts
import { vswhere } from 'node-vswhere';
import { vcvars } from 'node-vcvarsall';

// Find only VS installations that include the MSVC toolset.
const installations = await vswhere.getVSInstallations({
        all: true,
        sort: true,
        prerelease: true,
        requires: ['Microsoft.VisualStudio.Component.VC.Tools.x86.x64']
    })
    .catch(err => []);

if (installations.length > 0) {
    const vars = await vcvars.getVCVars(installations[0]);
}
```

### additional options

The following options map directly to the switches that `vcvarsall` supports. 

```ts
namespace vswhere {
    interface Options {
        arch?: Architecture;
        platformType?: PlatformType;
        windowsSdkVersion?: string;
        vcVersion?: string;
        spectre?: boolean;
    }
}
```

