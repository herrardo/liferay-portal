/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

const STORAGE_KEY_QUERIES = 'LFR_SEARCH_HISTORY_QUERIES';
const STORAGE_KEY_ITEMS = 'LFR_SEARCH_HISTORY_ITEMS';
const MAX_ENTRIES = 20;

export interface SearchHistoryItem {
	frequency: number;
	timestamp: number;
	title: string;
	url: string;
}

export interface SearchHistoryQuery {
	frequency: number;
	text: string;
	timestamp: number;
}

function readStorage<T>(key: string): T[] {
	try {
		const raw = localStorage.getItem(key);

		return raw ? (JSON.parse(raw) as T[]) : [];
	}
	catch {
		return [];
	}
}

function writeStorage<T>(key: string, entries: T[]): void {
	try {
		localStorage.setItem(key, JSON.stringify(entries));
	}
	catch {

		// Storage may be unavailable (private mode, quota exceeded, etc.)

	}
}

/**
 * Returns true when `full` is a within-word continuation of `prefix` —
 * i.e., `full` starts with `prefix` and the very next character is a
 * non-space (the user was still typing the same word).
 *
 * "docu" → "documents" : true  (same partial word)
 * "lego" → "lego star wars" : false (lego ends at a word boundary)
 */
function continuesWord(prefix: string, full: string): boolean {
	return full.startsWith(prefix) && full[prefix.length] !== ' ';
}

/**
 * Stores a search query in localStorage.
 *
 * Applies within-word prefix deduplication: if the new query extends a stored
 * query within the same word (e.g. "docu" → "documents"), the shorter entry is
 * replaced. Queries that share only a word-boundary prefix are kept as separate
 * entries because they represent different intents (e.g. "lego" and
 * "lego star wars" are both stored).
 *
 * @param text The search query string to store
 */
export function addQuery(text: string): void {
	const normalized = text.trim();

	if (!normalized) {
		return;
	}

	const lower = normalized.toLowerCase();
	const existing = readStorage<SearchHistoryQuery>(STORAGE_KEY_QUERIES);

	// Discard new query if a stored query is a within-word continuation of it
	// (stored is a longer completion of the same partial word).
	// Word-boundary prefixes like "lego" vs "lego star wars" are kept.

	const subsumedByExisting = existing.some((entry) => {
		const storedLower = entry.text.toLowerCase();

		return storedLower !== lower && continuesWord(lower, storedLower);
	});

	if (subsumedByExisting) {
		return;
	}

	// Remove stored queries that are within-word prefixes of the new query
	// (the user continued typing the same word). Exact matches are kept for
	// frequency tracking. Word-boundary prefixes like "lego" are not removed.

	const filtered = existing.filter((entry) => {
		const storedLower = entry.text.toLowerCase();

		return storedLower === lower || !continuesWord(storedLower, lower);
	});

	const exactMatch = filtered.find(
		(entry) => entry.text.toLowerCase() === lower
	);

	const deduped = filtered.filter(
		(entry) => entry.text.toLowerCase() !== lower
	);

	const updated: SearchHistoryQuery[] = [
		{
			frequency: exactMatch ? exactMatch.frequency + 1 : 1,
			text: normalized,
			timestamp: Date.now(),
		},
		...deduped,
	].slice(0, MAX_ENTRIES);

	writeStorage(STORAGE_KEY_QUERIES, updated);
}

/**
 * Stores a visited search result item in localStorage.
 * Items are deduplicated by URL; revisiting an item moves it to the front.
 *
 * @param url The URL of the visited item
 * @param title Human-readable label for the item
 */
export function addItem(url: string, title: string): void {
	if (!url || !title) {
		return;
	}

	const existing = readStorage<SearchHistoryItem>(STORAGE_KEY_ITEMS);

	const exactMatch = existing.find((entry) => entry.url === url);

	const deduped = existing.filter((entry) => entry.url !== url);

	const updated: SearchHistoryItem[] = [
		{
			frequency: exactMatch ? exactMatch.frequency + 1 : 1,
			timestamp: Date.now(),
			title,
			url,
		},
		...deduped,
	].slice(0, MAX_ENTRIES);

	writeStorage(STORAGE_KEY_ITEMS, updated);
}

/**
 * Returns stored search queries, most recent first.
 */
export function getQueries(): SearchHistoryQuery[] {
	return readStorage<SearchHistoryQuery>(STORAGE_KEY_QUERIES);
}

/**
 * Returns stored visited items, most recent first.
 */
export function getItems(): SearchHistoryItem[] {
	return readStorage<SearchHistoryItem>(STORAGE_KEY_ITEMS);
}

/**
 * Removes all stored search queries.
 */
export function clearQueries(): void {
	try {
		localStorage.removeItem(STORAGE_KEY_QUERIES);
	}
	catch {

		// noop

	}
}

/**
 * Removes a single search query by text.
 */
export function removeQuery(text: string): void {
	const normalized = text.trim().toLowerCase();
	const existing = readStorage<SearchHistoryQuery>(STORAGE_KEY_QUERIES);

	writeStorage(
		STORAGE_KEY_QUERIES,
		existing.filter((entry) => entry.text.toLowerCase() !== normalized)
	);
}

/**
 * Removes a single visited item by URL.
 */
export function removeItem(url: string): void {
	const existing = readStorage<SearchHistoryItem>(STORAGE_KEY_ITEMS);

	writeStorage(
		STORAGE_KEY_ITEMS,
		existing.filter((entry) => entry.url !== url)
	);
}

/**
 * Removes all stored visited items.
 */
export function clearItems(): void {
	try {
		localStorage.removeItem(STORAGE_KEY_ITEMS);
	}
	catch {

		// noop

	}
}

/**
 * Removes all stored search history (queries and items).
 */
export function clear(): void {
	clearQueries();
	clearItems();
}

const SearchHistory = {
	addItem,
	addQuery,
	clear,
	clearItems,
	clearQueries,
	getItems,
	getQueries,
	removeItem,
	removeQuery,
};

export default SearchHistory;
