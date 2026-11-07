# v0.4.3 — Quantity display cleanup

- Quantity fields no longer show trailing decimal zeroes when the value is an integer.
- Examples: `10.0000` -> `10`, `30.0000` -> `30`, `10.5000` -> `10.5`, `10.2500` -> `10.25`.
- Applied to Planned Qty WO, Material Qty WO, BOM Output Qty, and BOM Material Qty.
- Database precision remains unchanged; this is a display/input cleanup only.
