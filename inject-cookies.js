#!/usr/bin/env node
/**
 * inject-cookies.js
 * 
 * Reads cookies from google.txt (Netscape format) and injects them
 * directly into final.js as a hardcoded array — no file parsing at runtime.
 *
 * Usage:
 *   node inject-cookies.js                    # uses ./google.txt → ./final.js
 *   node inject-cookies.js path/to/cookies.txt  # custom cookie file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Config ───────────────────────────────────────────────
const cookieFile = process.argv[2] || path.resolve(__dirname, 'google.txt');
const targetFile = path.resolve(__dirname, 'bot', 'bot.js');

// ── Parse Netscape cookies ───────────────────────────────
function parseNetscapeCookies(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Cookie file not found: ${filePath}`);
        process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const cookies = [];

    for (let line of content.split('\n')) {
        line = line.trim();
        if (!line) continue;

        let isHttpOnly = false;
        if (line.startsWith('#HttpOnly_')) {
            isHttpOnly = true;
            line = line.substring(10);
        } else if (line.startsWith('#')) {
            continue;
        }

        const parts = line.split('\t');
        if (parts.length >= 7) {
            cookies.push({
                domain: parts[0],
                path: parts[2],
                secure: parts[3] === 'TRUE',
                expires: parseInt(parts[4], 10),
                name: parts[5],
                value: parts[6],
                sameSite: 'Lax',
                httpOnly: isHttpOnly,
            });
        }
    }

    return cookies;
}

// ── Read & inject ────────────────────────────────────────
console.log(`📂 Reading cookies from: ${cookieFile}`);
const cookies = parseNetscapeCookies(cookieFile);
console.log(`🍪 Parsed ${cookies.length} cookies`);

if (cookies.length === 0) {
    console.error('❌ No cookies parsed — check the file format.');
    process.exit(1);
}

// Read final.js
if (!fs.existsSync(targetFile)) {
    console.error(`❌ Target file not found: ${targetFile}`);
    process.exit(1);
}

let source = fs.readFileSync(targetFile, 'utf8');

// ── Markers in final.js ─────────────────────────────────
// We look for the parseNetscapeCookies function block and the
// cookieFile + googleCookies lines, then replace them with
// a hardcoded array.
const BEGIN_MARKER = '// __COOKIES_BEGIN__';
const END_MARKER   = '// __COOKIES_END__';

const cookieJSON = JSON.stringify(cookies, null, 4);

if (source.includes(BEGIN_MARKER) && source.includes(END_MARKER)) {
    // Already injected before — replace between markers
    const re = new RegExp(
        `${escapeRegex(BEGIN_MARKER)}[\\s\\S]*?${escapeRegex(END_MARKER)}`,
        'm'
    );
    source = source.replace(re, [
        BEGIN_MARKER,
        `    const googleCookies = ${indent(cookieJSON, 4)};`,
        END_MARKER,
    ].join('\n'));
} else {
    // First injection — find the cookie parsing block and replace it
    // Match from the parseNetscapeCookies function to the googleCookies assignment
    const cookieBlockRegex =
        /( *)function parseNetscapeCookies[\s\S]*?const googleCookies\s*=\s*parseNetscapeCookies\([^)]*\);/m;

    if (!cookieBlockRegex.test(source)) {
        console.error('❌ Could not locate the cookie-parsing block in final.js.');
        console.error('   Make sure final.js contains the parseNetscapeCookies function');
        console.error('   and the `const googleCookies = parseNetscapeCookies(...)` line.');
        process.exit(1);
    }

    source = source.replace(cookieBlockRegex, [
        `    ${BEGIN_MARKER}`,
        `    const googleCookies = ${indent(cookieJSON, 4)};`,
        `    ${END_MARKER}`,
    ].join('\n'));

    // Also remove the cookieFile line if it exists
    source = source.replace(
        /^\s*const cookieFile\s*=.*;\s*\n/m,
        ''
    );
}

// Write back
fs.writeFileSync(targetFile, source, 'utf8');
console.log(`✅ Injected ${cookies.length} cookies into final.js`);
console.log('   Run your bot with:  node final.js');

// ── Helpers ──────────────────────────────────────────────
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function indent(json, spaces) {
    // Indent every line after the first by `spaces`
    const pad = ' '.repeat(spaces);
    return json.split('\n').map((line, i) => (i === 0 ? line : pad + line)).join('\n');
}
