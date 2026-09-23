/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import RulesPage from './page';

describe('rules guide', () => {
  it('links to the guide from the home page and header', () => {
    render(<Home />);

    expect(screen.getByRole('link', { name: /如何遊玩/ }).getAttribute('href')).toBe('/rules');
    expect(screen.getByRole('link', { name: /規則 Rules/ }).getAttribute('href')).toBe('/rules');
  });

  it('explains the online game flow and scoring', () => {
    render(<RulesPage />);

    expect(screen.getByRole('heading', { name: '一起玩開源星手村' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '每輪怎麼進行' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '遊戲結束時' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '開始遊戲 · Play online' }).getAttribute('href')).toBe('/lobby');
  });
});
