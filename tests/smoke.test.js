'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createContext, loadScript } = require('./helpers/load-script.js');

/* Minimal DOM/window surface so the page scripts execute at load time the
   way they do in a browser — no elements present, so every guarded branch is
   taken and nothing is rendered. This catches load-time wiring regressions
   (missing globals, referencing JobUtils too early, etc.). */

function createDomStub() {
    const element = {
        addEventListener() {},
        setAttribute() {},
        getAttribute() { return null; },
        classList: {
            add() {}, remove() {}, toggle() {}, contains() { return false; }
        },
        click() {},
        remove() {},
        innerHTML: '',
        textContent: '',
        hidden: false
    };
    return {
        readyState: 'complete',
        getElementById() { return null; },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        createElement() { return Object.create(Object.getPrototypeOf(element)); },
        addEventListener() {},
        body: element
    };
}

function loadDashboardContext() {
    const sandbox = createContext();
    sandbox.document = createDomStub();
    sandbox.location = { pathname: '/pages/dashboard.html' };
    sandbox.localStorage = { getItem() { return null; } };
    loadScript('js/lib/job-utils.js', sandbox);
    loadScript('js/jobs.js', sandbox);
    loadScript('js/job-filters.js', sandbox);
    loadScript('js/dashboard.js', sandbox);
    loadScript('js/layout.js', sandbox);
    return sandbox;
}

test('page scripts load in a browser-like scope without throwing', () => {
    const ctx = loadDashboardContext();
    assert.equal(typeof ctx.JobUtils, 'object');
    assert.ok(Array.isArray(ctx.JOBS));
    assert.equal(typeof ctx.JobUtils.renderCard, 'function');
});

test('dashboard rules still compute from the shared data', () => {
    const ctx = loadDashboardContext();
    const history = [
        { jobIndex: 0, stage: 2, appliedDays: 6 },
        { jobIndex: 1, stage: 0, appliedDays: 2 }
    ];
    const stats = ctx.JobUtils.computeStats(history, 0);
    assert.equal(stats.interviews, 1);
    const csv = ctx.JobUtils.buildApplicationsCsv(history, ctx.JOBS, [
        { label: 'Applied', badge: 'badge-gray', segIdx: 1 },
        { label: 'Shortlisted', badge: 'badge-blue', segIdx: 2 },
        { label: 'Interview', badge: 'badge-purple', segIdx: 3 },
        { label: 'Offer', badge: 'badge-green', segIdx: 4 }
    ]);
    assert.match(csv, /"UX Designer","Google Drive"/);
});

test('layout.js produces the sidebar string for the current page', () => {
    const sandbox = createContext();
    let captured = '';
    const nav = {
        set innerHTML(html) { captured = html; },
        get innerHTML() { return captured; }
    };
    sandbox.document = {
        readyState: 'complete',
        getElementById(id) {
            return id === 'app-nav' ? nav : null;
        },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        addEventListener() {}
    };
    sandbox.location = { pathname: '/pages/jobs.html' };
    loadScript('js/layout.js', sandbox);
    assert.match(captured, /class="active"/);         // Jobs Board marked active
    assert.match(captured, /jobs.html/);
});