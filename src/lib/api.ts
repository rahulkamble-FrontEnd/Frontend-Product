// const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://47.128.67.255:3000/api/auth';
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://pmsapi.customfurnish.com/api/auth';

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

export type CreateShortlistPayload = {
  productId: string;
  customerNote: string;
};

export type ShortlistResponse = {
  id: string;
  customerId: string;
  productId: string;
  customerNote: string;
  sampleRequested: boolean;
  sampleRequestedAt: string | null;
  sampleStatus: string;
  createdAt: string;
};

export type ShortlistProduct = ProductListItem & {
  deletedAt: string | null;
  images?: ProductImageUploadResponse[] | null;
};

export type ShortlistItem = ShortlistResponse & {
  product?: ShortlistProduct | null;
};

export type UpdateShortlistNotePayload = {
  customerNote: string;
};

export type DeleteShortlistResponse = {
  message: string;
};

export type DesignerCustomer = {
  id: string;
  email: string;
  name: string;
  role: string;
  projectName?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedDesigner?: {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: string;
    projectName?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    resetPasswordToken: string | null;
    resetPasswordExpires: string | null;
  } | null;
};

export type DesignerCustomerDetailNote = {
  id?: string;
  designerId?: string;
  customerId?: string;
  productId?: string | null;
  title?: string | null;
  note?: string | null;
  content?: string | null;
  message?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
};

export type DesignerCustomerDetailResponse = {
  customer: DesignerCustomer;
  shortlist: ShortlistItem[];
  notes: DesignerCustomerDetailNote[];
};

export type CreateDesignerNotePayload = {
  customerId: string;
  productId?: string;
  note: string;
};

export type CreateDesignerRecommendationPayload = {
  customerId: string;
  productId: string;
  note: string;
};

export type UpdateDesignerNotePayload = {
  note: string;
};

export type UpdateDesignerSamplePayload = {
  sampleStatus: string;
};

export type NotificationItem = {
  id: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

export type DesignerRecommendationResponse = {
  id: string;
  designerId: string;
  customerId: string;
  productId: string;
  note: string;
  createdAt: string;
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

export async function createShortlist(payload: CreateShortlistPayload) {
  const productId = payload?.productId?.trim();
  if (!productId) throw new Error("Product id is required");

  const customerNote = typeof payload?.customerNote === "string" ? payload.customerNote.trim() : "";

  const response = await fetch(`${BASE_URL.replace('/auth', '')}/shortlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId,
      customerNote,
    }),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create shortlist item');
  }
  return response.json() as Promise<ShortlistResponse>;
}

export async function getShortlist() {
  const response = await fetch(`${BASE_URL.replace('/auth', '')}/shortlist`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch shortlist');
  }
  return response.json() as Promise<ShortlistItem[]>;
}

export async function requestShortlistSample(shortlistId: string) {
  const id = shortlistId.trim();
  if (!id) throw new Error("Shortlist id is required");

  const response = await fetch(`${BASE_URL.replace('/auth', '')}/shortlist/${encodeURIComponent(id)}/sample`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to request sample');
  }
  return response.json() as Promise<ShortlistResponse>;
}

export async function updateShortlistNote(shortlistId: string, payload: UpdateShortlistNotePayload) {
  const id = shortlistId.trim();
  if (!id) throw new Error("Shortlist id is required");

  const customerNote = typeof payload?.customerNote === "string" ? payload.customerNote.trim() : "";

  const response = await fetch(`${BASE_URL.replace('/auth', '')}/shortlist/${encodeURIComponent(id)}/note`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerNote }),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update shortlist note');
  }
  return response.json() as Promise<ShortlistResponse>;
}

export async function deleteShortlist(shortlistId: string) {
  const id = shortlistId.trim();
  if (!id) throw new Error("Shortlist id is required");

  const response = await fetch(`${BASE_URL.replace('/auth', '')}/shortlist/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to remove shortlist item');
  }
  return response.json() as Promise<DeleteShortlistResponse>;
}

export async function getDesignerCustomers() {
  const response = await fetch(`${BASE_URL.replace('/auth', '')}/designer/customers`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch designer customers');
  }
  return response.json() as Promise<DesignerCustomer[]>;
}

export async function getDesignerCustomerDetails(customerId: string) {
  const id = customerId.trim();
  if (!id) throw new Error("Customer id is required");

  const response = await fetch(`${BASE_URL.replace('/auth', '')}/designer/customers/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch designer customer details');
  }
  return response.json() as Promise<DesignerCustomerDetailResponse>;
}

export async function createDesignerNote(payload: CreateDesignerNotePayload) {
  const customerId = payload?.customerId?.trim();
  if (!customerId) throw new Error("Customer id is required");

  const note = typeof payload?.note === "string" ? payload.note.trim() : "";
  if (!note) throw new Error("Note is required");

  const productId = typeof payload?.productId === "string" ? payload.productId.trim() : "";

  const response = await fetch(`${BASE_URL.replace('/auth', '')}/designer/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId,
      ...(productId ? { productId } : {}),
      note,
    }),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create designer note');
  }
  return response.json() as Promise<DesignerCustomerDetailNote>;
}

