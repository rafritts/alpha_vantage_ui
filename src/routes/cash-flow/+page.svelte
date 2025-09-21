<script lang="ts">
	import { formatValue } from '$lib/utils';
	import { symbolStore } from '$lib/stores/symbol';
	import { callAlphaVantageFromBrowser } from '$lib/client/alphaVantage';
	import SymbolSearch from '$lib/components/SymbolSearch.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { sanitizeInput } from '$lib/utils/sanitize';
	let symbol = 'AAPL';
	let loading = false;
	let error: string | null = null;
	let data: Record<string, any> | null = null;
	let tab: 'annual' | 'quarterly' = 'annual';
	let expandedAnnualFlags: boolean[] = [];
	let expandedQuarterlyFlags: boolean[] = [];

	async function fetchCashFlow() {
		error = null;
		data = null;
		// reset expanded state on new fetch
		expandedAnnualFlags = [];
		expandedQuarterlyFlags = [];
		const s = $symbolStore.trim().toUpperCase();
		if (!s) {
			error = 'Please enter a symbol';
			return;
		}
		loading = true;
		try {
			const result = await callAlphaVantageFromBrowser('CASH_FLOW', { symbol: s });
			if (!result.ok) {
				error = result.upstreamNote || result.error || 'Request failed';
				const payload = (result.data ?? {}) as Record<string, any>;
				if (payload && (payload.Note || payload.Information || payload['Error Message'])) {
					error = payload.Note || payload.Information || payload['Error Message'];
				}
			} else {
				data = (result.data ?? null) as Record<string, any> | null;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	// Remove onSubmit as we're using the SymbolSearch component's submit handling

	function reportKeys(report: Record<string, any>) {
		// Place common cash flow keys first
		const preferred = [
			'fiscalDateEnding',
			'reportedCurrency',
			'operatingCashflow',
			'capitalExpenditures',
			'cashflowFromInvestment',
			'cashflowFromFinancing',
			'dividendPayout',
			'changeInCashAndCashEquivalents',
			'profitLoss',
			'netIncome'
		];
		const keys = Object.keys(report || {});
		const others = keys.filter((k) => !preferred.includes(k));
		return [...preferred.filter((k) => keys.includes(k)), ...others];
	}

	// Initialize expansion flags only when report counts change
	$: if (data) {
		const aLen = Array.isArray((data as any).annualReports)
			? (data as any).annualReports.length
			: 0;
		const qLen = Array.isArray((data as any).quarterlyReports)
			? (data as any).quarterlyReports.length
			: 0;
		if (expandedAnnualFlags.length !== aLen) {
			expandedAnnualFlags = new Array(aLen).fill(false);
		}
		if (expandedQuarterlyFlags.length !== qLen) {
			expandedQuarterlyFlags = new Array(qLen).fill(false);
		}
	}

	function toggleExpanded(kind: 'annual' | 'quarterly', idx: number) {
		if (kind === 'annual') {
			const next = [...expandedAnnualFlags];
			next[idx] = !next[idx];
			expandedAnnualFlags = next;
		} else {
			const next = [...expandedQuarterlyFlags];
			next[idx] = !next[idx];
			expandedQuarterlyFlags = next;
		}
	}

	function splitKeys(report: Record<string, any>) {
		const keys = reportKeys(report);
		return {
			visible: keys.slice(0, 8),
			hidden: keys.slice(8)
		};
	}
</script>

<section class="space-y-6">
	<PageHeader title="Cash Flow" badgeText="Fundamentals" badgeColor="primary" />

	<div class="card bg-base-100 shadow">
		<div class="card-body">
			<div class="flex flex-wrap items-end gap-3">
				<SymbolSearch 
					submitButtonText={loading ? 'Loading...' : 'Fetch Cash Flow'}
					loading={loading}
					on:search={() => fetchCashFlow()}
				/>
				{#if data}
					<div class="ml-auto flex items-center gap-2">
						<span class="label-text font-semibold">View:</span>
						<div class="join">
							<button
								type="button"
								class="btn join-item btn-sm md:btn-md"
								class:btn-primary={tab === 'annual'}
								class:btn-ghost={tab !== 'annual'}
								onclick={() => (tab = 'annual')}
							>
								Annual
							</button>
							<button
								type="button"
								class="btn join-item btn-sm md:btn-md"
								class:btn-primary={tab === 'quarterly'}
								class:btn-ghost={tab !== 'quarterly'}
								onclick={() => (tab = 'quarterly')}
							>
								Quarterly
							</button>
						</div>
					</div>
				{/if}
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
			Fetching cash flow from Alpha Vantage…
		</div>
	{/if}

	{#if data}
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<h2 class="card-title">Results for {$symbolStore.toUpperCase()}</h2>

				{#if tab === 'annual'}
					{#if (data as any).annualReports?.length}
						<div class="mt-3 space-y-3">
							{#each (data as any).annualReports as report, i}
								{@const splits = splitKeys(report)}
								<div class="overflow-hidden rounded-lg border border-base-300">
									<div
										class="flex items-center justify-between bg-base-200 px-3 py-2 font-semibold"
									>
										<span>Annual Report {i + 1} — {report.fiscalDateEnding}</span>
										{#if splits.hidden.length}
											<button
												type="button"
												class="btn btn-xs"
												onclick={(e) => { e.preventDefault(); e.stopPropagation(); toggleExpanded('annual', i); }}
												aria-expanded={expandedAnnualFlags[i]}
											>
												{expandedAnnualFlags[i] ? 'Show less' : `Show ${splits.hidden.length} more`}
											</button>
										{/if}
									</div>
									<div class="p-3">
										<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
											{#each splits.visible as k}
												<div class="card bg-base-200 p-3">
													<div class="text-[11px] tracking-wide text-base-content/60 uppercase">
														{k}
													</div>
													<div class="text-sm font-semibold break-words">
														{formatValue(k, report[k])}
													</div>
												</div>
											{/each}
											{#if expandedAnnualFlags[i]}
												{#each splits.hidden as k}
													<div class="card bg-base-200 p-3">
														<div class="text-[11px] tracking-wide text-base-content/60 uppercase">
															{k}
														</div>
														<div class="text-sm font-semibold break-words">
															{formatValue(k, report[k])}
														</div>
													</div>
												{/each}
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="mt-3 text-base-content/70">No annual reports available.</div>
					{/if}
				{:else if (data as any).quarterlyReports?.length}
					<div class="mt-3 space-y-3">
						{#each (data as any).quarterlyReports as report, i}
							{@const splits = splitKeys(report)}
							<div class="overflow-hidden rounded-lg border border-base-300">
								<div class="flex items-center justify-between bg-base-200 px-3 py-2 font-semibold">
									<span>Quarterly Report {i + 1} — {report.fiscalDateEnding}</span>
									{#if splits.hidden.length}
										<button
											type="button"
											class="btn btn-xs"
											onclick={(e) => { e.preventDefault(); e.stopPropagation(); toggleExpanded('quarterly', i); }}
											aria-expanded={expandedQuarterlyFlags[i]}
										>
											{expandedQuarterlyFlags[i]
												? 'Show less'
												: `Show ${splits.hidden.length} more`}
										</button>
									{/if}
								</div>
								<div class="p-3">
									<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
										{#each splits.visible as k}
											<div class="card bg-base-200 p-3">
												<div class="text-[11px] tracking-wide text-base-content/60 uppercase">
													{k}
												</div>
												<div class="text-sm font-semibold break-words">
													{formatValue(k, report[k])}
												</div>
											</div>
										{/each}
										{#if expandedQuarterlyFlags[i]}
											{#each splits.hidden as k}
												<div class="card bg-base-200 p-3">
													<div class="text-[11px] tracking-wide text-base-content/60 uppercase">
														{k}
													</div>
													<div class="text-sm font-semibold break-words">
														{formatValue(k, report[k])}
													</div>
												</div>
											{/each}
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="mt-3 text-base-content/70">No quarterly reports available.</div>
				{/if}
			</div>
		</div>
	{/if}
</section>
