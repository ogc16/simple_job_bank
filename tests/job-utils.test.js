'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadPortal } = require('./helpers/load-script.js');

const ctx = loadPortal();
const JobUtils = ctx.JobUtils;
const JOBS = ctx.JOBS;

/* ── Formatting ─────────────────────────────────────────────────────── */

test('salaryText formats whole-thousands ranges', () => {
    assert.equal(JobUtils.salaryText({ salaryMin: 80, salaryMax: 120 }), '$80k – $120k /yr');
});

test('salaryRangeText formats compact CSV ranges', () => {
    assert.equal(JobUtils.salaryRangeText({ salaryMin: 80, salaryMax: 120 }), '$80k–$120k/yr');
});

test('dateText handles singular and plural', () => {
    assert.equal(JobUtils.dateText(1), '1 day ago');
    assert.equal(JobUtils.dateText(2), '2 days ago');
});

/* ── Badges & cards ─────────────────────────────────────────────────── */

test('badgeClass maps every known label and falls back to gray', () => {
    assert.equal(JobUtils.badgeClass('Remote'), 'badge-green');
    assert.equal(JobUtils.badgeClass('Hybrid'), 'badge-blue');
    assert.equal(JobUtils.badgeClass('On-site'), 'badge-gray');
    assert.equal(JobUtils.badgeClass('Junior'), 'badge-green');
    assert.equal(JobUtils.badgeClass('Mid'), 'badge-blue');
    assert.equal(JobUtils.badgeClass('Senior'), 'badge-purple');
    assert.equal(JobUtils.badgeClass('Manager'), 'badge-gold');
    assert.equal(JobUtils.badgeClass('Full-time'), 'badge-indigo');
    assert.equal(JobUtils.badgeClass('Contract'), 'badge-orange');
    assert.equal(JobUtils.badgeClass('Something else'), 'badge-gray');
});

