#!/usr/bin/env node
'use strict';
require('colors');
const validateHtml = require('../lib/index');
const argv = require('yargs').argv;
const fs = require('fs');

let fileName = '';
if (argv._[0]) {
    run(fs.createReadStream(argv._[0]));
    fileName = argv._[0];
} else if (argv.content) {
    run(argv.content);
} else {
    console.error('No valid input');
    process.exit(1);
}

function run (input) {
    validateHtml(input).catch(errors => {
        // report on errors
        errors.forEach(e => {
            const nr = e.line.line;
            const lineDebug = [
                { line: nr - 1, content: e.line.code.before },
                { line: nr,     content: (e.line.code.current).bold.underline },
                { line: nr + 1, content: e.line.code.after },
            ]
                .map((d) => {
                    if (d.content && d.content.trim()) {
                        return `${d.line}: ${d.content}`;
                    }
                    return false;
                })
                .filter(Boolean)
                .join('\n    ');

            console.error([
                `\n${fileName.yellow.bold} ${String(e.line.line).yellow}:${String(e.line.start).yellow}`,
                `Error message: ${e.message.bold.red}`,
                lineDebug,
            ].join('\n')
            );
        });

        if (errors.length === 0) {
            console.log('Closed HTML-tags validation SUCCESS!'.green);
            process.exit(0);
        } else {
            console.error(`\nFound ${errors.length} errors in html`.bold);
            process.exit(1);
        }
    });
}

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);
