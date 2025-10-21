import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import JobPostBoard from '../JobPostBoard.jsx';
import JobPostDetailDrawer from '../JobPostDetailDrawer.jsx';
import JobPostWizard from '../JobPostWizard.jsx';
import {
  createEmptyForm,
  buildFormFromJob,
  buildPayloadFromForm,
} from '../jobPostFormUtils.js';

async function runInAct(callback) {
  await act(async () => {
    await callback();
  });
}

describe('Job post board', () => {
  it('filters and paginates job listings', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    const onSelectJob = vi.fn();
    const onNewJob = vi.fn();
    const onRefresh = vi.fn();
    const onPageChange = vi.fn();

    function Harness() {
      const [filters, setFilters] = useState({ search: '', status: undefined, workflowStage: undefined, visibility: undefined, page: 1 });
      return (
        <JobPostBoard
          jobs={[
            {
              id: 'job-1',
              title: 'Product Designer',
              location: 'Remote',
              employmentType: 'full_time',
              detail: {
                status: 'draft',
                visibility: 'public',
                workflowStage: 'draft',
                updatedAt: new Date('2024-01-01T12:00:00Z').toISOString(),
              },
            },
          ]}
          summary={{ statusCounts: { draft: 4, published: 2 } }}
          filters={filters}
          onFiltersChange={(next) => {
            setFilters(next);
            onFiltersChange(next);
          }}
          onSelectJob={onSelectJob}
          onNewJob={onNewJob}
          onRefresh={onRefresh}
          loading={false}
          pagination={{ page: 1, totalPages: 3, total: 30 }}
          onPageChange={onPageChange}
        />
      );
    }

    render(<Harness />);

    await runInAct(() => user.click(screen.getByRole('button', { name: /refresh/i })));
    expect(onRefresh).toHaveBeenCalled();

    await runInAct(() => user.click(screen.getAllByRole('button', { name: /drafts/i })[0]));
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft' }));

    await runInAct(() => user.type(screen.getByPlaceholderText(/search titles/i), 'designer'));
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'designer' }));

    const filterCard = screen.getByText(/workflow/i).closest('label');
    await runInAct(() => user.selectOptions(within(filterCard).getByRole('combobox'), 'active'));
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ workflowStage: 'active' }));

    await runInAct(() => user.click(screen.getByRole('button', { name: /product designer/i })));
    expect(onSelectJob).toHaveBeenCalled();

    await runInAct(() => user.click(screen.getByRole('button', { name: /next/i })));
    expect(onPageChange).toHaveBeenCalledWith(2);

    await runInAct(() => user.click(screen.getByRole('button', { name: /new job/i })));
    expect(onNewJob).toHaveBeenCalled();
  });
});

describe('Job post detail drawer', () => {
  it('exposes job operations', async () => {
    const user = userEvent.setup();
    const callbacks = {
      onEdit: vi.fn(),
      onDuplicate: vi.fn(),
      onPublish: vi.fn(),
      onArchive: vi.fn(),
      onDelete: vi.fn(),
      onClose: vi.fn(),
    };

    render(
      <JobPostDetailDrawer
        open
        job={{
          id: 'job-1',
          title: 'Product Designer',
          location: 'Remote',
          employmentType: 'full_time',
          description: 'Build great interfaces.',
          createdAt: new Date('2023-12-01T00:00:00Z').toISOString(),
          detail: {
            status: 'draft',
            visibility: 'public',
            workflowStage: 'draft',
            approvalStatus: 'pending_review',
            updatedAt: new Date('2024-01-01T12:00:00Z').toISOString(),
            promotionFlags: { featured: true },
            tags: ['Design'],
            metadata: { foo: 'bar' },
            benefits: ['Home office stipend'],
            responsibilities: ['Collaborate with PMs'],
            requirements: ['Figma expertise'],
            attachments: [{ label: 'Brief', url: 'https://gigvora.com/brief.pdf', type: 'PDF' }],
          },
        }}
        {...callbacks}
      />,
    );

    await runInAct(() => user.click(screen.getByRole('button', { name: /clone/i })));
    await runInAct(() => user.click(screen.getByRole('button', { name: /edit/i })));
    await runInAct(() => user.click(screen.getByRole('button', { name: /publish/i })));
    await runInAct(() => user.click(screen.getByRole('button', { name: /archive/i })));
    await runInAct(() => user.click(screen.getByRole('button', { name: /delete/i })));

    expect(callbacks.onDuplicate).toHaveBeenCalled();
    expect(callbacks.onEdit).toHaveBeenCalled();
    expect(callbacks.onPublish).toHaveBeenCalled();
    expect(callbacks.onArchive).toHaveBeenCalled();
    expect(callbacks.onDelete).toHaveBeenCalled();
  });
});

