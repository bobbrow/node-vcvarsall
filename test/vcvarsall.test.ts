import { vswhere } from "node-vswhere";
import { vcvars } from "../src/vcvarsall";

const assert = require('assert');
describe('vcvarsall', () => {
    it('Should get the dev environment variables from the latest version of Visual Studio', async () => {
        const vs = await vswhere.getVSInstallations({
            all: true,
            sort: true,
            prerelease: true,
            requires: ['Microsoft.VisualStudio.Component.VC.Tools.x86.x64']
        });
        assert.ok(vs.length > 0);
        const vars = await vcvars.getVCVars(vs[0]);
        assert.ok(vars['INCLUDE']);
        assert.ok(vars['VCToolsInstallDir']);
    });

    it('Should get the dev environment variables from a specific host/target arch', async () => {
        const vs = await vswhere.getVSInstallations({
            all: true,
            sort: true,
            prerelease: true,
            requires: ['Microsoft.VisualStudio.Component.VC.Tools.x86.x64']
        });
        assert.ok(vs.length > 0);
        const vars = await vcvars.getVCVars(vs[0], { arch: vcvars.Architecture.x86_x64 });
        const toolsetVersion = vars['VCToolsVersion'];
        assert.ok(vars['Path'].toLocaleLowerCase().includes('vc\\tools\\msvc\\' + toolsetVersion + '\\bin\\hostx86\\x64'));
    });

    it('Should get the dev environment variables from a specific host/target arch', async () => {
        const vs = await vswhere.getVSInstallations({
            all: true,
            sort: true,
            prerelease: true,
            requires: ['Microsoft.VisualStudio.Component.VC.Tools.x86.x64']
        });
        assert.ok(vs.length > 0);
        const vars = await vcvars.getVCVars(vs[0], { arch: vcvars.Architecture.x64_x86 });
        const toolsetVersion = vars['VCToolsVersion'];
        assert.ok(vars['Path'].toLocaleLowerCase().includes('vc\\tools\\msvc\\' + toolsetVersion + '\\bin\\hostx64\\x86'));
    });
});