/* Zero-dependency ESLint flat config.
   Run with:  npx --yes eslint@9 js tests
   No config packages are imported — only core rules and a hand-maintained
   global list, keeping the project dependency-free. */

'use strict';

/* ECMAScript built-ins (flat config starts with no globals at all). */
const ES_GLOBALS = {
    Array: 'readonly',
    ArrayBuffer: 'readonly',
    Boolean: 'readonly',
    Date: 'readonly',
    decodeURI: 'readonly',
    decodeURIComponent: 'readonly',
    encodeURI: 'readonly',
    encodeURIComponent: 'readonly',
    Error: 'readonly',
    EvalError: 'readonly',
    Function: 'readonly',
    Infinity: 'readonly',
    Int16Array: 'readonly',
    Int32Array: 'readonly',
    Int8Array: 'readonly',
    isFinite: 'readonly',
    isNaN: 'readonly',
    JSON: 'readonly',
    Map: 'readonly',
    Math: 'readonly',
    NaN: 'readonly',
    Number: 'readonly',
    Object: 'readonly',
    parseFloat: 'readonly',
    parseInt: 'readonly',
    Promise: 'readonly',
    RangeError: 'readonly',
    ReferenceError: 'readonly',
    RegExp: 'readonly',
    Set: 'readonly',
    String: 'readonly',
    Symbol: 'readonly',
    SyntaxError: 'readonly',
    TypeError: 'readonly',
    Uint16Array: 'readonly',
    Uint32Array: 'readonly',
    Uint8Array: 'readonly',
    undefined: 'readonly',
    URIError: 'readonly',
    WeakMap: 'readonly',
    WeakSet: 'readonly'
};

/* Browser/document globals used by the classic page scripts. */
const BROWSER_GLOBALS = {
    Blob: 'readonly',
    clearInterval: 'readonly',
    clearTimeout: 'readonly',
    console: 'readonly',
    document: 'readonly',
    globalThis: 'readonly',
    localStorage: 'readonly',
    location: 'readonly',
    navigator: 'readonly',
    self: 'readonly',
    setInterval: 'readonly',
    setTimeout: 'readonly',
    URL: 'readonly',
    window: 'readonly'
};

/* Node/module globals used by tests/ and tests/helpers/. */
const NODE_GLOBALS = {
    __dirname: 'readonly',
    __filename: 'readonly',
    Buffer: 'readonly',
    clearImmediate: 'readonly',
    clearInterval: 'readonly',
    clearTimeout: 'readonly',
    exports: 'readonly',
    global: 'readonly',
    module: 'readonly',
    process: 'readonly',
    queueMicrotask: 'readonly',
    require: 'readonly',
    setImmediate: 'readonly',
    setInterval: 'readonly',
    setTimeout: 'readonly'
};

/* App-level globals shared by the classic scripts. */
const APP_GLOBALS = {
    JobUtils: 'readonly',
    JOBS: 'readonly'
};

const SHARED_RULES = {
    'no-undef': 'error',
    'no-unused-vars': ['error', { args: 'after-used', caughtErrors: 'none', vars: 'all' }],
    'no-dupe-keys': 'error',
    'no-constant-condition': 'error',
    'no-unreachable': 'error',
    'no-extra-semi': 'error',
    'no-useless-escape': 'error',
    'valid-typeof': 'error'
};

module.exports = [
    {
        files: ['js/**/*.js'],
        languageOptions: {
            ecmaVersion: 5,
            sourceType: 'script',
            globals: Object.assign({}, ES_GLOBALS, BROWSER_GLOBALS, APP_GLOBALS)
        },
        rules: Object.assign({}, SHARED_RULES, {
            'no-var': 'off',
            'prefer-const': 'off'
        })
    },
    {
        files: ['tests/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: Object.assign({}, ES_GLOBALS, NODE_GLOBALS, { console: 'readonly' })
        },
        rules: SHARED_RULES
    }
];