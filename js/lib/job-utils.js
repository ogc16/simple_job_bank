/* ── Pure, framework-free job helpers ──────────────────────────────────────
   Shared by the browser scripts (loaded as a plain <script> tag, exposes a
   global `JobUtils`) and by the Node test suite (loaded in a vm sandbox the
   same way a browser would). Holds every value-formatting, filtering and
   validation rule used across the portal so the rules are written once and
   proven by tests.

   Depends on nothing. ES5-friendly to match the rest of the codebase. */

/* exported JobUtils */

/**
 * A single job listing.
 *
 * @typedef {Object} Job
 * @property {string} title
 * @property {string} company
 * @property {string} icon
 * @property {string[]} categories
 * @property {number} salaryMin   Annual salary low, whole thousands USD.
 * @property {number} salaryMax   Annual salary high, whole thousands USD.
 * @property {number} postedDays
 * @property {string} type        'Full-time' | 'Contract'
 * @property {string} location    'Remote' | 'Hybrid' | 'On-site'
 * @property {string} level       'Junior' | 'Mid' | 'Senior' | 'Manager'
 * @property {boolean} dashboard  true = shown on the dashboard recent list
 */

/**
 * Criteria accepted by {@link filterJobs}. Every field is optional.
 *
 * @typedef {Object} FilterCriteria
 * @property {string} [query]     Free-text search across title + company.
 * @property {string} [category]  Category select value, e.g. 'programming'.
 * @property {string} [location]  Location select value, e.g. 'Remote'.
 * @property {string} [salary]    Salary-range select value, e.g. '100-150'.
 * @property {number} [maxDays]   Only jobs posted at most this many days ago.
 * @property {string[]} [tags]    Active tag chips (job categories).
 */

/**
 * One row of a candidate's application history.
 *
 * @typedef {Object} ApplicationEntry
 * @property {number} jobIndex    Index into the JOBS array.
 * @property {number} stage       0..3, mapped to pipeline STAGES.
 * @property {number} appliedDays
 */

/**
 * A single pipeline stage definition.
 *
 * @typedef {Object} Stage
 * @property {string} label
 * @property {string} badge
 * @property {number} segIdx
 */

