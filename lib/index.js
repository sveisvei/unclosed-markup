'use strict';
const streams = require('stream');
const treevalidator = require('./treewalker');

function getCharsUntilLine (contentUntilStart, startOffset) {
    const lines = contentUntilStart.split(/\n|\n\r/);
    const result = lines.reduce((currentLine, lineStr, index) => {
        if (lines.length - 1 === index) {
            return currentLine;
        }
        return (
            currentLine -
            // lets substract this line, as its predecessing target line
            lineStr.length -
            // lets substract the char for the linebreak
            (index === 0 ? 0 : 1)
        );
    }, startOffset);
    return result;
}

function findLineInfo (fileContent, startOffset, endOffset) {
    const contentUntilStart = fileContent.substring(0, startOffset);
    let line = contentUntilStart.match(/\n|\n\r/g);
    line = (line && line.length) || 0;


    const lines = fileContent.split(/\n|\n\r/);
    const lineStart = getCharsUntilLine(contentUntilStart, startOffset);

    return {
        line: line + 1,
        code: {
            before: lines[line - 1] || '',
            current: lines[line],
            after: lines[line + 1] || '',
        },
        start: lineStart,
        end: (lineStart + (endOffset - startOffset)),
    };
}

function addCodeFromLocation (fileContent, tree, message) {
    return {
        message,
        code: fileContent.substring(tree.location.startOffset, tree.location.endOffset),
        loc: tree.location,
        line: findLineInfo(fileContent, tree.location.startOffset, tree.location.endOffset),
    };
}

function collectErrors (fileContent, tree, result = []) {
    if (tree.error) {
        result.push(
            addCodeFromLocation(fileContent, tree, tree.error)
        );
    }
    tree.children.forEach((entry) => {
        if (typeof entry == 'object') {
            collectErrors(fileContent, entry, result);
        }
    });
    return result;
}

module.exports = function validateContent (file, options = {}) {
    if (Array.isArray(file)) {
        return Promise.all(file.map(e => validateContent(e, options)));
    }

    let fileContent;

    if (typeof file === 'string') {
        fileContent = file;
        // lets convert to a stream
        file = new streams.Readable();
        file._read = function () { /* noop */ };
        file.push(fileContent);
        file.push(null);
    }

    // buffer up the filestream
    if (typeof fileContent !== 'string') {
        fileContent = '';
        file.on('data', (data) => {
            fileContent += data;
        });
    }

    return treevalidator(file, options).then((tree) => {
        const errors = collectErrors(fileContent, tree);

        if (errors.length > 0) {
            return Promise.reject(errors);
        } else {
            return true;
        }
    });
};
