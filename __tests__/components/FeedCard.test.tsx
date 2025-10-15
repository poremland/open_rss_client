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