describe('Job post wizard', () => {
  it('progresses through steps and submits form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({});

    render(
      <JobPostWizard
        open
        mode="create"
        initialForm={createEmptyForm()}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await runInAct(() => user.type(screen.getByLabelText(/^title$/i), 'Customer Success Lead'));
    await runInAct(() => user.click(screen.getByRole('button', { name: /^next$/i })));
    await runInAct(() => user.type(screen.getByLabelText(/department/i), 'Customer Success'));
    await runInAct(() => user.click(screen.getByRole('button', { name: /^next$/i })));
    await runInAct(() => user.type(screen.getByLabelText(/description/i), 'Own customer outcomes.'));
    await runInAct(() => user.click(screen.getByRole('button', { name: /^next$/i })));
    await runInAct(() => user.type(screen.getByLabelText(/approval notes/i), 'Ready for launch'));
    await runInAct(() => user.click(screen.getByRole('button', { name: /save job/i })));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      title: 'Customer Success Lead',
      department: 'Customer Success',
      description: 'Own customer outcomes.',
      approvalNotes: 'Ready for launch',
    });
  });
});

describe('Job post form utilities', () => {
  it('normalizes a job into a form draft', () => {
    const job = {
      id: 'job-1',
      title: 'Engineer',
      description: 'Build.',
      location: 'Remote',
      employmentType: 'full_time',
      detail: {
        status: 'published',
        workflowStage: 'active',
        approvalStatus: 'approved',
        approvalNotes: 'Ship it',
        visibility: 'public',
        workplaceType: 'remote',
        compensationType: 'salary',
        contractType: 'full_time',
        experienceLevel: 'mid',
        department: 'Engineering',
        team: 'Platform',
        salaryMin: 90000,
        salaryMax: 120000,
        currency: 'USD',
        applicationUrl: 'https://apply',
        applicationEmail: 'jobs@gigvora.com',
        hiringManagerName: 'Aria',
        hiringManagerEmail: 'aria@gigvora.com',
        recruiterName: 'Lee',
        recruiterEmail: 'lee@gigvora.com',
        tags: ['Node.js'],
        benefits: ['401k'],
        responsibilities: ['Deploy services'],
        requirements: ['5+ years'],
        attachments: [{ label: 'JD', url: 'https://jd', type: 'PDF' }],
        promotionFlags: { featured: true },
        publishedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
        expiresAt: new Date('2024-02-01T10:00:00Z').toISOString(),
        archiveReason: 'Replaced',
        externalReference: 'REF-1',
        metadata: { key: 'value' },
      },
    };

    const form = buildFormFromJob(job);
    expect(form).toMatchObject({
      id: 'job-1',
      title: 'Engineer',
      status: 'published',
      tagsText: 'Node.js',
      promotionFlags: expect.objectContaining({ featured: true }),
    });
    expect(form.metadataJson).toContain('"key"');
  });

  it('builds a payload from form values', () => {
    const form = createEmptyForm();
    form.title = 'Support Lead';
    form.status = 'draft';
    form.visibility = 'public';
    form.workflowStage = 'draft';
    form.approvalStatus = 'pending_review';
    form.metadataJson = '{"severity":"high"}';
    form.benefits = ['Wellness'];
    form.requirements = ['Customer focus'];
    form.responsibilities = ['Coach team'];
    form.attachments = [{ label: 'Brief', url: 'https://brief', type: 'PDF' }];

    const payload = buildPayloadFromForm(form);
    expect(payload).toMatchObject({
      title: 'Support Lead',
      status: 'draft',
      metadata: { severity: 'high' },
      benefits: ['Wellness'],
    });
  });

  it('validates metadata JSON when building payload', () => {
    const form = createEmptyForm();
    form.metadataJson = '{invalid';
    expect(() => buildPayloadFromForm(form)).toThrow('Metadata must be valid JSON.');
  });
});
