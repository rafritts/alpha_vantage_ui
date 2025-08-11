<script lang="ts">
  let symbol = 'AAPL';
  let loading = false;
  let error: string | null = null;
  let data: Record<string, any> | null = null;
  let tab: 'summary' | 'all' = 'summary';
  let query = '';

  const importantKeys = [
    'Name',
    'Symbol',
    'AssetType',
    'Exchange',
    'Currency',
    'Country',
    'Sector',
    'Industry',
    'MarketCapitalization',
    'PERatio',
    'EPS',
    'DividendYield',
    '52WeekHigh',
    '52WeekLow',
    '50DayMovingAverage',
    '200DayMovingAverage',
    'AnalystTargetPrice',
    'ProfitMargin',
    'OperatingMarginTTM',
    'ReturnOnAssetsTTM',
    'ReturnOnEquityTTM'
  ];

  function filteredEntries() {
    const entries = Object.entries(data || {});
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(([k, v]) =>
      k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q)
    );
  }

  function getVal(key: string) {
    return data ? data[key] : undefined;
  }

  // Formatting helpers
  const percentKeys = new Set([
    'DividendYield',
    'ProfitMargin',
    'OperatingMarginTTM',
    'ReturnOnAssetsTTM',
    'ReturnOnEquityTTM',
    'QuarterlyEarningsGrowthYOY',
    'QuarterlyRevenueGrowthYOY'
  ]);

  const currencyKeys = new Set([
    'MarketCapitalization',
    'EBITDA',
    'RevenueTTM',
    'GrossProfitTTM',
    'AnalystTargetPrice',
    'EPS',
    'DilutedEPSTTM',
    '52WeekHigh',
    '52WeekLow',
    '50DayMovingAverage',
    '200DayMovingAverage'
  ]);

  function isNumeric(v: any) {
    if (typeof v === 'number') return Number.isFinite(v);
    if (typeof v !== 'string') return false;
    const s = v.replace(/[,\s]/g, '');
    return s !== '' && !isNaN(Number(s));
  }

  function toNumber(v: any): number | null {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const n = Number(v.replace(/[,\s]/g, ''));
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  function fmtCurrency(n: number, minFrac = 0, maxFrac = 0) {
    const ccy = (data && data.Currency) || 'USD';
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: ccy,
        minimumFractionDigits: minFrac,
        maximumFractionDigits: maxFrac
      }).format(n);
    } catch {
      // Fallback to USD if currency code is unexpected
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: minFrac,
        maximumFractionDigits: maxFrac
      }).format(n);
    }
  }

  function formatValue(key: string, v: any): string {
    // Only format primitives/strings; objects are handled upstream
    if (v == null) return '';
    const num = toNumber(v);

    if (percentKeys.has(key) && num !== null) {
      // Values are decimals (e.g., 0.1234 => 12.34%)
      return `${(num * 100).toFixed(2)}%`;
    }

    if (currencyKeys.has(key) && num !== null) {
      // Use 2 decimals for price-like values, 0 for big aggregates unless < 1000
      const isPriceLike = ['AnalystTargetPrice', 'EPS', 'DilutedEPSTTM', '52WeekHigh', '52WeekLow', '50DayMovingAverage', '200DayMovingAverage'].includes(key);
      const minFrac = isPriceLike ? 2 : 0;
      const maxFrac = isPriceLike ? 2 : 0;
      return fmtCurrency(num, minFrac, maxFrac);
    }

    // Heuristic: keys ending with 'Margin' are percents
    if (/Margin$/i.test(key) && num !== null) {
      return `${(num * 100).toFixed(2)}%`;
    }

    // If looks numeric but not categorized, keep original formatting
    return String(v);
  }

  async function fetchOverview() {
    error = null;
    data = null;
    const s = symbol.trim().toUpperCase();
    if (!s) {
      error = 'Please enter a symbol';
      return;
    }
    loading = true;
    try {
      const res = await fetch(`/api/overview?symbol=${encodeURIComponent(s)}`);
      const ct = res.headers.get('content-type') || '';
      const isJSON = ct.includes('application/json');
      const body = isJSON ? await res.json() : await res.text();
      if (!res.ok) {
        error = isJSON ? JSON.stringify(body) : String(body);
      } else {
        data = body as Record<string, any>;
        if (data && (data.Note || data.Information || data['Error Message'])) {
          // Upstream informational/rate-limit
          error = data.Note || data.Information || data['Error Message'];
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
    fetchOverview();
  }
</script>

<section class="space-y-6">
  <div class="flex items-center gap-3">
    <h1 class="text-3xl font-bold">Alpha Vantage — Company Overview</h1>
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
            bind:value={symbol}
            placeholder="e.g. AAPL"
            autocomplete="off"
          />
        </label>
        <button type="submit" class="btn btn-primary" disabled={loading}>
          {#if loading}
            <span class="loading loading-spinner loading-sm"></span>
            Loading
          {:else}
            Fetch Overview
          {/if}
        </button>
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
      Fetching overview from Alpha Vantage…
    </div>
  {/if}

  {#if data}
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Results for {symbol.toUpperCase()}</h2>

        <div class="tabs tabs-boxed w-fit">
          <button class="tab {tab === 'summary' ? 'tab-active' : ''}" on:click={() => (tab = 'summary')}>Summary</button>
          <button class="tab {tab === 'all' ? 'tab-active' : ''}" on:click={() => (tab = 'all')}>All fields</button>
        </div>

        {#if tab === 'summary'}
          <div class="mt-3 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {#each importantKeys as key}
                {#if getVal(key) != null}
                  <div class="p-3 rounded-lg bg-base-200">
                    <div class="text-xs uppercase tracking-wide text-base-content/60">{key}</div>
                    <div class="text-sm font-semibold break-words">{formatValue(key, getVal(key))}</div>
                  </div>
                {/if}
              {/each}
            </div>

            {#if getVal('Description')}
              <details class="collapse collapse-arrow bg-base-200">
                <summary class="collapse-title text-md font-semibold">Description</summary>
                <div class="collapse-content text-sm whitespace-pre-wrap">{getVal('Description')}</div>
              </details>
            {/if}
          </div>
        {:else}
          <div class="mt-3 space-y-3">
            <div class="form-control">
              <label class="input input-bordered flex items-center gap-2 w-full sm:w-96">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 opacity-70"><path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clip-rule="evenodd" /></svg>
                <input type="text" class="grow" placeholder="Filter fields..." bind:value={query} />
              </label>
            </div>

            <div class="overflow-x-auto">
              <div class="max-h-[60vh] overflow-y-auto rounded-lg border border-base-300">
                <table class="table table-zebra">
                  <tbody>
                    {#each filteredEntries() as [k, v]}
                      <tr>
                        <td class="w-64 text-sm text-base-content/70 align-top">{k}</td>
                        <td class="font-medium break-words">
                          {#if typeof v === 'object'}
                            <pre class="text-xs whitespace-pre-wrap">{JSON.stringify(v, null, 2)}</pre>
                          {:else}
                            {formatValue(k, v)}
                          {/if}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</section>