var JobUtils = (function () {
    'use strict';

    var VALID_TYPES = ['Full-time', 'Contract'];
    var VALID_LOCATIONS = ['Remote', 'Hybrid', 'On-site'];
    var VALID_LEVELS = ['Junior', 'Mid', 'Senior', 'Manager'];

    /* ── Formatting ─────────────────────────────────────────────────── */

    /** @param {Job} job */
    function salaryText(job) {
        return '$' + job.salaryMin + 'k \u2013 $' + job.salaryMax + 'k /yr';
    }

    /** @param {Job} job */
    function salaryRangeText(job) {
        return '$' + job.salaryMin + 'k\u2013$' + job.salaryMax + 'k/yr';
    }

    /**
     * @param {number} days
     * @returns {string}
     */
    function dateText(days) {
        return days + (days === 1 ? ' day ago' : ' days ago');
    }

    /** @param {string} label */
    function badgeClass(label) {
        if (label === 'Remote')    return 'badge-green';
        if (label === 'Hybrid')    return 'badge-blue';
        if (label === 'On-site')   return 'badge-gray';
        if (label === 'Junior')    return 'badge-green';
        if (label === 'Mid')       return 'badge-blue';
        if (label === 'Senior')    return 'badge-purple';
        if (label === 'Manager')   return 'badge-gold';
        if (label === 'Full-time') return 'badge-indigo';
        if (label === 'Contract')  return 'badge-orange';
        return 'badge-gray';
    }

    /** @param {Job} job */
    function renderBadges(job) {
        return '<span class="badge ' + badgeClass(job.type) + '">' + job.type + '</span>' +
               '<span class="badge ' + badgeClass(job.location) + '">' + job.location + '</span>' +
               '<span class="badge ' + badgeClass(job.level) + '">' + job.level + '</span>';
    }

    /**
     * Render a job card. `detailsHref` is the link target for the detail page.
     *
     * @param {Job} job
     * @param {string} detailsHref
     */
    function renderCard(job, detailsHref) {
        var tags = job.categories.join(', ');
        var label = job.title + ' at ' + job.company + ', ' +
                    job.level + ', ' + job.type + ', ' + job.location + ', ' +
                    salaryText(job);
        return (
            '<a href="' + detailsHref + '" class="job_card" data-tags="' + tags + '" aria-label="' + label + '">' +
                '<div class="job_details">' +
                    '<div class="img">' +
                        '<i class="' + job.icon + '" aria-hidden="true"></i>' +
                    '</div>' +
                    '<div class="text">' +
                        '<h2>' + job.title + '</h2>' +
                        '<span>' + job.company + ' \u2013 ' + job.level + ' Post</span>' +
                        '<div class="badges">' + renderBadges(job) + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="job_salary">' +
                    '<h4>' + salaryText(job) + '</h4>' +
                    '<span>' + dateText(job.postedDays) + '</span>' +
                '</div>' +
            '</a>'
        );
    }

    /* ── Filtering ──────────────────────────────────────────────────── */

    /** @param {Job} job */
    function daysPosted(job) {
        return job.postedDays || 999;
    }

    /**
     * @param {Job} job
     * @param {string} [selected]
     */
    function matchesCategory(job, selected) {
        var sel = (selected || '').toLowerCase();
        if (!sel || sel === 'category') { return true; }
        return job.categories.indexOf(sel) !== -1;
    }

    /**
     * Location selects use "Remote" / "Hybrid" / "On-site"; match on the
     * first two letters so prefix values also work.
     *
     * @param {Job} job
     * @param {string} [selected]
     */
    function matchesLocation(job, selected) {
        var sel = (selected || '').toLowerCase();
        if (!sel) { return true; }
        return job.location.toLowerCase().indexOf(sel.slice(0, 2)) === 0;
    }

    /**
     * @param {Job} job
     * @param {string} [range]  e.g. '100-150'
     */
    function matchesSalary(job, range) {
        if (!range) { return true; }
        var parts = range.split('-');
        var lo = parseInt(parts[0], 10);
        var hi = parseInt(parts[1], 10);
        return job.salaryMax >= lo && job.salaryMin <= hi;
    }

    /**
     * @param {Job} job
     * @param {string} [query]
     */
    function matchesQuery(job, query) {
        if (!query) { return true; }
        query = String(query).toLowerCase();
        return (job.title + ' ' + job.company).toLowerCase().indexOf(query) !== -1;
    }

    /**
     * Tag chips act in OR across a job's categories.
     *
     * @param {Job} job
     * @param {string[]} [tags]
     */
    function matchesTags(job, tags) {
        if (!tags || tags.length === 0) { return true; }
        return job.categories.some(function (c) {
            return tags.indexOf(c) !== -1;
        });
    }

    /**
     * Apply every filter at once. Field order mirrors the original UI:
     * query, category, location, salary, recency, tag chips.
     *
     * @param {Job[]} jobs
     * @param {FilterCriteria} [criteria]
     * @returns {Job[]}
     */
    function filterJobs(jobs, criteria) {
        criteria = criteria || {};
        var query = (criteria.query || '').trim().toLowerCase();
        var maxDays = criteria.maxDays == null ? null : Number(criteria.maxDays);
        var out = [];

        for (var i = 0; i < jobs.length; i++) {
            var job = jobs[i];
            var passes = matchesQuery(job, query) &&
                matchesCategory(job, criteria.category) &&
                matchesLocation(job, criteria.location) &&
                matchesSalary(job, criteria.salary) &&
                (maxDays === null || daysPosted(job) <= maxDays) &&
                matchesTags(job, criteria.tags);
            if (passes) { out.push(job); }
        }
        return out;
    }

    /**
     * Toggle a tag in place, returning the new list.
     *
     * @param {string[]} tags
     * @param {string} tag
     * @returns {string[]}
     */
    function toggleTag(tags, tag) {
        var i = tags.indexOf(tag);
        if (i === -1) { return tags.concat([tag]); }
        return tags.slice(0, i).concat(tags.slice(i + 1));
    }

    /**
     * Debounce a function; trailing call wins.
     *
     * @param {Function} fn
     * @param {number} ms
     */
    function debounce(fn, ms) {
        /** @type {number | undefined} */
        var timer;
        return function () {
            clearTimeout(timer);
            timer = setTimeout(fn, ms);
        };
    }

    /* ── Dashboard stats & CSV ──────────────────────────────────────── */

    /**
     * Roll up the four summary stats for the dashboard.
     *
     * @param {ApplicationEntry[]} history
     * @param {number} savedCount
     * @returns {{ applied: number, interviews: number, saved: number, offers: number }}
     */
    function computeStats(history, savedCount) {
        return {
            applied: history.length,
            interviews: history.filter(function (a) { return a.stage >= 2; }).length,
            saved: savedCount,
            offers: history.filter(function (a) { return a.stage === 3; }).length
        };
    }

    /**
     * @param {ApplicationEntry[]} history
     * @param {Job[]} jobs
     * @param {Stage[]} stages
     * @returns {string[][]}
     */
    function applicationRows(history, jobs, stages) {
        return history.map(function (app) {
            var job = jobs[app.jobIndex];
            return [
                job.title,
                job.company,
                salaryRangeText(job),
                job.location,
                dateText(app.appliedDays),
                stages[app.stage].label
            ];
        });
    }

    /**
     * Quote/join a table of string rows into a CSV document.
     *
     * @param {string[][]} rows
     * @returns {string}
     */
    function toCsv(rows) {
        return rows.map(function (r) {
            return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
        }).join('\r\n');
    }

    /**
     * Header + one row per application, ready for download.
     *
     * @param {ApplicationEntry[]} history
     * @param {Job[]} jobs
     * @param {Stage[]} stages
     * @returns {string}
     */
    function buildApplicationsCsv(history, jobs, stages) {
        var header = [['Job', 'Company', 'Salary range', 'Location', 'Applied', 'Stage']];
        return toCsv(header.concat(applicationRows(history, jobs, stages)));
    }

    /* ── Data integrity ─────────────────────────────────────────────── */

    /**
     * Validate a single job, returning a list of human-readable errors
     * (empty when valid).
     *
     * @param {Job} job
     * @param {number} [index]
     * @returns {string[]}
     */
    function validateJob(job, index) {
        var at = index == null ? 'job' : 'JOBS[' + index + ']';
        /** @type {string[]} */
        var errors = [];

        /** @param {string} prop @param {string} msg */
        function fail(prop, msg) {
            errors.push(at + ' ' + prop + ' ' + msg);
        }

        if (!job || typeof job !== 'object') {
            return [at + ' is not an object'];
        }

        var record = /** @type {{ [key: string]: unknown }} */ (job);

        ['title', 'company', 'icon'].forEach(function (prop) {
            if (typeof record[prop] !== 'string' || String(record[prop]).trim() === '') {
                fail(prop, 'must be a non-empty string');
            }
        });

        if (!Array.isArray(job.categories) || job.categories.length === 0) {
            fail('categories', 'must be a non-empty array');
        } else {
            job.categories.forEach(function (c, i) {
                if (typeof c !== 'string' || c.trim() === '') {
                    errors.push(at + ' categories[' + i + '] must be a non-empty string');
                }
            });
        }

        if (typeof job.salaryMin !== 'number' || isNaN(job.salaryMin) || job.salaryMin < 0) {
            fail('salaryMin', 'must be a non-negative number');
        }
        if (typeof job.salaryMax !== 'number' || isNaN(job.salaryMax) || job.salaryMax < 0) {
            fail('salaryMax', 'must be a non-negative number');
        }
        if (typeof job.salaryMin === 'number' && typeof job.salaryMax === 'number' &&
            job.salaryMin > job.salaryMax) {
            fail('salary', 'min must not exceed max');
        }
        if (typeof job.postedDays !== 'number' || isNaN(job.postedDays) || job.postedDays < 0) {
            fail('postedDays', 'must be a non-negative number');
        }
        if (VALID_TYPES.indexOf(job.type) === -1) {
            fail('type', 'must be one of: ' + VALID_TYPES.join(', '));
        }
        if (VALID_LOCATIONS.indexOf(job.location) === -1) {
            fail('location', 'must be one of: ' + VALID_LOCATIONS.join(', '));
        }
        if (VALID_LEVELS.indexOf(job.level) === -1) {
            fail('level', 'must be one of: ' + VALID_LEVELS.join(', '));
        }
        if (typeof job.dashboard !== 'boolean') {
            fail('dashboard', 'must be a boolean');
        }

        return errors;
    }

    /**
     * Validate the whole job collection.
     *
     * @param {Job[]} jobs
     * @returns {string[]}
     */
    function validateJobs(jobs) {
        /** @type {string[]} */
        var errors = [];
        jobs.forEach(function (job, i) {
            validateJob(job, i).forEach(function (e) { errors.push(e); });
        });
        return errors;
    }

    return {
        salaryText: salaryText,
        salaryRangeText: salaryRangeText,
        dateText: dateText,
        badgeClass: badgeClass,
        renderBadges: renderBadges,
        renderCard: renderCard,
        daysPosted: daysPosted,
        matchesCategory: matchesCategory,
        matchesLocation: matchesLocation,
        matchesSalary: matchesSalary,
        matchesQuery: matchesQuery,
        matchesTags: matchesTags,
        filterJobs: filterJobs,
        toggleTag: toggleTag,
        debounce: debounce,
        computeStats: computeStats,
        applicationRows: applicationRows,
        toCsv: toCsv,
        buildApplicationsCsv: buildApplicationsCsv,
        validateJob: validateJob,
        validateJobs: validateJobs
    };
})();