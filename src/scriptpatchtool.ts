import { PatchStep, PatchStepType } from './data/scriptpatch';
import { WorkingSet } from './data/workingset';

export interface ScriptPatchToolResult {
    contentBefore: string;
    contentAfter: string;
    patched: boolean;
    sqlFileFullPath: string;
}

// needed for electron
export interface IOAbstraction {
    readFileSync(fileName: string, encoding: string): string;
    writeFileSync(fileName: string, data: any, encoding: string): void;
    normalize(fileName: string): string;
    dirname(fileName: string): string;
    existsSync(fileName: string): boolean;
}

export class ScriptPatchTool {
    static BRANDING = "-- Patched with ScriptPatchTool";
    static ENCODING = 'latin1';

    static load(fileName: string, io: IOAbstraction): WorkingSet {
        if (!io.existsSync(fileName)) {
            throw new Error('error: can\'t read file "' + fileName + '"');
        }

        const str = io.readFileSync(fileName, 'utf-8');
        const scriptPatch: any = JSON.parse(str);

        const result: WorkingSet = {
            fileName: fileName,
            scriptPatch: scriptPatch
        }

        return result;
    }

    static save(ws: WorkingSet, io: IOAbstraction) {
        const data: any = JSON.stringify(ws.scriptPatch, null, 2);
        io.writeFileSync(data, ws.fileName, 'utf-8');
    }

    static run(ws: WorkingSet, dry: boolean, io: IOAbstraction): ScriptPatchToolResult {
        const result = ScriptPatchTool.preview(ws, io);
        if (dry) {
            return result;
        }
        if (result.patched) {
            io.writeFileSync(result.sqlFileFullPath, result.contentAfter, ScriptPatchTool.ENCODING);
        }
        return result;
    }

    static preview(ws: WorkingSet, io: IOAbstraction): ScriptPatchToolResult {
        if (ws == null || ws === undefined) {
            throw new Error('workingset is not set');
        }

        if (ws.fileName == null || ws.fileName === undefined) {
            throw new Error('filename is not set');
        }

        if (ws.scriptPatch == null || ws.scriptPatch === undefined) {
            throw new Error('no scriptpatch defined');
        }

        if (ws.scriptPatch.sqlFileName == null || ws.scriptPatch.sqlFileName === undefined) {
            throw new Error('no sql file defined in scriptpatch');
        }

        let fileName = ws.scriptPatch.sqlFileName;

        if (ws.scriptPatch.relativePath) {
            fileName = io.dirname(io.normalize(ws.fileName));
            fileName = fileName + '/' + ws.scriptPatch.sqlFileName;
            fileName = io.normalize(fileName);
        }

        if (!io.existsSync(fileName)) {
            throw new Error('sql file "' + fileName + '" does not exist');
        }

        const str = io.readFileSync(fileName, ScriptPatchTool.ENCODING);
        if (str == null || str === undefined) {
            throw new Error('can\'t read sql file "' + fileName + '"');
        }

        const result: ScriptPatchToolResult = {
            contentBefore: str,
            contentAfter: str,
            patched: false,
            sqlFileFullPath: fileName
        }

        if (ws.scriptPatch == null || ws.scriptPatch === undefined) {
            return result;
        }
        if (str.indexOf(ScriptPatchTool.BRANDING) != -1) {
            return result;
        }

        result.contentAfter = ScriptPatchTool.runSteps(str, ws.scriptPatch.stepList);
        if (str !== result.contentAfter) {
            // we're patched...
            result.patched = true;
        }

        if (ws.scriptPatch.createBranding && result.patched) {
            result.contentAfter = ScriptPatchTool.BRANDING + " : " + (new Date()) + "\n" + result.contentAfter;
        }

        return result;
    }

    static runSteps(input: string, steps: PatchStep[]): string {
        let result = input;
        for (const step of steps) {
            result = ScriptPatchTool.runStep(result, step);
        }
        return result;
    }

    static runStep(input: string, step: PatchStep): string {
        if (step == null || step === undefined || !step.active) {
            return input;
        }

        if (input == null || input === undefined) {
            return input;
        }

        let result = '';
        let search = step.searchText;
        let replace = step.replaceText;

        // make me cleaner!
        if (search != null) {
            search = search.replace('\r', '');
            search = search.replace('\n', '\r\n');
        }
        if (replace != null) {
            replace = replace.replace('\r', '');
            replace = replace.replace('\n', '\r\n');
        }

        switch (step.stepType) {
            case PatchStepType.STEP_TYPE_EMPTY:
                result = input;
                break;
            case PatchStepType.STEP_INSERT_ON_TOP_OF_FILE:
                if (search != null) {
                    result = search + input;
                }
                break;
            case PatchStepType.STEP_APPEND_TO_END_OF_FILE:
                if (step.searchText != null) {
                    result = input + search;
                }
                break;
            case PatchStepType.STEP_INSERT_BEFORE_TEXT:
                if (search != null && replace != null) {
                    const position = input.indexOf(search);
                    if (position > -1) {
                        const head = input.substr(0, position);
                        const tail = input.substr(position);
                        result = head + replace + tail;
                    }
                }
                break;
            case PatchStepType.STEP_INSERT_AFTER_TEXT:
                if (search != null && replace != null) {
                    const position = input.indexOf(search) + search.length;
                    if (position > -1) {
                        const head = input.substr(0, position);
                        const tail = input.substr(position);
                        result = head + replace + tail;
                    }
                }
                break;
            case PatchStepType.STEP_REPLACE_TEXT:
                if (search != null && replace != null) {
                    const position = input.indexOf(search);
                    if (position > -1) {
                        const head = input.substr(0, position);
                        const tail = input.substr(position + replace.length);
                        result = head + replace + tail;
                    }
                }
                break;
            case PatchStepType.STEP_DELETE_TEXT:
                if (search != null) {
                    const position = input.indexOf(search);
                    if (position > -1) {
                        const head = input.substr(0, position);
                        const tail = input.substr(position + search.length);
                        result = head + tail;
                    }
                }
                break;
            default:
                console.error('unknown patch type', step.stepType);
        }

        return result;
    }
}

