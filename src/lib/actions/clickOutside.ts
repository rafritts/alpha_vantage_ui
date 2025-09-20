/**
 * Svelte action that dispatches a custom event when a click occurs outside of the element it's applied to.
 * 
 * Usage:
 * ```svelte
 * <div use:clickOutside={{ handler: handleClickOutside }}>...</div>
 * ```
 */
export function clickOutside(node: HTMLElement, { handler }: { handler: () => void }) {
	const handleClick = (event: MouseEvent) => {
		const target = event.target as Node;
		if (node && !node.contains(target) && !event.defaultPrevented) {
			handler();
		}
	};

	document.addEventListener('click', handleClick, true);

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		},
		update({ handler }: { handler: () => void }) {
			// Update the handler if it changes
		}
	};
}
