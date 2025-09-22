<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { symbolStore } from '$lib/stores/symbol';
	import { searchSymbols, type SymbolSearchResult } from '$lib/client/alphaVantage';
	import { clickOutside } from '$lib/actions/clickOutside';
	import { sanitizeInput } from '$lib/utils/sanitize';

	const dispatch = createEventDispatcher<{
		search: { symbol: string };
	}>();

	// Props
	let {
		placeholder = 'e.g. AAPL',
		autoFocus = false,
		showLabel = true,
		labelText = 'Symbol',
		submitButtonText = 'Search',
		showSubmitButton = true,
		debounceMs = 300,
		loading = false
	} = $props();

	// State
	let input = $state<HTMLInputElement | null>(null);
	let inputValue = $state($symbolStore);
	let isLoading = $state(false);
	let searchResults = $state<SymbolSearchResult[]>([]);
	let showResults = $state(false);
	let selectedIndex = $state(-1);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	let error = $state<string | null>(null);

	// Update input value when symbolStore changes
	$effect(() => {
		inputValue = $symbolStore;
	});

	// Update symbolStore when input value changes
	$effect(() => {
		$symbolStore = inputValue;
	});

	onMount(() => {
		if (autoFocus && input) {
			input.focus();
		}
	});

	async function handleInput() {
		// Clear any existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		// Reset state
		selectedIndex = -1;
		error = null;

		// Sanitize the input value
		inputValue = sanitizeInput(inputValue);

		// Don't search if input is empty
		if (!inputValue.trim()) {
			searchResults = [];
			showResults = false;
			return;
		}

		// Debounce search
		searchTimeout = setTimeout(async () => {
			isLoading = true;
			try {
				const result = await searchSymbols(inputValue);
				if (result.ok && result.data) {
					searchResults = result.data.bestMatches || [];
					showResults = searchResults.length > 0;
				} else {
					error = result.error || result.upstreamNote || 'Search failed';
					searchResults = [];
					showResults = false;
				}
			} catch (err) {
				error = err instanceof Error ? err.message : String(err);
				searchResults = [];
				showResults = false;
			} finally {
				isLoading = false;
			}
		}, debounceMs);
	}

	function handleKeydown(event: KeyboardEvent) {
		// Handle Enter key even if there are no search results
		if (event.key === 'Enter') {
			if (searchResults.length && selectedIndex >= 0) {
				// If an item is selected in the dropdown, select it
				event.preventDefault();
				selectResult(searchResults[selectedIndex]);
			} else if (inputValue.trim()) {
				// If no item is selected but there's input, use the input value
				event.preventDefault();

				// Store the symbol temporarily and sanitize it
				const symbol = sanitizeInput(inputValue.trim());

				// Reset the input field and clear search results
				inputValue = '';
				searchResults = [];

				// Update the symbol store
				$symbolStore = symbol;

				// Dispatch the search event
				dispatch('search', { symbol });
				showResults = false;
			}
			return;
		}

		// Only handle other navigation keys if there are search results
		if (!searchResults.length) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, searchResults.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, -1);
				break;
			case 'Escape':
				event.preventDefault();
				showResults = false;
				break;
		}
	}

	function selectResult(result: SymbolSearchResult) {
		const symbol = result['1. symbol'];

		// Store the symbol temporarily and sanitize it
		const selectedSymbol = sanitizeInput(symbol);

		// Reset the input field and clear search results
		inputValue = '';
		searchResults = [];
		showResults = false;

		// Update the symbol store
		$symbolStore = selectedSymbol;

		// Dispatch the search event when a result is selected
		dispatch('search', { symbol: selectedSymbol });

		// Focus the input field again for the next entry
		if (input) {
			input.focus();
		}
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (inputValue.trim()) {
			// Store the symbol temporarily and sanitize it
			const symbol = sanitizeInput(inputValue.trim());

			// Reset the input field and clear search results
			inputValue = '';
			searchResults = [];

			// Update the symbol store
			$symbolStore = symbol;

			// Dispatch the search event
			dispatch('search', { symbol });

			// Focus the input field again for the next entry
			if (input) {
				input.focus();
			}
		}
		showResults = false;
	}

	function handleClickOutside() {
		showResults = false;
	}
</script>

<div class="relative" use:clickOutside={{ handler: handleClickOutside }}>
	<form onsubmit={handleSubmit} class="flex flex-wrap items-end gap-3">
		{#if showLabel}
			<label class="form-control w-full sm:w-auto">
				<div class="label">
					<span class="label-text font-semibold">{labelText}</span>
				</div>
				<div class="relative">
					<input
						bind:this={input}
						type="text"
						class="input-bordered input w-48"
						bind:value={inputValue}
						oninput={handleInput}
						onkeydown={handleKeydown}
						onfocus={() => {
							// Only show results if we have results AND the input field is not empty
							if (searchResults.length > 0 && inputValue.trim()) showResults = true;
						}}
						{placeholder}
						autocomplete="off"
						spellcheck={false}
					/>
					{#if isLoading}
						<div class="absolute top-1/2 right-2 -translate-y-1/2">
							<span class="loading loading-xs loading-spinner"></span>
						</div>
					{/if}
				</div>
			</label>
		{:else}
			<div class="relative w-48">
				<input
					bind:this={input}
					type="text"
					class="input-bordered input w-48"
					bind:value={inputValue}
					oninput={handleInput}
					onkeydown={handleKeydown}
					onfocus={() => {
						// Only show results if we have results AND the input field is not empty
						if (searchResults.length > 0 && inputValue.trim()) showResults = true;
					}}
					{placeholder}
					autocomplete="off"
					spellcheck={false}
				/>
				{#if isLoading}
					<div class="absolute top-1/2 right-2 -translate-y-1/2">
						<span class="loading loading-xs loading-spinner"></span>
					</div>
				{/if}
			</div>
		{/if}

		{#if showSubmitButton}
			<button type="submit" class="btn btn-primary" disabled={isLoading}>
				{submitButtonText}
			</button>
		{/if}
	</form>

	{#if error}
		<div class="mt-2 text-sm text-error">{error}</div>
	{/if}

	{#if showResults}
		<div
			class="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md bg-base-100 shadow-lg sm:w-96"
		>
			<ul class="menu p-0">
				{#each searchResults as result, i}
					<li>
						<button
							type="button"
							class="flex flex-col items-start p-2 text-left {i === selectedIndex
								? 'bg-primary text-primary-content'
								: ''}"
							onclick={() => selectResult(result)}
							onmouseenter={() => (selectedIndex = i)}
						>
							<div class="font-semibold">{result['1. symbol']}</div>
							<div class="text-sm opacity-80">
								{result['2. name']} ({result['3. type']}, {result['4. region']})
							</div>
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
