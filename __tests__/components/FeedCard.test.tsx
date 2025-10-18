/*
 * RSS Reader: A mobile application for consuming RSS feeds.
 * Copyright (C) 2025 Paul Oremland
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FeedCard from '../../app/components/FeedCard';
import { Feed } from '../../models/Feed';

describe('FeedCard', () => {
  const mockItem: Feed = {
    id: 1,
    name: 'Test Feed',
    url: 'http://example.com/rss',
    count: 10,
	created_on: "",
	last_fetched: "",
	icon: null,
  };

  it('renders the feed name and unread count', () => {
    const { getByText } = render(
      <FeedCard item={mockItem} onPress={() => {}} onLongPress={() => {}} />
    );

    expect(getByText('Test Feed')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <FeedCard item={mockItem} onPress={onPress} onLongPress={() => {}} />
    );

    fireEvent.press(getByText('Test Feed'));
    expect(onPress).toHaveBeenCalled();
  });

  it('calls onLongPress when long-pressed', () => {
    const onLongPress = jest.fn();
    const { getByText } = render(
      <FeedCard item={mockItem} onPress={() => {}} onLongPress={onLongPress} />
    );

    fireEvent(getByText('Test Feed'), 'longPress');
    expect(onLongPress).toHaveBeenCalled();
  });
});