test('renderBadges emits one pill for type, location and level', () => {
    const html = JobUtils.renderBadges(JOBS[0]); // Full-time / Remote / Junior
    assert.match(html, /badge-indigo/);
    assert.match(html, /badge-green/);
    assert.equal((html.match(/class="badge/g) || []).length, 3);
});

test('renderCard carries the href, tags and a descriptive aria-label', () => {
    const job = JOBS[0];
    const html = JobUtils.renderCard(job, 'job-details.html');
    assert.match(html, /href="job-details.html"/);
    assert.match(html, />UX Designer<\/h2>/);
    assert.match(html, /data-tags="design"/);
    assert.match(html, /aria-label="UX Designer at Google Drive/);
});

/* ── Filtering ──────────────────────────────────────────────────────── */

test('daysPosted falls back to 999 for a missing age', () => {
    assert.equal(JobUtils.daysPosted({ postedDays: 2 }), 2);
    assert.equal(JobUtils.daysPosted({}), 999);
});

test('matchesCategory: empty or placeholder values pass everything', () => {
    assert.ok(JobUtils.matchesCategory(JOBS[0], ''));
    assert.ok(JobUtils.matchesCategory(JOBS[0], 'category'));
    assert.ok(JobUtils.matchesCategory(JOBS[0], 'design'));
    assert.equal(JobUtils.matchesCategory(JOBS[0], 'programming'), false);
});

test('matchesLocation matches on the first two letters', () => {
    assert.ok(JobUtils.matchesLocation({ location: 'Remote' }, 'Remote'));
    assert.ok(JobUtils.matchesLocation({ location: 'Remote' }, ''));
    assert.ok(JobUtils.matchesLocation({ location: 'Hybrid' }, 'Hy'));
    assert.equal(JobUtils.matchesLocation({ location: 'Remote' }, 'Hybrid'), false);
});

test('matchesSalary overlaps on range', () => {
    const job = { salaryMin: 80, salaryMax: 120 };
    assert.ok(JobUtils.matchesSalary(job, ''));
    assert.ok(JobUtils.matchesSalary(job, '100-150'));
    assert.ok(JobUtils.matchesSalary(job, '120-150'));
    assert.equal(JobUtils.matchesSalary(job, '130-180'), false);
    assert.equal(JobUtils.matchesSalary(job, '40-60'), false);
});

test('matchesTags acts in OR across a job categories', () => {
    const job = { categories: ['design', 'programming'] };
    assert.ok(JobUtils.matchesTags(job, undefined));
    assert.ok(JobUtils.matchesTags(job, []));
    assert.ok(JobUtils.matchesTags(job, ['programming']));
    assert.ok(JobUtils.matchesTags(job, ['design', 'marketing']));
    assert.equal(JobUtils.matchesTags(job, ['marketing']), false);
});

test('filterJobs combines every criterion', () => {
    const jobs = [
        { title: 'UX Designer', company: 'StudioA', categories: ['design'], location: 'Remote', salaryMin: 80, salaryMax: 120, postedDays: 1 },
        { title: 'Platform Dev', company: 'StudioB', categories: ['programming'], location: 'On-site', salaryMin: 140, salaryMax: 180, postedDays: 12 },
        { title: 'Design Engineer', company: 'StudioC', categories: ['design', 'programming'], location: 'Hybrid', salaryMin: 100, salaryMax: 140, postedDays: 3 }
    ];

    assert.equal(JobUtils.filterJobs(jobs, {}).length, 3);
    assert.equal(JobUtils.filterJobs(jobs, { query: 'design' }).length, 2);
    assert.equal(JobUtils.filterJobs(jobs, { category: 'programming' }).length, 2);
    assert.equal(JobUtils.filterJobs(jobs, { location: 'Remote' }).length, 1);
    assert.equal(JobUtils.filterJobs(jobs, { salary: '130-180' }).length, 2);
    assert.equal(JobUtils.filterJobs(jobs, { maxDays: 5 }).length, 2);
    assert.equal(JobUtils.filterJobs(jobs, { tags: ['design'] }).length, 2);
    assert.equal(JobUtils.filterJobs(jobs, { query: 'design', category: 'programming', location: 'Hybrid' }).length, 1);
    assert.equal(JobUtils.filterJobs(jobs, { query: 'nope' }).length, 0);
});

test('query matching is case-insensitive across title and company', () => {
    const job = { title: 'React.js Expert', company: 'YouTube', categories: [], salaryMin: 1, salaryMax: 2, postedDays: 1 };
    assert.ok(JobUtils.matchesQuery(job, 'youtube'));
    assert.ok(JobUtils.matchesQuery(job, 'EXpErT'));
    assert.ok(JobUtils.matchesQuery(job, ''));
    assert.equal(JobUtils.matchesQuery(job, 'wordpress'), false);
});

test('toggleTag adds and removes a single tag', () => {
    assert.deepEqual(JobUtils.toggleTag([], 'design'), ['design']);
    assert.deepEqual(JobUtils.toggleTag(['design'], 'design'), []);
    assert.deepEqual(JobUtils.toggleTag(['design'], 'programming'), ['design', 'programming']);
});

test('debounce fires once after the delay, ignoring bursts', async () => {
    let calls = 0;
    const run = JobUtils.debounce(() => { calls += 1; }, 15);
    run();
    run();
    run();
    assert.equal(calls, 0);
    await new Promise((resolve) => setTimeout(resolve, 40));
    assert.equal(calls, 1);
});

/* ── Dashboard stats & CSV ──────────────────────────────────────────── */

test('computeStats rolls up the pipeline', () => {
    const history = [
        { stage: 0 }, { stage: 1 }, { stage: 2 }, { stage: 3 }, { stage: 3 }
    ];
    const stats = JobUtils.computeStats(history, 3);
    assert.equal(stats.applied, 5);
    assert.equal(stats.saved, 3);
    assert.equal(stats.interviews, 3); // stages >= 2
    assert.equal(stats.offers, 2);     // stage === 3
});

test('toCsv quotes fields, escapes embedded quotes, and CRLF-joins', () => {
    const csv = JobUtils.toCsv([
        ['head', 'row'],
        ['say "hi"', 42]
    ]);
    assert.equal(csv, '"head","row"\r\n"say ""hi""","42"');
});

test('buildApplicationsCsv emits the header plus one row per application', () => {
    const stages = [
        { label: 'Applied', badge: 'badge-gray', segIdx: 1 },
        { label: 'Shortlisted', badge: 'badge-blue', segIdx: 2 },
        { label: 'Interview', badge: 'badge-purple', segIdx: 3 },
        { label: 'Offer', badge: 'badge-green', segIdx: 4 }
    ];
    const history = [
        { jobIndex: 0, stage: 2, appliedDays: 6 },
        { jobIndex: 1, stage: 0, appliedDays: 2 }
    ];
    const csv = JobUtils.buildApplicationsCsv(history, JOBS, stages);
    const lines = csv.split('\r\n');
    assert.equal(lines.length, 3);
    assert.match(lines[0], /^"Job","Company","Salary range","Location","Applied","Stage"$/);
    assert.match(lines[1], /"UX Designer","Google Drive"/);
    assert.match(lines[1], /"Interview"/);
    assert.match(lines[2], /"JavaScript Developer","Google"/);
});