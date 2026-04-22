/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayButtonWithIcon} from '@clayui/button';
import ClayDropDown from '@clayui/drop-down';
import ClayIcon from '@clayui/icon';
import {SearchHistoryItem, SearchHistoryQuery, navigate} from 'frontend-js-web';
import React from 'react';

interface Props {
	inputValue: string;
	items: SearchHistoryItem[];
	onItemRemove: (url: string) => void;
	onItemsClear: () => void;
	onQueryRemove: (text: string) => void;
	onQuerySelect: (query: string) => void;
	queries: SearchHistoryQuery[];
}

function HighlightMatch({highlight, text}: {highlight: string; text: string}) {
	if (!highlight) {
		return <>{text}</>;
	}

	const index = text.toLowerCase().indexOf(highlight.toLowerCase());

	if (index === -1) {
		return <>{text}</>;
	}

	return (
		<>
			{text.slice(0, index)}
			<strong>{text.slice(index, index + highlight.length)}</strong>
			{text.slice(index + highlight.length)}
		</>
	);
}

function RemoveButton({onRemove}: {onRemove: () => void}) {
	return (
		<span className="pr-2">
			<ClayButtonWithIcon
				aria-label={Liferay.Language.get('remove')}
				displayType="unstyled"
				onClick={(event) => {
					event.stopPropagation();
					onRemove();
				}}
				size="sm"
				symbol="times"
			/>
		</span>
	);
}

function SearchHistoryDropdown({
	inputValue,
	items,
	onItemRemove,
	onItemsClear,
	onQueryRemove,
	onQuerySelect,
	queries,
}: Props) {
	return (
		<div
			className="dropdown-menu dropdown-menu-width-sm show w-100"
			data-canonical-name={Liferay.Language.get(
				'search-history-dropdown'
			)}
		>
			{!!items.length && (
				<>
					<li
						className="dropdown-subheader"
						data-canonical-name={Liferay.Language.get(
							'recently-visited'
						)}
					>
						{Liferay.Language.get('recently-visited')}
					</li>

					<ClayDropDown.ItemList>
						{items.map((item) => (
							<ClayDropDown.Item
								data-canonical-name={item.title}
								key={item.url}
								onClick={() => navigate(item.url)}
							>
								<span className="align-items-center d-flex w-100">
									<span className="mr-2">
										<ClayIcon symbol="link" />
									</span>

									<span className="flex-grow-1">
										<HighlightMatch
											highlight={inputValue}
											text={item.title}
										/>
									</span>

									<RemoveButton
										onRemove={() => onItemRemove(item.url)}
									/>
								</span>
							</ClayDropDown.Item>
						))}
					</ClayDropDown.ItemList>
				</>
			)}

			{!!items.length && !!queries.length && <ClayDropDown.Divider />}

			{!!queries.length && (
				<>
					<li
						className="dropdown-subheader"
						data-canonical-name={Liferay.Language.get(
							'recent-searches'
						)}
					>
						{Liferay.Language.get('recent-searches')}
					</li>

					<ClayDropDown.ItemList>
						{queries.map((query) => (
							<ClayDropDown.Item
								data-canonical-name={query.text}
								key={query.text}
								onClick={() => onQuerySelect(query.text)}
							>
								<span className="align-items-center d-flex w-100">
									<span className="mr-2">
										<ClayIcon symbol="time" />
									</span>

									<span className="flex-grow-1">
										<HighlightMatch
											highlight={inputValue}
											text={query.text}
										/>
									</span>

									<RemoveButton
										onRemove={() =>
											onQueryRemove(query.text)
										}
									/>
								</span>
							</ClayDropDown.Item>
						))}
					</ClayDropDown.ItemList>
				</>
			)}

			{items.length + queries.length >= 2 && (
				<>
					<ClayDropDown.Divider />

					<ClayDropDown.Item
						data-canonical-name={Liferay.Language.get('clear-all')}
						onClick={onItemsClear}
					>
						{Liferay.Language.get('clear-all')}
					</ClayDropDown.Item>
				</>
			)}
		</div>
	);
}

export default SearchHistoryDropdown;
