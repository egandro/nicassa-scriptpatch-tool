import * as process from 'process';

import { WorkingSet } from '../../src/data/workingset';
import { ScriptPatchTool } from '../../src/scriptpatchtool';

export class Patch {
    fileName: string;
    dry: boolean;
    verbose: boolean;
    log: boolean;

    run(opts: any) {
        this.fileName = opts.file;
        this.dry = opts.dry;
        this.verbose = opts.verbose;
        this.log = opts.log;
        if(this.log) {
            this.verbose = true;
        }

        let ws: WorkingSet = <any>null;
        try {
            ws = ScriptPatchTool.load(this.fileName);
        } catch(err) {
            console.error(err);
            process.exit(-1);
        }

        const result = ScriptPatchTool.run(ws, this.dry);
        if(result.patched) {
            if(this.dry) {
                if(this.verbose) {
                    console.log('content of patch file "' + this.fileName + '" can be patched');
                }
            } else {
                if(this.verbose) {
                    console.log('content of patch file "' + this.fileName + '" patched');
                }
            }
            if(this.log) {
                console.log(result.contentAfter);
            }
            process.exit(0);
        } else {
            if(this.verbose) {
                console.log('content of patch file "' + this.fileName + '" can not be patched or does not need patching');
            }
            process.exit(-1);
        }
    }
}

export default function run(opts: any) {
    let instance = new Patch();
    return instance.run(opts);
}
