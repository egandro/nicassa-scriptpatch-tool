import * as fs from 'fs';
import * as path from 'path';

import { IOAbstraction } from '../../src/scriptpatchtool';

export class NodeIOAbstraction implements IOAbstraction {
    public readFileSync(fileName: string, encoding: string): string {
        return fs.readFileSync(fileName, encoding);
    }

    public writeFileSync(fileName: string, data: any, encoding: string): void {
        return fs.writeFileSync(fileName, data, {encoding: encoding});
    }

    public normalize(fileName: string): string {
        return path.normalize(fileName);
    }

    public dirname(fileName: string): string {
        return path.dirname(fileName);
    }

    public existsSync(fileName: string): boolean {
        return fs.existsSync(fileName);
    }
}
