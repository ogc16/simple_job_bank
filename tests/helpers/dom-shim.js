'use strict';

/* Minimal DOM stub that lets the real page scripts run inside the `vm` sandbox
   without a browser, so js/dashboard.js and js/job-filters.js are exercised
   end-to-end. HTML strings are NOT parsed — a test registers, ahead of time,
   which elements a selector should return (see `spec.selectors`). */

/** A bare-bones element that records everything the scripts do to it. */
class FakeElement {
    /** @param {string} tag */
    constructor(tag) {
        this.tagName = String(tag).toUpperCase();
        this.children = [];
        this._listeners = Object.create(null);
        this._attributes = Object.create(null);
        this._classes = new Set();
        this.value = '';
        this.textContent = '';
        this.innerHTML = '';
        this.hidden = false;
        this.dataset = Object.create(null);
        this.count = 0;
        this.classList = {
            add: (name) => { this._classes.add(name); },
            remove: (name) => { this._classes.delete(name); },
            contains: (name) => this._classes.has(name),
            toggle: (name, force) => {
                const on = force === undefined ? !this._classes.has(name) : Boolean(force);
                if (on) { this._classes.add(name); } else { this._classes.delete(name); }
                return on;
            }
        };
    }

    setAttribute(name, value) {
        this._attributes[name] = String(value);
    }

    getAttribute(name) {
        return Object.prototype.hasOwnProperty.call(this._attributes, name)
            ? this._attributes[name]
            : null;
    }

    addEventListener(type, fn) {
        (this._listeners[type] || (this._listeners[type] = [])).push(fn);
    }

    dispatch(type, event) {
        const ev = event || {};
        (this._listeners[type] || []).forEach((fn) => fn(ev));
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    remove() {}

    click() {
        this.dispatch('click', {});
    }

    scrollIntoView(options) {
        this.__scrolledIntoView = options || true;
    }
}

/**
 * Build a document stub for a page.
 * @param {object} spec - `{ ids: string[], selectors: Record<string, FakeElement[]> }`
 * @returns {object} stub document with `getElementById`, `querySelector(All)`,
 *   `createElement`, `body`, plus `document.elements` (Map by id) and
 *   `document.selectors` for assertions.
 */
function createDom(spec) {
    const ids = (spec && spec.ids) || [];
    const elements = new Map();
    ids.forEach((id) => elements.set(id, new FakeElement('div')));

    const selectors = Object.assign(Object.create(null), (spec && spec.selectors) || {});

    return {
        getElementById(id) {
            return elements.get(id) || null;
        },
        querySelectorAll(selector) {
            return selectors[selector] || [];
        },
        querySelector(selector) {
            const hits = selectors[selector] || [];
            return hits.length ? hits[0] : null;
        },
        createElement(tag) {
            return new FakeElement(tag);
        },
        body: new FakeElement('body'),
        elements,
        selectors
    };
}

module.exports = { FakeElement, createDom };