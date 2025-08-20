# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build the production application 
- `npm run preview` - Preview production build locally
- `npm run check` - Run Svelte type checking
- `npm run check:watch` - Run type checking in watch mode
- `npm run lint` - Run linting (Prettier + ESLint)
- `npm run format` - Format code with Prettier
- `npm run test` - Run all tests once
- `npm run test:unit` - Run tests in watch mode
- `npm run deploy` - Deploy to GitHub Pages
- `npm run build-deploy` - Build and deploy in one command

## Architecture Overview

This is a SvelteKit 5 application that provides a UI for Alpha Vantage API endpoints. The architecture has evolved from server-side proxy routes to direct client-side API calls.

### Key Architecture Decisions

**Client-Side API Integration**: The app uses direct browser calls to Alpha Vantage API (`src/lib/client/alphaVantage.ts`) rather than server-side proxy routes. API keys are managed through sessionStorage for security and user convenience.

**Static Site Generation**: Configured with `@sveltejs/adapter-static` for deployment to GitHub Pages. All routes are pre-rendered with fallback to `200.html` for SPA behavior.

**State Management**: 
- API key storage via Svelte stores backed by sessionStorage (`src/lib/stores/apiKey.ts`)
- Symbol management through dedicated store (`src/lib/stores/symbol.ts`)

### Directory Structure

- `src/routes/` - SvelteKit routes, each endpoint has its own page (company-overview, global-quote, etc.)
- `src/lib/client/` - Alpha Vantage API client with TypeScript types
- `src/lib/stores/` - Svelte stores for state management
- `src/lib/components/` - Reusable Svelte components
- `build/` - Production build output for static deployment

### Tech Stack

- **Framework**: SvelteKit 5 with TypeScript
- **Styling**: TailwindCSS 4 + DaisyUI components
- **Testing**: Vitest for unit tests
- **Build**: Vite with TailwindCSS plugin
- **Linting**: ESLint + Prettier with Svelte-specific configs
- **Deployment**: GitHub Pages via gh-pages

### API Integration Pattern

The `callAlphaVantageBrowser()` function in `src/lib/client/alphaVantage.ts` handles:
- API key retrieval from sessionStorage
- URL construction with query parameters
- Error handling for rate limits and API errors
- Typed response handling with `AVResult<T>` interface

### Development Notes

- No server-side environment variables needed - API keys are managed client-side
- All routes are accessible as static files after build
- Rate limiting errors from Alpha Vantage are gracefully handled and displayed to users
- The app supports multiple Alpha Vantage endpoints: Overview, Global Quote, Income Statement, Balance Sheet, Cash Flow, News Sentiment, and Earnings data