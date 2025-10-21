import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import HomepageAnnouncementForm from '../HomepageAnnouncementForm.jsx';

function Harness() {
  const [value, setValue] = useState({ enabled: false, message: '', ctaLabel: '', ctaHref: '' });
  return <HomepageAnnouncementForm value={value} onChange={setValue} disabled={false} />;
}

describe('HomepageAnnouncementForm', () => {
  it('propagates input changes and toggle state', async () => {
    const user = userEvent.setup();

    render(<Harness />);

    const messageInput = screen.getByLabelText(/message/i);
    await user.type(messageInput, 'Launch updates');
    expect(messageInput).toHaveValue('Launch updates');

    await user.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });
});
