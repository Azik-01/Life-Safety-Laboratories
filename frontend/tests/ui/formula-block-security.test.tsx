import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FormulaBlock from '../../src/components/lesson/FormulaBlock';

describe('FormulaBlock security', () => {
  it('renders formula markup as text instead of injected HTML', () => {
    const { container } = render(
      <FormulaBlock
        expression="E_{н} = r^2 + <img src=x onerror=alert(1)>"
        variables={[{ symbol: 'K_{з}', description: 'коэффициент запаса', unit: '' }]}
      />,
    );

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
    expect(container.querySelector('sub')).toHaveTextContent('н');
    expect(container.querySelector('sup')).toHaveTextContent('2');
    expect(container).toHaveTextContent('<img src=x onerror=alert(1)>');
  });
});
