import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import IdentityVerificationSection from '../IdentityVerificationSection.jsx';

vi.mock('../../../hooks/useSession.js', () => ({
  default: () => ({
    session: {
      id: 'user-001',
      profileId: 'profile-001',
    },
    isAuthenticated: true,
  }),
}));

vi.mock('../../../hooks/useIdentityVerification.js', () => ({
  default: vi.fn(() => ({
    data: null,
    loading: false,
    error: null,
    fromCache: false,
    lastUpdated: null,
    refresh: vi.fn(),
    save: vi.fn(),
    submit: vi.fn(),
    review: vi.fn(),
    uploadDocument: vi.fn(),
    saveState: {},
    submitState: {},
    reviewState: {},
    uploadState: {},
  })),
}));

const downloadIdentityDocument = vi.fn();

vi.mock('../../../services/identityVerification.js', () => ({
  downloadIdentityDocument: (...args) => downloadIdentityDocument(...args),
}));

describe('IdentityVerificationSection', () => {
  const baseResource = () => ({
    data: {
      userId: 'user-001',
      profileId: 'profile-001',
      current: {
        status: 'submitted',
        verificationProvider: 'manual_review',
        typeOfId: 'passport',
        idNumberLast4: '1234',
        issuingCountry: 'US',
        issuedAt: '2024-01-01T00:00:00Z',
        expiresAt: '2026-01-01T00:00:00Z',
        documents: {
          front: 'doc-front',
          back: 'doc-back',
          selfie: 'doc-selfie',
        },
        nameOnId: 'Jane Doe',
        dateOfBirth: '1990-01-01',
        address: {
          line1: '123 Main St',
          line2: 'Apt 4',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'US',
        },
        metadata: {
          addressProofKey: 'proof-key',
        },
        reviewNotes: 'Looks good',
        declinedReason: '',
        submittedAt: '2024-01-12T00:00:00Z',
        reviewedAt: null,
        reviewerId: null,
      },
      history: [
        { id: '1', status: 'submitted', actor: 'User', occurredAt: '2024-01-12T00:00:00Z' },
      ],
      nextActions: [{ id: 'verify', label: 'Verify identity', priority: 'high' }],
      requirements: {
        acceptedIdTypes: [
          { value: 'passport', label: 'Passport' },
          { value: 'license', label: 'Driver license' },
        ],
        acceptedIssuingCountries: [
          { value: 'US', label: 'United States' },
          { value: 'CA', label: 'Canada' },
        ],
      },
      capabilities: {
        canSubmit: true,
        canReview: true,
      },
      allowedStatuses: ['verified', 'rejected', 'expired'],
    },
    loading: false,
    error: null,
    fromCache: false,
    lastUpdated: '2024-01-12T00:00:00Z',
    refresh: vi.fn(),
    save: vi.fn().mockResolvedValue({}),
    submit: vi.fn().mockResolvedValue({}),
    review: vi.fn().mockResolvedValue({}),
    uploadDocument: vi.fn().mockResolvedValue({ key: 'uploaded-key' }),
    saveState: { status: null, error: null },
    submitState: { status: null, error: null },
    reviewState: { status: null, error: null },
    uploadState: { status: null, error: null },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders identity data and allows saving and submitting', async () => {
    const resource = baseResource();

    await act(async () => {
      render(<IdentityVerificationSection identityResource={resource} />);
    });

    await waitFor(() => expect(screen.getByTestId('identity-verification')).toBeInTheDocument());
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    });
    await waitFor(() => expect(resource.save).toHaveBeenCalled());

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /^submit$/i }));
    });
    await waitFor(() => expect(resource.submit).toHaveBeenCalled());
  });

  it('opens the documents view and fetches a preview', async () => {
    const resource = baseResource();
    downloadIdentityDocument.mockResolvedValueOnce({ key: 'doc-front', fileName: 'front-id.pdf' });

    await act(async () => {
      render(<IdentityVerificationSection identityResource={resource} />);
    });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /files/i }));
    });
    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    await act(async () => {
      await userEvent.click(viewButtons[0]);
    });

    await waitFor(() => expect(downloadIdentityDocument).toHaveBeenCalledWith({ key: 'doc-front' }));
  });

  it('allows reviewers to update the status', async () => {
    const resource = baseResource();

    await act(async () => {
      render(<IdentityVerificationSection identityResource={resource} />);
    });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /status/i }));
    });
    await act(async () => {
      await userEvent.selectOptions(screen.getByLabelText(/decision/i), ['verified']);
    });
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/notes/i), 'Approved after manual review');
    });
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /save decision/i }));
    });

    await waitFor(() =>
      expect(resource.review).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'verified',
          reviewNotes: expect.stringContaining('Approved'),
          userId: 'user-001',
          profileId: 'profile-001',
          reviewerId: 'user-001',
        }),
      ),
    );
  });
});
