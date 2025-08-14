<script lang="ts">
  import { symbolStore } from '$lib/stores/symbol';
  import { callAlphaVantageBrowser } from '$lib/client/alphaVantage';

  let loading = false;
  let error: string | null = null;
  let data: any = null;

  let showAnnual = false; // toggle between quarterly and annual if desired

  async function fetchEarnings() {
    error = null;
    data = null;
    const s = $symbolStore.trim().toUpperCase();
    if (!s) {
      error = 'Please enter a symbol';
      return;
    }
    loading = true;
    try {
      const result = await callAlphaVantageBrowser('EARNINGS', { symbol: s });
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

  function onSubmit(e: Event) {
    e.preventDefault();
    fetchEarnings();
  }

  type QE = { fiscalDateEnding: string; reportedDate?: string; reportedEPS?: string | number; estimatedEPS?: string | number; surprise?: string | number; surprisePercentage?: string | number };
  type AE = { fiscalDateEnding: string; reportedEPS?: string | number };

  function parseQuarterly(d: any): QE[] {
    const arr = Array.isArray(d?.quarterlyEarnings) ? d.quarterlyEarnings : [];
    return arr
      .map((x: any) => ({
        fiscalDateEnding: String(x.fiscalDateEnding),
        reportedDate: x.reportedDate ? String(x.reportedDate) : undefined,
        reportedEPS: x.reportedEPS,
        estimatedEPS: x.estimatedEPS,
        surprise: x.surprise,
        surprisePercentage: x.surprisePercentage
      }))
      .filter((x: QE) => x.fiscalDateEnding)
      .sort((a: QE, b: QE) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime());
  }

  function parseAnnual(d: any): AE[] {
    const arr = Array.isArray(d?.annualEarnings) ? d.annualEarnings : [];
    return arr
      .map((x: any) => ({
        fiscalDateEnding: String(x.fiscalDateEnding),
        reportedEPS: x.reportedEPS
      }))
      .filter((x: AE) => x.fiscalDateEnding)
      .sort((a: AE, b: AE) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime());
  }

  function toNumber(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return isFinite(n) ? n : null;
  }

  // Simple scales without external libs
  function extent(nums: (number | null)[]): [number, number] {
    const filtered = nums.filter((n): n is number => n !== null && !isNaN(n));
    if (filtered.length === 0) return [0, 1] as [number, number];
    return [Math.min(...filtered), Math.max(...filtered)] as [number, number];
  }

  const pad = 12; // chart padding
  const vw = 800; // viewbox width
  const vh = 280; // viewbox height

  function linePath(xs: number[], ys: (number | null)[], yDomain: [number, number]) {
    const [yMin, yMax] = yDomain;
    const innerW = vw - pad * 2;
    const innerH = vh - pad * 2;
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const xScale = (x: number) => pad + ((x - xMin) / Math.max(1, xMax - xMin)) * innerW;
    const yScale = (y: number) => pad + innerH - ((y - yMin) / Math.max(1e-9, yMax - yMin)) * innerH;

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

  // Axis helpers
  const maxXTicks = 8;
  function xStep(len: number) {
    return Math.max(1, Math.ceil(len / maxXTicks));
  }
  function shortDate(d: string | undefined) {
    if (!d) return '';
    // YYYY-MM-DD -> YYYY-MM
    return String(d).slice(0, 7);
  }
  function yearOnly(d: string | undefined) {
    if (!d) return '';
    return String(d).slice(0, 4);
  }
  function getYScale(yDomain: [number, number]) {
    const [yMin, yMax] = yDomain;
    const innerH = vh - pad * 2;
    return (y: number) => pad + innerH - ((y - yMin) / Math.max(1e-9, yMax - yMin)) * innerH;
  }
  // Nice ticks & domain (inspired by d3-array)
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
    // Ensure zero is included if it lies within the domain
    if (min > 0 && min !== 0) min = Math.min(0, min);
    if (max < 0 && max !== 0) max = Math.max(0, max);
    const range = max - min;
    const step = niceNumber(range / Math.max(1, maxCount), true);
    const niceMin = Math.floor(min / step) * step;
    const niceMax = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let v = niceMin; v <= niceMax + step * 0.5; v += step) {
      ticks.push(v);
    }
    // Deduplicate (floating point) and clamp within [niceMin, niceMax]
    const seen = new Set<string>();
    const out: number[] = [];
    for (const t of ticks) {
      const key = (Math.round(t / (step / 1e6)) * (step / 1e6)).toFixed(6);
      if (!seen.has(key)) {
        if (t >= niceMin - 1e-9 && t <= niceMax + 1e-9) out.push(t);
        seen.add(key);
      }
    }
    return out;
  }
  function niceDomain(domain: [number, number], maxCount = 5): [number, number] {
    const ticks = niceTicks(domain, maxCount);
    if (ticks.length === 0) return domain;
    return [ticks[0], ticks[ticks.length - 1]];
  }
  function formatTick(v: number) {
    const n = Math.abs(v) < 1e-8 ? 0 : v;
    const s = n.toFixed(2);
    return s.replace(/\.00$/, '');
  }

  // Helper to get last non-null numeric value from an array using an accessor
  function lastNumber<T>(arr: T[], fn: (d: T) => number | null): number | null {
    for (let i = arr.length - 1; i >= 0; i--) {
      const v = fn(arr[i]);
      if (v !== null && !isNaN(v)) return v;
    }
    return null;
  }

  // Reported EPS-driven y-axis helpers (low/median/high)
  function numeric<T>(v: T, fn: (x: T) => number | null): number | null {
    const n = fn(v);
    return n !== null && isFinite(n) ? n : null;
  }
  function reportedNumbers<T extends { reportedEPS?: any }>(arr: T[]): number[] {
    return arr
      .map((d) => toNumber(d.reportedEPS))
      .filter((n): n is number => n !== null && isFinite(n));
  }
  function lowMedianHigh(nums: number[]): [number, number, number] {
    const a = [...nums].sort((x, y) => x - y);
    const n = a.length;
    const low = a[0];
    const high = a[n - 1];
    let median = low;
    if (n % 2 === 1) median = a[(n - 1) >> 1];
    else median = (a[n / 2 - 1] + a[n / 2]) / 2;
    return [low, median, high];
  }
  function ticksFromReported<T extends { reportedEPS?: any }>(arr: T[]): number[] {
    const nums = reportedNumbers(arr);
    if (nums.length === 0) return [];
    const [lo, med, hi] = lowMedianHigh(nums);
    // Ensure unique ascending; if collapse happens, synthesize middle tick
    let uniq = Array.from(new Set([lo, med, hi])).sort((a, b) => a - b);
    if (uniq.length < 3) {
      const mid = lo + (hi - lo) / 2;
      uniq = Array.from(new Set([lo, mid, hi])).sort((a, b) => a - b);
    }
    return uniq;
  }
  function domainFromReported<T extends { reportedEPS?: any }>(arr: T[]): [number, number] {
    const t = ticksFromReported(arr);
    if (t.length === 0) return [0, 1];
    const lo = t[0];
    const hi = t[t.length - 1];
    // If flat line (all same), expand slightly to render
    return lo === hi ? [lo - 0.5, hi + 0.5] : [lo, hi];
  }
</script>

<section class="space-y-6">
  <div class="flex items-center gap-3">
    <h1 class="text-3xl font-bold">Alpha Vantage — Earnings History</h1>
    <div class="badge badge-accent">Fundamentals</div>
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
            Fetch Earnings
          {/if}
        </button>
        {#if data}
          <div class="flex items-center gap-2 ml-auto">
            <span class="label-text font-semibold">View:</span>
            <div class="join">
              <button type="button" class="btn btn-sm md:btn-md join-item" class:btn-primary={showAnnual} class:btn-ghost={!showAnnual} on:click={() => (showAnnual = true)}>
                Annual
              </button>
              <button type="button" class="btn btn-sm md:btn-md join-item" class:btn-primary={!showAnnual} class:btn-ghost={showAnnual} on:click={() => (showAnnual = false)}>
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
      Fetching earnings data…
    </div>
  {/if}

  {#if data}
    {#if showAnnual}
      {#key data}
        {#await Promise.resolve(parseAnnual(data)) then annual}
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Annual EPS — {$symbolStore.toUpperCase()}</h2>

              {#if annual.length > 1}
                <div class="w-full overflow-x-auto">
                  <svg viewBox={`0 0 ${vw} ${vh}`} class="w-full max-w-full">
                    <rect x="0" y="0" width={vw} height={vh} class="fill-base-200" />
                    <path
                      d={linePath(
                        Array.from({ length: annual.length }, (_, i) => i),
                        annual.map((d) => toNumber(d.reportedEPS)),
                        domainFromReported(annual)
                      )}
                      class="stroke-primary fill-none"
                      stroke-width="2"
                    />
                    {#if lastNumber(annual, (d) => toNumber(d.reportedEPS)) !== null}
                      <text x={vw - pad} y={pad + 12} text-anchor="end" class="text-[12px] font-semibold fill-base-content">{formatTick(lastNumber(annual, (d) => toNumber(d.reportedEPS))!)}</text>
                    {/if}
                    
                    <!-- X labels -->
                    {#each annual as _row, i}
                      {#if i % xStep(annual.length) === 0 || i === annual.length - 1}
                        <text
                          x={pad + (i / Math.max(1, annual.length - 1)) * (vw - pad * 2)}
                          y={vh - 2}
                          text-anchor="middle"
                          class="text-[10px] fill-base-content/70"
                        >
                          {yearOnly(annual[i].fiscalDateEnding)}
                        </text>
                      {/if}
                    {/each}
                  </svg>
                </div>
              {/if}

              <div class="overflow-x-auto">
                <table class="table table-zebra">
                  <thead>
                    <tr>
                      <th>Fiscal Date Ending</th>
                      <th class="text-right">Reported EPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each [...annual].reverse() as row}
                      <tr>
                        <td>{row.fiscalDateEnding}</td>
                        <td class="text-right">{toNumber(row.reportedEPS) ?? '-'}{#if toNumber(row.reportedEPS) !== null} USD{/if}</td>
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
              <h2 class="card-title">Quarterly EPS — {$symbolStore.toUpperCase()}</h2>

              {#if quarterly.length > 1}
                <div class="w-full overflow-x-auto">
                  <svg viewBox={`0 0 ${vw} ${vh}`} class="w-full max-w-full">
                    <rect x="0" y="0" width={vw} height={vh} class="fill-base-200" />
                    <path
                      d={linePath(
                        Array.from({ length: quarterly.length }, (_, i) => i),
                        quarterly.map((d) => toNumber(d.estimatedEPS)),
                        domainFromReported(quarterly)
                      )}
                      class="stroke-secondary/70 fill-none"
                      stroke-dasharray="4 3"
                      stroke-width="2"
                    />
                    <path
                      d={linePath(
                        Array.from({ length: quarterly.length }, (_, i) => i),
                        quarterly.map((d) => toNumber(d.reportedEPS)),
                        domainFromReported(quarterly)
                      )}
                      class="stroke-primary fill-none"
                      stroke-width="2"
                    />
                    <g>
                      <circle cx={pad + 8} cy={pad + 10} r="4" class="fill-primary" />
                      <text x={pad + 16} y={pad + 14} class="text-[11px] fill-base-content/80">Reported EPS</text>
                      <rect x={pad + 130} y={pad + 6} width="10" height="4" class="fill-none stroke-secondary/70" stroke-dasharray="4 3" stroke-width="2" />
                      <text x={pad + 146} y={pad + 14} class="text-[11px] fill-base-content/80">Estimated EPS</text>
                    </g>
                    {#if lastNumber(quarterly, (d) => toNumber(d.reportedEPS)) !== null}
                      <text x={vw - pad} y={pad + 12} text-anchor="end" class="text-[12px] font-semibold fill-base-content">{formatTick(lastNumber(quarterly, (d) => toNumber(d.reportedEPS))!)}</text>
                    {/if}
                    
                    <!-- X labels -->
                    {#each quarterly as _row, i}
                      {#if i % xStep(quarterly.length) === 0 || i === quarterly.length - 1}
                        <text
                          x={pad + (i / Math.max(1, quarterly.length - 1)) * (vw - pad * 2)}
                          y={vh - 2}
                          text-anchor="middle"
                          class="text-[10px] fill-base-content/70"
                        >
                          {shortDate(quarterly[i].fiscalDateEnding)}
                        </text>
                      {/if}
                    {/each}
                  </svg>
                </div>
              {/if}

              <div class="overflow-x-auto">
                <table class="table table-zebra">
                  <thead>
                    <tr>
                      <th>Fiscal Date Ending</th>
                      <th>Reported Date</th>
                      <th class="text-right">Estimated EPS</th>
                      <th class="text-right">Reported EPS</th>
                      <th class="text-right">Surprise</th>
                      <th class="text-right">Surprise %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each [...quarterly].reverse() as row}
                      <tr>
                        <td>{row.fiscalDateEnding}</td>
                        <td>{row.reportedDate ?? '-'}</td>
                        <td class="text-right">{toNumber(row.estimatedEPS) ?? '-'}</td>
                        <td class="text-right">{toNumber(row.reportedEPS) ?? '-'}</td>
                        <td class="text-right">{toNumber(row.surprise) ?? '-'}</td>
                        <td class="text-right">{toNumber(row.surprisePercentage) ?? '-'}</td>
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
