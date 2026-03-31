import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// ============= PROJECTS =============

export function useProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !user.isDemo,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (project: TablesInsert<'projects'>) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'projects'> & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// ============= MILESTONES =============

export function useProjectMilestones(projectId?: string) {
  return useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId!)
        .order('milestone_number');
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'project_milestones'> & { id: string }) => {
      const { data, error } = await supabase
        .from('project_milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });
}

// ============= MILESTONE STATES =============

export function useMilestoneStates(projectId?: string) {
  return useQuery({
    queryKey: ['milestone-states', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestone_states')
        .select('*')
        .eq('project_id', projectId!)
        .order('milestone_index');
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useUpsertMilestoneState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (state: { project_id: string; milestone_index: number; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('milestone_states')
        .upsert(state, { onConflict: 'project_id,milestone_index' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestone-states'] });
    },
  });
}

// ============= CHECKLIST ITEMS =============

export function useChecklistItems(projectId?: string) {
  return useQuery({
    queryKey: ['checklist-items', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_checklist_items')
        .select('*')
        .eq('project_id', projectId!)
        .order('milestone_number')
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'project_checklist_items'> & { id: string }) => {
      const { data, error } = await supabase
        .from('project_checklist_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
    },
  });
}

// ============= DOCUMENTS =============

export function useProjectDocuments(projectId?: string) {
  return useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (doc: TablesInsert<'project_documents'>) => {
      const { data, error } = await supabase
        .from('project_documents')
        .insert(doc)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-documents'] });
    },
  });
}

// ============= TICKETS =============

export function useTickets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tickets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !user.isDemo,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticket: TablesInsert<'tickets'>) => {
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticket)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useTicketMessages(ticketId?: string) {
  return useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId!)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!ticketId,
  });
}

export function useSendTicketMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (msg: TablesInsert<'ticket_messages'>) => {
      const { data, error } = await supabase
        .from('ticket_messages')
        .insert(msg)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages'] });
    },
  });
}

// ============= PROJECT MESSAGES =============

export function useProjectMessages(projectId?: string) {
  return useQuery({
    queryKey: ['project-messages', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_messages')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useSendProjectMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (msg: TablesInsert<'project_messages'>) => {
      const { data, error } = await supabase
        .from('project_messages')
        .insert(msg)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-messages'] });
    },
  });
}

// ============= APPOINTMENTS =============

export function useAppointments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['appointments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !user.isDemo,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appt: TablesInsert<'appointments'>) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appt)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

// ============= FILE STORAGE =============

export function useFileUpload() {
  return useMutation({
    mutationFn: async ({ bucket, path, file }: { bucket: string; path: string; file: File }) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      return urlData.publicUrl;
    },
  });
}

// ============= REGISTRATION REQUESTS (for master users) =============

export function useRegistrationRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['registration-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registration_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !user.isDemo && (user.roles?.includes('master') || user.roles?.includes('backend_ops')),
  });
}

// ============= REALTIME SUBSCRIPTIONS =============

export function useRealtimeProjects(callback: (payload: any) => void) {
  const { user } = useAuth();
  if (!user || user.isDemo) return;

  const channel = supabase
    .channel('projects-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, callback)
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export function useRealtimeMessages(projectId: string, callback: (payload: any) => void) {
  const channel = supabase
    .channel(`messages-${projectId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'project_messages',
      filter: `project_id=eq.${projectId}`,
    }, callback)
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
