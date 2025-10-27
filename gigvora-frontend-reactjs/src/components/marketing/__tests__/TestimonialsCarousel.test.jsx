import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestimonialsCarousel } from '../TestimonialsCarousel.jsx';

const TESTIMONIALS = [
  { quote: 'First testimonial from a delighted operator.', name: 'Alex Morgan' },
  { quote: 'Second testimonial highlighting crew coordination.', name: 'Priya Singh' },
  { quote: 'Third testimonial celebrating enterprise polish.', name: 'Jonah Li' },
];

afterEach(() => {
  vi.useRealTimers();
});

describe('TestimonialsCarousel', () => {
  it('auto-advances testimonials when autoplay is active', async () => {
    vi.useFakeTimers();

    render(<TestimonialsCarousel testimonials={TESTIMONIALS} autoPlayInterval={2000} />);

    expect(screen.getByText(/first testimonial/i)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    expect(screen.getByText(/second testimonial/i)).toBeInTheDocument();
  });

  it('pauses autoplay when the control is toggled', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime.bind(vi) });

    render(<TestimonialsCarousel testimonials={TESTIMONIALS} autoPlayInterval={1500} />);

    const pauseButton = screen.getByRole('button', { name: /pause testimonial autoplay/i });
    await user.click(pauseButton);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText(/first testimonial/i)).toBeInTheDocument();
  });

  it('supports keyboard navigation for manual control', async () => {
    const user = userEvent.setup();

    render(<TestimonialsCarousel testimonials={TESTIMONIALS} autoPlay={false} />);

    const carousel = screen.getByRole('group', { name: /gigvora customer testimonials/i });
    carousel.focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByText(/second testimonial/i)).toBeInTheDocument();

    await user.keyboard('{End}');
    expect(screen.getByText(/third testimonial/i)).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText(/second testimonial/i)).toBeInTheDocument();
  });
});
