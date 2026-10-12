'use strict';

/* Load the browser scripts exactly the way a browser would — as classic
   scripts sharing one global scope — using Node's vm module. This proves the
   shipped files work in their real execution model (no module wrapper), and
   it needs zero dependencies. */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..');

function createContext() {
    const sandbox = {};
    sandbox.window = sandbox;
    sandbox.self = sandbox;
    sandbox.globalThis = sandbox;
    sandbox.setTimeout = setTimeout;
    sandbox.clearTimeout = clearTimeout;
    sandbox.setInterval = setInterval;
    sandbox.clearInterval = clearInterval;
    vm.createContext(sandbox);
    return sandbox;
}

function loadScript(relPath, context) {
    const ctx = context || createContext();
    const filename = path.join(ROOT, relPath);
    const src = fs.readFileSync(filename, 'utf8');
    vm.runInContext(src, ctx, { filename });
    return ctx;
}

function loadPortal(context) {
    const ctx = context || createContext();
    loadScript('js/lib/job-utils.js', ctx);
    loadScript('js/jobs.js', ctx);
    return ctx;
}

module.exports = { createContext, loadScript, loadPortal, ROOT };