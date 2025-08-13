<script lang="ts">
  import { formatValue } from '$lib/utils';
  import { symbolStore } from '$lib/stores/symbol';
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
      const res = await fetch(`/api/cash-flow?symbol=${encodeURIComponent(s)}`);
      const ct = res.headers.get('content-type') || '';
      const isJSON = ct.includes('application/json');
      const body = isJSON ? await res.json() : await res.text();
      if (!res.ok) {
        error = isJSON ? JSON.stringify(body) : String(body);
      } else {
        data = body as Record<string, any>;
        if (data && (data.Note || data.Information || data['Error Message'])) {
          error = (data as any).Note || (data as any).Information || (data as any)['Error Message'];
          data = null;
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  function onSubmit(e: Event) {
    e.preventDefault();
    fetchCashFlow();
  }

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
    const aLen = Array.isArray((data as any).annualReports) ? (data as any).annualReports.length : 0;
    const qLen = Array.isArray((data as any).quarterlyReports) ? (data as any).quarterlyReports.length : 0;
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
  <div class="flex items-center gap-3">
    <h1 class="text-3xl font-bold">Alpha Vantage — Cash Flow</h1>
    <div class="badge badge-primary">Fundamentals</div>
  </div>

  <div class="card bg-base-100 shadow">
    <div class="card-body">
      <form class="flex flex-wrap items-end gap-3" on:submit={onSubmit}>
        <label class="form-control w-full sm:w-auto">
          <div class="label">
            <span class="label-text font-semibold">Symbol</span>
          </div>
          <input
            id="symbol"
            name="symbol"
            class="input input-bordered w-48"
            bind:value={$symbolStore}
            placeholder="e.g. AAPL"
            autocomplete="off"
          />
        </label>
        <button type="submit" class="btn btn-primary" disabled={loading}>
          {#if loading}
            <span class="loading loading-spinner loading-sm"></span>
            Loading
          {:else}
            Fetch Cash Flow
          {/if}
        </button>
        {#if data}
          <div class="flex items-center gap-2 ml-auto">
            <span class="label-text font-semibold">View:</span>
            <div class="join">
              <button type="button" class="btn btn-sm md:btn-md join-item" class:btn-primary={tab === 'annual'} class:btn-ghost={tab !== 'annual'} on:click={() => (tab = 'annual')}>
                Annual
              </button>
              <button type="button" class="btn btn-sm md:btn-md join-item" class:btn-primary={tab === 'quarterly'} class:btn-ghost={tab !== 'quarterly'} on:click={() => (tab = 'quarterly')}>
                Quarterly
              </button>
            </div>
          </div>
        {/if}
      </form>

      {#if error}
        <div class="alert alert-error whitespace-pre-wrap mt-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>{error}</span>
        </div>
      {/if}
    </div>
  </div>

  {#if loading && !data}
    <div class="flex items-center gap-2 text-base-content/70">
      <span class="loading loading-dots loading-md"></span>
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
                <div class="rounded-lg border border-base-300 overflow-hidden">
                  <div class="px-3 py-2 bg-base-200 font-semibold flex items-center justify-between">
                    <span>Annual Report {i + 1} — {report.fiscalDateEnding}</span>
                    {#if splits.hidden.length}
                      <button type="button" class="btn btn-xs" on:click|preventDefault|stopPropagation={() => toggleExpanded('annual', i)} aria-expanded={expandedAnnualFlags[i]}>
                        {expandedAnnualFlags[i] ? 'Show less' : `Show ${splits.hidden.length} more`}
                      </button>
                    {/if}
                  </div>
                  <div class="p-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {#each splits.visible as k}
                        <div class="card bg-base-200 p-3">
                          <div class="text-[11px] uppercase tracking-wide text-base-content/60">{k}</div>
                          <div class="text-sm font-semibold break-words">{formatValue(k, report[k])}</div>
                        </div>
                      {/each}
                      {#if expandedAnnualFlags[i]}
                        {#each splits.hidden as k}
                          <div class="card bg-base-200 p-3">
                            <div class="text-[11px] uppercase tracking-wide text-base-content/60">{k}</div>
                            <div class="text-sm font-semibold break-words">{formatValue(k, report[k])}</div>
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
        {:else}
          {#if (data as any).quarterlyReports?.length}
            <div class="mt-3 space-y-3">
              {#each (data as any).quarterlyReports as report, i}
                {@const splits = splitKeys(report)}
                <div class="rounded-lg border border-base-300 overflow-hidden">
                  <div class="px-3 py-2 bg-base-200 font-semibold flex items-center justify-between">
                    <span>Quarterly Report {i + 1} — {report.fiscalDateEnding}</span>
                    {#if splits.hidden.length}
                      <button type="button" class="btn btn-xs" on:click|preventDefault|stopPropagation={() => toggleExpanded('quarterly', i)} aria-expanded={expandedQuarterlyFlags[i]}>
                        {expandedQuarterlyFlags[i] ? 'Show less' : `Show ${splits.hidden.length} more`}
                      </button>
                    {/if}
                  </div>
                  <div class="p-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {#each splits.visible as k}
                        <div class="card bg-base-200 p-3">
                          <div class="text-[11px] uppercase tracking-wide text-base-content/60">{k}</div>
                          <div class="text-sm font-semibold break-words">{formatValue(k, report[k])}</div>
                        </div>
                      {/each}
                      {#if expandedQuarterlyFlags[i]}
                        {#each splits.hidden as k}
                          <div class="card bg-base-200 p-3">
                            <div class="text-[11px] uppercase tracking-wide text-base-content/60">{k}</div>
                            <div class="text-sm font-semibold break-words">{formatValue(k, report[k])}</div>
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
        {/if}
      </div>
    </div>
  {/if}
</section>
