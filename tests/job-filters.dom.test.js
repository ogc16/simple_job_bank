'use strict';

/* End-to-end tests for js/job-filters.js running in its real (classic-script,
   shared-global, vm) execution model against a DOM stub. Assertions are
   cross-checked against the pure rules in JobUtils so the DOM layer can never
   diverge from the tested helpers. */

const test = require('node:test');
const assert = require('node:assert/strict');

const { createContext, loadPortal, loadScript } = require('./helpers/load-script');
const { FakeElement, createDom } = require('./helpers/dom-shim');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const JOBS_PAGE_IDS = [
    'job-search', 'job-category', 'job-location', 'job-salary', 'job-filter',
    'job-list', 'job-count', 'no-results', 'clear-filters'
];
const FEATURED_IDS = ['featured-jobs'];

function makeChips(tags) {
    return tags.map((tag) => {
        const el = new FakeElement('div');
        el.setAttribute('data-tag', tag);
        return el;
    });
}

function mount(pageIds, pathname) {
    const chips = makeChips(['programming', 'design', 'marketing']);
    const doc = createDom({
        ids: pageIds,
        selectors: {
            '.tag[data-tag]': chips
        }
    });
    const ctx = createContext();
    ctx.document = doc;
    ctx.location = { pathname };
    loadPortal(ctx);
    return { ctx, doc };
}

function expectedCount(ctx, criteria) {
    const base = criteria.dashboard
        ? ctx.JOBS.filter((j) => j.dashboard)
        : ctx.JOBS;
    return ctx.JobUtils.filterJobs(base, criteria).length;
}

test('jobs page renders skeletons, then the full list on bootstrap', async () => {
    const { ctx, doc } = mount(JOBS_PAGE_IDS, '/pages/jobs.html');
    loadScript('js/job-filters.js', ctx);

    const list = doc.elements.get('job-list');
    const empty = doc.elements.get('no-results');
    assert.equal(list.innerHTML.indexOf('<div class="skeleton-card"'), 0, 'starts with skeletons');
    assert.equal(doc.elements.get('job-count').textContent, '\u2026');
    assert.equal(empty.hidden, true);

    await sleep(420); // bootstrap setTimeout(SKELETON_MS)

    assert.equal(doc.elements.get('job-count').textContent, '18');
    assert.equal(list.innerHTML.includes('UX Designer'), true);
    assert.equal(list.innerHTML.includes('pages/job-details.html'), false);
    assert.equal(list.innerHTML.includes('job-details.html'), true, 'cards link from pages/ without prefix');
    assert.equal(empty.hidden, true, 'no empty state when there are results');
    assert.equal(list.hidden, false);
});

test('index page renders the three most recent jobs as featured cards', () => {
    const { ctx, doc } = mount(FEATURED_IDS, '/index.html');
    loadScript('js/job-filters.js', ctx);

    const html = doc.elements.get('featured-jobs').innerHTML;
    assert.equal(html.includes('UX Designer'), true);
    assert.equal(html.includes('JavaScript Developer'), true);
    assert.equal(html.includes('Product Developer'), true);
    assert.equal(html.includes('Programmer'), false, 'only the three newest are featured');
    assert.equal(html.includes('pages/job-details.html'), true, 'cards link with pages/ prefix from the root');
});

test('dashboard page shows only dashboard-flagged jobs', async () => {
    const { ctx, doc } = mount(JOBS_PAGE_IDS, '/pages/dashboard.html');
    loadScript('js/job-filters.js', ctx);
    await sleep(420);

    const html = doc.elements.get('job-list').innerHTML;
    assert.equal(doc.elements.get('job-count').textContent, '8');
    assert.equal(html.includes('UX Designer'), true);
    assert.equal(html.includes('Backend Engineer'), false, 'non-dashboard jobs are hidden');
    assert.equal(expectedCount(ctx, { dashboard: true }), 8);
});

test('search input debounces and narrows the results', async () => {
    const { ctx, doc } = mount(JOBS_PAGE_IDS, '/pages/jobs.html');
    loadScript('js/job-filters.js', ctx);
    await sleep(420);

    const search = doc.elements.get('job-search');
    search.value = 'React';
    search.dispatch('input', {});
    await sleep(320); // debounce delay (250 ms) plus slack

    const html = doc.elements.get('job-list').innerHTML;
    assert.equal(doc.elements.get('job-count').textContent, '1');
    assert.equal(html.includes('React.js Expert'), true);
    assert.equal(html.includes('UX Designer'), false);
});

