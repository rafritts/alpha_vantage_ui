# Alpha Vantage UI (SvelteKit 5)

A modern SvelteKit UI for Alpha Vantage financial data APIs, providing access to multiple endpoints including company fundamentals, stock quotes, financial statements, and earnings data.

## Prerequisites

- Node.js 18+
- An Alpha Vantage API key: https://www.alphavantage.co/support/#api-key

## Setup

1. Install dependencies:

```sh
npm install
```

2. Start the development server:

```sh
npm run dev
```

Dev server default: http://localhost:5173

## API Key Management

This application uses client-side API key management with two storage options:

1. **Session Storage (Default)**: Your API key is stored in the browser's session storage and is automatically cleared when you close the tab.

2. **Encrypted Local Storage (Optional)**: You can choose to store your API key encrypted in local storage for persistence across browser sessions. The key is encrypted using AES encryption from the crypto-js library.

To set your API key, click the "API Key" button in the navigation bar and enter your key. You can toggle between session-only and persistent storage using the checkbox.

## Security Features

- **HTML Sanitization**: All user inputs are sanitized using the native browser Sanitizer API to prevent XSS attacks
- **AES Encryption**: API keys stored in localStorage are encrypted using AES encryption for enhanced security
- **Session-only Storage**: By default, API keys are stored in sessionStorage and cleared when the browser tab closes

## Available Endpoints

The application provides UI for the following Alpha Vantage API endpoints:

- **Company Overview**: Fundamental company data and financial ratios
- **Global Quote**: Latest price and trading information
- **Income Statement**: Quarterly and annual income statements
- **Balance Sheet**: Quarterly and annual balance sheets
- **Cash Flow**: Quarterly and annual cash flow statements
- **News Sentiment**: Latest news articles and sentiment analysis
- **Earnings History**: Historical EPS figures and surprises
- **Earnings Estimates**: Analyst EPS estimates
- **Earnings Call Transcript**: Earnings call transcripts with speaker information

## Usage

- Open the app and navigate to your desired endpoint
- Enter a stock symbol (e.g., AAPL) in the search field
- View the results in a clean, organized format
- If rate limited, the error message from Alpha Vantage is displayed

## Architecture

The application uses a client-side approach to API integration:

- Direct browser calls to Alpha Vantage API using the client's API key
- Svelte stores for state management
- Responsive UI with TailwindCSS and DaisyUI components
- Dark/light theme support

## Build

```sh
npm run build
npm run preview
```

## Deployment

This project is deployed on Vercel using the SvelteKit adapter-auto, which automatically configures the project for Vercel deployment.
