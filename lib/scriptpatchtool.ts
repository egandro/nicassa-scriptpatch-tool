
import { PatchStep } from './data/scriptpatch';
import { WorkingSet } from './data/workingset';

export class ScriptPatchTool {
    static run (ws: WorkingSet, dry: boolean): boolean {
        throw new Error('not implemented');
    }

    static preview (ws: WorkingSet): string {
        throw new Error('not implemented');
    }

    static runSteps (input: string, steps: PatchStep[]): string {
        return input;
    }
}
