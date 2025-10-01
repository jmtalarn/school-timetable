// filepath: src/dataLayer/exportImport.ts
import pako from 'pako'
import {
	type Kid,
	type Matter,
	type Timetable,
	type AppConfig,
	type Weekday,
	type TimeBlock,
	AllWeekdays,
} from "../types";
import { readDB, writeDB } from "./db";
import { ExportBundleSchema, type ExportBundle } from "./schemas";

/* ─────────────────────────────────────────────────────────────────────────────
   Base64url + compression helpers (browser-safe)
   ───────────────────────────────────────────────────────────────────────────── */

function bytesToBinaryString(bytes: Uint8Array): string {
	let s = "";
	const CHUNK = 0x8000;
	for (let i = 0; i < bytes.length; i += CHUNK) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		s += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as any);
	}
	return s;
}
function binaryStringToBytes(s: string): Uint8Array {
	const bytes = new Uint8Array(s.length);
	for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
	return bytes;
}
function b64urlEncodeBytes(bytes: Uint8Array): string {
	const b64 = btoa(bytesToBinaryString(bytes));
	return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlDecodeToBytes(s: string): Uint8Array {
	const mod = s.length % 4;
	const pad = mod === 2 ? "==" : mod === 3 ? "=" : "";
	const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
	const bin = atob(b64);
	return binaryStringToBytes(bin);
}
function compressToB64url(obj: unknown): string {
	const json = JSON.stringify(obj);
	const deflated = pako.deflate(json);
	return b64urlEncodeBytes(deflated);
}
function decompressFromB64url(s: string): unknown {
	const bytes = b64urlDecodeToBytes(s);
	const inflated = pako.inflate(bytes, { to: "string" }) as string;
	return JSON.parse(inflated);
}

/* ─────────────────────────────────────────────────────────────────────────────
   EXPORT: build bundle for selected kids
   ───────────────────────────────────────────────────────────────────────────── */

export function buildExportBundleForKids(kidIds: string[]): ExportBundle {
	const db = readDB();

	const selectedKids = db.kids.filter((k) => kidIds.includes(k.id));
	const selectedTimetables = db.timetables.filter((t) => kidIds.includes(t.kidId));

	// Only include matters actually referenced by those timetables
	const usedMatterIds = new Set<string>();
	for (const tt of selectedTimetables) {
		for (const blocks of Object.values(tt.days)) {
			for (const b of blocks) usedMatterIds.add(b.matterId);
		}
	}
	const selectedMatters = db.matters.filter((m) => usedMatterIds.has(m.id));

	const bundle: ExportBundle = {
		version: 2,
		matters: selectedMatters,
		kids: selectedKids,
		timetables: selectedTimetables,
		config: (db as any).config,
	};
	ExportBundleSchema.parse(bundle);
	return bundle;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHORT LINK FLOW (Netlify Function + Blobs)
   ───────────────────────────────────────────────────────────────────────────── */

// type PutReq = { v: 2; payload: string };
type PutRes = { ok: true; id: string } | { ok: false; error: string };
type GetRes =
	| { ok: true; v: 2; payload: string }
	| { ok: false; error: string };

/** Create a short import URL by storing the bundle in Netlify Blobs via /api/bundles. */
export async function createShortLinkForKids(
	kidIds: string[],
	baseUrl?: string
): Promise<string> {
	const bundle = buildExportBundleForKids(kidIds);
	const payload = compressToB64url(bundle);

	const res = await fetch("/api/bundles", {
		method: "POST",
		headers: { "content-type": "plain/text" },
		body: JSON.stringify(payload),
	});
	let data: PutRes | undefined;
	try {
		data = (await res.json()) as PutRes;
	} catch {
		// ignore
	}
	if (!res.ok || !data || data.ok !== true) {
		throw new Error(
			(data && "error" in data && data.error) || `Share failed (${res.status})`
		);
	}

	const importUrl = new URL(baseUrl ?? window.location.origin + "/import");
	importUrl.hash = `#id=${data.id}`;
	return importUrl.toString();
}

/** Resolve a stored bundle id (from #id=…) via the Netlify Function. */
export async function loadBundleById(id: string): Promise<ExportBundle> {
	const res = await fetch(`/api/bundles?id=${encodeURIComponent(id)}`);
	let data: GetRes | undefined;
	try {
		data = (await res.json()) as GetRes;
	} catch {
		// ignore
	}
	if (!res.ok || !data || data.ok !== true) {
		throw new Error(
			(data && "error" in data && data.error) || `Load failed (${res.status})`
		);
	}
	if (data.v !== 2) throw new Error("Unsupported bundle version");
	const obj = decompressFromB64url(data.payload);
	const bundle = ExportBundleSchema.parse(obj);
	return bundle;
}

/** Parse only short links: #id=… must be present; otherwise return error. */
export async function parseBundleFromURL(
	urlLike?: string
): Promise<{ ok: true; bundle: ExportBundle } | { ok: false; error: string }> {
	try {
		const url = new URL(urlLike ?? window.location.href);
		const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
		const params = new URLSearchParams(hash);
		const id = params.get("id");
		if (!id) return { ok: false, error: "No bundle id in link" };
		const bundle = await loadBundleById(id);
		return { ok: true, bundle };
	} catch (e: any) {
		return { ok: false, error: e?.message || "Invalid import link" };
	}
}

/** Share helper that creates the short link and prefers the native share sheet. */
export async function shareBundleForKids(kidIds: string[]) {
	const url = await createShortLinkForKids(kidIds);
	try {
		const nav: any = navigator;
		if (nav?.share) {
			await nav.share({
				title: "School Timetable",
				text: "Here’s my timetable export.",
				url,
			});
			return { ok: true };
		}
	} catch {
		// if user cancels / fails, fall through to clipboard
	}
	try {
		await navigator.clipboard.writeText(url);
		alert("Share link copied to clipboard.");
		return { ok: true };
	} catch {
		prompt("Copy this link:", url);
		return { ok: true };
	}
}

/* ─────────────────────────────────────────────────────────────────────────────
   IMPORT with merge options (robust & predictable)
   - Merge matters by *name* (case-insensitive); widen dates if needed.
   - Add kids by name (case-insensitive) or map to existing.
   - Replace timetable for the target kid (preserves extra fields from source).
   - Optionally widen scheduler hours in config.
   ───────────────────────────────────────────────────────────────────────────── */

export function importBundleWithOptions(
	bundle: ExportBundle,
	opts: {
		kidIds: string[];     // which kid IDs from the *bundle* to import
		applyConfig: boolean; // whether to widen config hours from the bundle
	}
): {
	kidsAdded: number;
	timetablesReplaced: number;
	mattersAdded: number;
	mattersUpdated: number;
	configUpdated: boolean;
} {
	const current = readDB();

	const norm = (s: string) => s.trim().toLowerCase();

	const kidsByName = new Map(current.kids.map((k) => [norm(k.name), k]));
	const kidsById = new Map(current.kids.map((k) => [k.id, k]));
	const mattersByName = new Map(current.matters.map((m) => [norm(m.name), m]));
	const mattersById = new Map(current.matters.map((m) => [m.id, m]));
	const timetablesByKidId = new Map(current.timetables.map((t) => [t.kidId, t]));

	// Filter to selected kids from the *bundle*
	const selectedKids = bundle.kids.filter((k) => opts.kidIds.includes(k.id));

	// Collect matters referenced by those kids' timetables
	const selectedKidIdSet = new Set(selectedKids.map((k) => k.id));
	const usedMatterIds = new Set<string>();
	for (const tb of bundle.timetables) {
		if (!selectedKidIdSet.has(tb.kidId)) continue;
		for (const blocks of Object.values(tb.days)) {
			for (const b of blocks) usedMatterIds.add(b.matterId);
		}
	}
	const incomingMattersMap = new Map(bundle.matters.map((m) => [m.id, m]));

	// Merge matters by name (widen dates)
	let mattersAdded = 0;
	let mattersUpdated = 0;
	const resolvedMatterId = new Map<string, string>(); // bundleId -> currentId
	for (const mid of usedMatterIds) {
		const inc = incomingMattersMap.get(mid);
		if (!inc) continue;

		const key = norm(inc.name);
		const existing = mattersByName.get(key);

		if (!existing) {
			// New matter (avoid id collisions)
			let newMatter: Matter = { ...inc };
			if (mattersById.has(newMatter.id)) {
				newMatter = { ...newMatter, id: `${newMatter.id}-${Date.now()}` };
			}
			current.matters.push(newMatter);
			mattersByName.set(key, newMatter);
			mattersById.set(newMatter.id, newMatter);
			resolvedMatterId.set(inc.id, newMatter.id);
			mattersAdded++;
		} else {
			let changed = false;
			const prevStart = existing.startDate ?? "";
			const prevEnd = existing.endDate ?? "";
			const nextStart = inc.startDate ?? prevStart;
			const nextEnd = inc.endDate ?? prevEnd;

			if (nextStart && (!prevStart || nextStart < prevStart)) {
				existing.startDate = nextStart;
				changed = true;
			}
			if (nextEnd && (!prevEnd || nextEnd > prevEnd)) {
				existing.endDate = nextEnd;
				changed = true;
			}
			if (changed) mattersUpdated++;
			resolvedMatterId.set(inc.id, existing.id);
		}
	}

	// Helper: remap timetable to target kid id + mapped matter ids, preserving extra fields
	const remapTimetable = (tb: Timetable, targetKidId: string): Timetable => {
		const remappedDays = AllWeekdays.reduce((acc, day) => {
			const inBlocks = tb.days[day] ?? [];
			acc[day] = inBlocks.map((b) => ({
				...b,
				matterId: resolvedMatterId.get(b.matterId) ?? b.matterId,
			}));
			return acc;
		}, {} as Record<Weekday, TimeBlock[]>);

		const { kidId: _drop, days: _dropDays, ...rest } = tb as any;
		const out: Timetable = {
			...rest,            // preserve any extra fields your schema may have
			kidId: targetKidId, // override
			days: remappedDays, // override
		};
		return out;
	};

	let kidsAdded = 0;
	let timetablesReplaced = 0;

	for (const incKid of selectedKids) {
		const key = norm(incKid.name);
		const existingKid = kidsByName.get(key);

		let targetKidId: string;
		if (!existingKid) {
			// Add kid (avoid id collisions)
			let newKid: Kid = { ...incKid };
			if (kidsById.has(newKid.id)) {
				newKid = { ...newKid, id: `${newKid.id}-${Date.now()}` };
			}
			current.kids.push(newKid);
			kidsByName.set(key, newKid);
			kidsById.set(newKid.id, newKid);
			targetKidId = newKid.id;
			kidsAdded++;
		} else {
			targetKidId = existingKid.id;
		}

		// Find that kid's timetable in the bundle
		const incomingTb = bundle.timetables.find((t) => t.kidId === incKid.id);
		if (incomingTb) {
			const remapped = remapTimetable(incomingTb, targetKidId);
			const existingIdx = current.timetables.findIndex((t) => t.kidId === targetKidId);
			if (existingIdx >= 0) {
				current.timetables[existingIdx] = remapped;
			} else {
				current.timetables.push(remapped);
			}
			timetablesByKidId.set(targetKidId, remapped);
			timetablesReplaced++;
		}
	}

	// Optionally widen config hours
	let configUpdated = false;
	if (opts.applyConfig && bundle.config) {
		const cur = (current as any).config as AppConfig | undefined;
		const inc = bundle.config as AppConfig;
		if (!cur) {
			(current as any).config = inc;
			configUpdated = true;
		} else {
			const next: AppConfig = { ...cur };
			if (inc.startHour && (!cur.startHour || inc.startHour < cur.startHour)) {
				next.startHour = inc.startHour;
			}
			if (inc.endHour && (!cur.endHour || inc.endHour > cur.endHour)) {
				next.endHour = inc.endHour;
			}
			if (next.startHour !== cur.startHour || next.endHour !== cur.endHour) {
				(current as any).config = next;
				configUpdated = true;
			}
		}
	}

	writeDB(() => current);
	return { kidsAdded, timetablesReplaced, mattersAdded, mattersUpdated, configUpdated };
}
