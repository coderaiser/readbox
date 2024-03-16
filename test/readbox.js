'use strict';

const mockRequire = require('mock-require');
const {stopAll, reRequire} = mockRequire;
const {test, stub} = require('supertape');

const stringToStream = require('string-to-stream');

const tryToCatch = require('try-to-catch');

const read = require('..');

const pullout = require('pullout');

const stringify = (json) => JSON.stringify(json, null, 4);

test('dropbox: no args', async (t) => {
    const [e] = await tryToCatch(read);
    
    t.equal(e.message, 'token should be a string!', 'should throw when no token');
    t.end();
});

test('dropbox: no path', async (t) => {
    const [e] = await tryToCatch(read, 'token');
    
    t.equal(e.message, 'path should be a string!', 'should throw when no path');
    t.end();
});

test('dropbox: read: error', async (t) => {
    const token = 'token';
    const path = '/';
    const error = Error('hello');
    const options = {};
    
    const createReadStream = stub();
    const dropboxify = stub().rejects(error);
    
    mockRequire('dropboxify', dropboxify);
    mockRequire('@cloudcmd/dropbox', {
        createReadStream,
    });
    
    const read = reRequire('..');
    
    const [e] = await tryToCatch(read, token, path, options);
    stopAll();
    
    t.equal(e, error, 'should return error');
    t.end();
});

test('dropbox: read: not dir', async (t) => {
    const token = 'token';
    const path = '/';
    const file = 'hello';
    
    const createReadStream = stub().returns(stringToStream(file));
    
    const dropboxify = stub().rejects(Error('path/not_folder/'));
    
    mockRequire('dropboxify', dropboxify);
    mockRequire('@cloudcmd/dropbox', {
        createReadStream,
    });
    
    const read = reRequire('..');
    
    const stream = await read(token, path);
    const result = await pullout(stream, 'string');
    
    stopAll();
    
    t.equal(result, file);
    t.end();
});

test('dropbox: read: result', async (t) => {
    const token = 'token';
    const path = '/';
    const list = {
        path,
        files: [],
    };
    
    const createDropboxDownloadStream = stub();
    
    const dropboxify = stub().resolves(list);
    
    mockRequire('dropboxify', dropboxify);
    mockRequire('dropbox-stream', {
        createDropboxDownloadStream,
    });
    
    const read = reRequire('..');
    
    const expected = stringify(list);
    
    const stream = await read(token, path);
    const result = await pullout(stream, 'string');
    
    stopAll();
    
    t.equal(result, expected);
    t.end();
});

test('dropbox: read: result: type: directory', async (t) => {
    const token = 'token';
    const path = '/';
    const list = {
        path,
        files: [],
    };
    
    const createDropboxDownloadStream = stub();
    const dropboxify = stub().resolves(list);
    
    mockRequire('dropboxify', dropboxify);
    mockRequire('dropbox-stream', {
        createDropboxDownloadStream,
    });
    
    const read = reRequire('..');
    const {type} = await read(token, path);
    
    stopAll();
    
    t.equal(type, 'directory');
    t.end();
});

test('dropbox: read: result: type: directory: root', async (t) => {
    const token = 'token';
    const path = '/hello/world';
    const list = {
        path,
        files: [],
    };
    
    const createDropboxDownloadStream = stub();
    const dropboxify = stub().resolves(list);
    
    mockRequire('dropboxify', dropboxify);
    mockRequire('dropbox-stream', {
        createDropboxDownloadStream,
    });
    
    const read = reRequire('..');
    
    const stream = await read(token, path, {
        root: '/hello',
    });
    
    const str = await pullout(stream, 'string');
    const json = JSON.parse(str);
    
    stopAll();
    
    t.equal(json.path, '/world');
    t.end();
});

test('dropbox: read: not dir: type: file', async (t) => {
    const token = 'token';
    const path = '/';
    const file = 'hello';
    
    const createReadStream = stub().returns(stringToStream(file));
    
    const dropboxify = stub().rejects(Error('path/not_folder/'));
    
    mockRequire('dropboxify', dropboxify);
    mockRequire('@cloudcmd/dropbox', {
        createReadStream,
    });
    
    const read = reRequire('..');
    
    const {type} = await read(token, path);
    stopAll();
    
    t.equal(type, 'file');
    t.end();
});
