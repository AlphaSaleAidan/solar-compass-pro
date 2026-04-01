
## ASP Production Build Plan

### ✅ Phase 1: Database Schema & Tables — DONE
### ✅ Phase 2: DataSourceProvider (Demo ↔ Production) — DONE (was already implemented)
### ✅ Phase 3: SOP Engine — DONE
- Created `src/data/sopEngine.ts` with sequential pipeline enforcement, welcome call validation, site survey validation, pre-submission checklist, and M7 speed bonus calculation.

### ✅ Phase 4: Milestone SOPs Updated — DONE
- Added M6 `m6-service-contract` (ASP Care Plan)
- Updated M7 to match prompt: `m7-day-count`, `m7-installer-score`, `m7-ops-approve`

### ✅ Phase 5: Aurora Edge Function — DONE
- `supabase/functions/aurora-ingest/index.ts` — accepts deal data via POST, creates project at M1, initializes milestone_states, creates audit trail

### ✅ Phase 6: Seed Users — DONE (was already implemented)

### Remaining:
- Phase 7: Wire SOP engine into SellTab/SellProjectCard for production users
- Phase 8: QC Review 7-point checklist UI for Backend Ops
- Phase 9: File uploads to Supabase Storage
- Phase 10: Storage bucket RLS policies

