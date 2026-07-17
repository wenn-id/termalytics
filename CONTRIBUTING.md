# Contributing to Termalytics

Thanks for your interest!

## Development

```bash
git clone https://github.com/alwan-juliawan/termalytics.git
cd termalytics
npm install
npm run build
npm test
```

## Guidelines

- Zero runtime dependencies — do not add any.
- All new features need tests (`node:test`).
- Keep TypeScript strict mode happy.
- Run `npm run build && npm test` before submitting a PR.

## Reporting Bugs

Open an issue with:
- Node version (`node -v`)
- Terminal emulator name
- Minimal reproduction code
