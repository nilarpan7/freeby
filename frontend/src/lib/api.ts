import { supabase } from './supabase';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper to map Supabase Task to Frontend Task
const mapTask = (t: any) => {
  if (!t) return null;
  return {
    ...t,
    status: t.status?.toLowerCase() || 'open',
    reward_karma: t.karma_reward,
    client_name: t.client_name || t.profiles?.full_name || 'Task Creator',
    client_company: t.profiles?.company || '',
    client_id: t.senior_id || t.client_telegram_id,
    micro_tasks: t.micro_tasks || [],
  };
};

// Auth API
export const authApi = {
  async register(data: { 
    email: string; 
    password: string; 
    name: string; 
    role: string;
    domain?: string;
    skills?: string[];
    company?: string;
  }) {
    // 1. Sign up with Supabase Auth
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.name,
          role: data.role,
        }
      }
    });
    if (error) throw new ApiError(error.status || 400, error.message);
    
    // 2. Create profile
    if (authData.user) {
      // Map frontend role to DB enum: student -> STUDENT, client -> SENIOR
      const dbRole = data.role === 'client' ? 'SENIOR' : 'STUDENT';
      
      const profileData: any = {
        id: authData.user.id,
        full_name: data.name,
        role: dbRole,
        skills: data.skills || [],
        karma_score: 0,
        profile_completed: false, // Will complete in setup page
      };
      
      // Only set domain if it's a valid enum value (null would fail on domain_type enum)
      if (data.domain) {
        profileData.domain = data.domain;
      }

      if (data.company) {
        profileData.company = data.company;
      }
      
      const { error: profileError } = await supabase.from('profiles').insert([profileData]);
      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't throw — the user is created, profile can be retried
      }
    }
    
    const user = await this.getMe();
    return { access_token: authData.session?.access_token || 'sb-token', user };
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
    return { access_token: 'google-oauth', user: await this.getMe() };
  },

  async setupProfile(data: { domain: string; skills: string[]; bio?: string; github_url?: string; avatar_url?: string; company?: string }) {
    const user = await this.getMe();
    if (!user?.id) throw new ApiError(401, 'Unauthorized');
    
    const updatePayload = {
      domain: data.domain,
      skills: data.skills,
      bio: data.bio || null,
      github_url: data.github_url || null,
      avatar_url: data.avatar_url || null,
      company: data.company || null,
      profile_completed: true
    };

    // Try update first
    const { data: updated, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Profile update error:', error);
      // If update fails (RLS), try upsert
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, full_name: user.name, role: user.role === 'client' ? 'SENIOR' : 'STUDENT', ...updatePayload })
        .select()
        .single();
      if (upsertError) {
        console.error('Profile upsert error:', upsertError);
        throw new ApiError(400, upsertError.message);
      }
    }
    
    const refreshedUser = await this.getMe();
    return { user: refreshedUser };
  },
  
  async getMe() {
    const { data: authData, error } = await supabase.auth.getUser();
    if (error || !authData.user) return null;
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError || !profile) {
      // Return minimal user if profile doesn't exist yet
      return {
        id: authData.user.id,
        email: authData.user.email || '',
        name: authData.user.user_metadata?.full_name || 'User',
        role: (authData.user.user_metadata?.role || 'student') as 'student' | 'client',
        skills: [],
        karma_score: 0,
        avatar_url: '',
        github_url: '',
        profile_completed: false,
        tasks_completed: 0,
        tasks_posted: 0,
        created_at: authData.user.created_at,
      };
    }
    
    return {
      id: profile.id,
      email: authData.user.email || '',
      name: profile.full_name,
      // Map DB enum back: SENIOR -> client, STUDENT -> student
      role: (profile.role === 'SENIOR' ? 'client' : 'student') as 'student' | 'client',
      domain: profile.domain,
      skills: profile.skills || [],
      karma_score: profile.karma_score || 0,
      avatar_url: profile.avatar_url || '',
      github_url: profile.github_url || '',
      bio: profile.bio,
      company: profile.company,
      profile_completed: profile.profile_completed || false,
      tasks_completed: 0, // Could query from solo_tasks
      tasks_posted: 0,
      endorsements_received: 0,
      created_at: profile.created_at,
    };
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async getUserProfile(userId: string) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error || !profile) return null;
    
    // Also fetch tasks count roughly
    const { count: completedCount } = await supabase
      .from('solo_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assignee_id', userId)
      .eq('status', 'COMPLETED');
      
    const { count: postedCount } = await supabase
      .from('solo_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('senior_id', userId);

    return {
      id: profile.id,
      name: profile.full_name,
      role: (profile.role === 'SENIOR' ? 'client' : 'student') as 'student' | 'client',
      domain: profile.domain,
      skills: profile.skills || [],
      karma_score: profile.karma_score || 0,
      avatar_url: profile.avatar_url || '',
      github_url: profile.github_url || '',
      bio: profile.bio,
      company: profile.company,
      tasks_completed: completedCount || 0,
      tasks_posted: postedCount || 0,
      endorsements_received: 0,
      created_at: profile.created_at,
    };
  }
};

