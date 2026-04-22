/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import SearchHistory, {
	addItem,
	addQuery,
	clear,
	clearItems,
	clearQueries,
	getItems,
	getQueries,
} from '../../../src/main/resources/META-INF/resources/main/utils/searchHistory';

afterEach(() => {
	localStorage.clear();
});

describe('addQuery', () => {
	it('stores a new query with frequency 1', () => {
		addQuery('documents');

		const queries = getQueries();

		expect(queries).toHaveLength(1);
		expect(queries[0].text).toBe('documents');
		expect(queries[0].frequency).toBe(1);
	});

	it('ignores empty strings', () => {
		addQuery('');
		addQuery('   ');

		expect(getQueries()).toHaveLength(0);
	});

	it('trims surrounding whitespace before storing', () => {
		addQuery('  documents  ');

		expect(getQueries()[0].text).toBe('documents');
	});

	it('increments frequency when the same query is repeated', () => {
		addQuery('documents');
		addQuery('documents');
		addQuery('documents');

		const queries = getQueries();

		expect(queries).toHaveLength(1);
		expect(queries[0].frequency).toBe(3);
	});

	it('frequency increment is case-insensitive', () => {
		addQuery('Documents');
		addQuery('documents');

		const queries = getQueries();

		expect(queries).toHaveLength(1);
		expect(queries[0].frequency).toBe(2);
	});

	it('moves a repeated query to the front', () => {
		addQuery('blogs');
		addQuery('documents');
		addQuery('blogs');

		expect(getQueries()[0].text).toBe('blogs');
	});

	it('removes a shorter prefix query when a longer one is stored', () => {
		addQuery('docu');
		addQuery('documents');

		const queries = getQueries();

		expect(queries).toHaveLength(1);
		expect(queries[0].text).toBe('documents');
	});

	it('discards a new query that is a prefix of an existing longer query', () => {
		addQuery('documents');
		addQuery('docu');

		const queries = getQueries();

		expect(queries).toHaveLength(1);
		expect(queries[0].text).toBe('documents');
	});

	it('removes multiple shorter prefixes when a longer query is stored', () => {
		addQuery('do');
		addQuery('doc');
		addQuery('docu');
		addQuery('documents');

		const queries = getQueries();

		expect(queries).toHaveLength(1);
		expect(queries[0].text).toBe('documents');
	});

	it('keeps both queries when the shorter one ends at a word boundary', () => {
		addQuery('lego');
		addQuery('lego star wars');

		expect(getQueries()).toHaveLength(2);
	});

	it('keeps the shorter query when the longer one is added first', () => {
		addQuery('lego star wars');
		addQuery('lego');

		expect(getQueries()).toHaveLength(2);
	});

	it('still deduplicates a mid-word partial even in a multi-word context', () => {
		addQuery('lego s');
		addQuery('lego star wars');

		const queries = getQueries();

		expect(queries).toHaveLength(1);
		expect(queries[0].text).toBe('lego star wars');
	});

	it('stores unrelated queries independently', () => {
		addQuery('documents');
		addQuery('blogs');

		expect(getQueries()).toHaveLength(2);
	});

	it('records a timestamp on each entry', () => {
		const before = Date.now();

		addQuery('documents');

		const after = Date.now();
		const {timestamp} = getQueries()[0];

		expect(timestamp).toBeGreaterThanOrEqual(before);
		expect(timestamp).toBeLessThanOrEqual(after);
	});

	it('updates the timestamp when a repeated query is stored', () => {
		addQuery('documents');

		const firstTimestamp = getQueries()[0].timestamp;

		addQuery('documents');

		const secondTimestamp = getQueries()[0].timestamp;

		expect(secondTimestamp).toBeGreaterThanOrEqual(firstTimestamp);
	});

	it('caps stored queries at 20 entries', () => {
		const terms = [
			'alpha',
			'bravo',
			'charlie',
			'delta',
			'echo',
			'foxtrot',
			'golf',
			'hotel',
			'india',
			'juliet',
			'kilo',
			'lima',
			'mike',
			'november',
			'oscar',
			'papa',
			'quebec',
			'romeo',
			'sierra',
			'tango',
			'uniform',
			'victor',
			'whiskey',
			'xray',
			'yankee',
		];

		terms.forEach((term) => addQuery(term));

		expect(getQueries()).toHaveLength(20);
	});

	it('drops the oldest entries when the cap is reached', () => {
		const terms = [
			'alpha',
			'bravo',
			'charlie',
			'delta',
			'echo',
			'foxtrot',
			'golf',
			'hotel',
			'india',
			'juliet',
			'kilo',
			'lima',
			'mike',
			'november',
			'oscar',
			'papa',
			'quebec',
			'romeo',
			'sierra',
			'tango',
			'uniform',
		];

		terms.forEach((term) => addQuery(term));

		const texts = getQueries().map((q) => q.text);

		expect(texts).not.toContain('alpha');
	});
});