export async function createDesignerRecommendation(payload: CreateDesignerRecommendationPayload) {
  const customerId = payload?.customerId?.trim();
  if (!customerId) throw new Error("Customer id is required");

  const productId = payload?.productId?.trim();
  if (!productId) throw new Error("Product id is required");

  const note = typeof payload?.note === "string" ? payload.note.trim() : "";
  if (!note) throw new Error("Note is required");

  const response = await fetch(`${BASE_URL.replace('/auth', '')}/designer/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId,
      productId,
      note,
    }),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create recommendation');
  }
  return response.json() as Promise<DesignerRecommendationResponse>;
}

export async function updateDesignerNote(noteId: string, payload: UpdateDesignerNotePayload) {
  const id = noteId.trim();
  if (!id) throw new Error("Note id is required");

  const note = typeof payload?.note === "string" ? payload.note.trim() : "";
  if (!note) throw new Error("Note is required");

  const response = await fetch(`${BASE_URL.replace('/auth', '')}/designer/notes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update designer note');
  }
  return response.json() as Promise<DesignerCustomerDetailNote>;
}

export async function updateDesignerSample(shortlistId: string, payload: UpdateDesignerSamplePayload) {
  const id = shortlistId.trim();
  if (!id) throw new Error("Shortlist id is required");

  const sampleStatus = typeof payload?.sampleStatus === "string" ? payload.sampleStatus.trim() : "";
  if (!sampleStatus) throw new Error("Sample status is required");

  const response = await fetch(`${BASE_URL.replace('/auth', '')}/designer/samples/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sampleStatus }),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update sample status');
  }
  return response.json() as Promise<ShortlistResponse>;
}

export async function getNotifications() {
  const response = await fetch(`${BASE_URL.replace('/auth', '')}/notifications`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch notifications');
  }
  return response.json() as Promise<NotificationItem[]>;
}

export async function markNotificationAsRead(notificationId: string) {
  const id = notificationId.trim();
  if (!id) throw new Error("Notification id is required");

  const response = await fetch(`${BASE_URL.replace('/auth', '')}/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to mark notification as read');
  }
  return response.json() as Promise<NotificationItem>;
}

export type MarkAllNotificationsReadResponse = {
  updatedCount: number;
};

