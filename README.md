# Domino Assistant MVP

Frontend-first MVP para asistencia de dominó (reglas venezolanas, 4 jugadores, sin pozo).

## Phase 1 engine

A lightweight local engine is available at `src/domino-engine.js` with:

- double-six tile set generation
- 4-player / 2-team setup
- 7-tile hand distribution validation
- opening player detection through `6-6`
- legal move generation for left/right board ends
- play/pass validation
- turn advancement
- hand winner detection when a player empties their hand

## Quick demo

```bash
node scripts/domino-engine-demo.mjs
```

This runs a small assertion-based demo that exercises the core engine flow.
