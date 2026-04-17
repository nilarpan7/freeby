// API Client for Kramic.sh Backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('kramic_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(response.status, error.detail || 'Request failed');
  }
  
  return response.json();
}

// Auth API
export const authApi = {
  async register(data: {
    email: string;
    password: string;
    name: string;
    role: string;
    domain: string;
    skills: string[];
    company?: string;
  }) {
    return fetchWithAuth('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async login(email: string, password: string) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    return fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Login failed' }));
        throw new ApiError(res.status, error.detail);
      }
      return res.json();
    });
  },
  
  async googleAuth(data: {
    token: string;
    role: string;
    domain: string;
    skills: string[];
    company?: string;
  }) {
    return fetchWithAuth('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async getMe() {
    return fetchWithAuth('/api/auth/me');
  },
};

// Task API
export const taskApi = {
  async getTasks(filters?: { status?: string; difficulty?: string; domain?: string }) {
    const params = new URLSearchParams(filters as any);
    return fetchWithAuth(`/api/tasks?${params}`);
  },
  
  async getTask(taskId: string) {
    return fetchWithAuth(`/api/tasks/${taskId}`);
  },
  
  async createTask(data: {
    title: string;
    description: string;
    stack: string[];
    difficulty: string;
    time_estimate_min: number;
  }) {
    return fetchWithAuth('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async claimTask(taskId: string) {
    return fetchWithAuth(`/api/tasks/${taskId}/claim`, {
      method: 'POST',
    });
  },
  
  async submitTask(taskId: string, data: { github_link: string; submission_text: string }) {
    return fetchWithAuth(`/api/tasks/${taskId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async reviewTask(taskId: string, data: { action: string; feedback?: string }) {
    return fetchWithAuth(`/api/tasks/${taskId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// User API
export const userApi = {
  async getUser(userId: string) {
    return fetchWithAuth(`/api/users/${userId}`);
  },
  
  async getKarmaEvents(userId: string) {
    return fetchWithAuth(`/api/users/${userId}/karma`);
  },
  
  async getLeaderboard(limit: number = 50) {
    return fetchWithAuth(`/api/users?limit=${limit}`);
  },
};

// Sprint API
export const sprintApi = {
  async createSprint(data: { title: string; description: string; max_participants?: number }) {
    return fetchWithAuth('/api/sprints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async joinSprint(sprintId: string) {
    return fetchWithAuth('/api/sprints/join', {
      method: 'POST',
      body: JSON.stringify({ sprint_id: sprintId }),
    });
  },
  
  async getSprintAuth(sprintId: string) {
    return fetchWithAuth(`/api/sprints/${sprintId}/auth`);
  },
  
  async completeSprint(sprintId: string, peerUpvotes: string[]) {
    return fetchWithAuth('/api/sprints/complete', {
      method: 'POST',
      body: JSON.stringify({ sprint_id: sprintId, peer_upvotes: peerUpvotes }),
    });
  },
  
  async getActiveSprints() {
    return fetchWithAuth('/api/sprints');
  },
};

export { ApiError };
