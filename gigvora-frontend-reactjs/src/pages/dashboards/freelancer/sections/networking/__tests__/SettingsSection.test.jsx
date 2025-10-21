import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SettingsSection from '../SettingsSection.jsx';

afterEach(() => {
  vi.clearAllMocks();
});

const baseCard = {
  title: 'Principal Designer',
  headline: 'Leading AI-native brand systems',
  bio: 'Consulting for consumer fintech and retail.',
  contactEmail: 'designer@gigvora.com',
  contactPhone: '+1 555 0100',
  websiteUrl: 'https://portfolio.example.com/work',
  linkedinUrl: 'https://www.linkedin.com/in/designer',
  calendlyUrl: 'https://calendly.com/designer/discovery',
  portfolioUrl: 'https://dribbble.com/designer',
  spotlightVideoUrl: 'https://youtu.be/example',
  coverImageUrl: 'https://images.example.com/header.png',
  attachments: [],
};

describe('SettingsSection', () => {
  it('submits a sanitised payload when the form is valid', async () => {
    const handleSave = vi.fn().mockResolvedValue({});

    render(<SettingsSection card={baseCard} saving={false} onSave={handleSave} />);

    await userEvent.clear(screen.getByLabelText(/contact email/i));
    await userEvent.type(screen.getByLabelText(/contact email/i), 'pro@gigvora.com ');

    await userEvent.clear(screen.getByLabelText(/phone/i));
    await userEvent.type(screen.getByLabelText(/phone/i), '  +44 20 1234 5678  ');

    await userEvent.type(screen.getByLabelText(/attachment name/i), ' Credentials ');
    await userEvent.type(screen.getByLabelText(/attachment url/i), 'https://files.example.com/credentials.pdf');
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledTimes(1);
    });

    const payload = handleSave.mock.calls[0][0];
    expect(payload.contactEmail).toBe('pro@gigvora.com');
    expect(payload.contactPhone).toBe('+44 20 1234 5678');
    expect(payload.attachments).toEqual([
      {
        name: 'Credentials',
        url: 'https://files.example.com/credentials.pdf',
      },
    ]);
    expect(await screen.findByText('Workspace card updated.')).toBeInTheDocument();
  });

  it('prevents submission when the email is invalid', async () => {
    const handleSave = vi.fn().mockResolvedValue({});

    render(<SettingsSection card={baseCard} saving={false} onSave={handleSave} />);

    await userEvent.clear(screen.getByLabelText(/contact email/i));
    await userEvent.type(screen.getByLabelText(/contact email/i), 'invalid-email');

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText('Please provide a valid contact email.')).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('prevents duplicate attachments', async () => {
    render(<SettingsSection card={baseCard} saving={false} onSave={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/attachment url/i), 'https://files.example.com/deck.pdf');
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    await userEvent.type(screen.getByLabelText(/attachment url/i), 'https://files.example.com/deck.pdf');
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(await screen.findByText('This attachment has already been added.')).toBeInTheDocument();
  });
});
