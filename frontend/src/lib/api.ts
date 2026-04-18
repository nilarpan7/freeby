import { supabase } from './supabase';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Auth API
export const authApi = {
  async register(data: { email: string; password: string; name: string; role: string }) {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (error) throw new ApiError(error.status || 400, error.message);
    
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: authData.user.id,
          full_name: data.name,
          role: data.role.toUpperCase() as any, // 'STUDENT' or 'SENIOR'
        }
      ]);
      if (profileError) throw new ApiError(400, profileError.message);
    }
    
    // Attempt to get the combined user object
    try {
      const user = await this.getMe();
      return { access_token: authData.session?.access_token, user };
    } catch (e) {
      // In case getMe fails immediately after sign up
      return { access_token: authData.session?.access_token, user: authData.user };
    }
  },
  
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new ApiError(error.status || 400, error.message);
    
    const user = await this.getMe();
    return { access_token: data.session?.access_token, user };
  },
  
  async googleAuth(data: { token: string; role: string }) {
    const user = await this.getMe();
    if (user?.id) {
      await supabase.from('profiles').update({ role: data.role.toUpperCase() }).eq('id', user.id);
    }
    return { access_token: 'google-oauth', user };
  },

  async setupProfile(data: { domain: string; skills: string[]; bio?: string; github_url?: string; avatar_url?: string; company?: string }) {
    const user = await this.getMe();
    if (!user?.id) throw new ApiError(401, 'Unauthorized');
    
    const { error } = await supabase.from('profiles').update({
      domain: data.domain,
      skills: data.skills,
    }).eq('id', user.id);
    if (error) throw new ApiError(400, error.message);
    
    const updatedUser = await this.getMe();
    return { user: updatedUser };
  },
  
  async getMe() {
    const { data: authData, error } = await supabase.auth.getUser();
    if (error || !authData.user) throw new ApiError(401, 'Unauthorized');
    
    const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
    if (profileError) throw new ApiError(404, 'Profile not found');
    
    return {
      ...authData.user,
      ...profile,
      name: profile.full_name,
      karma_score: profile.karma_score || 0,
    };
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new ApiError(400, error.message);
  }
};

// Task API
export const taskApi = {
  async getTasks(filters?: { status?: string; difficulty?: string; domain?: string }) {
    let query = supabase.from('solo_tasks').select(`
      *,
      profiles:senior_id (full_name, domain)
    `);
    if (filters?.status) query = query.eq('status', filters.status.toUpperCase());
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new ApiError(400, error.message);
    return data;
  },
  
  async getTask(id: string) {
    const { data, error } = await supabase.from('solo_tasks').select(`
      *,
      profiles:senior_id (full_name)
    `).eq('id', id).single();
    if (error) throw new ApiError(404, error.message);
    return data;
  },
  
  async createTask(data: { title: string; description: string; karma_reward?: number; }) {
    const user = await authApi.getMe();
    if (!user.id) throw new ApiError(401, 'Unauthorized');

    const { data: taskData, error } = await supabase.from('solo_tasks').insert([
      {
        senior_id: user.id,
        title: data.title,
        description: data.description,
        karma_reward: data.karma_reward || 10,
        status: 'OPEN'
      }
    ]).select().single();
    if (error) throw new ApiError(400, error.message);
    return taskData;
  },
  
  async claimTask(id: string) {
    const user = await authApi.getMe();
    if (!user.id) throw new ApiError(401, 'Unauthorized');

    const { data, error } = await supabase.from('solo_tasks').update({
      assignee_id: user.id,
      status: 'CLAIMED'
    }).eq('id', id).select().single();
    if (error) throw new ApiError(400, error.message);
    return data;
  },
  
  async submitTask(id: string, data: { github_link: string; submission_text: string }) {
    const user = await authApi.getMe();
    if (!user.id) throw new ApiError(401, 'Unauthorized');

    const { data: updatedTask, error } = await supabase.from('solo_tasks').update({
      submission_link: data.github_link,
      status: 'IN_REVIEW'
    }).eq('id', id).eq('assignee_id', user.id).select().single();
    if (error) throw new ApiError(400, error.message);
    return updatedTask;
  },
  
  async reviewTask(id: string, data: { action: string; feedback?: string }) {
    if (data.action === 'approve' || data.action === 'pass') {
      const { error } = await supabase.rpc('approve_solo_task', { p_task_id: id });
      if (error) throw new ApiError(400, error.message);
      return { success: true };
    }
    return { success: false };
  },
};

// User API
export const userApi = {
  async getUser(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw new ApiError(404, error.message);
    return data;
  },
  
  async getKarmaEvents(userId: string) {
    const { data, error } = await supabase.from('attestations').select(`
      *,
      solo_tasks:task_id (title)
    `).eq('student_id', userId).order('created_at', { ascending: false });
    if (error) throw new ApiError(400, error.message);
    return data;
  },
  
  async getLeaderboard(limit: number = 50) {
    const { data, error } = await supabase.from('profiles').select('*').order('karma_score', { ascending: false }).limit(limit);
    if (error) throw new ApiError(400, error.message);
    return data;
  },
};

// Sprint API
export const sprintApi = {
  async createSprint(data: { title: string; description: string; max_participants?: number; repo_link?: string }) {
    const { data: sprint, error } = await supabase.from('squad_sprints').insert([
      {
        title: data.title,
        description: data.description,
        repo_link: data.repo_link || '',
        max_members: data.max_participants || 4,
      }
    ]).select().single();
    if (error) throw new ApiError(400, error.message);
    return sprint;
  },
  
  async joinSprint(sprintId: string) {
    const user = await authApi.getMe();
    if (!user.id) throw new ApiError(401, 'Unauthorized');

    const { error } = await supabase.from('squad_members').insert([
      { sprint_id: sprintId, student_id: user.id }
    ]);
    if (error) throw new ApiError(400, error.message);
    return { success: true };
  },
  
  async getActiveSprints() {
    const { data, error } = await supabase.from('squad_sprints').select(`
      *,
      squad_members ( count )
    `).eq('status', 'FORMING').order('created_at', { ascending: false });
    if (error) throw new ApiError(400, error.message);
    return data;
  },
};
