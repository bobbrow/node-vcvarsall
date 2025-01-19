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
});