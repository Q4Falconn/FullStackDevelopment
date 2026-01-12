# UNO (React + Redux + RxJS)

This is the Assignment 5 conversion of the earlier UNO client:

- React for UI
- Redux Toolkit for state management
- RxJS for handling server push (GraphQL subscription via `graphql-ws`)
- Functional UNO model from Assignment 4 (`src/model/*`)

## Run

```bash
npm install
npm run dev
```

## Configure server URLs (optional)

Defaults:
- HTTP: `http://localhost:4000/graphql`
- WS: `ws://localhost:4000/graphql`

Override with:

```bash
VITE_GRAPHQL_HTTP_URL=...
VITE_GRAPHQL_WS_URL=...
```
