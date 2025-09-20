<script lang="ts">
	import { symbolStore } from '$lib/stores/symbol';
	import { callAlphaVantageFromBrowser } from '$lib/client/alphaVantage';
	import SymbolSearch from '$lib/components/SymbolSearch.svelte';
	import BackButton from '$lib/components/BackButton.svelte';

	let loading = false;
	let error: string | null = null;
	let data: any = null;

	let showAnnual = true; // default to annual for estimates

	async function fetchEstimates() {
		error = null;
		data = null;
		const s = $symbolStore.trim().toUpperCase();
		if (!s) {
			error = 'Please enter a symbol';
			return;
		}
		loading = true;
		try {
			const result = await callAlphaVantageFromBrowser('EARNINGS_ESTIMATES', { symbol: s });
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

	// Matches Alpha Vantage EARNINGS_ESTIMATES response
	// We split into annual vs quarterly using the `horizon` field.
	type Estimate = {
		date: string; // YYYY-MM-DD
		horizon: string; // e.g., "current fiscal year", "next quarter"
		epsMean: number | null;
		epsHigh: number | null;
		epsLow: number | null;
		epsAnalystCount: number | null;
		epsAvg7: number | null;
		epsAvg30: number | null;
		epsAvg60: number | null;
		epsAvg90: number | null;
		revMean: number | null;
		revHigh: number | null;
		revLow: number | null;
		revAnalystCount: number | null;
		revUp7: number | null;
		revDown7: number | null;
		revUp30: number | null;
		revDown30: number | null;
	};

	function toNumber(v: any): number | null {
		if (v === null || v === undefined || v === '') return null;
		const n = Number(v);
		return isFinite(n) ? n : null;
	}

	function parseAll(d: any): Estimate[] {
		const arr: any[] = Array.isArray(d?.estimates) ? d.estimates : [];
		return arr
			.map((x: any) => ({
				date: String(x.date ?? ''),
				horizon: String(x.horizon ?? ''),
				epsMean: toNumber(x.eps_estimate_average),
				epsHigh: toNumber(x.eps_estimate_high),
				epsLow: toNumber(x.eps_estimate_low),
				epsAnalystCount: toNumber(x.eps_estimate_analyst_count),
				epsAvg7: toNumber(x.eps_estimate_average_7_days_ago),
				epsAvg30: toNumber(x.eps_estimate_average_30_days_ago),
				epsAvg60: toNumber(x.eps_estimate_average_60_days_ago),
				epsAvg90: toNumber(x.eps_estimate_average_90_days_ago),
				revMean: toNumber(x.revenue_estimate_average),
				revHigh: toNumber(x.revenue_estimate_high),
				revLow: toNumber(x.revenue_estimate_low),
				revAnalystCount: toNumber(x.revenue_estimate_analyst_count),
				revUp7: toNumber(x.eps_estimate_revision_up_trailing_7_days),
				revDown7: toNumber(x.eps_estimate_revision_down_trailing_7_days),
				revUp30: toNumber(x.eps_estimate_revision_up_trailing_30_days),
				revDown30: toNumber(x.eps_estimate_revision_down_trailing_30_days)
			}))
			.filter((x: Estimate) => x.date)
			.sort((a: Estimate, b: Estimate) => new Date(a.date).getTime() - new Date(b.date).getTime());
	}

	function parseQuarterly(d: any): Estimate[] {
		return parseAll(d).filter((e) => /quarter/i.test(e.horizon));
	}

	function parseAnnual(d: any): Estimate[] {
		return parseAll(d).filter((e) => /fiscal\s*year/i.test(e.horizon));
	}

	// chart helpers (simple, no deps)
	const pad = 12;
	const vw = 800;
	const vh = 280;

	function extent(nums: (number | null)[]): [number, number] {
		const filtered = nums.filter((n): n is number => n !== null && !isNaN(n));
		if (filtered.length === 0) return [0, 1] as [number, number];
		return [Math.min(...filtered), Math.max(...filtered)] as [number, number];
	}

	function niceNumber(x: number, round: boolean) {
		const exp = Math.floor(Math.log10(Math.max(1e-12, Math.abs(x))));
		const f = Math.abs(x) / Math.pow(10, exp);
		let nf = 1;
		if (round) {
			if (f < 1.5) nf = 1;
			else if (f < 3) nf = 2;
			else if (f < 7) nf = 5;
			else nf = 10;
		} else {
			if (f <= 1) nf = 1;
			else if (f <= 2) nf = 2;
			else if (f <= 5) nf = 5;
			else nf = 10;
		}
		return nf * Math.pow(10, exp);
	}
	function niceTicks(domain: [number, number], maxCount = 5) {
		let [min, max] = domain;
		if (!isFinite(min) || !isFinite(max)) return [] as number[];
		if (min === max) {
			const delta = min === 0 ? 1 : Math.abs(min) * 0.1;
			min -= delta;
			max += delta;
		}
		if (min > 0) min = Math.min(0, min);
		if (max < 0) max = Math.max(0, max);
		const range = max - min;
		const step = niceNumber(range / Math.max(1, maxCount), true);
		const niceMin = Math.floor(min / step) * step;
		const niceMax = Math.ceil(max / step) * step;
		const ticks: number[] = [];
		for (let v = niceMin; v <= niceMax + step * 0.5; v += step) ticks.push(v);
		return ticks;
	}
	function formatTick(v: number) {
		const n = Math.abs(v) < 1e-8 ? 0 : v;
		const s = n.toFixed(2);
		return s.replace(/\.00$/, '');
	}

	function linePath(xs: number[], ys: (number | null)[], domain?: [number, number]) {
		const [yMin, yMax] = domain ?? extent(ys);
		const innerW = vw - pad * 2;
		const innerH = vh - pad * 2;
		const xMin = Math.min(...xs);
		const xMax = Math.max(...xs);
		const xScale = (x: number) => pad + ((x - xMin) / Math.max(1, xMax - xMin)) * innerW;
		const yScale = (y: number) =>
			pad + innerH - ((y - yMin) / Math.max(1e-9, yMax - yMin)) * innerH;
		let d = '';
		let started = false;
		for (let i = 0; i < xs.length; i++) {
			const y = ys[i];
			if (y === null || isNaN(y)) continue;
			const X = xScale(xs[i]);
			const Y = yScale(y);
			if (!started) {
				d += `M ${X} ${Y}`;
				started = true;
			} else {
				d += ` L ${X} ${Y}`;
			}
		}
		return d;
	}

	const maxXTicks = 8;
	function xStep(len: number) {
		return Math.max(1, Math.ceil(len / maxXTicks));
	}
	function shortDate(d: string | undefined) {
		return d ? String(d).slice(0, 7) : '';
	}
	function yearOnly(d: string | undefined) {
		return d ? String(d).slice(0, 4) : '';
	}
</script>

<section class="space-y-6">
	<div class="flex items-center gap-3">
		<BackButton variant="primary" size="sm" />
		<h1 class="text-3xl font-bold">Earnings Estimates</h1>
		<div class="badge badge-accent">Fundamentals</div>
	</div>

	<div class="card bg-base-100 shadow">
		<div class="card-body">
			<div class="flex flex-wrap items-end gap-3">
				<SymbolSearch 
					submitButtonText={loading ? 'Loading...' : 'Fetch Estimates'}
					loading={loading}
					on:search={() => fetchEstimates()}
				/>
				{#if data}
					<div class="ml-auto flex items-center gap-2">
						<span class="label-text font-semibold">View:</span>
						<div class="join">
							<button
								type="button"
								class="btn join-item btn-sm md:btn-md"
								class:btn-primary={showAnnual}
								class:btn-ghost={!showAnnual}
								onclick={() => (showAnnual = true)}
							>
								Annual
							</button>
							<button
								type="button"
								class="btn join-item btn-sm md:btn-md"
								class:btn-primary={!showAnnual}
								class:btn-ghost={showAnnual}
								onclick={() => (showAnnual = false)}
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
			Fetching estimates…
		</div>
	{/if}

	{#if data}
		{#if showAnnual}
			{#key data}
				{#await Promise.resolve(parseAnnual(data)) then annual}
					<div class="card bg-base-100 shadow">
						<div class="card-body">
							<h2 class="card-title">Annual EPS Estimates — {$symbolStore.toUpperCase()}</h2>

							{#if annual.length > 1}
								<!-- Graph intentionally removed per request -->
							{/if}

							<div class="overflow-x-auto">
								<table class="table table-zebra">
									<thead>
										<tr>
											<th>Date</th>
											<th>Horizon</th>
											<th class="text-right">EPS Mean</th>
											<th class="text-right">EPS High</th>
											<th class="text-right">EPS Low</th>
											<th class="text-right">EPS Analysts</th>
											<th class="text-right">Revenue Mean</th>
											<th class="text-right">Revenue High</th>
											<th class="text-right">Revenue Low</th>
										</tr>
									</thead>
									<tbody>
										{#each [...annual].reverse() as row}
											<tr>
												<td>{row.date}</td>
												<td>{row.horizon}</td>
												<td class="text-right"
													>{row.epsMean ?? '-'}{#if row.epsMean !== null}
														USD{/if}</td
												>
												<td class="text-right"
													>{row.epsHigh ?? '-'}{#if row.epsHigh !== null}
														USD{/if}</td
												>
												<td class="text-right"
													>{row.epsLow ?? '-'}{#if row.epsLow !== null}
														USD{/if}</td
												>
												<td class="text-right">{row.epsAnalystCount ?? '-'}</td>
												<td class="text-right"
													>{row.revMean ?? '-'}{#if row.revMean !== null}
														USD{/if}</td
												>
												<td class="text-right"
													>{row.revHigh ?? '-'}{#if row.revHigh !== null}
														USD{/if}</td
												>
												<td class="text-right"
													>{row.revLow ?? '-'}{#if row.revLow !== null}
														USD{/if}</td
												>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				{/await}
			{/key}
		{:else}
			{#key data}
				{#await Promise.resolve(parseQuarterly(data)) then quarterly}
					<div class="card bg-base-100 shadow">
						<div class="card-body">
							<h2 class="card-title">Quarterly EPS Estimates — {$symbolStore.toUpperCase()}</h2>

							{#if quarterly.length > 1}
								<!-- Graph intentionally removed per request -->
							{/if}

							<div class="overflow-x-auto">
								<table class="table table-zebra">
									<thead>
										<tr>
											<th>Date</th>
											<th>Horizon</th>
											<th class="text-right">EPS Mean</th>
											<th class="text-right">EPS High</th>
											<th class="text-right">EPS Low</th>
											<th class="text-right">EPS Analysts</th>
											<th class="text-right">EPS Avg (7/30/60/90d ago)</th>
											<th class="text-right">Rev Mean</th>
											<th class="text-right">Rev High</th>
											<th class="text-right">Rev Low</th>
											<th class="text-right">Revisions (Up/Down 7d, 30d)</th>
										</tr>
									</thead>
									<tbody>
										{#each [...quarterly].reverse() as row}
											<tr>
												<td>{row.date}</td>
												<td>{row.horizon}</td>
												<td class="text-right"
													>{row.epsMean ?? '-'}{#if row.epsMean !== null}
														USD{/if}</td
												>
												<td class="text-right"
													>{row.epsHigh ?? '-'}{#if row.epsHigh !== null}
														USD{/if}</td
												>
												<td class="text-right"
													>{row.epsLow ?? '-'}{#if row.epsLow !== null}
														USD{/if}</td
												>
												<td class="text-right">{row.epsAnalystCount ?? '-'}</td>
												<td class="text-right"
													>{[row.epsAvg7, row.epsAvg30, row.epsAvg60, row.epsAvg90]
														.map((v) => v ?? '-')
														.join(' / ')}</td
												>
												<td class="text-right"
													>{row.revMean ?? '-'}{#if row.revMean !== null}
														USD{/if}</td
												>
												<td class="text-right"
													>{row.revHigh ?? '-'}{#if row.revHigh !== null}
														USD{/if}</td
												>
												<td class="text-right"
													>{row.revLow ?? '-'}{#if row.revLow !== null}
														USD{/if}</td
												>
												<td class="text-right"
													>{[
														row.revUp7 ?? '-',
														row.revDown7 ?? '-',
														row.revUp30 ?? '-',
														row.revDown30 ?? '-'
													].join(' / ')}</td
												>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				{/await}
			{/key}
		{/if}
	{/if}
</section>
