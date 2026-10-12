'use strict';

/* End-to-end tests for js/dashboard.js: personalized greeting, stats,
   application pipeline, notifications, CSV export and quick-action scrolling —
   all driven through a DOM stub in the vm sandbox. */

const test = require('node:test');
const assert = require('node:assert/strict');

const { createContext, loadPortal, loadScript } = require('./helpers/load-script');
const { FakeElement, createDom } = require('./helpers/dom-shim');

const DASHBOARD_IDS = [
    'user-name', 'stat-applied', 'stat-interviews', 'stat-saved', 'stat-offers',
    'pipeline-list', 'notif-list', 'notif-count', 'mark-read', 'export-csv',
    'go-pipeline', 'go-recommendations'
];

function makeLocalStorage(initial) {
    const data = Object.assign({}, initial || {});
    return {
        _data: data,
        getItem(key) {
            return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
        },
        setItem(key, value) { data[key] = String(value); }
    };
}

function mountDashboard(options) {
    const opts = options || {};
    const pipelineAnchor = new FakeElement('section');
    const recommendationsAnchor = new FakeElement('section');
    const unreadItems = [];

    for (let i = 0; i < 3; i += 1) {
        const item = new FakeElement('li');
        item.classList.add('notif-item');
        item.classList.add('unread');
        unreadItems.push(item);
    }

    const doc = createDom({
        ids: DASHBOARD_IDS,
        selectors: {
            '.notif-item.unread': unreadItems,
            '#pipeline': [pipelineAnchor],
            '#recommendations': [recommendationsAnchor]
        }
    });

    const ctx = createContext();
    ctx.document = doc;
    ctx.location = { pathname: '/pages/dashboard.html' };
    ctx.localStorage = makeLocalStorage(opts.storage);
    ctx.Blob = class BlobStub {
        constructor(parts, meta) {
            this.parts = parts;
            this.meta = meta;
        }
    };
    ctx.URL = {
        createObjectURL(blob) { ctx.__blobUrlCtor = blob; return 'blob:mock-url'; },
        revokeObjectURL(url) { ctx.__revokedUrl = url; }
    };

    loadPortal(ctx);
    loadScript('js/dashboard.js', ctx);

    return { ctx, doc, unreadItems, pipelineAnchor, recommendationsAnchor };
}

function el(doc, id) {
    return doc.elements.get(id);
}

test('greeting falls back to Alex when nothing is stored', () => {
    const { doc } = mountDashboard();
    assert.equal(el(doc, 'user-name').textContent, 'Alex');
});

test('greeting uses the stored user name', () => {
    const { doc } = mountDashboard({ storage: { 'portal.user': '{"name":"Sam"}' } });
    assert.equal(el(doc, 'user-name').textContent, 'Sam');
});

test('malformed stored user degrades to the fallback greeting', () => {
    const { doc } = mountDashboard({ storage: { 'portal.user': 'not-json{' } });
    assert.equal(el(doc, 'user-name').textContent, 'Alex');
});

test('summary stats reflect the application history', () => {
    const { doc } = mountDashboard();
    assert.equal(el(doc, 'stat-applied').textContent, '5');
    assert.equal(el(doc, 'stat-interviews').textContent, '2');
    assert.equal(el(doc, 'stat-saved').textContent, '3');
    assert.equal(el(doc, 'stat-offers').textContent, '1');
});

test('pipeline renders jobs with stage badges and progress', () => {
    const { doc } = mountDashboard();
    const html = el(doc, 'pipeline-list').innerHTML;

    assert.equal(html.includes('React.js Expert'), true, 'top-stage application listed');
    assert.equal(html.includes('UX Designer'), true);
    assert.equal(html.includes('badge-green'), true, 'Offer stage uses the green badge');
    assert.equal(html.includes('badge-gray'), true, 'Applied stage uses the gray badge');
    assert.equal(html.includes('aria-valuenow="4"'), true, 'progress track reports stage 4 of 4');
    assert.equal(html.includes(' role="progressbar"'), true);
});

test('notifications render with unread count', () => {
    const { doc } = mountDashboard();
    const html = el(doc, 'notif-list').innerHTML;

    assert.equal(html.includes('matches your JavaScript profile.'), true);
    assert.equal(html.includes(' unread"'), true);
    assert.equal(el(doc, 'notif-count').textContent, '3');
    assert.equal(el(doc, 'notif-count').hidden, false);
});

test("mark-all-read clears the unread styling and hides the badge", () => {
    const { doc, unreadItems } = mountDashboard();
    el(doc, 'mark-read').click();

    unreadItems.forEach((item) => {
        assert.equal(item.classList.contains('unread'), false);
    });
    assert.equal(el(doc, 'notif-count').hidden, true);
});

test('exporting CSV creates an anchor download and confirms on the button', () => {
    const { ctx, doc } = mountDashboard();

    el(doc, 'export-csv').click();

    const anchor = doc.body.children[0];
    assert.equal(anchor.download, 'my-applications.csv');
    assert.equal(anchor.href, 'blob:mock-url');
    assert.equal(ctx.__revokedUrl, 'blob:mock-url');
    assert.equal(el(doc, 'export-csv').textContent.indexOf('Downloaded!'), 0);
    assert.ok(ctx.__blobUrlCtor.parts[0].indexOf('UX Designer') !== -1, 'the CSV carries job data');
});

test('quick actions scroll to their sections', () => {
    const { doc, pipelineAnchor, recommendationsAnchor } = mountDashboard();

    el(doc, 'go-pipeline').click();
    el(doc, 'go-recommendations').click();

    assert.equal(pipelineAnchor.__scrolledIntoView.behavior, 'smooth');
    assert.equal(pipelineAnchor.__scrolledIntoView.block, 'start');
    assert.equal(recommendationsAnchor.__scrolledIntoView.behavior, 'smooth');
    assert.equal(recommendationsAnchor.__scrolledIntoView.block, 'start');
});