/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect, mergeTests} from '@playwright/test';

import {apiHelpersTest} from '../../../../../fixtures/apiHelpersTest';
import {featureFlagsTest} from '../../../../../fixtures/featureFlagsTest';
import {isolatedSiteTest} from '../../../../../fixtures/isolatedSiteTest';
import {loginTest} from '../../../../../fixtures/loginTest';
import {waitForFDS} from '../../../../../utils/waitFor';
import {fdsSamplePageTest} from '../../fixtures/fdsSamplePageTest';

const STORAGE_KEY_ITEMS = 'LFR_SEARCH_HISTORY_ITEMS';
const STORAGE_KEY_QUERIES = 'LFR_SEARCH_HISTORY_QUERIES';

const test = mergeTests(
	apiHelpersTest,
	fdsSamplePageTest,
	featureFlagsTest({
		'LPS-178052': {enabled: true},
	}),
	isolatedSiteTest,
	loginTest()
);

test.beforeEach(async ({fdsSamplePage, page, site}) => {
	await fdsSamplePage.setupFDSSampleWidget({
		fragmentKeys: ['advanced-search-fds-sample'],
		site,
	});

	await fdsSamplePage.selectTab('Advanced');

	await waitForFDS({page});

	await page.evaluate(
		([keyQueries, keyItems]) => {
			localStorage.removeItem(keyQueries);
			localStorage.removeItem(keyItems);
		},
		[STORAGE_KEY_QUERIES, STORAGE_KEY_ITEMS]
	);
});

test('Dropdown is not visible when search history is empty', async ({
	fdsSamplePage,
}) => {
	await fdsSamplePage.managementToolbar.searchInput.click();

	await expect(
		fdsSamplePage.managementToolbar.searchHistoryDropdown.container
	).not.toBeVisible();
});

test('Query is saved and shown in dropdown after searching', async ({
	fdsSamplePage,
	page,
}) => {
	await fdsSamplePage.managementToolbar.searchInput.fill('Sample55');

	await fdsSamplePage.managementToolbar.searchInput.press('Enter');

	await waitForFDS({page});

	await page.click('body');

	await fdsSamplePage.managementToolbar.searchInput.click();

	await expect(
		fdsSamplePage.managementToolbar.searchHistoryDropdown.container
	).toBeVisible();

	await expect(
		fdsSamplePage.managementToolbar.searchHistoryDropdown.queryItems.filter(
			{hasText: 'Sample55'}
		)
	).toBeVisible();
});

test('Query is saved after clicking the search button', async ({
	fdsSamplePage,
	page,
}) => {
	await fdsSamplePage.managementToolbar.searchInput.fill('Sample10');

	await fdsSamplePage.managementToolbar.searchButton.click();

	await waitForFDS({page});

	await page.click('body');

	await fdsSamplePage.managementToolbar.searchInput.click();

	await expect(
		fdsSamplePage.managementToolbar.searchHistoryDropdown.queryItems.filter(
			{hasText: 'Sample10'}
		)
	).toBeVisible();
});

test('Selecting a query from the dropdown triggers the search', async ({
	fdsSamplePage,
	page,
}) => {
	await page.evaluate(
		([key]) => {
			localStorage.setItem(
				key,
				JSON.stringify([
					{frequency: 1, text: 'Sample55', timestamp: Date.now()},
				])
			);
		},
		[STORAGE_KEY_QUERIES]
	);

	await fdsSamplePage.managementToolbar.searchInput.click();

	await fdsSamplePage.managementToolbar.searchHistoryDropdown.queryItems
		.filter({hasText: 'Sample55'})
		.click();

	await waitForFDS({page});

	await expect(fdsSamplePage.table.bodyRows).toHaveCount(1);

	await expect(
		fdsSamplePage.managementToolbar.searchHistoryDropdown.container
	).not.toBeVisible();
});

test('Partial-match input highlights the matching substring in query text', async ({
	fdsSamplePage,
	page,
}) => {
	await page.evaluate(
		([key]) => {
			localStorage.setItem(
				key,
				JSON.stringify([
					{frequency: 1, text: 'Sample55', timestamp: Date.now()},
				])
			);
		},
		[STORAGE_KEY_QUERIES]
	);

	await fdsSamplePage.managementToolbar.searchInput.fill('Sam');

	await expect(
		fdsSamplePage.managementToolbar.searchHistoryDropdown.container
	).toBeVisible();

	await expect(
		fdsSamplePage.managementToolbar.searchHistoryDropdown.queryItems
			.filter({hasText: 'Sample55'})
			.locator('strong')
	).toHaveText('Sam');
});

test('Removing an individual query removes only that entry', async ({
	fdsSamplePage,
	page,
}) => {
	await page.evaluate(
		([key]) => {
			localStorage.setItem(
				key,
				JSON.stringify([
					{frequency: 1, text: 'Sample55', timestamp: Date.now()},
					{frequency: 1, text: 'Sample10', timestamp: Date.now()},
				])
			);
		},
		[STORAGE_KEY_QUERIES]
	);

	await fdsSamplePage.managementToolbar.searchInput.click();

	const itemToRemove =
		fdsSamplePage.managementToolbar.searchHistoryDropdown.queryItems.filter(
			{hasText: 'Sample55'}
		);

	await itemToRemove.getByRole('button', {name: 'remove'}).click();

	await expect(itemToRemove).not.toBeVisible();

	await expect(
		fdsSamplePage.managementToolbar.searchHistoryDropdown.queryItems.filter(
			{hasText: 'Sample10'}
		)
	).toBeVisible();
});

