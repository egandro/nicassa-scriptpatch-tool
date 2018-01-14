let fs = require('fs');
let process = require('process');

export class Patch {
    fileName: string;

    run(opts: any) {
        this.fileName = opts.file;

        if (!fs.existsSync(this.fileName)) {
            console.error('error: can\'t read file "' + this.fileName + '"');
        }
    }


}

export default function run(opts: any) {
    let instance = new Patch();
    return instance.run(opts);
}
