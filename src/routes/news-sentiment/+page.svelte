<script lang="ts">
  import { symbolStore } from '$lib/stores/symbol';
  import { onMount } from 'svelte';
  let tickers = 'AAPL';
  let topics = '';
  let time_from = '';
  let time_to = '';
  let sort: 'LATEST' | 'EARLIEST' | '' = 'LATEST';
  let limit: number | '' = 50;

  let loading = false;
  let error: string | null = null;
  let data: any = null;

  function buildQuery() {
    const params = new URLSearchParams();
    if (tickers.trim()) params.set('tickers', tickers.trim());
    if (topics.trim()) params.set('topics', topics.trim());
    if (time_from.trim()) params.set('time_from', time_from.trim());
    if (time_to.trim()) params.set('time_to', time_to.trim());
    if (sort) params.set('sort', sort);
    if (limit !== '' && Number(limit) > 0) params.set('limit', String(limit));
    return params.toString();
  }

  async function fetchNews() {
    error = null;
    data = null;
    // If a single ticker is provided, sync it to the global symbol store
    const single = tickers.split(',').map((t) => t.trim()).filter(Boolean);
    if (single.length === 1) {
      symbolStore.set(single[0].toUpperCase());
    }
    const q = buildQuery();
    if (!q.includes('tickers=') && !q.includes('topics=')) {
      error = 'Please provide at least one of: tickers or topics';
      return;
    }
    loading = true;
    try {
      const res = await fetch(`/api/news-sentiment?${q}`);
      const ct = res.headers.get('content-type') || '';
      const isJSON = ct.includes('application/json');
      const body = isJSON ? await res.json() : await res.text();
      if (!res.ok) {
        error = isJSON ? JSON.stringify(body) : String(body);
      } else {
        data = body;
        if (data && (data.Note || data.Information || data['Error Message'])) {
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
    fetchNews();
  }

  // Initialize tickers from the global symbol once on mount
  onMount(() => {
    if ($symbolStore) {
      tickers = $symbolStore;
    }
  });
</script>

<section class="space-y-6">
  <div class="flex items-center gap-3">
    <h1 class="text-3xl font-bold">Alpha Vantage — News Sentiment</h1>
    <div class="badge badge-secondary">News & Sentiment</div>
  </div>

  <div class="card bg-base-100 shadow">
    <div class="card-body">
      <form class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" on:submit={onSubmit}>
        <label class="form-control">
          <div class="label"><span class="label-text font-semibold">Tickers (comma separated)</span></div>
          <input class="input input-bordered" placeholder="e.g. AAPL,MSFT" bind:value={tickers} />
        </label>
        <label class="form-control">
          <div class="label"><span class="label-text font-semibold">Topics (comma separated)</span></div>
          <input class="input input-bordered" placeholder="e.g. technology,finance" bind:value={topics} />
        </label>
        <label class="form-control">
          <div class="label"><span class="label-text font-semibold">Sort</span></div>
          <select class="select select-bordered" bind:value={sort}>
            <option value="LATEST">LATEST</option>
            <option value="EARLIEST">EARLIEST</option>
          </select>
        </label>
        <label class="form-control">
          <div class="label"><span class="label-text font-semibold">Limit</span></div>
          <input class="input input-bordered" type="number" min="1" max="200" bind:value={limit} />
        </label>
        <label class="form-control">
          <div class="label"><span class="label-text font-semibold">Time From (YYYYMMDDTHHMM)</span></div>
          <input class="input input-bordered" placeholder="e.g. 20240101T0000" bind:value={time_from} />
        </label>
        <label class="form-control">
          <div class="label"><span class="label-text font-semibold">Time To (YYYYMMDDTHHMM)</span></div>
          <input class="input input-bordered" placeholder="e.g. 20251231T2359" bind:value={time_to} />
        </label>

        <div class="md:col-span-2 lg:col-span-3 flex items-end gap-3">
          <button type="submit" class="btn btn-primary" disabled={loading}>
            {#if loading}
              <span class="loading loading-spinner loading-sm"></span>
              Loading
            {:else}
              Fetch News
            {/if}
          </button>
          {#if error}
            <div class="alert alert-error whitespace-pre-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>{error}</span>
            </div>
          {/if}
        </div>
      </form>
    </div>
  </div>

  {#if loading && !data}
    <div class="flex items-center gap-2 text-base-content/70">
      <span class="loading loading-dots loading-md"></span>
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
                <img src={item.banner_image} alt="banner" class="w-24 h-24 object-cover rounded" />
              {/if}
              <div class="flex-1">
                <a href={item.url} target="_blank" rel="noreferrer" class="link link-primary text-lg font-semibold">{item.title}</a>
                <div class="text-sm text-base-content/70">
                  <span>{item.source}</span>
                  {#if item.time_published}
                    <span> • {item.time_published}</span>
                  {/if}
                </div>
                {#if item.summary}
                  <div class="text-sm mt-1">{item.summary}</div>
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
        <details class="collapse collapse-arrow mt-2">
          <summary class="collapse-title text-md font-semibold">Raw response</summary>
          <div class="collapse-content text-xs whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</div>
        </details>
      </div>
    </div>
  {/if}
</section>
