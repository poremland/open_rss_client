import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FeedItemCard from '../../app/components/FeedItemCard';
import { FeedItem } from '../../models/FeedItem';

describe('FeedItemCard', () => {
  const mockItem: FeedItem = {
    id: 1,
    title: 'Test Title',
    link: 'http://example.com',
    description: '<p>Test Description</p><img src="http://example.com/image.jpg" />',
	url: 'http://example.com',
	feed_id: 1,
	created_on_time: 0,
	status: 'unread',
  };

  it('renders the title, link, and description', () => {
    const { getByText } = render(
      <FeedItemCard item={mockItem} onPress={() => {}} onLongPress={() => {}} isItemSelected={false} />
    );

    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('http://example.com')).toBeTruthy();
    expect(getByText('Test Description')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <FeedItemCard item={mockItem} onPress={onPress} onLongPress={() => {}} isItemSelected={false} />
    );

    fireEvent.press(getByTestId('feed-item-1'));
    expect(onPress).toHaveBeenCalled();
  });

  it('calls onLongPress when long-pressed', () => {
    const onLongPress = jest.fn();
    const { getByTestId } = render(
      <FeedItemCard item={mockItem} onPress={() => {}} onLongPress={onLongPress} isItemSelected={false} />
    );

    fireEvent(getByTestId('feed-item-1'), 'longPress');
    expect(onLongPress).toHaveBeenCalled();
  });

  it('extracts and displays an image from the description', () => {
    const { getByTestId } = render(
      <FeedItemCard item={mockItem} onPress={() => {}} onLongPress={() => {}} isItemSelected={false} />
    );

    const image = getByTestId('feed-item-image');
    expect(image.props.source.uri).toBe('http://example.com/image.jpg');
  });

  it('does not display an image if there is no image in the description', () => {
    const itemWithoutImage: FeedItem = {
      ...mockItem,
      description: '<p>No image here</p>',
    };
    const { queryByTestId } = render(
      <FeedItemCard item={itemWithoutImage} onPress={() => {}} onLongPress={() => {}} isItemSelected={false} />
    );

    expect(queryByTestId('feed-item-image')).toBeNull();
  });

  it('applies the selected style when isItemSelected is true', () => {
    const { getByTestId } = render(
      <FeedItemCard item={mockItem} onPress={() => {}} onLongPress={() => {}} isItemSelected={true} />
    );

    const card = getByTestId('feed-item-1');
    const { StyleSheet } = require('react-native');
    const style = StyleSheet.flatten(card.props.style);
    expect(style.backgroundColor).toBe('lightblue');
  });
});