test('category select matches the pure filter rules', async () => {
    const { ctx, doc } = mount(JOBS_PAGE_IDS, '/pages/jobs.html');
    loadScript('js/job-filters.js', ctx);
    await sleep(420);

    doc.elements.get('job-category').value = 'design';
    doc.elements.get('job-category').dispatch('change', {});
    await sleep(50);

    const html = doc.elements.get('job-list').innerHTML;
    assert.equal(doc.elements.get('job-count').textContent, String(expectedCount(ctx, { category: 'design' })));
    assert.equal(html.includes('UX Designer'), true);
    assert.equal(html.includes('JavaScript Developer'), false);
});

test('combining salary, location and recency matches pure rules', async () => {
    const { ctx, doc } = mount(JOBS_PAGE_IDS, '/pages/jobs.html');
    loadScript('js/job-filters.js', ctx);
    await sleep(420);

    doc.elements.get('job-salary').value = '160-400';
    doc.elements.get('job-salary').dispatch('change', {});
    doc.elements.get('job-location').value = 'remote';
    doc.elements.get('job-location').dispatch('change', {});
    doc.elements.get('job-filter').value = '5';
    doc.elements.get('job-filter').dispatch('change', {});
    await sleep(50);

    const expected = expectedCount(ctx, { salary: '160-400', location: 'remote', maxDays: 5 });
    assert.equal(doc.elements.get('job-count').textContent, String(expected));
    assert.ok(expected > 0, 'the combined filter still matches some jobs');
});

test('empty results reveal the empty state and hide the list', async () => {
    const { ctx, doc } = mount(JOBS_PAGE_IDS, '/pages/jobs.html');
    loadScript('js/job-filters.js', ctx);
    await sleep(420);

    doc.elements.get('job-search').value = 'no-such-job-anywhere';
    doc.elements.get('job-search').dispatch('input', {});
    await sleep(320);

    assert.equal(doc.elements.get('job-count').textContent, '0');
    assert.equal(doc.elements.get('job-list').hidden, true);
    assert.equal(doc.elements.get('no-results').hidden, false);

    const clear = doc.elements.get('clear-filters');
    clear.click();
    assert.equal(doc.elements.get('job-count').textContent, '18');
    assert.equal(doc.elements.get('job-list').hidden, false);
});

test('tag chips get ARIA state, toggle filters on click, and respond to keys', async () => {
    const { ctx, doc } = mount(JOBS_PAGE_IDS, '/pages/jobs.html');
    loadScript('js/job-filters.js', ctx);

    const chips = doc.selectors['.tag[data-tag]'];
    assert.equal(chips.length, 3);
    chips.forEach((chip) => {
        assert.equal(chip.getAttribute('role'), 'button');
        assert.equal(chip.getAttribute('tabindex'), '0');
        assert.equal(chip.getAttribute('aria-pressed'), 'false');
    });

    await sleep(420);

    const programming = chips[0];
    programming.click();
    assert.equal(programming.classList.contains('active'), true);
    assert.equal(programming.getAttribute('aria-pressed'), 'true');
    assert.equal(doc.elements.get('job-count').textContent, String(expectedCount(ctx, { tags: ['programming'] })));

    let keyDefaultPrevented = false;
    programming.dispatch('keydown', { key: 'Enter', preventDefault: () => { keyDefaultPrevented = true; } });
    assert.equal(keyDefaultPrevented, true);
    assert.equal(programming.classList.contains('active'), false, 'Enter toggles the chip back off');
    assert.equal(programming.getAttribute('aria-pressed'), 'false');

    const design = chips[1];
    design.dispatch('keydown', { key: ' ', preventDefault: () => { keyDefaultPrevented = true; } });
    assert.equal(design.classList.contains('active'), true, 'space toggles on');
    assert.equal(doc.elements.get('job-count').textContent, String(expectedCount(ctx, { tags: ['design'] })));
});

test('clear-filters resets inputs, chips and the list', async () => {
    const { ctx, doc } = mount(JOBS_PAGE_IDS, '/pages/jobs.html');
    loadScript('js/job-filters.js', ctx);

    const chips = doc.selectors['.tag[data-tag]'];
    await sleep(420);

    doc.elements.get('job-search').value = 'React';
    doc.elements.get('job-category').value = 'programming';
    doc.elements.get('job-location').value = 'remote';
    chips[0].click();

    doc.elements.get('clear-filters').click();

    assert.equal(doc.elements.get('job-search').value, '');
    assert.equal(doc.elements.get('job-category').value, '');
    assert.equal(doc.elements.get('job-location').value, '');
    assert.equal(chips[0].classList.contains('active'), false);
    assert.equal(chips[0].getAttribute('aria-pressed'), 'false');
    assert.equal(doc.elements.get('job-count').textContent, '18');
    assert.equal(doc.elements.get('job-list').innerHTML.includes('UX Designer'), true);
});