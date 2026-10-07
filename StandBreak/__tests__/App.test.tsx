/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/notifications', () => ({}));
jest.mock('../src/purchase', () => ({
  initIAP: jest.fn().mockResolvedValue(undefined),
  endIAP: jest.fn().mockResolvedValue(undefined),
  listenToPurchases: jest.fn(),
}));

test('renders correctly', async () => {
  let app: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    app = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(async () => { app.unmount(); });
});
