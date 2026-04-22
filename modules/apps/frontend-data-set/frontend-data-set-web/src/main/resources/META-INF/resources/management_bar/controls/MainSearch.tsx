/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayButtonWithIcon} from '@clayui/button';
import {ClayInput} from '@clayui/form';
import {
	addSearchHistoryQuery,
	clearSearchHistoryItems,
	clearSearchHistoryQueries,
	getSearchHistoryItems,
	getSearchHistoryQueries,
	removeSearchHistoryItem,
	removeSearchHistoryQuery,
} from 'frontend-js-web';
import React, {useContext, useEffect, useReducer, useState} from 'react';

import FrontendDataSetContext from '../../FrontendDataSetContext';
import SearchHistoryDropdown from './SearchHistoryDropdown';

const CONTAINER_ATTR = 'data-search-history-container';

function MainSearch({onClear}: {onClear: () => void}) {
	const {apiURL, appURL, onSearch, searchParam} = useContext(
		FrontendDataSetContext
	);

	const [dropdownActive, setDropdownActive] = useState(false);
	const [, forceUpdate] = useReducer((n: number) => n + 1, 0);
	const [inputValue, setInputValue] = useState(searchParam || '');

	useEffect(() => {
		setInputValue(searchParam || '');
	}, [searchParam]);

	useEffect(() => {
		const handleMouseDown = (event: MouseEvent) => {
			const target = event.target as Element;

			if (!target.closest(`[${CONTAINER_ATTR}]`)) {
				setDropdownActive(false);
			}
		};

		document.addEventListener('mousedown', handleMouseDown);

		return () => document.removeEventListener('mousedown', handleMouseDown);
	}, []);

	const allQueries = getSearchHistoryQueries();
	const allItems = getSearchHistoryItems();

	const filteredQueries = inputValue
		? allQueries.filter((q) =>
				q.text.toLowerCase().includes(inputValue.toLowerCase())
			)
		: allQueries;

	const filteredItems = inputValue
		? allItems.filter((item) =>
				item.title.toLowerCase().includes(inputValue.toLowerCase())
			)
		: allItems;

	const hasHistory = !!filteredQueries.length || !!filteredItems.length;

	function handleQuerySelect(query: string) {
		setInputValue(query);
		setDropdownActive(false);
		addSearchHistoryQuery(query);
		onSearch({query});
	}

	function handleQueryRemove(text: string) {
		removeSearchHistoryQuery(text);
		forceUpdate();
	}

	function handleItemRemove(url: string) {
		removeSearchHistoryItem(url);
		forceUpdate();
	}

	function handleItemsClear() {
		clearSearchHistoryItems();
		clearSearchHistoryQueries();
		forceUpdate();
	}

	return (
		<ClayInput.Group {...{[CONTAINER_ATTR]: true}}>
			<ClayInput.GroupItem>
				<ClayInput
					aria-label={Liferay.Language.get('search')}
					className="input-group-inset input-group-inset-after"
					onChange={(event) => {
						const value = event.target.value;

						setInputValue(value);
						setDropdownActive(true);

						if (!value) {
							onClear();
						}

						if (!apiURL && !appURL) {
							onSearch({query: value});
						}
					}}
					onFocus={() => setDropdownActive(true)}
					onKeyDown={(event) => {
						if (event.key === 'Enter' && (apiURL || appURL)) {
							event.preventDefault();

							addSearchHistoryQuery(inputValue);

							onSearch({query: inputValue});

							setDropdownActive(false);
						}
						else if (event.key === 'Escape') {
							setDropdownActive(false);
						}
					}}
					placeholder={Liferay.Language.get('search')}
					type="search"
					value={inputValue}
				/>

				<ClayInput.GroupInsetItem after tag="div">
					<ClayButtonWithIcon
						aria-label={Liferay.Language.get('search')}
						displayType="unstyled"
						monospaced={false}
						onClick={(event) => {
							event.preventDefault();

							addSearchHistoryQuery(inputValue);

							onSearch({query: inputValue});

							setDropdownActive(false);
						}}
						symbol="search"
						type="submit"
					/>
				</ClayInput.GroupInsetItem>
			</ClayInput.GroupItem>

			{dropdownActive && hasHistory && (
				<SearchHistoryDropdown
					inputValue={inputValue}
					items={filteredItems}
					onItemRemove={handleItemRemove}
					onItemsClear={handleItemsClear}
					onQueryRemove={handleQueryRemove}
					onQuerySelect={handleQuerySelect}
					queries={filteredQueries}
				/>
			)}
		</ClayInput.Group>
	);
}

export default MainSearch;
