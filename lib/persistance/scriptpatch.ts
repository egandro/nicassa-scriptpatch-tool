export const enum PatchStepType {
    STEP_TYPE_EMPTY = 0,
    STEP_INSERT_ON_TOP_OF_FILE = 1,
    STEP_APPEND_TO_END_OF_FILE = 2,
    STEP_INSERT_BEFORE_TEXT = 3,
    STEP_INSERT_AFTER_TEXT = 4,
    STEP_REPLACE_TEXT = 5,
    STEP_DELETE_TEXT = 6,
}

export interface PatchStep {
    comment: string,
    stepType: PatchStepType,
    searchText: string,
    replaceText: string,
    active: string
}

export interface ScriptPatch {
    sqlFileName: string,
    relativePath: boolean,
    comment: string,
    createBranding: boolean,
    stepList: PatchStep[]
}
