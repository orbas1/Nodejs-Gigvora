import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import GdprBreachResponseCard from '../GdprBreachResponseCard.jsx';
import GdprConsentFrameworkCard from '../GdprConsentFrameworkCard.jsx';
import GdprDataSubjectRequestsCard from '../GdprDataSubjectRequestsCard.jsx';
import GdprProcessorsCard from '../GdprProcessorsCard.jsx';
import GdprRetentionPoliciesCard from '../GdprRetentionPoliciesCard.jsx';

function BreachResponseHarness({ initialData, onChange }) {
  const [data, setData] = useState({ tooling: [], ...initialData });

  const handleChange = (field, value) => {
    onChange(field, value);
    setData((previous) => ({ ...previous, [field]: value }));
  };

  return <GdprBreachResponseCard data={data} onChange={handleChange} />;
}

function ConsentFrameworkHarness({ initialData, onChange }) {
  const [data, setData] = useState(initialData);

  const handleChange = (field, value) => {
    onChange(field, value);
    setData((previous) => ({ ...previous, [field]: value }));
  };

  return <GdprConsentFrameworkCard data={data} onChange={handleChange} />;
}

function DataSubjectHarness({ initialData, onChange }) {
  const [data, setData] = useState(initialData);

  const handleChange = (field, value) => {
    onChange(field, value);
    setData((previous) => ({ ...previous, [field]: value }));
  };

  return <GdprDataSubjectRequestsCard data={data} onChange={handleChange} />;
}

function ProcessorsHarness({ initialProcessors, onAdd, onUpdate, onRemove }) {
  const [processors, setProcessors] = useState(initialProcessors);

  const handleAdd = () => {
    onAdd();
    setProcessors((previous) => [
      ...previous,
      { id: `processor-${previous.length + 1}`, name: '', purpose: '', dataCategories: [] },
    ]);
  };

  const handleUpdate = (id, changes) => {
    onUpdate(id, changes);
    setProcessors((previous) =>
      previous.map((processor) => (processor.id === id ? { ...processor, ...changes } : processor)),
    );
  };

  const handleRemove = (id) => {
    onRemove(id);
    setProcessors((previous) => previous.filter((processor) => processor.id !== id));
  };

  return (
    <GdprProcessorsCard
      processors={processors}
      onAddProcessor={handleAdd}
      onUpdateProcessor={handleUpdate}
      onRemoveProcessor={handleRemove}
    />
  );
}

function RetentionPoliciesHarness({ initialPolicies, onAdd, onUpdate, onRemove }) {
  const [policies, setPolicies] = useState(initialPolicies);

  const handleAdd = () => {
    onAdd();
    setPolicies((previous) => [
      ...previous,
      { id: `policy-${previous.length + 1}`, name: '', dataCategories: [], appliesTo: [] },
    ]);
  };

  const handleUpdate = (id, changes) => {
    onUpdate(id, changes);
    setPolicies((previous) =>
      previous.map((policy) => (policy.id === id ? { ...policy, ...changes } : policy)),
    );
  };

  const handleRemove = (id) => {
    onRemove(id);
    setPolicies((previous) => previous.filter((policy) => policy.id !== id));
  };

  return (
    <GdprRetentionPoliciesCard
      policies={policies}
      onAddPolicy={handleAdd}
      onUpdatePolicy={handleUpdate}
      onRemovePolicy={handleRemove}
    />
  );
}

describe('GDPR cards', () => {
  it('notifies of breach response changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<BreachResponseHarness initialData={{ tooling: [] }} onChange={handleChange} />);

    const notificationInput = screen.getByLabelText(/notification window/i);
    await user.clear(notificationInput);
    await user.type(notificationInput, '48');
    expect(handleChange.mock.calls.at(-1)).toEqual(['notificationWindowHours', '48']);

    handleChange.mockClear();
    await user.type(screen.getByPlaceholderText(/add a platform/i), 'Slack');
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    expect(handleChange.mock.calls.at(-1)).toEqual(['tooling', ['Slack']]);
  });

  it('tracks consent framework toggles and numbers', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <ConsentFrameworkHarness
        initialData={{
          marketingOptInDefault: false,
          cookieBannerEnabled: true,
          withdrawalChannels: [],
          cookieRefreshMonths: '',
        }}
        onChange={handleChange}
      />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    expect(handleChange.mock.calls.at(-1)).toEqual(['marketingOptInDefault', true]);

    handleChange.mockClear();
    await user.click(checkboxes[1]);
    expect(handleChange.mock.calls.at(-1)).toEqual(['cookieBannerEnabled', false]);

    handleChange.mockClear();
    const refreshInput = screen.getByLabelText(/cookie consent refresh/i);
    await user.clear(refreshInput);
    await user.type(refreshInput, '18');
    expect(handleChange.mock.calls.at(-1)).toEqual(['cookieRefreshMonths', '18']);
  });

  it('captures data subject request settings', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <DataSubjectHarness
        initialData={{ automatedIntake: false, intakeChannels: [], exportFormats: [] }}
        onChange={handleChange}
      />,
    );

    const contactInput = screen.getByLabelText(/primary contact email/i);
    await user.clear(contactInput);
    await user.type(contactInput, 'privacy@example.com');
    expect(handleChange.mock.calls.at(-1)).toEqual(['contactEmail', 'privacy@example.com']);

    handleChange.mockClear();
    const intakeToggle = screen.getByRole('checkbox', { name: /disabled/i });
    await user.click(intakeToggle);
    expect(handleChange.mock.calls.at(-1)).toEqual(['automatedIntake', true]);
  });

  it('supports processor roster maintenance', async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();
    const handleUpdate = vi.fn();
    const handleRemove = vi.fn();

    render(
      <ProcessorsHarness
        initialProcessors={[{ id: 'aws', name: 'AWS', purpose: 'Hosting', dataCategories: [] }]}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onRemove={handleRemove}
      />,
    );

    const processorCard = screen.getByRole('heading', { name: /aws/i }).closest('article');

    await user.click(screen.getByRole('button', { name: /add processor/i }));
    expect(handleAdd).toHaveBeenCalledTimes(1);

    const nameInput = screen.getByDisplayValue('AWS');
    await user.clear(nameInput);
    await user.type(nameInput, 'AWS Cloud');
    expect(handleUpdate.mock.calls.at(-1)).toEqual(['aws', { name: 'AWS Cloud' }]);

    handleUpdate.mockClear();
    const processorRemove = within(processorCard).getByRole('button', { name: /^remove$/i });
    await user.click(processorRemove);
    expect(handleRemove).toHaveBeenCalledWith('aws');
  });

  it('supports retention policy automation', async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();
    const handleUpdate = vi.fn();
    const handleRemove = vi.fn();

    render(
      <RetentionPoliciesHarness
        initialPolicies={[{ id: 'accounts', name: 'Account data', retentionDays: 365, autoDelete: false }]}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onRemove={handleRemove}
      />,
    );

    const policyCard = screen.getByRole('heading', { name: /account data/i }).closest('article');

    await user.click(screen.getByRole('button', { name: /add policy/i }));
    expect(handleAdd).toHaveBeenCalledTimes(1);

    const policyName = screen.getByDisplayValue('Account data');
    await user.clear(policyName);
    await user.type(policyName, 'Account data EU');
    expect(handleUpdate.mock.calls.at(-1)).toEqual(['accounts', { name: 'Account data EU' }]);

    handleUpdate.mockClear();
    const policyRemove = within(policyCard).getByRole('button', { name: /^remove$/i });
    await user.click(policyRemove);
    expect(handleRemove).toHaveBeenCalledWith('accounts');
  });
});
