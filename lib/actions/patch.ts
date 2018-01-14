let fs = require('fs');
let process = require('process');

import { WorkingSet } from '../persistance/workingset';
import { ScriptPatch } from '../persistance/scriptpatch';

export class Patch {
    workingSet: WorkingSet
    fileName: string;

    run(opts: any) {
        this.fileName = opts.file;

        if (!fs.existsSync(this.fileName)) {
            console.error('error: can\'t read file "' + this.fileName + '"');
            process.exit(-1);
        }

        const str = fs.readFileSync(this.fileName);
        const scriptPatch: ScriptPatch = JSON.parse(str);

        this.workingSet = {
            fileName: this.fileName,
            scriptPatch: scriptPatch
        }
    }


}

export default function run(opts: any) {
    let instance = new Patch();
    return instance.run(opts);
}
