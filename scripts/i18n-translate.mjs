#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

// If Node < 18, uncomment to polyfill fetch:
// import { fetch as undiciFetch } from "undici";
// globalThis.fetch ??= undiciFetch;

const ROOT = process.cwd();
const EXTRACTED = path.join(ROOT, "src/i18n/extracted/en.json");
const LOCALES_DIR = path.join(ROOT, "src/i18n/messages");
const EN_OUT = path.join(LOCALES_DIR, "en.json");

// Choose provider: libre | google | off
const MT_PROVIDER = (process.env.MT_PROVIDER || "libre").toLowerCase();

// LibreTranslate (free/public or self-hosted)
const LIBRE_URL = process.env.LIBRETRANSLATE_URL || "https://libretranslate.com";
const LIBRE_API_KEY = process.env.LIBRETRANSLATE_API_KEY || "";

// -------------- FS helpers --------------
async function readJsonSafe(file, fallback = null) {
	try { return JSON.parse(await fs.readFile(file, "utf8")); }
	catch { return fallback; }
}

async function writeJsonPretty(file, obj) {
	await fs.mkdir(path.dirname(file), { recursive: true });
	const sorted = Object.fromEntries(
		Object.entries(obj).sort(([ a ], [ b ]) => a.localeCompare(b))
	);
	await fs.writeFile(file, JSON.stringify(sorted, null, 2) + "\n", "utf8");
}

// -------------- Extracted format normalization --------------
function normalizeExtracted(data) {
	// Accept:
	// 1) { id: "defaultMessage", ... }
	// 2) [{ id, defaultMessage }]
	// 3) { id: { defaultMessage, description? }, ... }
	if (Array.isArray(data)) {
		return Object.fromEntries(data.map(m => [ m.id, m.defaultMessage ?? "" ]));
	}
	if (data && typeof data === "object") {
		const first = Object.values(data)[ 0 ];
		if (typeof first === "string") return data;
		if (first && typeof first === "object" && "defaultMessage" in first) {
			return Object.fromEntries(
				Object.entries(data).map(([ id, v ]) => [ id, v.defaultMessage ?? "" ])
			);
		}
	}
	throw new Error("Unknown extracted file shape.");
}

// -------------- Token protection --------------
// Protect ICU args {name}, HTML-like tags <strong>…</strong>, and HTML entities.
function protectAll(text) {
	const map = new Map(); let i = 0;
	const ICU = /{[^}]+}/g;
	const TAG = /<\/?[A-Za-z][A-Za-z0-9]*(?:\s+[^<>]*?)?>/g;
	const ENT = /&[a-zA-Z]+;|&#\d+;|&#x[0-9a-fA-F]+;/g;
	const replacer = (m) => { const t = `__TOK_${i++}__`; map.set(t, m); return t; };
	let safe = text.replace(TAG, replacer);
	safe = safe.replace(ICU, replacer);
	safe = safe.replace(ENT, replacer);
	return { safe, map };
}
function restoreAll(text, map) {
	let out = text;
	for (const [ t, orig ] of map.entries()) out = out.replaceAll(t, orig);
	return out;
}

// -------------- Providers --------------
async function libreTranslateOne(text, target, source = "en") {
	const res = await fetch(`${LIBRE_URL.replace(/\/$/, "")}/translate`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			q: text,
			source,
			target,
			format: "text",
			api_key: LIBRE_API_KEY || undefined,
		}),
	});
	if (!res.ok) throw new Error(`LibreTranslate HTTP ${res.status}`);
	const json = await res.json();
	if (typeof json?.translatedText === "string") return json.translatedText;
	if (Array.isArray(json?.translations) && json.translations[ 0 ]?.text) {
		return json.translations[ 0 ].text;
	}
	throw new Error("Unexpected LibreTranslate response");
}

let googleTranslate;
async function googleTranslateOne(text, target) {
	if (!googleTranslate) {
		const mod = await import("@vitalets/google-translate-api");
		googleTranslate = mod.translate;
	}
	const res = await googleTranslate(text, { to: target });
	return res.text;
}

// Small concurrency helper
async function mapLimit(arr, limit, fn) {
	const ret = []; let i = 0;
	const workers = Array(Math.min(limit, arr.length)).fill(0).map(async () => {
		while (i < arr.length) { const idx = i++; ret[ idx ] = await fn(arr[ idx ], idx); }
	});
	await Promise.all(workers);
	return ret;
}

async function translateAll(entries, targetLang) {
	if (MT_PROVIDER === "off") {
		return Object.fromEntries(entries.map(([ id, en ]) => [ id, en ]));
	}

	const doOne = async (en) => {
		const { safe, map } = protectAll(en);
		let out;
		if (MT_PROVIDER === "libre") out = await libreTranslateOne(safe, targetLang, "en");
		else if (MT_PROVIDER === "google") out = await googleTranslateOne(safe, targetLang);
		else out = safe;
		return restoreAll(out, map);
	};

	const results = await mapLimit(
		entries,
		3,
		async ([ id, en ]) => [ id, await doOne(en) ]
	);

	return Object.fromEntries(results);
}

// -------------- Main --------------
async function main() {
	const locales = process.argv.slice(2); // e.g. es ca (you can also pass en, it will be ignored for MT)
	const extracted = await readJsonSafe(EXTRACTED);
	if (!extracted) throw new Error(`Missing extracted file at ${EXTRACTED}`);

	// Normalize extracted → base English map
	const base = normalizeExtracted(extracted); // { id: defaultMessage }

	// ALWAYS sync English by copying to messages/en.json
	await writeJsonPretty(EN_OUT, base);
	console.log(`[i18n] synced ${EN_OUT} from extracted`);

	// If no other locales provided, we're done
	const targets = locales.filter(l => l.toLowerCase() !== "en");
	if (targets.length === 0) {
		console.log("[i18n] no target locales provided (besides en). Done.");
		return;
	}

	for (const locale of targets) {
		const outFile = path.join(LOCALES_DIR, `${locale}.json`);
		const existing = (await readJsonSafe(outFile)) || {};
		const missing = Object.entries(base).filter(([ id ]) => !(id in existing));

		let filled = {};
		if (missing.length) {
			console.log(`[i18n] ${locale}: ${missing.length} missing keys → MT=${MT_PROVIDER}`);
			try {
				filled = await translateAll(missing, locale);
			} catch (err) {
				console.warn(`[i18n] ${locale}: MT failed (${err?.message || err}). Falling back to English.`);
				filled = Object.fromEntries(missing.map(([ id, en ]) => [ id, en ]));
			}
		} else {
			console.log(`[i18n] ${locale}: up to date`);
		}

		const merged = { ...existing, ...filled };
		await writeJsonPretty(outFile, merged);
		console.log(`[i18n] wrote ${outFile}`);
	}
}

main().catch((e) => { console.error(e); process.exit(1); });
