import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner', () => {
	it('renders svg element', () => {
		const { container } = render(<Spinner />);
		const svg = container.querySelector('svg');
		expect(svg).toBeInTheDocument();
	});

	it('applies default className', () => {
		const { container } = render(<Spinner />);
		const svg = container.querySelector('svg');
		expect(svg).toHaveClass('size-4');
	});

	it('applies custom className', () => {
		const { container } = render(<Spinner className="size-8" />);
		const svg = container.querySelector('svg');
		expect(svg).toHaveClass('size-8');
	});
});
