let fs = require('fs');
let process = require('process');

import { WorkingSet } from '../../../lib/data/workingset';
import { ScriptPatchTool } from '../../../lib/scriptpatchtool';

export class Patch {
    fileName: string;
    dry: boolean;

    run(opts: any) {
        this.fileName = opts.file;
        this.dry = opts.dry;

        if (!fs.existsSync(this.fileName)) {
            console.error('error: can\'t read file "' + this.fileName + '"');
            process.exit(-1);
        }

        const str = fs.readFileSync(this.fileName);
        const scriptPatch: any = JSON.parse(str);

        const ws: WorkingSet = {
            fileName: this.fileName,
            scriptPatch: scriptPatch
        }

        const result = ScriptPatchTool.run(ws, this.dry);
        if(result.patched) {
            if(this.dry) {
                console.log('content of patch file "' + this.fileName + '" can be patched');
                process.exit(0);
            } else {
                console.log('content of patch file "' + this.fileName + '" patched');
                process.exit(0);
            }
        } else {
            console.log('content of patch file "' + this.fileName + '" can not be patched or does not need patching');
            process.exit(-1);
        }
    }
}

export default function run(opts: any) {
    let instance = new Patch();
    return instance.run(opts);
}
