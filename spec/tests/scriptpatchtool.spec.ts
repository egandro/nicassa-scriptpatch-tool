import { ScriptPatchTool } from '../../lib/scriptpatchtool';
import { PatchStep, PatchStepType} from '../../lib/data/scriptpatch';

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

    it('it should no changes for step type STEP_TYPE_EMPTY', testAsync(async () => {
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

});