describe('addItem', () => {
	it('stores a new item with frequency 1', () => {
		addItem('http://localhost/doc', 'My Document');

		const items = getItems();

		expect(items).toHaveLength(1);
		expect(items[0].url).toBe('http://localhost/doc');
		expect(items[0].title).toBe('My Document');
		expect(items[0].frequency).toBe(1);
	});

	it('ignores calls with an empty url', () => {
		addItem('', 'My Document');

		expect(getItems()).toHaveLength(0);
	});

	it('ignores calls with an empty title', () => {
		addItem('http://localhost/doc', '');

		expect(getItems()).toHaveLength(0);
	});

	it('increments frequency when the same URL is visited again', () => {
		addItem('http://localhost/doc', 'My Document');
		addItem('http://localhost/doc', 'My Document');
		addItem('http://localhost/doc', 'My Document');

		const items = getItems();

		expect(items).toHaveLength(1);
		expect(items[0].frequency).toBe(3);
	});

	it('moves a revisited item to the front', () => {
		addItem('http://localhost/a', 'Item A');
		addItem('http://localhost/b', 'Item B');
		addItem('http://localhost/a', 'Item A');

		expect(getItems()[0].url).toBe('http://localhost/a');
	});

	it('updates the title when a URL is revisited with a different title', () => {
		addItem('http://localhost/doc', 'Old Title');
		addItem('http://localhost/doc', 'New Title');

		expect(getItems()[0].title).toBe('New Title');
	});

	it('records a timestamp on each entry', () => {
		const before = Date.now();

		addItem('http://localhost/doc', 'My Document');

		const after = Date.now();
		const {timestamp} = getItems()[0];

		expect(timestamp).toBeGreaterThanOrEqual(before);
		expect(timestamp).toBeLessThanOrEqual(after);
	});

	it('updates the timestamp when a URL is revisited', () => {
		addItem('http://localhost/doc', 'My Document');

		const firstTimestamp = getItems()[0].timestamp;

		addItem('http://localhost/doc', 'My Document');

		const secondTimestamp = getItems()[0].timestamp;

		expect(secondTimestamp).toBeGreaterThanOrEqual(firstTimestamp);
	});

	it('caps stored items at 20 entries', () => {
		for (let i = 0; i < 25; i++) {
			addItem(`http://localhost/${i}`, `Item ${i}`);
		}

		expect(getItems()).toHaveLength(20);
	});

	it('drops the oldest entries when the cap is reached', () => {
		for (let i = 0; i < 21; i++) {
			addItem(`http://localhost/${i}`, `Item ${i}`);
		}

		const urls = getItems().map((item) => item.url);

		expect(urls).not.toContain('http://localhost/0');
	});
});

describe('getQueries', () => {
	it('returns an empty array when nothing has been stored', () => {
		expect(getQueries()).toEqual([]);
	});

	it('returns queries most recent first', () => {
		addQuery('first');
		addQuery('second');
		addQuery('third');

		const texts = getQueries().map((q) => q.text);

		expect(texts).toEqual(['third', 'second', 'first']);
	});
});

describe('getItems', () => {
	it('returns an empty array when nothing has been stored', () => {
		expect(getItems()).toEqual([]);
	});

	it('returns items most recent first', () => {
		addItem('http://localhost/a', 'A');
		addItem('http://localhost/b', 'B');
		addItem('http://localhost/c', 'C');

		const urls = getItems().map((item) => item.url);

		expect(urls).toEqual([
			'http://localhost/c',
			'http://localhost/b',
			'http://localhost/a',
		]);
	});
});

describe('clearQueries', () => {
	it('removes all stored queries', () => {
		addQuery('documents');
		addQuery('blogs');

		clearQueries();

		expect(getQueries()).toEqual([]);
	});

	it('does not affect stored items', () => {
		addItem('http://localhost/doc', 'My Document');
		addQuery('documents');

		clearQueries();

		expect(getItems()).toHaveLength(1);
	});
});

describe('clearItems', () => {
	it('removes all stored items', () => {
		addItem('http://localhost/a', 'A');
		addItem('http://localhost/b', 'B');

		clearItems();

		expect(getItems()).toEqual([]);
	});

	it('does not affect stored queries', () => {
		addQuery('documents');
		addItem('http://localhost/doc', 'My Document');

		clearItems();

		expect(getQueries()).toHaveLength(1);
	});
});

describe('clear', () => {
	it('removes all stored queries and items', () => {
		addQuery('documents');
		addItem('http://localhost/doc', 'My Document');

		clear();

		expect(getQueries()).toEqual([]);
		expect(getItems()).toEqual([]);
	});
});

describe('default export', () => {
	it('exposes all named functions', () => {
		expect(SearchHistory.addItem).toBe(addItem);
		expect(SearchHistory.addQuery).toBe(addQuery);
		expect(SearchHistory.clear).toBe(clear);
		expect(SearchHistory.clearItems).toBe(clearItems);
		expect(SearchHistory.clearQueries).toBe(clearQueries);
		expect(SearchHistory.getItems).toBe(getItems);
		expect(SearchHistory.getQueries).toBe(getQueries);
	});
});
