<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { BookText } from 'lucide-svelte';
	import { Key } from 'lucide-svelte';
	import { LayoutGrid } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { apiKeyStore, persistentStorage, isSessionOnly } from '$lib/stores/apiKey';
	import { sanitizeInput } from '$lib/utils/sanitize';

	let { children } = $props();

	// API key modal state
	let showApiModal = $state(false);
	let tempKey = $state('');
	let isPersistent = $state(false);

	function openApiKeyModal() {
		tempKey = $apiKeyStore ?? '';
		isPersistent = !$isSessionOnly;
		showApiModal = true;
	}

	function closeApiKeyModal() {
		showApiModal = false;
	}

	function saveApiKey() {
		// Update persistence preference first
		persistentStorage.set(isPersistent);
		
		// Sanitize the API key before storing it
		apiKeyStore.set(sanitizeInput(tempKey.trim()));
		showApiModal = false;
	}

	function clearApiKey() {
		apiKeyStore.set('');
		tempKey = '';
		showApiModal = false;
	}

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
			// ignore for now
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
			// ignore for now
		}
		if (!saved) {
			const prefersDark =
				typeof window !== 'undefined' &&
				window.matchMedia &&
				window.matchMedia('(prefers-color-scheme: dark)').matches;
			saved = prefersDark ? 'dark' : 'light';
		}
		theme = saved;
		applyTheme(theme);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-dvh flex-col bg-base-200">
	<div class="navbar bg-base-100 shadow">
		<div class="container mx-auto flex items-center justify-between px-4">
			<div class="flex-1">
				<a class="btn text-xl btn-ghost" href="/">
					<LayoutGrid />
					Alpha Vantage UI</a>
			</div>
			<div class="flex flex-none items-center gap-2">
				<button class="btn btn-secondary" onclick={openApiKeyModal} aria-label="Set API Key">
					<Key />
					API Key
					{#if $apiKeyStore}
						<span class="ml-2 badge badge-sm badge-success">Set</span>
						{#if $isSessionOnly}
							<span class="ml-1 badge badge-xs badge-ghost">Session-only</span>
						{:else}
							<span class="ml-1 badge badge-xs badge-info">Persistent</span>
						{/if}
					{:else}
						<span class="ml-2 badge badge-ghost badge-sm">Not Set</span>
					{/if}
				</button>
				<a
					class="btn btn-primary"
					href="https://www.alphavantage.co/documentation/"
					target="_blank"
					rel="noreferrer">
					<BookText />
					AlphaVantage Docs</a
				>
				<label
					class="btn swap btn-circle h-8 min-h-0 w-8 swap-rotate p-0 ring-0 btn-ghost btn-xs focus:ring-0 focus:outline-none focus-visible:outline-none"
					aria-label="Toggle theme"
				>
					<input
						type="checkbox"
						onchange={(e) => {
							const checked = (e.currentTarget as HTMLInputElement).checked;
							theme = checked ? 'dark' : 'light';
							applyTheme(theme);
						}}
						checked={theme === 'dark'}
						class="sr-only ring-0 outline-none focus:ring-0 focus:outline-none focus-visible:outline-none"
						aria-label="Theme checkbox"
					/>
					<!-- Moon icon (shown when dark) -->
					<svg
						class="swap-on h-4 w-4 fill-current"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
					</svg>
					<!-- Sun icon (shown when light) -->
					<svg
						class="swap-off h-4 w-4"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="5"></circle>
						<path
							d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
						></path>
					</svg>
				</label>
			</div>
		</div>
	</div>

	{#if showApiModal}
		<dialog open class="modal">
			<div class="modal-box">
				<h3 class="text-lg font-bold">Alpha Vantage API Key</h3>
				<div class="py-2 h-[3rem]">
					{#if !isPersistent}
						<p class="text-sm opacity-80">Your key is stored in session storage and cleared when this tab closes.</p>
					{:else}
						<p class="text-sm opacity-80">Your key will be stored encrypted in local storage and persist across sessions. You can clear it at any time.</p>
					{/if}
				</div>
				<div class="mt-3">
					<input
						type="text"
						class="input-bordered input w-full mb-4"
						bind:value={tempKey}
						placeholder="Enter your API key"
						autocomplete="off"
						spellcheck={false}
					/>
				</div>
				
				<div class="form-control w-full">
					<label class="flex items-start gap-3 cursor-pointer">
						<input type="checkbox" class="checkbox checkbox-primary mt-1" bind:checked={isPersistent} />
						<div class="flex flex-col">
							<span class="label-text font-medium">Store API key permanently (encrypted)</span>
							<span class="label-text text-xs opacity-70 mt-1">
								I understand there is a small risk of XSS attacks with persistent storage
							</span>
						</div>
					</label>
				</div>
				
				<div class="modal-action">
					{#if $apiKeyStore}
						<button class="btn btn-outline" onclick={clearApiKey}>Clear</button>
					{/if}
					<button class="btn" onclick={closeApiKeyModal}>Cancel</button>
					<button
						class="btn btn-primary"
						onclick={saveApiKey}
						disabled={!tempKey.trim() && !$apiKeyStore}>Save</button
					>
				</div>
			</div>
			<button type="button" class="modal-backdrop" onclick={closeApiKeyModal} aria-label="Close"
			></button>
		</dialog>
	{/if}

	<main class="container mx-auto w-full flex-1 px-4 py-6">
		{@render children?.()}
	</main>

	<footer class="footer-center footer bg-base-100 p-4 text-base-content">
		<aside>
			<div class="mt-2 flex items-center justify-center gap-4">
				<a
					href="https://svelte.dev"
					target="_blank"
					rel="noreferrer"
					class="inline-flex items-center"
					aria-label="Svelte"
				>
					<img
						alt="Svelte logo"
						src="https://upload.wikimedia.org/wikipedia/commons/1/1b/Svelte_Logo.svg"
						class="h-6 w-auto opacity-80 transition-opacity hover:opacity-100"
					/>
				</a>
				<a
					href="https://tailwindcss.com"
					target="_blank"
					rel="noreferrer"
					class="inline-flex items-center"
					aria-label="Tailwind CSS"
				>
					<img
						alt="Tailwind CSS logo"
						src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg"
						class="h-6 w-auto opacity-80 transition-opacity hover:opacity-100"
					/>
				</a>
				<a
					href="https://daisyui.com"
					target="_blank"
					rel="noreferrer"
					class="inline-flex items-center"
					aria-label="daisyUI"
				>
					<img
						alt="daisyUI logo"
						src="https://img.daisyui.com/images/daisyui/mark.svg"
						class="h-6 w-auto opacity-80 transition-opacity hover:opacity-100"
					/>
				</a>
			</div>
		</aside>
	</footer>
</div>
