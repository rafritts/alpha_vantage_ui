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
			<p>Built with SvelteKit + DaisyUI</p>
		</aside>
	</footer>
</div>
