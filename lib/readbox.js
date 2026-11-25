import squad from 'squad';
import {tryToCatch} from 'try-to-catch';
import stringToStream from 'string-to-stream';
import {dropboxify as _dropboxify} from 'dropboxify';
import {createReadStream as _createReadStream} from '@cloudcmd/dropbox';

const isString = (a) => typeof a === 'string';

const stringify = (json) => JSON.stringify(json, null, 4);
const streamJson = squad(stringToStream, stringify);

const {assign} = Object;

export const readbox = async (token, filepath, options = {}, overrides = {}) => {
    check(token, filepath);
    
    const {
        sort,
        order,
        type,
        root = '',
    } = options;
    
    const {
        createReadStream = _createReadStream,
        dropboxify = _dropboxify,
    } = overrides;
    
    const [error, list] = await tryToCatch(dropboxify, token, filepath, {
        sort,
        order,
        type,
    });
    
    if (!error) {
        const path = list.path.replace(root, '');
        const stream = streamJson({
            ...list,
            path,
        });
        
        assign(stream, {
            type: 'directory',
        });
        
        return stream;
    }
    
    if (error.message.indexOf('path/not_folder/'))
        throw error;
    
    const stream = createReadStream(token, filepath);
    
    assign(stream, {
        type: 'file',
    });
    
    return stream;
};

function check(token, path) {
    if (!isString(token))
        throw Error('token should be a string!');
    
    if (!isString(path))
        throw Error('path should be a string!');
}
