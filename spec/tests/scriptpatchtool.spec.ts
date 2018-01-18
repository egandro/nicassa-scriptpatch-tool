import { ScriptPatchTool } from '../../src/scriptpatchtool';
import { ScriptPatch, PatchStep, PatchStepType} from '../../src/data/scriptpatch';
import { WorkingSet } from '../../src/data/workingset';

describe('ScriptPatchTool', () => {

    beforeEach(testAsync(async () => {
    }));

    it('it should do no changes for no steps', testAsync(async () => {
        const input = `Nothing`;

        const steps: PatchStep[] = [];

        const output = ScriptPatchTool.runSteps(input, steps);

        expect(output).not.toBeNull();
        expect(output).not.toBeUndefined();
        expect(output).toBe(input);

    }));

    it('it should do no changes for inactive steps', testAsync(async () => {
        const input = `Nothing`;

        const steps: PatchStep[] = [];
        let step: PatchStep = {
            comment: '',
            stepType: PatchStepType.STEP_DELETE_TEXT,
            searchText: 'Nothing',
            replaceText: '',
            active: false
        }
        steps.push(step);

        step = {
            comment: '',
            stepType: PatchStepType.STEP_INSERT_ON_TOP_OF_FILE,
            searchText: <any>null,
            replaceText: 'Nothing',
            active: false
        }
        steps.push(step);

        const output = ScriptPatchTool.runSteps(input, steps);

        expect(output).not.toBeNull();
        expect(output).not.toBeUndefined();
        expect(output).toBe(input);

    }));

    it('it should do no nothing for null search and replace texts', testAsync(async () => {
        const input = `Nothing`;

        let step: PatchStep =  {
            comment: '',
            stepType: PatchStepType.STEP_INSERT_ON_TOP_OF_FILE,
            searchText: null,
            replaceText: null,
            active: true
        }

        const output = ScriptPatchTool.runSteps(input, [step]);

        expect(output).not.toBeNull();
        expect(output).not.toBeUndefined();
        expect(output).toBe(input);

    }));

    it('it should do no changes for step type STEP_TYPE_EMPTY', testAsync(async () => {
        const input = `Nothing`;

        const steps: PatchStep[] = [];
        const step: PatchStep = {
            comment: '',
            stepType: PatchStepType.STEP_TYPE_EMPTY,
            searchText: '',
            replaceText: '',
            active: true
        }
        steps.push(step);

        const output = ScriptPatchTool.runSteps(input, steps);

        expect(output).not.toBeNull();
        expect(output).not.toBeUndefined();
        expect(output).toBe(input);

    }));

    it('it should insert a text on top for step STEP_INSERT_ON_TOP_OF_FILE', testAsync(async () => {
        const input = `abcdef`;
        const expected = `Some Dummy Textabcdef`;

        const searchText = 'Some Dummy Text';
        const replaceText: string = <any>null;
        const step: PatchStep = {
            comment: '',
            stepType: PatchStepType.STEP_INSERT_ON_TOP_OF_FILE,
            searchText: searchText,
            replaceText: replaceText,
            active: true
        }

        const output = ScriptPatchTool.runSteps(input, [step]);

        expect(output).not.toBeNull();
        expect(output).not.toBeUndefined();
        expect(output).toBe(expected);
    }));

    it('it should insert a text on bottom for step STEP_APPEND_TO_END_OF_FILE', testAsync(async () => {
        const input = `abcdef`;
        const expected = `abcdefSome Dummy Text`;

        const searchText = 'Some Dummy Text';
        const replaceText: string = <any>null;
        const step: PatchStep = {
            comment: '',
            stepType: PatchStepType.STEP_APPEND_TO_END_OF_FILE,
            searchText: searchText,
            replaceText: replaceText,
            active: true
        }

        const output = ScriptPatchTool.runSteps(input, [step]);

        expect(output).not.toBeNull();
        expect(output).not.toBeUndefined();
        expect(output).toBe(expected);
    }));

    it('it should insert a text before a search text for step STEP_INSERT_BEFORE_TEXT', testAsync(async () => {
        const input = `abcdef`;
        const expected = `abcSome Dummy Textdef`;

        const searchText = 'def';
        const replaceText = 'Some Dummy Text';
        const step: PatchStep = {
            comment: '',
            stepType: PatchStepType.STEP_INSERT_BEFORE_TEXT,
            searchText: searchText,
            replaceText: replaceText,
            active: true
        }

        const output = ScriptPatchTool.runSteps(input, [step]);

        expect(output).not.toBeNull();
        expect(output).not.toBeUndefined();
        expect(output).toBe(expected);
    }));

    it('it should insert a text after a search text for step STEP_INSERT_AFTER_TEXT', testAsync(async () => {
        const input = `abcdef`;
        const expected = `abcSome Dummy Textdef`;

        const searchText = 'abc';
        const replaceText = 'Some Dummy Text';
        const step: PatchStep = {
            comment: '',
            stepType: PatchStepType.STEP_INSERT_AFTER_TEXT,
            searchText: searchText,
            replaceText: replaceText,
            active: true
        }

        const output = ScriptPatchTool.runSteps(input, [step]);

        expect(output).not.toBeNull();
        expect(output).not.toBeUndefined();
        expect(output).toBe(expected);
    }));

    it('it should replace a text with a new text for step STEP_REPLACE_TEXT', testAsync(async () => {
        const input = `abcSome Dummy Textdef`;
        const expected = `abctxeT ymmuD emoSdef`;

        const searchText = 'Some Dummy Text';
        const replaceText = searchText.split('').reverse().join('');
        const step: PatchStep = {
            comment: '',
            stepType: PatchStepType.STEP_REPLACE_TEXT,
            searchText: searchText,
            replaceText: replaceText,
            active: true
        }

        const output = ScriptPatchTool.runSteps(input, [step]);

        expect(output).not.toBeNull();
        expect(output).not.toBeUndefined();
        expect(output).toBe(expected);
    }));

    it('it should delete a text for step STEP_DELETE_TEXT', testAsync(async () => {
        const input = `abcSome Dummy Textdef`;
        const expected = `abcdef`;

        const searchText = 'Some Dummy Text';
        const replaceText: string = <any> null;
        const step: PatchStep = {
            comment: '',
            stepType: PatchStepType.STEP_DELETE_TEXT,
            searchText: searchText,
            replaceText: replaceText,
            active: true
        }

        const output = ScriptPatchTool.runSteps(input, [step]);

        expect(output).not.toBeNull();
        expect(output).not.toBeUndefined();
        expect(output).toBe(expected);
    }));

    it('it should create a preview', testAsync(async () => {
        const expected = '-- abctxeT ymmuD emoSdef\n';

        const searchText = 'Some Dummy Text';
        const replaceText = searchText.split('').reverse().join('');
        const step: PatchStep = {
            comment: '',
            stepType: PatchStepType.STEP_REPLACE_TEXT,
            searchText: searchText,
            replaceText: replaceText,
            active: true
        }

        const scriptPatch: ScriptPatch = {
            sqlFileName: 'testdata.sql.raw', // force this extension to keep it over git/CRLF/LF
            relativePath: true,
            comment: '',
            createBranding: false,
            stepList: [step]
        }

        const ws: WorkingSet = {
            fileName: __dirname + '/../testfiles/fake.json',
            scriptPatch: scriptPatch
        }

        const output = ScriptPatchTool.preview(ws);

        expect(output).not.toBeNull();
        expect(output).not.toBeUndefined();
        expect(output.contentAfter).not.toBeNull();
        expect(output.contentAfter).not.toBeUndefined();
        expect(output.patched).toBeTruthy();
        expect(output.contentAfter).toBe(expected);
    }));

    it('it should create a branding', testAsync(async () => {
        const searchText = 'Some Dummy Text';
        const replaceText = searchText.split('').reverse().join('');
        const step: PatchStep = {
            comment: '',
            stepType: PatchStepType.STEP_REPLACE_TEXT,
            searchText: searchText,
            replaceText: replaceText,
            active: true
        }

        const scriptPatch: ScriptPatch = {
            sqlFileName: 'testdata.sql.raw', // force this extension to keep it over git/CRLF/LF
            relativePath: true,
            comment: '',
            createBranding: true,
            stepList: [step]
        }

        const ws: WorkingSet = {
            fileName: __dirname + '/../testfiles/fake.json',
            scriptPatch: scriptPatch
        }

        const output = ScriptPatchTool.preview(ws);

        expect(output).not.toBeNull();
        expect(output).not.toBeUndefined();
        expect(output.contentAfter).not.toBeNull();
        expect(output.contentAfter).not.toBeUndefined();
        expect(output.patched).toBeTruthy();
        expect(output.contentAfter.indexOf(ScriptPatchTool.BRANDING)).not.toBe(-1);
    }));

    it('it should not path when having a branding', testAsync(async () => {
        const searchText = 'Some Dummy Text';
        const replaceText = searchText.split('').reverse().join('');
        const step: PatchStep = {
            comment: '',
            stepType: PatchStepType.STEP_REPLACE_TEXT,
            searchText: searchText,
            replaceText: replaceText,
            active: true
        }

        const scriptPatch: ScriptPatch = {
            sqlFileName: 'testdata-patched.sql.raw', // force this extension to keep it over git/CRLF/LF
            relativePath: true,
            comment: '',
            createBranding: true,
            stepList: [step]
        }

        const ws: WorkingSet = {
            fileName: __dirname + '/../testfiles/fake.json',
            scriptPatch: scriptPatch
        }

        const output = ScriptPatchTool.preview(ws);

        expect(output).not.toBeNull();
        expect(output).not.toBeUndefined();
        expect(output.contentAfter).not.toBeNull();
        expect(output.contentAfter).not.toBeUndefined();
        expect(output.patched).toBeFalsy();

        // should not to be patched
        expect(output.contentAfter.indexOf(searchText)).not.toBe(-1); // current text should be kept
        expect(output.contentAfter.indexOf(replaceText)).toBe(-1); // and not replaced by...
    }));
});
