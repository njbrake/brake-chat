import type { ComponentType } from 'svelte';

export function getSuggestionRenderer(
	Component: ComponentType,
	props: Record<string, any> = {}
): (container: HTMLElement, context: any) => void {
	return (container: HTMLElement, context: any) => {
		const instance = new Component({
			target: container,
			props: {
				...props,
				...context
			}
		});

		return {
			destroy: () => {
				instance.$destroy();
			}
		};
	};
}
