import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../src/App';
import muiTheme from '../../src/theme';
import { ProgressProvider } from '../../src/context/ProgressContext';

vi.mock('../../src/components/lesson/LabScene3D', () => ({
  default: function MockLabScene3D() {
    return <div data-testid="mock-lab-scene">mock scene</div>;
  },
}));

function renderApp() {
  return render(
    <ThemeProvider theme={muiTheme}>
      <ProgressProvider>
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>
      </ProgressProvider>
    </ThemeProvider>
  );
}

describe('nav smoke', () => {
  it('opens theory section', async () => {
    const user = userEvent.setup();
    renderApp();

    const theoryButtons = await screen.findAllByRole('button', { name: 'Теория' });
    await user.click(theoryButtons[0]);

    expect(await screen.findByRole('button', { name: 'На главную' })).toBeInTheDocument();
  }, 30000);
});