export async function markAllNotificationsAsRead() {
  const response = await fetch(`${BASE_URL.replace('/auth', '')}/notifications/read-all`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to mark all notifications as read');
  }
  return response.json() as Promise<MarkAllNotificationsReadResponse>;
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

export type UpdateProductStatusPayload = {
  status: string;
};

export type UpdateProductStatusResponse = ProductListItem & {
  deletedAt: string | null;
};

export async function updateProductStatus(productId: string, payload: UpdateProductStatusPayload) {
  const id = productId.trim();
  if (!id) throw new Error("Product id is required");
  const nextStatus = payload?.status?.trim();
  if (!nextStatus) throw new Error("Status is required");

  const response = await fetch(`${BASE_URL.replace('/auth', '')}/products/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: nextStatus }),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update product status');
  }
  return response.json() as Promise<UpdateProductStatusResponse>;
}

export type UpdateProductPayload = {
  name: string;
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
  status: "draft" | "active" | "archived" | "published";
};

export type UpdateProductResponse = ProductListItem & {
  deletedAt: string | null;
};

export async function updateProduct(productId: string, payload: UpdateProductPayload) {
  const id = productId.trim();
  if (!id) throw new Error("Product id is required");

  if (!payload || typeof payload !== "object") throw new Error("Payload is required");
  if (!payload.name?.trim()) throw new Error("name must be a non-empty string");
  if (!payload.sku?.trim()) throw new Error("sku must be a non-empty string");
  if (!payload.brand?.trim()) throw new Error("brand must be a non-empty string");
  if (!payload.description?.trim()) throw new Error("description must be a non-empty string");
  if (!payload.materialType?.trim()) throw new Error("materialType must be a non-empty string");
  if (!payload.colorName?.trim()) throw new Error("colorName must be a non-empty string");
  if (!payload.dimensions?.trim()) throw new Error("dimensions must be a non-empty string");

  if (typeof payload.performanceRating !== "number") throw new Error("performanceRating must be a number");
  if (typeof payload.durabilityRating !== "number") throw new Error("durabilityRating must be a number");
  if (typeof payload.priceCategory !== "number") throw new Error("priceCategory must be a number");
  if (typeof payload.maintenanceRating !== "number") throw new Error("maintenanceRating must be a number");

  if (payload.bestUsedFor !== null && !Array.isArray(payload.bestUsedFor)) throw new Error("bestUsedFor must be an array of strings or null");
  if (!Array.isArray(payload.pros)) throw new Error("pros must be an array of strings");
  if (!Array.isArray(payload.cons)) throw new Error("cons must be an array of strings");
  if (
    (Array.isArray(payload.bestUsedFor) && payload.bestUsedFor.some((v) => typeof v !== "string")) ||
    payload.pros.some((v) => typeof v !== "string") ||
    payload.cons.some((v) => typeof v !== "string")
  ) {
    throw new Error("Arrays must contain only strings");
  }

  const response = await fetch(`${BASE_URL.replace('/auth', '')}/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update product");
  }
  return response.json() as Promise<UpdateProductResponse>;
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

export type DeleteProductCategoryResponse = {
  message: string;
};

export async function deleteProductCategory(productId: string, categoryId: string) {
  const pid = productId.trim();
  const cid = categoryId.trim();
  if (!pid) throw new Error("Product id is required");
  if (!cid) throw new Error("Category id is required");

  const response = await fetch(
    `${BASE_URL.replace('/auth', '')}/products/${encodeURIComponent(pid)}/categories/${encodeURIComponent(cid)}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to unlink category');
  }
  return response.json() as Promise<DeleteProductCategoryResponse>;
}

export type BlogStatus = "draft" | "published" | "archived";

export type CreateBlogPayload = {
  title: string;
  slug: string;
  body: string;
  status: BlogStatus;
  categoryTag?: string | null;
  featuredImageS3Key?: string | null;
};

export type BlogAuthor = {
  id: string;
};

export type BlogItem = {
  id: string;
  title: string;
  slug: string;
  body: string;
  status: string;
  categoryTag: string | null;
  featuredImageS3Key: string | null;
  featuredImageUrl: string | null;
  author?: BlogAuthor | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type RawBlogResponse = {
  id?: string;
  title?: string;
  slug?: string;
  body?: string;
  status?: string;
  categoryTag?: string | null;
  category_tag?: string | null;
  featuredImageS3Key?: string | null;
  featured_image_s3_key?: string | null;
  featuredImageUrl?: string | null;
  featured_image_url?: string | null;
  author?: BlogAuthor | null;
  publishedAt?: string | null;
  published_at?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

function normalizeBlog(raw: RawBlogResponse): BlogItem {
  return {
    id: raw.id ?? "",
    title: raw.title ?? "",
    slug: raw.slug ?? "",
    body: raw.body ?? "",
    status: raw.status ?? "draft",
    categoryTag: raw.categoryTag ?? raw.category_tag ?? null,
    featuredImageS3Key: raw.featuredImageS3Key ?? raw.featured_image_s3_key ?? null,
    featuredImageUrl: raw.featuredImageUrl ?? raw.featured_image_url ?? null,
    author: raw.author ?? null,
    publishedAt: raw.publishedAt ?? raw.published_at ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
  };
}

export async function getBlogs() {
  const response = await fetch(`${BASE_URL.replace('/auth', '')}/blog`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch blogs");
  }

  const data: unknown = await response.json();
  if (Array.isArray(data)) {
    return data.map((item) => normalizeBlog(item as RawBlogResponse));
  }

  if (data && typeof data === "object") {
    const obj = data as { items?: unknown; data?: unknown; blogs?: unknown };
    const listLike = obj.items ?? obj.data ?? obj.blogs;
    if (Array.isArray(listLike)) {
      return listLike.map((item) => normalizeBlog(item as RawBlogResponse));
    }
  }

  return [] as BlogItem[];
}

export async function createBlog(payload: CreateBlogPayload, featuredImageFile?: File) {
  const cleanPayload = {
    title: payload.title.trim(),
    slug: payload.slug.trim(),
    body: payload.body.trim(),
    status: payload.status,
    categoryTag: payload.categoryTag?.trim() || null,
    featuredImageS3Key: payload.featuredImageS3Key?.trim() || null,
  };

  const endpoint = `${BASE_URL.replace('/auth', '')}/blog`;
  const response = featuredImageFile instanceof File
    ? await fetch(endpoint, {
        method: "POST",
        body: (() => {
          const formData = new FormData();
          formData.append("title", cleanPayload.title);
          formData.append("slug", cleanPayload.slug);
          formData.append("body", cleanPayload.body);
          formData.append("status", cleanPayload.status);
          if (cleanPayload.categoryTag) formData.append("categoryTag", cleanPayload.categoryTag);
          if (cleanPayload.featuredImageS3Key) formData.append("featuredImageS3Key", cleanPayload.featuredImageS3Key);
          formData.append("featuredImage", featuredImageFile);
          return formData;
        })(),
        credentials: "include",
      })
    : await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanPayload.title,
          slug: cleanPayload.slug,
          body: cleanPayload.body,
          status: cleanPayload.status,
          ...(cleanPayload.categoryTag ? { categoryTag: cleanPayload.categoryTag } : {}),
          ...(cleanPayload.featuredImageS3Key ? { featuredImageS3Key: cleanPayload.featuredImageS3Key } : {}),
        }),
        credentials: "include",
      });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create blog");
  }

  const data = (await response.json()) as RawBlogResponse;
  return normalizeBlog(data);
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
