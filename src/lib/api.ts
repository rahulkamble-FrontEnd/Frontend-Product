const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/auth';

/**
 * PRODUCTION READY API UTILITY
 * All requests include credentials: 'include' for cross-origin cookie support.
 */

export type CreateProductPayload = {
  name: string;
  sku: string;
  brand: string;
  description: string;
  materialType: string;
  colorName: string;
  dimensions: string;
  status: string;
  performanceRating: number;
  durabilityRating: number;
  priceCategory: number;
  maintenanceRating: number;
  pros: string[];
  cons: string[];
};

export type ProductImageUploadResponse = {
  id: string;
  productId: string;
  s3Key: string;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: string;
  url: string;
};

export type ProductCategory = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  type: "material" | "furniture";
  displayOrder: number;
  isActive: boolean;
};

export type BindProductCategoriesResponse = {
  added: number;
  skipped: string[];
  invalid: string[];
};

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  description: string;
  materialType: string;
  finishType: string | null;
  colorName: string;
  colorHex: string | null;
  thickness: string | null;
  dimensions: string;
  performanceRating: number;
  durabilityRating: number;
  priceCategory: number;
  maintenanceRating: number;
  bestUsedFor: string[] | null;
  pros: string[];
  cons: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductListResponse = {
  items: ProductListItem[];
  total: number;
  page: number;
  limit: number;
};

export type ProductCompareCategory = {
  categoryId: string;
  name: string;
  slug: string;
  type: "material" | "furniture";
};

export type ProductCompareItem = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  materialType: string;
  finishType: string | null;
  colorName: string;
  thickness: string | null;
  dimensions: string;
  performanceRating: number;
  durabilityRating: number;
  priceCategory: number;
  maintenanceRating: number;
  primaryImageUrl: string | null;
  categories: ProductCompareCategory[];
};

export type ProductCompareFieldValue = string | number | null;

export type ProductCompareField = {
  key: string;
  values: ProductCompareFieldValue[];
};

export type ProductCompareResponse = {
  ids: string[];
  missingIds: string[];
  products: ProductCompareItem[];
  fields: ProductCompareField[];
};

export async function getProducts(params?: {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: string;
  categoryType?: "material" | "furniture";
  q?: string;
  includeImages?: boolean;
  includeCategories?: boolean;
}) {
  const url = new URL(`${BASE_URL.replace('/auth', '')}/products`);
  if (params?.page) url.searchParams.set('page', String(params.page));
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.status) url.searchParams.set('status', params.status);
  if (params?.categoryId) url.searchParams.set('categoryId', params.categoryId);
  if (params?.categoryType) url.searchParams.set('categoryType', params.categoryType);
  if (params?.q) url.searchParams.set('q', params.q);
  if (typeof params?.includeImages === 'boolean') url.searchParams.set('includeImages', String(params.includeImages));
  if (typeof params?.includeCategories === 'boolean') url.searchParams.set('includeCategories', String(params.includeCategories));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch products');
  }
  return response.json() as Promise<ProductListResponse>;
}

export async function getProductsCompare(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
  if (uniqueIds.length < 2 || uniqueIds.length > 4) {
    throw new Error('Compare requires 2 to 4 product ids');
  }

  const url = new URL(`${BASE_URL.replace('/auth', '')}/products/compare`);
  url.searchParams.set('ids', uniqueIds.join(','));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to compare products');
  }
  return response.json() as Promise<ProductCompareResponse>;
}

export async function getProductImages(productId: string) {
  const response = await fetch(`${BASE_URL.replace('/auth', '')}/products/${productId}/images`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch product images');
  }
  const data: unknown = await response.json();
  if (Array.isArray(data)) return data as ProductImageUploadResponse[];
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: unknown[] }).items as ProductImageUploadResponse[];
  }
  return [];
}

export type ProductDetailsResponse = ProductListItem & {
  images?: ProductImageUploadResponse[] | null;
  categories?: ProductCategory[] | null;
};

export async function getProductBySlug(slug: string) {
  const response = await fetch(`${BASE_URL.replace('/auth', '')}/products/${encodeURIComponent(slug)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch product');
  }
  return response.json() as Promise<ProductDetailsResponse>;
}

export type DeleteProductResponse = {
  message: string;
};

export async function deleteProduct(productId: string) {
  const id = productId.trim();
  if (!id) throw new Error("Product id is required");

  const response = await fetch(`${BASE_URL.replace('/auth', '')}/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete product');
  }
  return response.json() as Promise<DeleteProductResponse>;
}

export async function createProduct(payload: CreateProductPayload) {
  const response = await fetch(`${BASE_URL.replace('/auth', '')}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Product creation failed');
  }
  return response.json();
}

export async function uploadProductImage(productId: string, imageFile: File) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${BASE_URL.replace('/auth', '')}/products/${productId}/images`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Product image upload failed');
  }
  return response.json() as Promise<ProductImageUploadResponse>;
}

export type DeleteProductImageResponse = {
  message: string;
};

export async function deleteProductImage(productId: string, imageId: string) {
  const pid = productId.trim();
  const iid = imageId.trim();
  if (!pid) throw new Error("Product id is required");
  if (!iid) throw new Error("Image id is required");

  const response = await fetch(
    `${BASE_URL.replace('/auth', '')}/products/${encodeURIComponent(pid)}/images/${encodeURIComponent(iid)}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete product image');
  }
  return response.json() as Promise<DeleteProductImageResponse>;
}

export async function bindProductCategories(productId: string, categoryIds: string[]) {
  const response = await fetch(`${BASE_URL.replace('/auth', '')}/products/${productId}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryIds }),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Binding categories failed');
  }
  return response.json() as Promise<BindProductCategoriesResponse>;
}

export async function login(payload: { email: string; password: string }) {
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

export async function logout(payload: { email: string; password: string }) {
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

export async function getCategoryBySlug(slug: string) {
  const response = await fetch(`${BASE_URL.replace('/auth', '')}/categories/${slug}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch category details');
  }
  return response.json();
}
