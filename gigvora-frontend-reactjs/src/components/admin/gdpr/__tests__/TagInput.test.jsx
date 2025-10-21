import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import TagInput from '../TagInput.jsx';

function TagInputHarness({ initialValues, onChange, ...props }) {
  const [values, setValues] = useState(initialValues);

  const handleChange = (nextValues) => {
    onChange(nextValues);
    setValues(nextValues);
  };

  return <TagInput values={values} onChange={handleChange} {...props} />;
}

describe('TagInput', () => {
  it('adds tags via button and enter key then removes them', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <TagInputHarness
        label="Channels"
        initialValues={['Email']}
        onChange={handleChange}
        placeholder="Add channel"
      />,
    );

    const input = screen.getByPlaceholderText(/add channel/i);
    await user.type(input, 'Portal');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(handleChange.mock.calls.at(-1)?.[0]).toEqual(['Email', 'Portal']);

    await user.clear(input);
    await user.type(input, 'SMS{enter}');

    expect(handleChange.mock.calls.at(-1)?.[0]).toEqual(['Email', 'Portal', 'SMS']);

    const removeButton = screen.getByRole('button', { name: /remove email/i });
    await user.click(removeButton);

    expect(handleChange.mock.calls.at(-1)?.[0]).toEqual(['Portal', 'SMS']);
  });
});
