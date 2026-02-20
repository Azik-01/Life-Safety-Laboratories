import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../src/App';
import muiTheme from '../../src/theme';

vi.mock('../../src/components/lesson/LabScene3D', () => ({
  default: function MockLabScene3D() {
    return <div data-testid="mock-lab-scene">mock scene</div>;
  },
}));

function renderApp() {
  return render(
    <ThemeProvider theme={muiTheme}>
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe('critical user flow', () => {
  it('goes lesson -> theory -> lab -> report -> test', async () => {
    const user = userEvent.setup();
    renderApp();

    const theoryButtons = screen.getAllByRole('button', { name: 'Теория' });
    await user.click(theoryButtons[0]);

    expect(await screen.findByText(/Производственное освещение/)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Лабораторная' }));
    expect(await screen.findByText('Шаг 0. Вариант студента')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Последние цифры студбилета'), '123456');
    await user.click(screen.getByRole('button', { name: 'Автоподстановка' }));
    await user.click(screen.getByRole('button', { name: 'Далее' }));
    await user.click(screen.getByRole('button', { name: 'Зафиксировать результат шага' }));

    expect(await screen.findByText('Таблица результатов')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Тест' }));
    await user.click(screen.getByRole('button', { name: 'Проверить тест' }));

    expect(await screen.findByText(/Итог:/)).toBeInTheDocument();
  }, 20000);
});
