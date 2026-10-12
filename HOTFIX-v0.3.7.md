# v0.3.7
- Fix edit WO date normalization: PostgreSQL date/date-string is converted to HTML `YYYY-MM-DD` before save.
- Roll Over now sends deterministic transaction number `RO-<WO No>` to reduce duplicate risk on retries.
- Duplicate-number response during retry is reconciled as already rolled over.
- Concurrent-update response is shown as uncertain state with explicit instruction to verify Accurate first.
- Added `Tandai Sudah Masuk` action for ROLLOVER_ERROR so a transaction that actually exists in Accurate can be reconciled locally without posting again.
