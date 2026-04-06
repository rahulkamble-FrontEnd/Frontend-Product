const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/auth';

/**
 * PRODUCTION READY API UTILITY
 * All requests include credentials: 'include' for cross-origin cookie support.
 */

export async function login(payload: any) {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!response.ok) {
     const error = await response.json().catch(() => ({}));
     throw new Error(error.message || 'Login failed');
  }
  return response.json();
}

export async function logout(payload: any) {
  const response = await fetch(`${BASE_URL}/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!response.ok) {
     const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Logout failed');
  }
  return response.json();
}

export async function getMe() {
  const response = await fetch(`${BASE_URL}/me`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Unauthorized');
  }
  return response.json();
}

export async function forgotPassword(payload: { email: string }) {
  const response = await fetch(`${BASE_URL}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Forgot password request failed');
  }
  return response.json();
}

export async function resetPassword(payload: { token: string; newPassword: string }) {
  const response = await fetch(`${BASE_URL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Reset password failed');
  }
  return response.json();
}

export async function createUser(payload: { email: string; name: string; role: string; projectName?: string }) {
  const response = await fetch(`${BASE_URL.replace('/auth', '')}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'User creation failed');
  }
  return response.json();
}

export async function getUsers(role?: string) {
  let url = `${BASE_URL.replace('/auth', '')}/users`;
  if (role) {
    url += `?role=${role}`;
  }
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch users');
  }
  return response.json();
}

export async function deleteUser(id: string) {
  const response = await fetch(`${BASE_URL.replace('/auth', '')}/users/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to deactivate user');
  }
  return response.json();
}

export async function updateUser(id: string, payload: { name: string; email: string; role: string; projectName?: string; assignedDesignerId?: string }) {
  const response = await fetch(`${BASE_URL.replace('/auth', '')}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update user');
  }
  return response.json();
}

export async function createCategory(payload: { name: string; type: 'material' | 'furniture'; parent_id?: string }) {
  const response = await fetch(`${BASE_URL.replace('/auth', '')}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Category creation failed');
  }
  return response.json();
}

export async function getCategories(type?: 'material' | 'furniture') {
  let url = `${BASE_URL.replace('/auth', '')}/categories`;
  if (type) {
    url += `?type=${type}`;
  }
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch categories');
  }
  return response.json();
}

export async function deleteCategory(id: string) {
  const response = await fetch(`${BASE_URL.replace('/auth', '')}/categories/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to deactivate category');
  }
  return response.json();
}

export async function updateCategory(id: string, payload: { name?: string; type: 'material' | 'furniture'; parent_id?: string }) {
  const response = await fetch(`${BASE_URL.replace('/auth', '')}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update category');
  }
  return response.json();
}
