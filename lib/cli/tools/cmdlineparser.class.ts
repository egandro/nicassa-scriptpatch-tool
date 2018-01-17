import * as parser from 'nomnom';

export class CmdLineParser {
    public static parse(): any {
        parser.command('patch')
            .option('dry', {
                abbr: 'd',
                flag: true,
                default: false,
                help: 'dry run - only check if it can be patched but do not run the patch actions default is'
            })
            .option('file', {
                abbr: 'f',
                metavar: 'patchfile.json',
                required: true,
                help: 'path for to a patchfile.json file [required]'
            })
            .help('patches files according to the patchfiles steps');

        var opts = parser.parse();
        var action = null;

        if (opts[0] === undefined || opts[0] === '') {
            action = null;
        } else {
            action = {
                module: '../../lib/cli/actions/' + opts[0],
                opts: opts
            };
        }

        return action;
    }
}
