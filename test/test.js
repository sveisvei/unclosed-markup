'use strict';

const test = require('ava');
const { Readable } = require('stream');
const validate = require('../lib/index');
const fs = require('fs');

function createFakeStream (data) {
    const mockedStream = new Readable();
    mockedStream._read = function () { /* do nothing */ };

    mockedStream.push(data);
    mockedStream.push(null);

    return mockedStream;
}


test('should report errors with a stream', async (t) => {
    t.plan(1);
    const stream = createFakeStream('<div><a href><span><div></span></div>');

    try {
        await validate(stream);
    } catch (e) {
        t.is(e.length, 2);
    }
});

test('should report errors with a fs filestream', async (t) => {
    t.plan(1);
    const stream = fs.createReadStream('./fixtures/file.html');

    try {
        await validate(stream);
    } catch (e) {
        t.is(e.length, 2);
    }
});


test('should report errors with a string', async (t) => {
    t.plan(1);
    const content = '<div><a href><span><div></span></div>';

    try {
        await validate(content);
    } catch (e) {
        t.is(e.length, 2);
    }
});

test('should handle array of files', async (t) => {
    const content = ['<div></div>', '<div></div>'];

    const result = await validate(content);

    t.deepEqual(result, [true, true]);
});

test('should report on deep errors', async (t) => {
    t.plan(1);
    const content = '<u><div><p><div><u><span><div></span></div></p></div></u>';

    try {
        await validate(content);
    } catch (e) {
        t.is(e.length, 2);
    }
});

test('should report on top errors', async (t) => {
    const content = '<div>';

    try {
        await validate(content);
    } catch (e) {
        t.is(e.length, 1);
    }
});

test('should report on mangled errors', async (t) => {
    const content = '><div>>>';

    try {
        await validate(content);
    } catch (e) {
        t.is(e.length, 1);
    }
});


test('should not report error on void elements', (t) => {
    t.notThrows(validate('<br><br>'));
});


test('should take void elements as input', (t) => {
    t.notThrows(validate('<customTag><customTag2>', { voidElements: { customtag: true, customtag2: true } }));
});

test('error object', async (t) => {
    t.plan(3);

    try {
        await validate('<div><a></div>');
    } catch (e) {
        t.is(e.length, 1);
        const error = e[0];
        t.is(typeof error, 'object');
        t.deepEqual(error, {
            message: '"a" was never closed',
            code: '<a>',
            loc: {
                line: 1, col: 6, startOffset: 5, endOffset: 8,
            },
            line: {
                line: 1, code: { before: '', current: '<div><a></div>', after: '' }, start: 5, end: 8,
            },
        });
    }
});
