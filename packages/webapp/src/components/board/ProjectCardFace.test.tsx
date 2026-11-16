/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ProjectCardFace from './ProjectCardFace';
import type { ProjectCard } from '@/game';

const card = {
  id: 'p1',
  name: '資料申請小幫手',
  type: '開放資料',
  difficulty: 2,
  requirements: { 工程師: 2, 美術設計: 1 },
} as unknown as ProjectCard;

describe('ProjectCardFace (hand card)', () => {
  it('uses the floating teal ★ pill instead of the old in-card tag', () => {
    const { container } = render(<ProjectCardFace card={card} data-testid="hand" />);
    expect(screen.getByLabelText('難度 2').textContent).toBe('★★');
    expect(screen.getByLabelText('難度 2').classList.contains('project-card__star-pill')).toBe(true);
    expect(container.querySelector('.project-card__tag')).toBeNull();
    expect(container.querySelector('.project-card__stars')).toBeNull();
    // The type survives as a caption above the title, so no hole is left.
    expect(screen.getByText('開放資料')).toBeTruthy();
    expect(screen.getByRole('heading', { name: card.name })).toBeTruthy();
  });

  it('selected keeps the focused (orange ring) state and still selects on click', () => {
    const onClick = jest.fn();
    render(<ProjectCardFace card={card} selected onClick={onClick} data-testid="hand" />);
    const face = screen.getByTestId('hand');
    expect(face.getAttribute('data-visual-state')).toBe('focused');
    fireEvent.click(face);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled dims the card and ignores clicks', () => {
    const onClick = jest.fn();
    render(<ProjectCardFace card={card} disabled onClick={onClick} data-testid="hand" />);
    const face = screen.getByTestId('hand');
    expect(face.getAttribute('data-visual-state')).toBe('disabled');
    fireEvent.click(face);
    expect(onClick).not.toHaveBeenCalled();
  });
});
