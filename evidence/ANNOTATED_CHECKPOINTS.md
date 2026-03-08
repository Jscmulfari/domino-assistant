# Annotated checkpoints (structural redesign)

1. **command_header** introduced at top-level with title/meta hierarchy.
2. **board_stage** now central composition (main board + side checkpoint panel).
3. **assistant_tray** implemented as separate bottom tray zone with mobile collapse behavior.
4. Domino geometry redesigned (strict vertical tile, top/bottom halves with zero gap).
5. Dense responsive selector grid with spacing token system (`--s-*`).
6. Interaction states improved (`:hover`, `:active`, `.sel`, confirm CTA state).
7. Core flow preserved: select up to 7, confirm shown only at exactly 7.
