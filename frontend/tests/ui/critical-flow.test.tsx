import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../src/App';
import { ProgressProvider } from '../../src/context/ProgressContext';
import muiTheme from '../../src/theme';

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
    </ThemeProvider>,
  );
}

describe('critical user flow', () => {
  it(
    'goes home -> theory -> lab -> results -> test',
    async () => {
      const user = userEvent.setup();
      renderApp();

      const theoryButtons = await screen.findAllByRole('button', { name: /теория/i });
      await user.click(theoryButtons[0]);

      expect(await screen.findByRole('button', { name: /на главную/i })).toBeInTheDocument();

      await user.click(screen.getByRole('tab', { name: /лабораторная/i }));
      await user.click(screen.getByRole('button', { name: /далее/i }));
      await user.click(screen.getByRole('button', { name: /зафиксировать результат/i }));

      expect(await screen.findByText(/таблица результатов/i)).toBeInTheDocument();

      await user.click(screen.getByRole('tab', { name: /тест/i }));
      await user.click(screen.getByRole('button', { name: /проверить тест/i }));

      expect(await screen.findByText(/итог:/i)).toBeInTheDocument();
    },
    120000,
  );
});
