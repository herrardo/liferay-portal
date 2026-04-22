/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect, mergeTests} from '@playwright/test';

import {loginTest} from '../../../fixtures/loginTest';
import {getRandomInt} from '../../../utils/getRandomInt';
import {cmsPagesTest} from './fixtures/cmsPagesTest';

const STORAGE_KEY_ITEMS = 'LFR_SEARCH_HISTORY_ITEMS';
const STORAGE_KEY_QUERIES = 'LFR_SEARCH_HISTORY_QUERIES';

const test = mergeTests(cmsPagesTest, loginTest());

test.beforeEach(async ({contentsPage, page}) => {
	await contentsPage.goto();

	await page.evaluate(
		([keyQueries, keyItems]) => {
			localStorage.removeItem(keyQueries);
			localStorage.removeItem(keyItems);
		},
		[STORAGE_KEY_QUERIES, STORAGE_KEY_ITEMS]
	);
});

test('Clicking a content title link adds it to Recently Visited', async ({
	contentsPage,
}) => {
	const title = `Test Article ${getRandomInt()}`;

	await test.step('Create a basic web content', async () => {
		await contentsPage.createContent('Basic Web Content');

		await contentsPage.fillData([{label: 'Title', value: title}]);

		await contentsPage.saveContent();
	});

	await test.step('Click the content title link', async () => {
		await contentsPage.clickContentLink(title);
	});

	await test.step('Navigate back to the contents list', async () => {
		await contentsPage.goto();
	});

	await test.step('Verify the item appears under Recently Visited', async () => {
		await contentsPage.searchHistoryDropdown.searchInput.click();

		await expect(
			contentsPage.searchHistoryDropdown.recentlyVisitedHeader
		).toBeVisible();

		await expect(
			contentsPage.searchHistoryDropdown.visitedItems.filter({
				hasText: title,
			})
		).toBeVisible();
	});
});

test('Clicking a folder link adds it to Recently Visited', async ({
	contentsPage,
}) => {
	const folderName = `Test Folder ${getRandomInt()}`;

	await test.step('Create a folder', async () => {
		await contentsPage.createFolder(folderName);
	});

	await test.step('Click the folder title link', async () => {
		await contentsPage.clickContentLink(folderName);
	});

	await test.step('Navigate back to the contents list', async () => {
		await contentsPage.goto();
	});

	await test.step('Verify the folder appears under Recently Visited', async () => {
		await contentsPage.searchHistoryDropdown.searchInput.click();

		await expect(
			contentsPage.searchHistoryDropdown.recentlyVisitedHeader
		).toBeVisible();

		await expect(
			contentsPage.searchHistoryDropdown.visitedItems.filter({
				hasText: folderName,
			})
		).toBeVisible();
	});
});

test('Clicking a kebab menu action does not add the item to Recently Visited', async ({
	contentsPage,
}) => {
	const title = `Test Article ${getRandomInt()}`;

	await test.step('Create a basic web content', async () => {
		await contentsPage.createContent('Basic Web Content');

		await contentsPage.fillData([{label: 'Title', value: title}]);

		await contentsPage.saveContent();
	});

	await test.step('Open the content via the Edit kebab action', async () => {
		await contentsPage.editContent(title);
	});

	await test.step('Navigate back to the contents list', async () => {
		await contentsPage.goto();
	});

	await test.step('Verify the item does NOT appear under Recently Visited', async () => {
		await contentsPage.searchHistoryDropdown.searchInput.click();

		await expect(
			contentsPage.searchHistoryDropdown.container
		).not.toBeVisible();
	});
});
