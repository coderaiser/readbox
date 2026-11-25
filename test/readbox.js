import {test, stub} from 'supertape';
import stringToStream from 'string-to-stream';
import {tryToCatch} from 'try-to-catch';
import pullout from 'pullout';
import {readbox} from '../lib/readbox.js';

const stringify = (json) => JSON.stringify(json, null, 4);

test('dropbox: no args', async (t) => {
    const [e] = await tryToCatch(readbox);
    
    t.equal(e.message, 'token should be a string!', 'should throw when no token');
    t.end();
});

test('dropbox: no path', async (t) => {
    const [e] = await tryToCatch(readbox, 'token');
    
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
    
    const [e] = await tryToCatch(readbox, token, path, options, {
        dropboxify,
        createReadStream,
    });
    
    t.equal(e, error, 'should return error');
    t.end();
});

test('dropbox: read: not dir', async (t) => {
    const token = 'token';
    const path = '/';
    const file = 'hello';
    
    const createReadStream = stub().returns(stringToStream(file));
    const dropboxify = stub().rejects(Error('path/not_folder/'));
    
    const stream = await readbox(token, path, {}, {
        dropboxify,
        createReadStream,
    });
    
    const result = await pullout(stream, 'string');
    
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
    
    const dropboxify = stub().resolves(list);
    
    const expected = stringify(list);
    
    const stream = await readbox(token, path, {}, {
        dropboxify,
    });
    
    const result = await pullout(stream, 'string');
    
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
    
    const dropboxify = stub().resolves(list);
    
    const {type} = await readbox(token, path, {}, {
        dropboxify,
    });
    
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
    
    const dropboxify = stub().resolves(list);
    
    const stream = await readbox(token, path, {
        root: '/hello',
    }, {
        dropboxify,
    });
    
    const str = await pullout(stream, 'string');
    const json = JSON.parse(str);
    
    t.equal(json.path, '/world');
    t.end();
});

test('dropbox: read: not dir: type: file', async (t) => {
    const token = 'token';
    const path = '/';
    const file = 'hello';
    
    const createReadStream = stub().returns(stringToStream(file));
    const dropboxify = stub().rejects(Error('path/not_folder/'));
    
    const {type} = await readbox(token, path, {}, {
        dropboxify,
        createReadStream,
    });
    
    t.equal(type, 'file');
    t.end();
});

test('dropbox: read: sort, order, type: passed to dropboxify', async (t) => {
    const token = 'token';
    const path = '/';
    
    const dropboxify = stub().resolves({
        path,
        files: [],
    });
    
    await readbox(token, path, {
        sort: 'time',
        order: 'desc',
        type: 'raw',
    }, {
        dropboxify,
    });
    
    const args = [
        token,
        path, {
            sort: 'time',
            order: 'desc',
            type: 'raw',
        },
    ];
    
    t.calledWith(dropboxify, args);
    t.end();
});
