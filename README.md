# Alpha Vantage UI (SvelteKit 5)

A simple SvelteKit UI for Alpha Vantage Fundamental Data, starting with the Company Overview endpoint.

## Prerequisites

- Node.js 18+
- An Alpha Vantage API key: https://www.alphavantage.co/support/#api-key

## Setup

1. Install dependencies:

```sh
npm install
```

2. Create your env file:

```sh
cp .env.example .env
# then edit .env and set your key
```

Required var in `.env`:

```ini
ALPHA_VANTAGE_API_KEY=YOUR_KEY
```

This is read on the server only via `$env/dynamic/private` and is never exposed to the client.

## Run

```sh
npm run dev
```

Dev server default: http://localhost:5173

## Usage

- Open the app and enter a stock symbol (e.g., AAPL). Click "Fetch Overview".
- The app calls the SvelteKit server route `GET /api/overview?symbol=...`, which securely proxies the request to Alpha Vantage using your server-side API key.
- Results render as a grid of key/value fields. If rate limited, the error/Note from Alpha Vantage is shown.

### API route

`src/routes/api/overview/+server.ts` implements the proxy to Alpha Vantage `function=OVERVIEW`.

### UI route

`src/routes/+page.svelte` renders the input form, loading, error, and results grid.

## Build

```sh
npm run build
npm run preview
```

## Deployment

This project is deployed on Vercel using the SvelteKit adapter-auto, which automatically configures the project for Vercel deployment.
