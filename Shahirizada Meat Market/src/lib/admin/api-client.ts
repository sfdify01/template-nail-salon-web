import { projectId, publicAnonKey } from '../../utils/supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-a05c3297`;

export const adminApi = {
  async login(password: string) {
    try {
      const response = await fetch(`${BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(data.error || 'Login failed');
      }

      return response.json();
    } catch (error: any) {
      console.error('Login error details:', error);
      console.error('API URL:', `${BASE_URL}/admin/login`);
      throw new Error(error.message || 'Failed to connect to server. Please check if the Supabase Edge Function is deployed.');
    }
  },

  async logout() {
    const response = await fetch(`${BASE_URL}/admin/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      credentials: 'include',
    });

    return response.json();
  },

  async checkAuth() {
    const response = await fetch(`${BASE_URL}/admin/check`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      return data.authenticated;
    }
    return false;
  },

  async getPosts() {
    const response = await fetch(`${BASE_URL}/admin/posts`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    return response.json();
  },

  async getPost(id: string) {
    const response = await fetch(`${BASE_URL}/admin/posts/${id}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch post');
    }

    return response.json();
  },

  async createPost(post: any) {
    const response = await fetch(`${BASE_URL}/admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      credentials: 'include',
      body: JSON.stringify(post),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create post');
    }

    return response.json();
  },

  async updatePost(id: string, updates: any) {
    const response = await fetch(`${BASE_URL}/admin/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update post');
    }

    return response.json();
  },

  async deletePost(id: string) {
    const response = await fetch(`${BASE_URL}/admin/posts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete post');
    }

    return response.json();
  },

  async uploadImage(file: File, slug: string) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('slug', slug);

    const response = await fetch(`${BASE_URL}/admin/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Upload failed');
    }

    return response.json();
  },

  async deduplicateBlogs(dryRun: boolean = true) {
    const response = await fetch(`${BASE_URL}/admin/dedupe-blogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      credentials: 'include',
      body: JSON.stringify({ dryRun }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Deduplication failed');
    }

    return response.json();
  },

  async getDeduplicationLogs() {
    const response = await fetch(`${BASE_URL}/admin/dedupe-logs`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch deduplication logs');
    }

    return response.json();
  },

  async getMenu() {
    const response = await fetch(`${BASE_URL}/menu`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch menu');
    }

    return response.json();
  },

  async updateMenu(menuData: any) {
    const response = await fetch(`${BASE_URL}/admin/menu`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      credentials: 'include',
      body: JSON.stringify(menuData),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Failed to update menu' }));
      throw new Error(data.error || 'Failed to update menu');
    }

    return response.json();
  },

  async uploadProductImage(file: File, itemId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);
    formData.append('itemId', itemId);

    const response = await fetch(`${BASE_URL}/admin/product/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Upload failed');
    }

    return response.json();
  },
};
