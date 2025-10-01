// utils/base64.ts
export function decodeBase64UrlToString(input: string): string {
	if (!input) throw new Error('Empty Base64 string');

	// If someone pasted raw JSON, just return it.
	const trimmed = input.trim();
	if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
		return trimmed;
	}

	// Normalize URL-safe/Base64 and common transport issues
	let b64 = trimmed
		.replace(/\s+/g, '')     // remove whitespace/newlines
		.replace(/ /g, '+')      // URLSearchParams may turn + into space
		.replace(/-/g, '+')      // base64url -> base64
		.replace(/_/g, '/');     // base64url -> base64

	// Re-pad
	while (b64.length % 4 !== 0) b64 += '=';

	// Decode to bytes, then to UTF-8 text
	const binary = atob(b64);
	const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
	return new TextDecoder().decode(bytes);
}

export function decodeBase64UrlJSON<T = unknown>(input: string): T {
	const text = decodeBase64UrlToString(input);
	try {
		return JSON.parse(text) as T;
	} catch {
		// If the payload was URI-encoded JSON instead of base64, try that
		const maybe = decodeURIComponentSafe(text);
		return JSON.parse(maybe) as T;
	}
}
export function encodeJSONToBase64Url(obj: unknown): string {
	const bytes = new TextEncoder().encode(JSON.stringify(obj));
	const b64 = btoa(String.fromCharCode(...bytes));
	return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeURIComponentSafe(s: string): string {
	try { return decodeURIComponent(s); } catch { return s; }
}
