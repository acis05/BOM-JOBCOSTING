# v0.4.2 — WO calculation basic fix

- Planned Qty now rescales both Material WO and Biaya WO immediately.
- Empty/zero Planned Qty never triggers a multiplication.
- Editing an existing WO loads stored material/cost values as-is and does not recalculate on load.
- Changing Planned Qty in Edit mode scales current values exactly once by `newQty / previousQty`.
- Create API stores the material/cost values shown in the WO form instead of silently recalculating them again.
- Backend only falls back to BOM calculation if material/cost lines were not sent by the client.
- Prevents the previous screen-vs-saved mismatch / apparent x10,000 double multiplication.
