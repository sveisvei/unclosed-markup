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


test('should report errors with a stream', (t) => {
    const stream = createFakeStream('<div><a href><span><div></span></div>');

    return validate(stream).then((result) => {
        t.false(result);
    })
    .catch(e => {
        t.is(e.length, 2);
    });
});

test('should report errors with a fs filestream', (t) => {
    const stream = fs.createReadStream('./fixtures/file.html');

    return validate(stream).then((result) => {
        t.false(result);
    })
    .catch(e => {
        t.is(e.length, 2);
    });
});


test('should report errors with a string', (t) => {
    const content = '<div><a href><span><div></span></div>';

    return validate(content).then((result) => {
        t.false(result);
    })
    .catch(e => {
        t.is(e.length, 2);
    });
});

test('should report on deep errors', (t) => {
    const content = '<u><div><p><div><u><span><div></span></div></p></div></u>';

    return validate(content).then((result) => {
        t.false(result);
    })
    .catch(e => {
        t.is(e.length, 2);
    });
});

test('should report on top errors', (t) => {
    const content = '<div>';

    return validate(content).then((result) => {
        t.false(result);
    })
    .catch(e => {
        t.is(e.length, 1);
    });
});

test('should report on mangled errors', (t) => {
    const content = '><div>>>';

    return validate(content).then((result) => {
        t.false(result);
    })
    .catch(e => {
        t.is(e.length, 1);
    });
});


test('should not report error on void elements', () => (validate('<br><br>')));

test('should take void elements as input', () => (
    validate('<customTag><customTag2>', { voidElements: { customtag: true, customtag2: true } })
));

test('error object', (t) => {
    t.plan(3);
    return validate('<div><a></div>').catch(e => {
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
    });
});
