import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PersonaSelection, { DEFAULT_PERSONAS_FOR_SELECTION } from '../PersonaSelection.jsx';

const [founderPersona, freelancerPersona, talentPersona] = DEFAULT_PERSONAS_FOR_SELECTION;

describe('PersonaSelection', () => {
  it('renders hero imagery, metrics, and benefits for each persona card', () => {
    render(<PersonaSelection personas={[founderPersona]} />);

    expect(screen.getByRole('heading', { name: founderPersona.title })).toBeInTheDocument();
    expect(screen.getByText(founderPersona.subtitle)).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: founderPersona.heroMedia.alt || `${founderPersona.title} hero` }),
    ).toBeInTheDocument();
    expect(screen.getByText(founderPersona.metrics[0].label)).toBeInTheDocument();
    expect(screen.getByText(founderPersona.metrics[0].value)).toBeInTheDocument();
    expect(screen.getByText(founderPersona.signatureMoments[0].label)).toBeInTheDocument();
    expect(screen.getByText(founderPersona.recommendedModules[0])).toBeInTheDocument();
  });

  it('notifies parent components when personas are previewed or selected', async () => {
    const onPreview = vi.fn();
    const onChange = vi.fn();
    const personas = [founderPersona, freelancerPersona];

    render(<PersonaSelection personas={personas} onPreview={onPreview} onChange={onChange} />);

    const freelancerCard = screen.getByRole('button', { name: new RegExp(freelancerPersona.title, 'i') });
    await userEvent.hover(freelancerCard);
    expect(onPreview).toHaveBeenCalledWith(personas[1]);

    await userEvent.click(freelancerCard);
    expect(onChange).toHaveBeenCalledWith(freelancerPersona.id, personas[1]);
  });

  it('highlights the selected persona and respects disabled states', async () => {
    const onChange = vi.fn();
    render(<PersonaSelection personas={[talentPersona]} value={talentPersona.id} disabled onChange={onChange} />);

    const founderButton = screen.getByRole('button', { name: new RegExp(talentPersona.title, 'i') });
    expect(founderButton).toBeDisabled();
    expect(founderButton.className).toContain('ring-2');

    await userEvent.click(founderButton);
    expect(onChange).not.toHaveBeenCalled();
  });
});
