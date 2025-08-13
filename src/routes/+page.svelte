<script>
  import Card from '$lib/components/Card.svelte';
</script>

<div class="container mx-auto px-4 py-8">
  <div class="text-center mb-12">
    <h1 class="text-4xl font-bold mb-2">Alpha Vantage API Data Viewer</h1>
    <p class="text-lg text-gray-500">Click on any of the cards below to view the API data.</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Card 
      title="Company Overview"
      description="Get fundamental data for a company, including financial ratios, and market capitalization."
      href="/company-overview"
    />
    <Card 
      title="Income Statement"
      description="Access a company's income statements, with detailed quarterly and annual reports."
      href="/income-statement"
    />
    <Card 
      title="Balance Sheet"
      description="Get a company's balance sheet, with detailed quarterly and annual reports."
      href="/balance-sheet"
    />

    <Card 
      title="Cash Flow"
      description="View a company's cash flow statements, with detailed quarterly and annual reports."
      href="/cash-flow"
    />

    <Card 
      title="Global Quote"
      description="Fetch latest price, change and other intraday quote metrics for a symbol."
      href="/global-quote"
    />

    <Card 
      title="News Sentiment"
      description="Search latest news and sentiment scores for tickers and topics using Alpha Vantage's News Sentiment API."
      href="/news-sentiment"
    />

    <Card 
      title="Earnings History"
      description="View quarterly and annual EPS, surprises, and visualize trends over time."
      href="/earnings-history"
    />

    <Card 
      title="Earnings Estimates"
      description="See analyst EPS estimates (annual and quarterly) with simple visualizations."
      href="/earnings-estimates"
    />

    <!-- Add more cards as you build out more API pages -->
  </div>
</div>

