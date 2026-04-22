/**
 * RBAC (Role-Based Access Control) for Alpha Sale Pro
 * 
 * Hierarchy: Master Admin → VP → Regional → Divisional → Manager → Rep/Installer/Financier
 * 
 * When Supabase RLS is wired, this maps to:
 * - `user_roles` table: user_id, role, org_id, region_id?, division_id?
 * - `role_permissions` table: role, permission, resource
 * - RLS policies use these to gate row access
 */

// ── Role Hierarchy ──────────────────────────────────────────────────────
export type OrgRole = 
  | 'master_admin'    // apierce@alphasale.co — full control
  | 'vp'              // VP-level: sees everything, manage regions
  | 'regional'        // Regional manager: manages a region's divisions
  | 'divisional'      // Divisional: manages teams in a division
  | 'manager'         // Team manager: manages individual reps
  | 'sales_rep'       // Individual sales rep
  | 'installer'       // Installer team member
  | 'financier';      // Financier / capital partner

// Role hierarchy levels (higher = more access)
export const ROLE_HIERARCHY: Record<OrgRole, number> = {
  master_admin: 100,
  vp: 80,
  regional: 60,
  divisional: 40,
  manager: 20,
  sales_rep: 10,
  installer: 10,
  financier: 10,
};

// ── Permissions ─────────────────────────────────────────────────────────
export type Permission =
  // Deal lifecycle
  | 'deals:create'
  | 'deals:view_own'
  | 'deals:view_team'
  | 'deals:view_all'
  | 'deals:edit'
  | 'deals:delete'
  | 'deals:approve'
  // Milestone lifecycle  
  | 'milestones:submit'
  | 'milestones:verify'
  | 'milestones:approve'
  | 'milestones:fund_release'
  // Portal access
  | 'portal:sales'
  | 'portal:ops'
  | 'portal:installer'
  | 'portal:financier'
  | 'portal:council'
  // Admin
  | 'admin:users'
  | 'admin:roles'
  | 'admin:settings'
  | 'admin:reports';

// ── Default Role → Permissions Map ──────────────────────────────────────
export const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  master_admin: [
    'deals:create', 'deals:view_own', 'deals:view_team', 'deals:view_all', 'deals:edit', 'deals:delete', 'deals:approve',
    'milestones:submit', 'milestones:verify', 'milestones:approve', 'milestones:fund_release',
    'portal:sales', 'portal:ops', 'portal:installer', 'portal:financier', 'portal:council',
    'admin:users', 'admin:roles', 'admin:settings', 'admin:reports',
  ],
  vp: [
    'deals:create', 'deals:view_own', 'deals:view_team', 'deals:view_all', 'deals:edit', 'deals:approve',
    'milestones:verify', 'milestones:approve',
    'portal:sales', 'portal:ops', 'portal:council',
    'admin:reports',
  ],
  regional: [
    'deals:create', 'deals:view_own', 'deals:view_team', 'deals:edit', 'deals:approve',
    'milestones:verify',
    'portal:sales', 'portal:ops',
    'admin:reports',
  ],
  divisional: [
    'deals:create', 'deals:view_own', 'deals:view_team', 'deals:edit',
    'portal:sales', 'portal:ops',
  ],
  manager: [
    'deals:create', 'deals:view_own', 'deals:view_team', 'deals:edit',
    'portal:sales',
  ],
  sales_rep: [
    'deals:create', 'deals:view_own', 'deals:edit',
    'portal:sales',
  ],
  installer: [
    'deals:view_own', 'milestones:submit',
    'portal:installer',
  ],
  financier: [
    'deals:view_all', 'milestones:fund_release',
    'portal:financier',
  ],
};

// ── RBAC Helpers ────────────────────────────────────────────────────────

/** Check if a role has a specific permission */
export function hasPermission(role: OrgRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Check if roleA outranks roleB in the hierarchy */
export function outranks(roleA: OrgRole, roleB: OrgRole): boolean {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}

/** Get the display label for a role */
export function getRoleLabel(role: OrgRole): string {
  const labels: Record<OrgRole, string> = {
    master_admin: 'Master Admin',
    vp: 'VP',
    regional: 'Regional Manager',
    divisional: 'Divisional Manager',
    manager: 'Team Manager',
    sales_rep: 'Sales Rep',
    installer: 'Installer',
    financier: 'Financier',
  };
  return labels[role] || role;
}

/** Get the color class for a role badge */
export function getRoleBadgeColor(role: OrgRole): string {
  switch (role) {
    case 'master_admin': return 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 border-amber-500/30';
    case 'vp': return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'regional': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'divisional': return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    case 'manager': return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
    case 'sales_rep': return 'bg-primary/15 text-primary border-primary/30';
    case 'installer': return 'bg-[hsl(var(--green))]/15 text-[hsl(var(--green))] border-[hsl(var(--green))]/30';
    case 'financier': return 'bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))] border-[hsl(var(--yellow))]/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

// ── Supabase RLS SQL (for future migration) ─────────────────────────────
/**
 * When wiring to Supabase, create these tables & policies:
 * 
 * CREATE TABLE user_roles (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id UUID REFERENCES auth.users NOT NULL,
 *   role TEXT NOT NULL CHECK (role IN ('master_admin','vp','regional','divisional','manager','sales_rep','installer','financier')),
 *   org_id UUID REFERENCES organizations NOT NULL,
 *   region_id UUID REFERENCES regions,
 *   division_id UUID REFERENCES divisions,
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 * 
 * -- RLS: Users can see their own roles
 * ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "users_see_own_roles" ON user_roles
 *   FOR SELECT USING (user_id = auth.uid());
 * 
 * -- RLS: Master admin can manage all roles in their org
 * CREATE POLICY "master_manage_roles" ON user_roles
 *   FOR ALL USING (
 *     EXISTS (
 *       SELECT 1 FROM user_roles ur
 *       WHERE ur.user_id = auth.uid() AND ur.role = 'master_admin' AND ur.org_id = user_roles.org_id
 *     )
 *   );
 * 
 * -- Deals: scoped by role level
 * CREATE POLICY "deals_by_role" ON deals
 *   FOR SELECT USING (
 *     CASE
 *       WHEN get_user_role(auth.uid()) IN ('master_admin','vp','financier') THEN TRUE
 *       WHEN get_user_role(auth.uid()) = 'regional' THEN region_id = get_user_region(auth.uid())
 *       WHEN get_user_role(auth.uid()) = 'divisional' THEN division_id = get_user_division(auth.uid())
 *       WHEN get_user_role(auth.uid()) = 'manager' THEN team_id = get_user_team(auth.uid())
 *       ELSE created_by = auth.uid()
 *     END
 *   );
 */
