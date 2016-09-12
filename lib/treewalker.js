'use strict';
const parse5 = require('parse5');
const internalVoidElements = require('./void-elements');

function createCursor (parent, name, closed, opened, location) {
    return {
        parent,
        name,
        closed,
        opened,
        location,
        children: [],
    };
}

function createTree (file, { voidElements = internalVoidElements } = {}) {
    const rootCursor = {
        name: 'ROOT',
        children: [],
    };
    let cursor = rootCursor;

    const parser = new parse5.SAXParser({
        locationInfo: true,
    });

    parser.on('startTag', (name, attrs, selfClosing, location) => {
        // special case
        if (name.indexOf('>') > -1) {
            throw new Error(`Tagname ${name} is invalid`);
        }

        if (voidElements[name.toLowerCase()]) {
            selfClosing = true;
        }

        cursor = createCursor(cursor, name, selfClosing, true, location);
        cursor.parent.children.push(cursor);

        if (selfClosing) {
            cursor = cursor.parent;
        }
    });

    parser.on('endTag', (name, location) => {
        // special case
        if (name.indexOf('<') > -1) {
            throw new Error(`Tagname ${name} has invalid content`);
        }

        if (voidElements[name.toLowerCase()]) {
            return;
        }

        // FIX "incorrect" open/close
        if (cursor.closed === false &&
            cursor.name !== name &&
            cursor.parent.closed === false &&
            cursor.parent.name === name) {
            cursor = cursor.parent;
        }

        if (cursor && cursor.name === name) {
            cursor.closed = true;
            cursor = cursor.parent;
        } else {
            const closedCursor = createCursor(cursor, name, true, false, location);
            cursor.children.push(closedCursor);
        }
    });

    file.pipe(parser);

    return new Promise((resolve, reject) => {
        parser.on('end', () => {
            resolve(rootCursor);
        });
        parser.on('error', reject);
    });
};


function walkTagTree (tree) {
    if (tree.closed === false) {
        tree.error = `\"${tree.name}\" was never closed`;
    }

    if (tree.opened === false) {
        tree.error = `\"${tree.name}\" is missing an opening tag`;
    }
    // recursive
    tree.children.forEach((entry) => {
        if (typeof entry == 'object') {
            walkTagTree(entry);
        }
    });
    return tree;
}

module.exports = function walkTree (file, options) {
    return createTree(file, options).then(walkTagTree);
};
