/* ── Job-filter engine & component renderer.

   Three modes detected automatically:
     1. Filter page  (#job-search + #job-list)  – dashboard.html / jobs.html
     2. Featured page (#featured-jobs)           – index.html
     3. Neither page – bail out silently.        (layout.js pages without jobs)

   Relies on the global JOBS array supplied by jobs.js and the pure helpers
   in job-utils.js (global `JobUtils`). */

(function () {
    'use strict';

    /* ── Helpers ──────────────────────────────────────────────────────── */

    var SEARCH_DELAY = 250;          // ms debounce
    var SKELETON_MS  = 350;          // simulated load delay for skeleton demo

    var SEARCH_INPUT  = /** @type {HTMLInputElement | null} */ (document.getElementById('job-search'));
    var CATEGORY_SEL  = /** @type {HTMLSelectElement | null} */ (document.getElementById('job-category'));
    var LOCATION_SEL  = /** @type {HTMLSelectElement | null} */ (document.getElementById('job-location'));
    var SALARY_SEL    = /** @type {HTMLSelectElement | null} */ (document.getElementById('job-salary'));
    var FILTER_SEL    = /** @type {HTMLSelectElement | null} */ (document.getElementById('job-filter'));
    var JOB_LIST      = document.getElementById('job-list');
    var FEATURED_LIST = document.getElementById('featured-jobs');
    var COUNT_EL      = document.getElementById('job-count');

    /* Job-detail pages live under pages/; index.html at the root needs the
       pages/ prefix while pages/*.html can use the bare filename. */
    function jobDetailsHref() {
        var parts = window.location.pathname.split('/');
        if (parts.length >= 2 && parts[parts.length - 2].toLowerCase() === 'pages') {
            return 'job-details.html';
        }
        return 'pages/job-details.html';
    }
    var JOB_DETAILS_HREF = jobDetailsHref();
    var EMPTY_EL       = document.getElementById('no-results');
    /** @type {Element[]} */
    var tagChips       = Array.prototype.slice.call(document.querySelectorAll('.tag[data-tag]'));
    /** @type {string[]} */
    var activeTags     = [];

    var SKELETON_HTML =
        '<div class="skeleton-card" aria-hidden="true">' +
            '<div class="job_details">' +
                '<div class="skeleton sk-icon"></div>' +
                '<div class="skeleton-text">' +
                    '<div class="sk-title"></div>' +
                    '<div class="sk-sub"></div>' +
                '</div>' +
            '</div>' +
            '<div class="skeleton-right">' +
                '<div class="sk-salary"></div>' +
                '<div class="sk-date"></div>' +
            '</div>' +
        '</div>';

    /** @param {number} count */
    function skeletonSet(count) {
        var out = '';
        for (var i = 0; i < count; i++) { out += SKELETON_HTML; }
        return out;
    }

    /** @param {HTMLElement} el @param {string} html */
    function setHTML(el, html) {
        el.innerHTML = html;
    }

    /* ── Featured cards (index.html) ──────────────────────────────────── */

    function renderFeatured() {
        if (!FEATURED_LIST || typeof JOBS === 'undefined') { return; }
        var sorted = JOBS.slice().sort(function (a, b) {
            return a.postedDays - b.postedDays;
        });
        setHTML(FEATURED_LIST, sorted.slice(0, 3).map(function (job) {
            return JobUtils.renderCard(job, JOB_DETAILS_HREF);
        }).join(''));
    }

    /* ── Filter logic ─────────────────────────────────────────────────── */

    var isDashboard = JOB_LIST &&
        window.location.pathname.toLowerCase().indexOf('dashboard') !== -1;

    function baseJobs() {
        return isDashboard
            ? JOBS.filter(function (j) { return j.dashboard; })
            : JOBS;
    }

    function applyFilters() {
        var visible = JobUtils.filterJobs(baseJobs(), {
            query: SEARCH_INPUT ? SEARCH_INPUT.value : '',
            category: CATEGORY_SEL ? CATEGORY_SEL.value : '',
            location: LOCATION_SEL ? LOCATION_SEL.value : '',
            salary: SALARY_SEL ? SALARY_SEL.value : '',
            maxDays: FILTER_SEL && FILTER_SEL.value ? parseInt(FILTER_SEL.value, 10) : undefined,
            tags: activeTags
        });

        if (JOB_LIST) {
            setHTML(JOB_LIST, visible.map(function (job) {
                return JobUtils.renderCard(job, JOB_DETAILS_HREF);
            }).join(''));
        }

        if (COUNT_EL) { COUNT_EL.textContent = String(visible.length); }
        if (EMPTY_EL && JOB_LIST) {
            EMPTY_EL.hidden = visible.length > 0;
            JOB_LIST.hidden = visible.length === 0;
        }
    }

    /* ── Chip interaction (keyboard + mouse) ──────────────────────────── */

    tagChips.forEach(function (chip) {
        chip.setAttribute('role', 'button');
        chip.setAttribute('tabindex', '0');
        chip.setAttribute('aria-pressed', 'false');
        chip.setAttribute('aria-controls', 'job-list');
    });

    tagChips.forEach(function (chip) {
        function toggle() {
            var tag = chip.getAttribute('data-tag');
            if (tag) { activeTags = JobUtils.toggleTag(activeTags, tag); }
            chip.classList.toggle('active');
            chip.setAttribute('aria-pressed', String(chip.classList.contains('active')));
            applyFilters();
        }
        chip.addEventListener('click', toggle);
        chip.addEventListener('keydown', function (ev) {
            var keyEvent = /** @type {KeyboardEvent} */ (ev);
            if (keyEvent.key === 'Enter' || keyEvent.key === ' ') { keyEvent.preventDefault(); toggle(); }
        });
    });

    /* ── Clear filters button (inside the empty state) ────────────────── */

    var clearBtn = document.getElementById('clear-filters');
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            if (SEARCH_INPUT) { SEARCH_INPUT.value = ''; }
            if (CATEGORY_SEL) { CATEGORY_SEL.value = ''; }
            if (LOCATION_SEL) { LOCATION_SEL.value = ''; }
            if (SALARY_SEL)   { SALARY_SEL.value   = ''; }
            if (FILTER_SEL)   { FILTER_SEL.value   = ''; }
            tagChips.forEach(function (chip) {
                chip.classList.remove('active');
                chip.setAttribute('aria-pressed', 'false');
            });
            activeTags.length = 0;
            applyFilters();
        });
    }

    /* ── Search + filter listeners ────────────────────────────────────── */

    if (SEARCH_INPUT && JOB_LIST) {
        SEARCH_INPUT.addEventListener('input', JobUtils.debounce(applyFilters, SEARCH_DELAY));
    }
    if (CATEGORY_SEL) { CATEGORY_SEL.addEventListener('change', applyFilters); }
    if (LOCATION_SEL) { LOCATION_SEL.addEventListener('change', applyFilters); }
    if (SALARY_SEL)   { SALARY_SEL.addEventListener('change', applyFilters); }
    if (FILTER_SEL)   { FILTER_SEL.addEventListener('change', applyFilters); }

    /* ── Bootstrap ────────────────────────────────────────────────────── */

    if (JOB_LIST) {
        setHTML(JOB_LIST, skeletonSet(4));
        if (EMPTY_EL) { EMPTY_EL.hidden = true; }
        if (COUNT_EL) { COUNT_EL.textContent = '\u2026'; }

        setTimeout(function () {
            applyFilters();
        }, SKELETON_MS);
    } else {
        renderFeatured();
    }

})();