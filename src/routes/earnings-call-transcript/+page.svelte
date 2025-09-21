<script lang="ts">
	import { symbolStore } from '$lib/stores/symbol';
	import { callAlphaVantageFromBrowser } from '$lib/client/alphaVantage';
	import SymbolSearch from '$lib/components/SymbolSearch.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import { sanitizeInput } from '$lib/utils/sanitize';

	let loading = false;
	let error: string | null = null;
	let data: any = null;
	let quarter = '2024Q1';

	interface TranscriptEntry {
		speaker: string;
		title: string;
		content: string;
		sentiment: string;
	}

	interface EarningsCallData {
		symbol: string;
		quarter: string;
		transcript: TranscriptEntry[];
	}

	async function fetchTranscript() {
		error = null;
		data = null;
		const s = $symbolStore.trim().toUpperCase();
		if (!s) {
			error = 'Please enter a symbol';
			return;
		}
		// Sanitize the quarter input
		quarter = sanitizeInput(quarter);
		if (!quarter.trim()) {
			error = 'Please enter a quarter (e.g., 2024Q1)';
			return;
		}
		loading = true;
		try {
			const result = await callAlphaVantageFromBrowser('EARNINGS_CALL_TRANSCRIPT', {
				symbol: s,
				quarter: quarter.trim()
			});
			if (!result.ok) {
				error = result.upstreamNote || result.error || 'Request failed';
				const payload = (result.data ?? {}) as Record<string, any>;
				if (payload && (payload.Note || payload.Information || payload['Error Message'])) {
					error = payload.Note || payload.Information || payload['Error Message'];
				}
			} else {
				data = (result.data ?? null) as EarningsCallData | null;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	// Remove onSubmit as we're using the SymbolSearch component's submit handling

	function formatSentiment(sentiment: string): string {
		const num = parseFloat(sentiment);
		if (isNaN(num)) return sentiment;
		return (num * 100).toFixed(1) + '%';
	}

	function getSentimentColor(sentiment: string): string {
		const num = parseFloat(sentiment);
		if (isNaN(num)) return 'text-base-content';
		if (num >= 0.6) return 'text-success';
		if (num >= 0.4) return 'text-warning';
		return 'text-error';
	}

	function truncateContent(content: string, maxLength = 200): string {
		if (content.length <= maxLength) return content;
		return content.substring(0, maxLength) + '...';
	}

	$: transcriptEntries = data?.transcript || [];
	$: speakers = Array.from(
		new Set(transcriptEntries.map((entry: TranscriptEntry) => entry.speaker))
	);
</script>

<section class="space-y-6">
	<div class="flex items-center gap-3">
		<BackButton variant="primary" size="sm" />
		<h1 class="text-3xl font-bold">Earnings Call Transcript</h1>
		<div class="badge badge-info">Alpha Intelligence&trade;</div>
	</div>

	<div class="card bg-base-100 shadow">
		<div class="card-body">
			<div class="flex flex-wrap items-end gap-3">
				<SymbolSearch 
					showSubmitButton={false}
				/>
				<label class="form-control w-full sm:w-auto">
					<div class="label">
						<span class="label-text font-semibold">Quarter</span>
					</div>
					<input
						id="quarter"
						name="quarter"
						class="input-bordered input w-32"
						bind:value={quarter}
						oninput={() => { quarter = sanitizeInput(quarter); }}
						placeholder="e.g. 2024Q1"
						autocomplete="off"
						spellcheck={false}
					/>
				</label>
				<button type="button" class="btn btn-primary" disabled={loading} onclick={fetchTranscript}>
					{#if loading}
						<span class="loading loading-sm loading-spinner"></span>
						Loading
					{:else}
						Fetch Transcript
					{/if}
				</button>
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
			Fetching earnings call transcript from Alpha Vantage…
		</div>
	{/if}

	{#if data}
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<div class="mb-4 flex flex-wrap items-center justify-between gap-4">
					<h2 class="card-title">
						{data.symbol} - {data.quarter} Earnings Call Transcript
					</h2>
					<div class="stats shadow-sm">
						<div class="stat">
							<div class="stat-title">Total Speakers</div>
							<div class="stat-value text-lg">{speakers.length}</div>
						</div>
						<div class="stat">
							<div class="stat-title">Entries</div>
							<div class="stat-value text-lg">{transcriptEntries.length}</div>
						</div>
					</div>
				</div>

				{#if transcriptEntries.length === 0}
					<div class="alert alert-warning">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 shrink-0 stroke-current"
							fill="none"
							viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
							/></svg
						>
						<span>No transcript data available for this symbol and quarter.</span>
					</div>
				{:else}
					<div class="space-y-4">
						{#each transcriptEntries as entry, i}
							<div class="card border-l-4 border-primary bg-base-200">
								<div class="card-body p-4">
									<div class="mb-2 flex flex-wrap items-center justify-between gap-2">
										<div class="text-lg font-semibold">
											{entry.speaker}
											{#if entry.title}
												<span class="text-sm font-normal text-base-content/70">— {entry.title}</span
												>
											{/if}
										</div>
										{#if entry.sentiment}
											<div class="badge badge-outline {getSentimentColor(entry.sentiment)}">
												Sentiment: {formatSentiment(entry.sentiment)}
											</div>
										{/if}
									</div>
									<div class="text-sm leading-relaxed whitespace-pre-wrap">
										{entry.content}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</section>
