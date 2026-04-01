
## ASP Production Build Plan

This implements everything from your uploaded prompt in the suggested build order. Each phase builds on the previous one.

### Phase 1: Database Schema & Tables
- Create `site_surveys` table (new)
- Create `aurora_imports` table (new)
- Add missing columns to existing tables (`projects`: `pipeline_stage`, `qc_status`, `qc_dirty_notes`, `welcome_call_recording_url`, `welcome_call_flags`, `source`, etc.)
- Add missing columns to `profiles` (some already exist: `platform_access`, `organization_id`, `tier`)
- Add missing columns to `milestone_states` (`milestone` text field, unique constraint on project_id+milestone)
- Add missing columns to `fund_releases` (`source` field)
- Add missing columns to `tickets` (`issue` field)
- RLS policies for all new/modified tables

### Phase 2: DataSourceProvider (Demo ↔ Production)
- Update `DataSourceProvider.tsx` to route test001 → demo data, all others → Supabase
- Create `CloudProjectStoreProvider` that exposes the same interface as the demo store
- Add pre-pipeline stage support for production users

### Phase 3: Pre-Pipeline Sales Rep Workflow (Steps A1–A7)
- **A1**: Project creation form → creates `projects` row with `pipeline_stage = "draft"`
- **A2**: Aurora Sync form (manual entry for MVP) → sets `pipeline_stage = "aurora_synced"`
- **A3**: Convert to Sale confirmation modal → `pipeline_stage = "sale_converted"`
- **A4**: Send/Sign Documents buttons → `docs_sent` → `docs_signed`
- **A5**: Welcome Call form with 10 questions + flag logic → `welcome_call_done`
- **A6**: Site Survey multi-section upload → `site_survey_done`
- **A7**: Pre-submission checklist + submit for approval → `submitted_for_qc`

### Phase 4: Backend Ops QC Review (Phase B)
- QC Review queue showing `qc_status = "pending"` projects
- 7-point checklist UI
- Mark Clean flow (assign installer, push to pipeline at M1, init milestone_states)
- Mark Dirty flow (notes, return to Sales Rep)

### Phase 5: Milestone Processing (Phase C)
- Wire existing milestone UI to Supabase milestone_states
- M1–M7 checklist definitions with role-based actions
- Upload, date, and text entry support per checklist item
- Fund release flow: Backend Ops approve → Financier release
- M7 speed bonus auto-calculation

### Phase 6: Aurora Edge Function
- `aurora-ingest` edge function accepting deal data via API
- Duplicate checking, project creation, milestone initialization
- Audit trail in `aurora_imports`

### Phase 7: Realtime Subscriptions
- Enable realtime on projects, milestone_states, tickets, ticket_messages, project_messages, financier_updates, fund_releases, site_surveys
- Channel subscriptions in CloudProjectStoreProvider

### Phase 8: File Upload Integration
- Supabase Storage uploads to `project-files` bucket
- Path structure: `{org_id}/{project_id}/{stage}/{section}/{timestamp}_{filename}`
- Upload previews, file type validation, size limits
- Immutable audit trail (no deletes)

### Phase 9: RLS Policies
- Role-based access per the permissions matrix
- Sales Rep: own projects only
- Backend Ops: all projects
- Installer: assigned projects only
- Financier: portfolio projects only
- Master: full access

### Phase 10: Seed Users
- Create 3 users: apierce@alphasale.co (master), mpierce@alphasale.co (master), echeung@alphasale.co (sales_rep)

---

**Constraints honored:**
- Demo (test001) remains completely untouched
- No UI/theme redesign
- No changes to existing component interfaces
- CSGO rewards system preserved

**Recommended approach:** I'll implement phase by phase, starting with the database migration. Each phase will be a separate conversation turn so you can review and approve incrementally.

Shall I proceed with **Phase 1 (Database Schema)** first?
