<script lang="ts">
	import { symbolStore } from '$lib/stores/symbol';
	import { onMount } from 'svelte';
	import { callAlphaVantageFromBrowser } from '$lib/client/alphaVantage';
	import SymbolSearch from '$lib/components/SymbolSearch.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	let tickers = 'AAPL';
	let topics = '';
	let time_from = '';
	let time_to = '';
	let sort: 'LATEST' | 'EARLIEST' | '' = 'LATEST';
	let limit: number | '' = 50;

	let loading = false;
	let error: string | null = null;
	let data: any = null;

	function buildParams() {
		// Alpha Vantage expects parameters to be passed directly in the URL
		// Example: https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=COIN,CRYPTO:BTC,FOREX:USD&time_from=20220410T0130&limit=1000&apikey=demo
		const params: Record<string, string> = {};
		
		// Alpha Vantage expects 'tickers' parameter as a comma-separated list without spaces
		// Format can include prefixes like CRYPTO: or FOREX:
		if (tickers.trim()) {
			// Remove spaces after commas to match expected format
			params.tickers = tickers.split(',').map(t => t.trim()).join(',');
		}
		
		// Alpha Vantage expects 'topics' parameter as a comma-separated list
		if (topics.trim()) {
			// Remove spaces after commas to match expected format
			params.topics = topics.split(',').map(t => t.trim()).join(',');
		}
		
		// Alpha Vantage expects 'time_from' parameter in YYYYMMDDTHHMM format
		if (time_from.trim()) params.time_from = time_from.trim();
		
		// Alpha Vantage expects 'time_to' parameter in YYYYMMDDTHHMM format
		if (time_to.trim()) params.time_to = time_to.trim();
		
		// Alpha Vantage expects 'sort' parameter as LATEST or EARLIEST
		if (sort) params.sort = sort;
		
		// Alpha Vantage expects 'limit' parameter as a number
		if (limit !== '' && Number(limit) > 0) params.limit = String(limit);
		
		return params;
	}

	async function fetchNews() {
		error = null;
		data = null;
		// If a single ticker is provided, sync it to the global symbol store
		const single = tickers
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);
		if (single.length === 1) {
			symbolStore.set(single[0].toUpperCase());
		}
		
		// Check if we have required parameters
		if (!tickers.trim() && !topics.trim()) {
			error = 'Please provide at least one of: tickers or topics';
			return;
		}
		
		loading = true;
		try {
			// Build params for AV NEWS_SENTIMENT
			const params = buildParams();
			const result = await callAlphaVantageFromBrowser('NEWS_SENTIMENT', params);
			if (!result.ok) {
				error = result.upstreamNote || result.error || 'Request failed';
				if (result.data) {
					// expose raw upstream data for debugging if available
					data = result.data;
				}
			} else {
				data = result.data as any;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	function onSubmit(e: Event) {
		e.preventDefault();
		fetchNews();
	}

	// Initialize tickers from the global symbol once on mount
	onMount(() => {
		if ($symbolStore) {
			tickers = $symbolStore;
		}
	});
	
	// Handle symbol selection from SymbolSearch
	function handleSymbolSelect(event: CustomEvent) {
		const symbol = event.detail.symbol;
		// Add the symbol to the tickers if it's not already there
		const tickerList = tickers.split(',').map(t => t.trim()).filter(Boolean);
		if (!tickerList.includes(symbol)) {
			if (tickerList.length > 0 && tickerList[0] !== '') {
				// Join with comma but no space to match Alpha Vantage's expected format
				tickers = [...tickerList, symbol].join(',');
			} else {
				tickers = symbol;
			}
		}
	}
	
	// Clear the tickers list
	function clearTickers() {
		tickers = '';
	}
	
	// Remove a specific ticker from the list
	function removeTicker(ticker: string) {
		const tickerList = tickers.split(',').map(t => t.trim()).filter(Boolean);
		// Join with comma but no space to match Alpha Vantage's expected format
		tickers = tickerList.filter(t => t !== ticker).join(',');
	}
</script>

<section class="space-y-6">
	<div class="flex items-center gap-3">
		<BackButton variant="primary" size="sm" />
		<h1 class="text-3xl font-bold">News Sentiment</h1>
		<div class="badge badge-secondary">Alpha Intelligence&trade;</div>
	</div>

	<div class="card bg-base-100 shadow">
		<div class="card-body">
			<form class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3" onsubmit={onSubmit}>
				<div class="form-control">
					<div class="label">
						<span class="label-text font-semibold">Tickers</span>
					</div>
					<div class="flex flex-col gap-2">
						<SymbolSearch 
							showLabel={false}
							showSubmitButton={false}
							on:search={handleSymbolSelect}
							placeholder="Search for symbols to add"
							autoFocus={true}
						/>
						
						{#if tickers}
							<div class="flex flex-wrap gap-2 mt-2">
								{#each tickers.split(',').map(t => t.trim()).filter(Boolean) as ticker}
									<div class="badge badge-primary gap-1">
										{ticker}
										<button 
											type="button" 
											class="btn btn-xs btn-circle btn-ghost" 
											onclick={() => removeTicker(ticker)}
										>
											✕
										</button>
									</div>
								{/each}
								<button 
									type="button" 
									class="btn btn-xs btn-ghost" 
									onclick={clearTickers}
								>
									Clear All
								</button>
							</div>
						{:else}
							<div class="text-sm text-base-content/70">Search and select symbols above</div>
						{/if}
						
						<div class="text-xs text-base-content/50 mt-1">
							<div>Selected tickers: <span class="font-mono">{tickers || 'none'}</span></div>
							<div class="mt-1">Format: Standard tickers (AAPL), crypto (CRYPTO:BTC), or forex (FOREX:USD)</div>
						</div>
					</div>
				</div>
				<label class="form-control">
					<div class="label">
						<span class="label-text font-semibold">Topics (comma separated)</span>
					</div>
					<input
						class="input-bordered input"
						placeholder="e.g. technology,finance"
						bind:value={topics}
					/>
				</label>
				<label class="form-control">
					<div class="label"><span class="label-text font-semibold">Sort</span></div>
					<select class="select-bordered select" bind:value={sort}>
						<option value="LATEST">LATEST</option>
						<option value="EARLIEST">EARLIEST</option>
					</select>
				</label>
				<label class="form-control">
					<div class="label"><span class="label-text font-semibold">Limit</span></div>
					<input class="input-bordered input" type="number" min="1" max="200" bind:value={limit} />
				</label>
				<label class="form-control">
					<div class="label">
						<span class="label-text font-semibold">Time From (YYYYMMDDTHHMM)</span>
					</div>
					<input
						class="input-bordered input"
						placeholder="e.g. 20240101T0000"
						bind:value={time_from}
					/>
				</label>
				<label class="form-control">
					<div class="label">
						<span class="label-text font-semibold">Time To (YYYYMMDDTHHMM)</span>
					</div>
					<input
						class="input-bordered input"
						placeholder="e.g. 20251231T2359"
						bind:value={time_to}
					/>
				</label>

				<div class="flex items-end gap-3 md:col-span-2 lg:col-span-3">
					<button type="submit" class="btn btn-primary" disabled={loading}>
						{#if loading}
							<span class="loading loading-sm loading-spinner"></span>
							Loading
						{:else}
							Fetch News
						{/if}
					</button>
					{#if error}
						<div class="alert alert-error whitespace-pre-wrap">
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
			</form>
		</div>
	</div>

	{#if loading && !data}
		<div class="flex items-center gap-2 text-base-content/70">
			<span class="loading loading-md loading-dots"></span>
			Fetching news sentiment from Alpha Vantage…
		</div>
	{/if}

	{#if data?.feed?.length}
		<div class="space-y-3">
			{#each data.feed as item}
				<div class="card bg-base-100 shadow">
					<div class="card-body gap-2">
						<div class="flex items-start gap-3">
							{#if item.banner_image}
								<img src={item.banner_image} alt="banner" class="h-24 w-24 rounded object-cover" />
							{/if}
							<div class="flex-1">
								<a
									href={item.url}
									target="_blank"
									rel="noreferrer"
									class="link text-lg font-semibold link-primary">{item.title}</a
								>
								<div class="text-sm text-base-content/70">
									<span>{item.source}</span>
									{#if item.time_published}
										<span> • {item.time_published}</span>
									{/if}
								</div>
								{#if item.summary}
									<div class="mt-1 text-sm">{item.summary}</div>
								{/if}
							</div>
						</div>
						<div class="flex flex-wrap items-center gap-2 text-sm">
							{#if item.overall_sentiment_label}
								<div class="badge">{item.overall_sentiment_label}</div>
							{/if}
							{#if item.overall_sentiment_score}
								<div class="badge badge-outline">score: {item.overall_sentiment_score}</div>
							{/if}
						</div>
						{#if item.ticker_sentiment?.length}
							<div class="mt-1 overflow-x-auto">
								<table class="table table-sm">
									<thead>
										<tr>
											<th>Ticker</th>
											<th>Relevance</th>
											<th>Label</th>
											<th>Score</th>
										</tr>
									</thead>
									<tbody>
										{#each item.ticker_sentiment as t}
											<tr>
												<td class="font-semibold">{t.ticker}</td>
												<td>{t.relevance_score}</td>
												<td>{t.ticker_sentiment_label}</td>
												<td>{t.ticker_sentiment_score}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else if data}
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<div class="text-base-content/70">No news items found.</div>
				<details class="collapse-arrow collapse mt-2">
					<summary class="text-md collapse-title font-semibold">Raw response</summary>
					<div class="collapse-content text-xs whitespace-pre-wrap">
						{JSON.stringify(data, null, 2)}
					</div>
				</details>
			</div>
		</div>
	{/if}
</section>
