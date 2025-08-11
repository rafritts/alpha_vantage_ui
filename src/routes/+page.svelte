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
    <!-- Add more cards as you build out more API pages -->
  </div>
</div>

