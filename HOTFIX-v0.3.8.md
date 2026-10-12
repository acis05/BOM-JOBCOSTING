# v0.3.8

- Accurate concurrency response after Roll Over is now classified as `ROLLOVER_VERIFY`, not a hard error.
- UI shows `PERLU VERIFIKASI` instead of red `ROLLOVER_ERROR` for this case.
- Retry is hidden for verification state to reduce duplicate finished-goods transactions.
- `Tandai Sudah Masuk` remains available after the user confirms the Roll Over exists in Accurate.
- Genuine Roll Over failures still use `ROLLOVER_ERROR` and allow Retry.
