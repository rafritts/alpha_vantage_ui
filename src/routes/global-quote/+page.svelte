<script lang="ts">
  let symbol = 'IBM';
  let loading = false;
  let error: string | null = null;
  let data: Record<string, any> | null = null;

  async function fetchQuote() {
    error = null;
    data = null;
    const s = symbol.trim().toUpperCase();
    if (!s) {
      error = 'Please enter a symbol';
      return;
    }
    loading = true;
    try {
      const res = await fetch(`/api/global-quote?symbol=${encodeURIComponent(s)}`);
      const ct = res.headers.get('content-type') || '';
      const isJSON = ct.includes('application/json');
      const body = isJSON ? await res.json() : await res.text();
      if (!res.ok) {
        error = isJSON ? JSON.stringify(body) : String(body);
      } else {
        const payload = body as Record<string, any>;
        if (payload && (payload.Note || payload.Information || payload['Error Message'])) {
          error = payload.Note || payload.Information || payload['Error Message'];
        } else {
          data = payload['Global Quote'] ?? payload;
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
    fetchQuote();
  }

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
    <h1 class="text-3xl font-bold">Alpha Vantage — Global Quote</h1>
    <div class="badge badge-secondary">Market Data</div>
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
            placeholder="e.g. IBM"
            autocomplete="off"
          />
        </label>
        <button type="submit" class="btn btn-primary" disabled={loading}>
          {#if loading}
            <span class="loading loading-spinner loading-sm"></span>
            Loading
          {:else}
            Fetch Global Quote
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
      Fetching global quote from Alpha Vantage…
    </div>
  {/if}

  {#if data}
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Results for {symbol.toUpperCase()}</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
          {#each displayPairs(data) as [key, label]}
            <div class="card bg-base-200 p-3">
              <div class="text-[11px] uppercase tracking-wide text-base-content/60">{label}</div>
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
