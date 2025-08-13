<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';

	let { children } = $props();

	type Theme = 'light' | 'dark';
	let theme = $state<Theme>('light');

	const applyTheme = (t: Theme) => {
		// add a temporary class to animate color changes
		document.documentElement.classList.add('theme-transition');
		document.documentElement.setAttribute('data-theme', t);
		setTimeout(() => {
			document.documentElement.classList.remove('theme-transition');
		}, 500);
		try {
			localStorage.setItem('theme', t);
		} catch (e) {
			// ignore storage errors (e.g., SSR or privacy mode)
		}
	};

	const toggleTheme = () => {
		theme = theme === 'light' ? 'dark' : 'light';
		applyTheme(theme);
	};

	onMount(() => {
		let saved: Theme | null = null;
		try {
			const v = localStorage.getItem('theme');
			if (v === 'light' || v === 'dark') saved = v;
		} catch (e) {
			// ignore
		}
		if (!saved) {
			const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
			saved = prefersDark ? 'dark' : 'light';
		}
		theme = saved;
		applyTheme(theme);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-dvh flex flex-col bg-base-200">
	<div class="navbar bg-base-100 shadow">
		<div class="container mx-auto px-4 flex items-center justify-between">
			<div class="flex-1">
				<a class="btn btn-ghost text-xl" href="/">Alpha Vantage UI</a>
			</div>
			<div class="flex-none flex items-center gap-2">
				<a class="btn btn-primary" href="https://www.alphavantage.co/documentation/" target="_blank" rel="noreferrer">Docs</a>
				<label class="btn btn-ghost btn-xs btn-circle swap swap-rotate focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 w-8 h-8 min-h-0 p-0" aria-label="Toggle theme">
					<input
						type="checkbox"
						onchange={(e) => {
							const checked = (e.currentTarget as HTMLInputElement).checked;
							theme = checked ? 'dark' : 'light';
							applyTheme(theme);
						}}
						checked={theme === 'dark'}
						class="sr-only outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0"
						aria-label="Theme checkbox"
					/>
					<!-- Moon icon (shown when dark) -->
					<svg class="swap-on h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
						<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
					</svg>
					<!-- Sun icon (shown when light) -->
					<svg class="swap-off h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<circle cx="12" cy="12" r="5"></circle>
						<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
					</svg>
				</label>
			</div>
		</div>
	</div>

	<main class="container mx-auto px-4 py-6 flex-1 w-full">
		{@render children?.()}
	</main>

	<footer class="footer footer-center bg-base-100 text-base-content p-4">
		<aside>
			<div class="mt-2 flex items-center justify-center gap-4">
				<a href="https://svelte.dev" target="_blank" rel="noreferrer" class="inline-flex items-center" aria-label="Svelte">
					<img
						alt="Svelte logo"
						src="https://upload.wikimedia.org/wikipedia/commons/1/1b/Svelte_Logo.svg"
						class="h-6 w-auto opacity-80 hover:opacity-100 transition-opacity"
					/>
				</a>
				<a href="https://daisyui.com" target="_blank" rel="noreferrer" class="inline-flex items-center" aria-label="daisyUI">
					<img
						alt="daisyUI logo"
						src="https://img.daisyui.com/images/daisyui/mark.svg"
						class="h-6 w-auto opacity-80 hover:opacity-100 transition-opacity"
					/>
				</a>
				<a href="https://tailwindcss.com" target="_blank" rel="noreferrer" class="inline-flex items-center" aria-label="Tailwind CSS">
					<img
						alt="Tailwind CSS logo"
						src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg"
						class="h-6 w-auto opacity-80 hover:opacity-100 transition-opacity"
					/>
				</a>
			</div>
		</aside>
	</footer>
</div>
