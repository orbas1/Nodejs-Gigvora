import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../Modal.jsx';

describe('Modal', () => {
  it('renders content and triggers onClose when the close button is pressed', () => {
    const handleClose = vi.fn();

    render(
      <Modal open title="Session" description="Details" onClose={handleClose}>
        <p>Modal body</p>
      </Modal>,
    );

    expect(screen.getByText('Modal body')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('listens for escape key presses when open', () => {
    const handleClose = vi.fn();

    render(
      <Modal open title="Session" onClose={handleClose}>
        <p>Modal body</p>
      </Modal>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when closed', () => {
    const { container } = render(
      <Modal open={false} title="Hidden" onClose={vi.fn()}>
        <span>Hidden</span>
      </Modal>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
