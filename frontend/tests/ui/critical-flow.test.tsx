import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
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

function renderApp(initialEntry: string) {
  return render(
    <ThemeProvider theme={muiTheme}>
      <ProgressProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <AppRoutes />
        </MemoryRouter>
      </ProgressProvider>
    </ThemeProvider>,
  );
}

describe('critical route flow', () => {
  it(
    'renders lesson theory, lab, and test routes',
    async () => {
      const theory = renderApp('/lesson/1/theory');
      expect(await screen.findByRole('button', { name: /на главную/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /теория/i })).toHaveAttribute('aria-selected', 'true');
      theory.unmount();

      const lab = renderApp('/lesson/1/lab');
      expect(await screen.findByText(/шаг 0\. вариант студента/i)).toBeInTheDocument();
      lab.unmount();

      renderApp('/lesson/1/test');
      expect(await screen.findByRole('button', { name: /проверить тест/i })).toBeInTheDocument();
    },
    30000,
  );
});
