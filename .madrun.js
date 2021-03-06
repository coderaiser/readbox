'use strict';

const {run} = require('madrun');

module.exports = {
    'test': () => 'tape \'test/*.js\'',
    'report': () => 'nyc report --reporter=text-lcov | coveralls',
    'coverage': () => 'nyc npm test',
    'watch:coverage': () => run('watcher', 'npm run coverage'),
    'watch:test': () => run('watcher', 'npm test'),
    'watcher': () => 'nodemon -w test -w lib --exec',
    'lint': () => 'putout lib test .madrun.js',
    'fix:lint': () => run('lint', '--fix'),
};