test('Recent Searches section is hidden after removing the last query', async ({
	fdsSamplePage,
	page,
}) => {
	await page.evaluate(
		([key]) => {
			localStorage.setItem(
				key,
				JSON.stringify([
					{frequency: 1, text: 'Sample55', timestamp: Date.now()},
				])
			);
		},
		[STORAGE_KEY_QUERIES]
	);

	await fdsSamplePage.managementToolbar.searchInput.click();

	await fdsSamplePage.managementToolbar.searchHistoryDropdown.queryItems
		.filter({hasText: 'Sample55'})
		.getByRole('button', {name: 'remove'})
		.click();

	await expect(
		fdsSamplePage.managementToolbar.searchHistoryDropdown
			.recentSearchesHeader
	).not.toBeVisible();
});

test('Clear All is not shown when there is only one history entry', async ({
	fdsSamplePage,
	page,
}) => {
	await page.evaluate(
		([key]) => {
			localStorage.setItem(
				key,
				JSON.stringify([
					{frequency: 1, text: 'Sample55', timestamp: Date.now()},
				])
			);
		},
		[STORAGE_KEY_QUERIES]
	);

	await fdsSamplePage.managementToolbar.searchInput.click();

	await expect(
		fdsSamplePage.managementToolbar.searchHistoryDropdown.clearAllButton
	).not.toBeVisible();
});

test('Clear All is shown when there are two or more history entries', async ({
	fdsSamplePage,
	page,
}) => {
	await page.evaluate(
		([key]) => {
			localStorage.setItem(
				key,
				JSON.stringify([
					{frequency: 1, text: 'Sample55', timestamp: Date.now()},
					{frequency: 1, text: 'Sample10', timestamp: Date.now()},
				])
			);
		},
		[STORAGE_KEY_QUERIES]
	);

	await fdsSamplePage.managementToolbar.searchInput.click();

	await expect(
		fdsSamplePage.managementToolbar.searchHistoryDropdown.clearAllButton
	).toBeVisible();
});

test('Clear All removes all queries and items', async ({
	fdsSamplePage,
	page,
}) => {
	await page.evaluate(
		([keyQueries, keyItems]) => {
			localStorage.setItem(
				keyQueries,
				JSON.stringify([
					{frequency: 1, text: 'Sample55', timestamp: Date.now()},
				])
			);
			localStorage.setItem(
				keyItems,
				JSON.stringify([
					{
						frequency: 1,
						timestamp: Date.now(),
						title: 'Sample Item',
						url: '/some-url',
					},
				])
			);
		},
		[STORAGE_KEY_QUERIES, STORAGE_KEY_ITEMS]
	);

	await fdsSamplePage.managementToolbar.searchInput.click();

	await fdsSamplePage.managementToolbar.searchHistoryDropdown.clearAllButton.click();

	await fdsSamplePage.managementToolbar.searchInput.click();

	await expect(
		fdsSamplePage.managementToolbar.searchHistoryDropdown.container
	).not.toBeVisible();
});

test('Dropdown closes when clicking outside the search container', async ({
	fdsSamplePage,
	page,
}) => {
	await page.evaluate(
		([key]) => {
			localStorage.setItem(
				key,
				JSON.stringify([
					{frequency: 1, text: 'Sample55', timestamp: Date.now()},
				])
			);
		},
		[STORAGE_KEY_QUERIES]
	);

	await fdsSamplePage.managementToolbar.searchInput.click();

	await expect(
		fdsSamplePage.managementToolbar.searchHistoryDropdown.container
	).toBeVisible();

	await page.click('body');

	await expect(
		fdsSamplePage.managementToolbar.searchHistoryDropdown.container
	).not.toBeVisible();
});

test('Dropdown closes on Escape key', async ({fdsSamplePage, page}) => {
	await page.evaluate(
		([key]) => {
			localStorage.setItem(
				key,
				JSON.stringify([
					{frequency: 1, text: 'Sample55', timestamp: Date.now()},
				])
			);
		},
		[STORAGE_KEY_QUERIES]
	);

	await fdsSamplePage.managementToolbar.searchInput.click();

	await expect(
		fdsSamplePage.managementToolbar.searchHistoryDropdown.container
	).toBeVisible();

	await page.keyboard.press('Escape');

	await expect(
		fdsSamplePage.managementToolbar.searchHistoryDropdown.container
	).not.toBeVisible();
});

test('Recently Visited section appears before Recent Searches section', async ({
	fdsSamplePage,
	page,
}) => {
	await page.evaluate(
		([keyQueries, keyItems]) => {
			localStorage.setItem(
				keyQueries,
				JSON.stringify([
					{frequency: 1, text: 'Sample55', timestamp: Date.now()},
				])
			);
			localStorage.setItem(
				keyItems,
				JSON.stringify([
					{
						frequency: 1,
						timestamp: Date.now(),
						title: 'Sample Item',
						url: '/some-url',
					},
				])
			);
		},
		[STORAGE_KEY_QUERIES, STORAGE_KEY_ITEMS]
	);

	await fdsSamplePage.managementToolbar.searchInput.click();

	const dropdown =
		fdsSamplePage.managementToolbar.searchHistoryDropdown.container;

	const visitedIndex = await dropdown
		.locator('[data-canonical-name="Recently Visited"]')
		.evaluate((element) => {
			const siblings = Array.from(element.parentElement!.children);

			return siblings.indexOf(element);
		});

	const searchesIndex = await dropdown
		.locator('[data-canonical-name="Recent Searches"]')
		.evaluate((element) => {
			const siblings = Array.from(element.parentElement!.children);

			return siblings.indexOf(element);
		});

	expect(visitedIndex).toBeLessThan(searchesIndex);
});
