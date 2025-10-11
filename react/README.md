# React Development Workspace

The `react` directory provides an isolated development environment for implementing HTML pages with React, without introducing React dependencies to the main game codebase.

## Development Workflow

To create a new React page while maintaining static HTML deployment via GitHub Pages:

### 1. Create React App

- Create a new React app within this directory
- Name it for **one page only** (no routing)
- Example: A metrics page should live in `react/metrics/`

### 2. Development

- Develop normally using Vite
- Run `npm run start` to test the page in isolation

### 3. Build

- Build the React app when ready

### 4. Deploy Preparation

- Create a top-level HTML file in the repository root (not in the React directory)
- Copy the JS and CSS script tags from `react/[app-name]/dist/index.html`
- Paste them into your new top-level HTML file

### 5. Verification

- Stop the React dev server
- Run `npm run dev` from the repository root
- Visit your page (e.g., `127.0.0.1/metrics`) to verify it works correctly
