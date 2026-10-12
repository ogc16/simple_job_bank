'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadPortal } = require('./helpers/load-script.js');

const ctx = loadPortal();
const JobUtils = ctx.JobUtils;
const JOBS = ctx.JOBS;

test('JOBS loads as a populated array in browser-like global scope', () => {
    assert.ok(Array.isArray(JOBS));
    assert.ok(JOBS.length >= 10);
    assert.equal(typeof ctx.JobUtils, 'object');
    // classic-script globals are reachable exactly as in a browser
    assert.equal(ctx.window.JOBS, JOBS);
});

test('the entire job collection passes validation', () => {
    // validateJobs returns a vm-realm array; compare by length/content
    assert.equal(JobUtils.validateJobs(JOBS).length, 0);
});

test('every job declares its dashboard flag explicitly', () => {
    const undecided = JOBS.filter((j) => typeof j.dashboard !== 'boolean');
    assert.equal(undecided.length, 0);
});

test('the dashboard has at least three featured jobs', () => {
    const featured = JOBS.filter((j) => j.dashboard);
    assert.ok(featured.length >= 3);
});

test('every category used by a job is selectable', () => {
    const known = new Set(['design', 'programming', 'javascript', 'php', 'marketing']);
    const seen = new Set();
    JOBS.forEach((j) => j.categories.forEach((c) => seen.add(c)));
    for (const c of seen) {
        assert.ok(known.has(c), `unknown category "${c}"`);
    }
});

test('each icon is a Font Awesome class', () => {
    JOBS.forEach((j) => assert.match(j.icon, /^(fa|fab|fas|far) /));
});

test('tag chips match the categories the data advertises', () => {
    const categories = JOBS.map((j) => j.categories).flat();
    ['programming', 'design', 'marketing', 'php', 'javascript'].forEach((c) => {
        assert.ok(categories.includes(c), `category "${c}" is referenced by no job`);
    });
});

test('salary ranges are sane (min <= max and non-zero)', () => {
    JOBS.forEach((j, i) => {
        assert.ok(j.salaryMin > 0, `JOBS[${i}] salaryMin must be positive`);
        assert.ok(j.salaryMin <= j.salaryMax, `JOBS[${i}] salaryMin > salaryMax`);
    });
});