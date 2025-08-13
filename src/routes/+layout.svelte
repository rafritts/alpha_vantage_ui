<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
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
