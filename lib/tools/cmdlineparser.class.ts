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
            .option('verbose', {
                abbr: 'v',
                flag: true,
                default: false,
                help: 'verbose print status'
            })
            .option('log', {
                abbr: 'l',
                flag: true,
                default: false,
                help: 'print content of the patched file'
            })
            .option('file', {
                abbr: 'f',
                metavar: 'patchfile.json',
                required: true,
                help: 'path for to a patchfile.json file [required]'
            })
            .option('output', {
                abbr: 'o',
                metavar: 'outfile.sql',
                required: false,
                help: 'optional out file to save the patched file to another file'
            })
            .help('patches files according to the patchfiles steps');

        var opts = parser.parse();
        var action = null;

        if (opts[0] === undefined || opts[0] === '') {
            action = null;
        } else {
            action = {
                module: '../lib/actions/' + opts[0],
                opts: opts
            };
        }

        return action;
    }
}
