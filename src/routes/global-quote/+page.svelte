<script lang="ts">
	import { symbolStore } from '$lib/stores/symbol';
	import { callAlphaVantageFromBrowser } from '$lib/client/alphaVantage';
	import SymbolSearch from '$lib/components/SymbolSearch.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	let symbol = 'IBM';
	let loading = false;
	let error: string | null = null;
	let data: Record<string, any> | null = null;

	async function fetchQuote() {
		error = null;
		data = null;
		const s = $symbolStore.trim().toUpperCase();
		if (!s) {
			error = 'Please enter a symbol';
			return;
		}
		loading = true;
		try {
			const result = await callAlphaVantageFromBrowser('GLOBAL_QUOTE', { symbol: s });
			if (!result.ok) {
				error = result.upstreamNote || result.error || 'Request failed';
				const payload = (result.data ?? {}) as Record<string, any>;
				if (payload && (payload.Note || payload.Information || payload['Error Message'])) {
					error = payload.Note || payload.Information || payload['Error Message'];
				}
			} else {
				const payload = (result.data ?? {}) as Record<string, any>;
				data = payload['Global Quote'] ?? payload;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	// Remove onSubmit as we're using the SymbolSearch component's submit handling

	function isNumeric(v: any) {
		const n = Number(v);
		return !isNaN(n) && isFinite(n);
	}

	function formatNumber(v: any) {
		const n = Number(v);
		if (isNaN(n)) return String(v);
		return new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(n);
	}

	// Map Alpha Vantage fields to friendlier labels and desired order
	const fieldOrder: Array<[string, string]> = [
		['01. symbol', 'Symbol'],
		['02. open', 'Open'],
		['03. high', 'High'],
		['04. low', 'Low'],
		['05. price', 'Price'],
		['08. previous close', 'Previous Close'],
		['09. change', 'Change'],
		['10. change percent', 'Change %'],
		['06. volume', 'Volume'],
		['07. latest trading day', 'Latest Trading Day']
	];

	function displayPairs(d: Record<string, any>) {
		const preferred = fieldOrder.filter(([k]) => k in d);
		const others = Object.keys(d)
			.filter((k) => !preferred.some(([pk]) => pk === k))
			.map((k) => [k, k] as [string, string]);
		return [...preferred, ...others];
	}
</script>

<section class="space-y-6">
	<div class="flex items-center gap-3">
		<BackButton variant="primary" size="sm" />
		<h1 class="text-3xl font-bold">Global Quote</h1>
		<div class="badge badge-secondary">Market Data</div>
	</div>

	<div class="card bg-base-100 shadow">
		<div class="card-body">
			<div class="flex flex-wrap items-end gap-3">
				<SymbolSearch 
					submitButtonText={loading ? 'Loading...' : 'Fetch Global Quote'}
					loading={loading}
					on:search={() => fetchQuote()}
				/>
			</div>

			{#if error}
				<div class="mt-3 alert alert-error whitespace-pre-wrap">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/></svg
					>
					<span>{error}</span>
				</div>
			{/if}
		</div>
	</div>

	{#if loading && !data}
		<div class="flex items-center gap-2 text-base-content/70">
			<span class="loading loading-md loading-dots"></span>
			Fetching global quote from Alpha Vantage…
		</div>
	{/if}

	{#if data}
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<h2 class="card-title">Results for {$symbolStore.toUpperCase()}</h2>

				<div class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each displayPairs(data) as [key, label]}
						<div class="card bg-base-200 p-3">
							<div class="text-[11px] tracking-wide text-base-content/60 uppercase">{label}</div>
							<div class="text-sm font-semibold break-words">
								{#if isNumeric(data[key])}
									{#if key === '06. volume'}
										{new Intl.NumberFormat('en-US').format(Number(data[key]))}
									{:else}
										{formatNumber(data[key])}
									{/if}
								{:else}
									{String(data[key])}
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</section>
