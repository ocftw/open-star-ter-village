/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ProjectCard } from '@/game/card';
import ProjectCardFace from './ProjectCardFace';

const card: ProjectCard = {
  id: 'p1', name: '一個非常非常長的專案名稱需要換行顯示而不是被截斷', type: '開放政府', difficulty: 3,
  description: '', requirements: { 美術設計: 4, 工程師: 8 },
};

test('shows difficulty stars, the name and one dl row per requirement', () => {
  render(<ProjectCardFace card={card} data-testid="face" />);
  const face = screen.getByTestId('face');
  expect(within(face).getByLabelText('難度 3').textContent).toBe('★★★');
  expect(within(face).getByRole('heading', { name: card.name })).toBeTruthy();
  const terms = Array.from(face.querySelectorAll('dt')).map((dt) => dt.textContent);
  const counts = Array.from(face.querySelectorAll('dd')).map((dd) => dd.textContent);
  expect(terms).toEqual(['美術設計', '工程師']);
  expect(counts).toEqual(['4', '8']);
  expect(face.querySelector('.project-card__type, .tag-en, svg, img')).toBeNull();
  expect(face.getAttribute('data-requirements')).toBe('美術設計,工程師');
  expect(JSON.parse(face.getAttribute('data-job-requirements')!)).toEqual({ 美術設計: 4, 工程師: 8 });
  expect(face.getAttribute('data-visual-state')).toBe('default');
  expect(face.classList.contains('project-card')).toBe(true);expect(face.classList.contains('project-card--compact')).toBe(true);expect(face.classList.contains('project-card--default')).toBe(true);;
});

test('without onClick the card has no tabindex, role or selection handler', () => {
  render(<ProjectCardFace card={card} data-testid="face" />);
  const face = screen.getByTestId('face');
  expect(face.hasAttribute('tabindex')).toBe(false);
  expect(face.hasAttribute('role')).toBe(false);
  expect(face.hasAttribute('aria-pressed')).toBe(false);
  fireEvent.keyDown(face, { key: 'Enter' });
  fireEvent.click(face);
  expect(face.getAttribute('data-visual-state')).toBe('default');
});

test('with onClick the card is a focusable button selected by click, Enter and Space', () => {
  const onClick = jest.fn();
  const { rerender } = render(<ProjectCardFace card={card} data-testid="face" onClick={onClick} />);
  const face = screen.getByTestId('face');
  expect(face.getAttribute('tabindex')).toBe('0');
  expect(face.getAttribute('role')).toBe('button');
  expect(face.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(face);
  fireEvent.keyDown(face, { key: 'Enter' });
  fireEvent.keyDown(face, { key: ' ' });
  fireEvent.keyDown(face, { key: 'a' });
  expect(onClick).toHaveBeenCalledTimes(3);
  rerender(<ProjectCardFace card={card} data-testid="face" onClick={onClick} selected />);
  expect(face.getAttribute('aria-pressed')).toBe('true');
  expect(face.getAttribute('data-visual-state')).toBe('focused');
  expect(face.classList.contains('project-card--focused')).toBe(true);;
});

test('profession picker rows are pressable targets that do not select the card', () => {
  const onClick = jest.fn();
  const onPick = jest.fn();
  render(
    <ProjectCardFace
      card={card}
      data-testid="face"
      onClick={onClick}
      professionPicker={{ eligibleJobNames: ['美術設計'], selectedJobName: '美術設計', onPick }}
    />,
  );
  const row = screen.getByTestId('profession-target-美術設計');
  expect(row.getAttribute('role')).toBe('button');
  expect(row.getAttribute('aria-pressed')).toBe('true');
  expect(screen.queryByTestId('profession-target-工程師')).toBeNull();
  fireEvent.click(row);
  fireEvent.keyDown(row, { key: 'Enter' });
  expect(onPick).toHaveBeenCalledTimes(2);
  expect(onPick).toHaveBeenCalledWith('美術設計');
  expect(onClick).not.toHaveBeenCalled();
});
