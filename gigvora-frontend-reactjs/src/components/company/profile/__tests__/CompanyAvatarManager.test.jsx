import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CompanyAvatarManager from '../CompanyAvatarManager.jsx';

describe('CompanyAvatarManager', () => {
  const profile = { companyName: 'Gigvora', logoUrl: 'https://cdn.test/logo.png', bannerUrl: '' };

  it('submits updates with current form state', () => {
    const handleSubmit = vi.fn();
    render(<CompanyAvatarManager profile={profile} onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText('Logo image URL'), { target: { value: 'https://cdn.test/logo-new.png' } });
    fireEvent.submit(screen.getByRole('button', { name: /Save images/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      logoUrl: 'https://cdn.test/logo-new.png',
      bannerUrl: '',
    });
  });

  it('resets the form when cancelling', () => {
    const handleCancel = vi.fn();
    render(<CompanyAvatarManager profile={profile} onCancel={handleCancel} />);

    fireEvent.change(screen.getByLabelText('Logo image URL'), { target: { value: 'https://cdn.test/logo-new.png' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));

    expect(handleCancel).toHaveBeenCalled();
    expect(screen.getByLabelText('Logo image URL')).toHaveValue('https://cdn.test/logo.png');
  });
});
