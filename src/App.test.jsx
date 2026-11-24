import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  test('renders homepage title', () => {
    render(<App />);
    const titleElements = screen.getAllByText(/DYNAMITE/i);
    expect(titleElements.length).toBeGreaterThan(0);
  });

  test('renders home page content', () => {
    render(<App />);
    const homeElements = screen.getAllByText(/Home/i);
    expect(homeElements.length).toBeGreaterThan(0);
  });
});
