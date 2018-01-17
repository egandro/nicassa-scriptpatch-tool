import * as process from 'process';

import { WorkingSet } from '../../src/data/workingset';
import { ScriptPatchTool } from '../../src/scriptpatchtool';
import { NodeIOAbstraction } from '../tools/nodeioabstraction.class';

export class Patch {
    fileName: string;
    dry: boolean;
    verbose: boolean;
    io: NodeIOAbstraction = new NodeIOAbstraction();

    run(opts: any) {
        this.fileName = opts.file;
        this.dry = opts.dry;
        this.verbose = opts.verbose;

        let ws: WorkingSet = <any>null;
        try {
            ws = ScriptPatchTool.load(this.fileName, this.io);
        } catch(err) {
            console.error(err);
            process.exit(-1);
        }

        const result = ScriptPatchTool.run(ws, this.dry, this.io);
        if(result.patched) {
            if(this.dry) {
                console.log('content of patch file "' + this.fileName + '" can be patched');
            } else {
                console.log('content of patch file "' + this.fileName + '" patched');
            }
            if(this.verbose) {
                console.log(result.contentAfter);
            }
            process.exit(0);
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
