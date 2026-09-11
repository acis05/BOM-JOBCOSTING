# v0.3.1 Accurate item sync fix

- Removes legacy global `items_cache_accurate_id_key` and `items_cache_item_no_key`.
- Adds organization-scoped unique indexes for cached Accurate items.
- Deduplicates item list results before cache write.
- Adds a runtime safety migration inside item sync for databases upgraded from older releases.
- Fixes tenant filtering on BOM edit master dropdowns.
