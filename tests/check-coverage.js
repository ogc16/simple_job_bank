'use strict';

/* Coverage gate — runs the test suite with Node's built-in coverage reporter
   and exits non-zero if tests fail OR the aggregate coverage drops below the
   thresholds. Run directly:  node tests/check-coverage.js   (used by CI). */

const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

const THRESHOLDS = {
    lines: 90,
    branches: 75,
    funcs: 90
};

const ALL_FILES_RE = /all files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/m;

function parseAllFiles(output) {
    const match = ALL_FILES_RE.exec(output);
    if (!match) {
        return null;
    }
    return {
        lines: Number(match[1]),
        branches: Number(match[2]),
        funcs: Number(match[3])
    };
}

const child = spawn(process.execPath, ['--test', '--experimental-test-coverage'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe']
});

let output = '';
function accumulate(chunk) {
    output += chunk;
    process.stdout.write(chunk);
}
child.stdout.on('data', accumulate);
child.stderr.on('data', accumulate);

child.on('close', (code) => {
    if (code !== 0) {
        console.error(`\n[coverage-gate] test run failed (exit ${code})`);
        process.exitCode = 1;
        return;
    }

    const coverage = parseAllFiles(output);
    if (!coverage) {
        console.error('\n[coverage-gate] could not locate the "all files" coverage row');
        process.exitCode = 1;
        return;
    }

    const failures = Object.keys(THRESHOLDS).filter((key) => coverage[key] < THRESHOLDS[key]);
    if (failures.length) {
        console.error(
            `\n[coverage-gate] FAILED — ${failures
                .map((key) => `${key} ${coverage[key].toFixed(2)}% < ${THRESHOLDS[key]}%`)
                .join(', ')}`
        );
        console.error(
            `[coverage-gate] all files: line ${coverage.lines.toFixed(2)}%, ` +
            `branch ${coverage.branches.toFixed(2)}%, funcs ${coverage.funcs.toFixed(2)}%`
        );
        process.exitCode = 1;
        return;
    }

    console.log(
        `\n[coverage-gate] OK — line ${coverage.lines.toFixed(2)}%, ` +
        `branch ${coverage.branches.toFixed(2)}%, funcs ${coverage.funcs.toFixed(2)}%`
    );
});