// Task API
export const taskApi = {
  async getTasks(filters?: { status?: string; difficulty?: string; domain?: string }) {
    let query = supabase.from('solo_tasks').select('*');
    
    if (filters?.status) {
      query = query.eq('status', filters.status.toUpperCase());
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new ApiError(400, error.message);
    
    return (data || []).map(mapTask);
  },
  
  async getTask(id: string) {
    const { data, error } = await supabase
      .from('solo_tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new ApiError(404, error.message);
    return mapTask(data);
  },
  
  async createTask(data: any) {
    const user = await authApi.getMe();
    if (!user?.id) throw new ApiError(401, 'Unauthorized');

    const { data: taskData, error } = await supabase.from('solo_tasks').insert([
      {
        senior_id: user.id,
        title: data.title,
        description: data.description,
        karma_reward: data.reward_karma || 10,
        stack: data.stack || [],
        difficulty: (data.difficulty?.toLowerCase() || 'easy') as any,
        time_estimate_min: data.time_estimate_min || 60,
        min_karma: data.min_karma || 0,
        reward_amount: data.reward_amount || 0,
        status: 'OPEN'
      }
    ]).select().single();
    
    if (error) throw new ApiError(400, error.message);
    return mapTask(taskData);
  },
  
  async claimTask(id: string) {
    const user = await authApi.getMe();
    if (!user?.id) throw new ApiError(401, 'Unauthorized');

    // Check karma requirement
    const task = await this.getTask(id);
    if (!task) throw new ApiError(404, 'Task not found');
    if (user.karma_score < (task.min_karma || 0)) {
      throw new ApiError(403, `You need ${task.min_karma - user.karma_score} more karma to claim this task`);
    }

    const { data, error } = await supabase.from('solo_tasks').update({
      assignee_id: user.id,
      status: 'CLAIMED'
    }).eq('id', id).eq('status', 'OPEN').select().single();
    
    if (error) throw new ApiError(400, error.message);
    return mapTask(data);
  },

  async applyForTask(id: string, applicationText: string) {
    return this.claimTask(id);
  },
  
  async submitTask(id: string, data: { github_link: string; submission_text: string }) {
    const user = await authApi.getMe();
    if (!user?.id) throw new ApiError(401, 'Unauthorized');

    const { data: updatedTask, error } = await supabase.from('solo_tasks').update({
      submission_link: data.github_link,
      status: 'IN_REVIEW'
    }).eq('id', id).eq('assignee_id', user.id).select().single();
    
    if (error) throw new ApiError(400, error.message);
    return mapTask(updatedTask);
  },
  
  async reviewTask(id: string, data: { action: string; feedback?: string }) {
    if (data.action === 'approve' || data.action === 'pass') {
      const { error } = await supabase.rpc('approve_solo_task', { p_task_id: id });
      if (error) throw new ApiError(400, error.message);
      return { success: true };
    } else if (data.action === 'reject' || data.action === 'revision') {
      const { error } = await supabase.from('solo_tasks').update({
        status: 'REVISION_REQUESTED'
      }).eq('id', id);
      if (error) throw new ApiError(400, error.message);
      return { success: true };
    }
    return { success: false };
  },

  async getMyTasks() {
    const user = await authApi.getMe();
    if (!user?.id) return [];
    
    const { data, error } = await supabase
      .from('solo_tasks')
      .select('*')
      .eq('assignee_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return (data || []).map(mapTask);
  },
};

// User API
export const userApi = {
  async getUser(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw new ApiError(404, error.message);
    return {
      ...data,
      name: data.full_name
    };
  },
  
  async getKarmaEvents(userId: string) {
    const { data, error } = await supabase.from('attestations').select(`
      *,
      solo_tasks:task_id (title)
    `).eq('student_id', userId).order('created_at', { ascending: false });
    
    if (error) throw new ApiError(400, error.message);
    return (data || []).map(e => ({
      ...e,
      task_title: e.solo_tasks?.title,
      karma_delta: 10 // Mock delta for solo tasks
    }));
  },
  
  async getLeaderboard(limit: number = 50) {
    const { data, error } = await supabase.from('profiles').select('*').order('karma_score', { ascending: false }).limit(limit);
    if (error) throw new ApiError(400, error.message);
    return (data || []).map((u, i) => ({
      rank: i + 1,
      user: { ...u, name: u.full_name },
      trend: 'stable',
      tasks_this_week: 2
    }));
  },
};

// Sprint API
export const sprintApi = {
  async createSprint(data: any) {
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
    if (!user?.id) throw new ApiError(401, 'Unauthorized');

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

// Quest Analysis API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const questApi = {
  async submitQuest(data: {
    student_id: string;
    quest_id: string;
    quest_type: string;
    github_url: string;
    quest_title: string;
    ai_criteria: string[];
    reward_karma: number;
  }) {
    const resp = await fetch(`${API_URL}/quests/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!resp.ok) throw new ApiError(resp.status, await resp.text());
    return resp.json();
  },

  async getSubmission(submissionId: string) {
    const resp = await fetch(`${API_URL}/quests/submission/${submissionId}`);
    if (!resp.ok) throw new ApiError(resp.status, 'Submission not found');
    return resp.json();
  },

  async getHistory(studentId: string, questType?: string, status?: string) {
    const params = new URLSearchParams();
    if (questType) params.set('quest_type', questType);
    if (status) params.set('status', status);
    const resp = await fetch(`${API_URL}/quests/history/${studentId}?${params}`);
    if (!resp.ok) throw new ApiError(resp.status, 'Failed to fetch history');
    return resp.json();
  },

  async getStats(studentId: string) {
    const resp = await fetch(`${API_URL}/quests/stats/${studentId}`);
    if (!resp.ok) throw new ApiError(resp.status, 'Failed to fetch stats');
    return resp.json();
  },

  async getKarmaGraph(studentId: string) {
    const resp = await fetch(`${API_URL}/quests/karma-graph/${studentId}`);
    if (!resp.ok) throw new ApiError(resp.status, 'Failed to fetch karma graph');
    return resp.json();
  },

  async reanalyze(submissionId: string) {
    const resp = await fetch(`${API_URL}/quests/reanalyze/${submissionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!resp.ok) throw new ApiError(resp.status, 'Failed to start re-analysis');
    return resp.json();
  },
};

// Referral API
export const referralApi = {
  async referUser(data: { referrer_id: string; referred_user_id: string; task_id: string }) {
    const resp = await fetch(`${API_URL}/referrals/refer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: 'Referral failed' }));
      throw new ApiError(resp.status, err.detail || 'Referral failed');
    }
    return resp.json();
  },

  async getMyReferrals(userId: string) {
    const resp = await fetch(`${API_URL}/referrals/my-referrals/${userId}`);
    if (!resp.ok) throw new ApiError(resp.status, 'Failed to fetch referrals');
    return resp.json();
  },

  async resolveReferral(referralId: string, outcome: 'completed' | 'rejected') {
    const resp = await fetch(`${API_URL}/referrals/resolve/${referralId}?outcome=${outcome}`, {
      method: 'POST',
    });
    if (!resp.ok) throw new ApiError(resp.status, 'Failed to resolve referral');
    return resp.json();
  },

  async notifyTaskUpdate(taskId: string, event: string, details?: string) {
    const resp = await fetch(`${API_URL}/referrals/notify-task-update?task_id=${taskId}&event=${event}&details=${encodeURIComponent(details || '')}`, {
      method: 'POST',
    });
    return resp.json();
  },
};

// Chat API
export const chatApi = {
  async getMessages(taskId: string) {
    const resp = await fetch(`${API_URL}/chat/${taskId}`);
    if (!resp.ok) throw new ApiError(resp.status, 'Failed to fetch messages');
    return resp.json();
  },

  async sendMessage(taskId: string, senderId: string, messageText: string) {
    const resp = await fetch(`${API_URL}/chat/${taskId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_id: senderId, message_text: messageText }),
    });
    if (!resp.ok) throw new ApiError(resp.status, 'Failed to send message');
    return resp.json();
  }
};
