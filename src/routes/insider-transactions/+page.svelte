<script lang="ts">
	import { symbolStore } from '$lib/stores/symbol';
	import { callAlphaVantageFromBrowser } from '$lib/client/alphaVantage';
	import SymbolSearch from '$lib/components/SymbolSearch.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	interface InsiderTransaction {
		transaction_date: string;
		ticker: string;
		executive: string;
		executive_title: string;
		security_type: string;
		acquisition_or_disposal: 'A' | 'D';
		shares: string;
		share_price: string;
	}

	let loading = false;
	let error: string | null = null;
	let data: Record<string, any> | null = null;
	let transactions: InsiderTransaction[] = [];

	async function fetchInsiderTransactions() {
		error = null;
		data = null;
		transactions = [];
		const s = $symbolStore.trim().toUpperCase();
		if (!s) {
			error = 'Please enter a symbol';
			return;
		}
		loading = true;
		try {
			const result = await callAlphaVantageFromBrowser('INSIDER_TRANSACTIONS', { symbol: s });
			if (!result.ok) {
				error = result.upstreamNote || result.error || 'Request failed';
				const payload = (result.data ?? {}) as Record<string, any>;
				if (payload && (payload.Note || payload.Information || payload['Error Message'])) {
					error = payload.Note || payload.Information || payload['Error Message'];
				}
			} else {
				data = (result.data ?? {}) as Record<string, any>;
				// Find the key that contains the transactions array
				const transactionsKey = Object.keys(data).find(
					(key) =>
						key !== 'Note' &&
						key !== 'Information' &&
						key !== 'Error Message' &&
						Array.isArray(data[key])
				);
				if (transactionsKey && Array.isArray(data[transactionsKey])) {
					transactions = data[transactionsKey] as InsiderTransaction[];
				}
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	function formatNumber(value: string): string {
		const num = Number(value);
		if (isNaN(num)) return value;
		return new Intl.NumberFormat('en-US').format(num);
	}

	function formatPrice(price: string): string {
		const num = Number(price);
		if (isNaN(num)) return price;
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(num);
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(date);
	}

	function getTransactionTypeLabel(type: string): string {
		return type === 'A' ? 'Acquisition' : 'Disposal';
	}

	function getTransactionTypeColor(type: string): string {
		return type === 'A' ? 'badge-success' : 'badge-error';
	}
</script>

<section class="space-y-6">
	<PageHeader title="Insider Transactions" badgeText="Regulatory Data" badgeColor="warning" />

	<div class="card bg-base-100 shadow">
		<div class="card-body">
			<div class="flex flex-wrap items-end gap-3">
				<SymbolSearch
					submitButtonText={loading ? 'Loading...' : 'Fetch Insider Transactions'}
					{loading}
					on:search={() => fetchInsiderTransactions()}
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

	{#if loading && transactions.length === 0}
		<div class="flex items-center gap-2 text-base-content/70">
			<span class="loading loading-md loading-dots"></span>
			Fetching insider transactions from Alpha Vantage…
		</div>
	{/if}

	{#if transactions.length > 0}
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<h2 class="card-title">Insider Transactions for {$symbolStore.toUpperCase()}</h2>
				<div class="mb-4 text-sm text-base-content/60">
					Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
				</div>

				<div class="overflow-x-auto">
					<table class="table table-zebra">
						<thead>
							<tr>
								<th>Date</th>
								<th>Executive</th>
								<th>Title</th>
								<th>Type</th>
								<th>Security</th>
								<th>Shares</th>
								<th>Price</th>
								<th>Total Value</th>
							</tr>
						</thead>
						<tbody>
							{#each transactions as transaction}
								<tr>
									<td class="whitespace-nowrap">
										{formatDate(transaction.transaction_date)}
									</td>
									<td class="font-medium">
										{transaction.executive}
									</td>
									<td class="text-sm">
										{transaction.executive_title}
									</td>
									<td>
										<span
											class="badge {getTransactionTypeColor(
												transaction.acquisition_or_disposal
											)} badge-sm"
										>
											{getTransactionTypeLabel(transaction.acquisition_or_disposal)}
										</span>
									</td>
									<td class="text-sm">
										{transaction.security_type}
									</td>
									<td class="text-right font-mono">
										{formatNumber(transaction.shares)}
									</td>
									<td class="text-right font-mono">
										{formatPrice(transaction.share_price)}
									</td>
									<td class="text-right font-mono font-medium">
										{formatPrice(
											String(Number(transaction.shares) * Number(transaction.share_price))
										)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}

	{#if !loading && transactions.length === 0 && !error && $symbolStore}
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<p class="text-base-content/60">
					No insider transactions found for {$symbolStore.toUpperCase()}
				</p>
			</div>
		</div>
	{/if}
</section>
