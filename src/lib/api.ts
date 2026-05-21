/** Auth API base. Browser dev uses same-origin proxy so JWT cookie/token work on :4200. */
export function getApiAuthBase(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    if (typeof window !== "undefined") return "/backend-api/auth";
    return "http://127.0.0.1:3000/api/auth";
  }
  return "https://pmsapi.customfurnish.com/api/auth";
}

/**
 * PRODUCTION READY API UTILITY
 * All requests include credentials: 'include' for cross-origin cookie support.
 * Bearer token is sent as fallback for environments where cookies are blocked
 * (incognito, mobile, cross-site).
 */

let _accessToken: string | null =
  typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;

function syncAccessTokenFromStorage() {
  if (typeof window === 'undefined') return;
  const stored = sessionStorage.getItem('access_token');
  if (stored) _accessToken = stored;
}

export function setAccessToken(token: string | null) {
  _accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) sessionStorage.setItem('access_token', token);
    else sessionStorage.removeItem('access_token');
  }
}

export function getAccessToken() {
  syncAccessTokenFromStorage();
  return _accessToken;
}

function authHeaders(): Record<string, string> {
  syncAccessTokenFromStorage();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;
  return headers;
}

function bearerOnlyHeaders(): Record<string, string> {
  syncAccessTokenFromStorage();
  return _accessToken ? { Authorization: `Bearer ${_accessToken}` } : {};
}

/** Re-login when JWT missing but credentials are stored (common after refresh/tab reopen). */
export async function ensureAuthenticated(): Promise<void> {
  if (typeof window === "undefined") return;
  syncAccessTokenFromStorage();
  if (_accessToken) return;

  const email = localStorage.getItem("userEmail")?.trim() || "";
  const password = localStorage.getItem("userPassword") || "";
  if (!email || !password) {
    throw new Error("Session expired. Please log in again.");
  }
  await login({ email, password });
}

export type CreateProductPayload = {
  imsId: string;
  name: string;
  sku: string;
  brand: string;
  description?: string;
  bookName?: string;
  pageNumber?: string;
  application?: string;
  materialType?: string;
  colorName?: string;
  dimensions?: string;
  status: string;
  performanceRating?: number;
  durabilityRating?: number;
  priceCategory?: number;
  maintenanceRating?: number;
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
  parentId?: string | null;
  parentSlug?: string | null;
  parentName?: string | null;
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
  imsId?: string;
  brand?: string;
  description: string;
  bookName?: string | null;
  pageNumber?: string | null;
  application?: string | null;
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
  filters?: {
    finishes?: string[];
    brands?: string[];
    thicknesses?: string[];
    colors?: string[];
  };
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
  imsId?: string;
  brand?: string;
  bookName?: string | null;
  pageNumber?: string | null;
  application?: string | null;
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
  customerNote: string | null;
  sampleRequested: boolean;
  sampleRequestedAt: string | null;
  sampleStatus: string;
  designerReplyNote?: string | null;
  designerReplyUpdatedAt?: string | null;
  createdAt: string;
};

export type ShortlistProduct = ProductListItem & {
  deletedAt: string | null;
  images?: ProductImageUploadResponse[] | null;
};

export type ShortlistItem = ShortlistResponse & {
  product?: ShortlistProduct | null;
  recommendations?: DesignerRecommendationResponse[];
};

type RawShortlistResponse = {
  id?: string;
  customerId?: string;
  customer_id?: string;
  productId?: string;
  product_id?: string;
  customerNote?: string | null;
  customer_note?: string | null;
  sampleRequested?: boolean;
  sample_requested?: boolean;
  sampleRequestedAt?: string | null;
  sample_requested_at?: string | null;
  sampleStatus?: string;
  sample_status?: string;
  designerReplyNote?: string | null;
  designer_reply_note?: string | null;
  designerReplyUpdatedAt?: string | null;
  designer_reply_updated_at?: string | null;
  createdAt?: string;
  created_at?: string;
};

type RawShortlistItem = RawShortlistResponse & {
  product?: ShortlistProduct | null;
  recommendations?: DesignerRecommendationResponse[];
};

function normalizeShortlistResponse(raw: RawShortlistResponse): ShortlistResponse {
  return {
    id: raw.id ?? "",
    customerId: raw.customerId ?? raw.customer_id ?? "",
    productId: raw.productId ?? raw.product_id ?? "",
    customerNote: raw.customerNote ?? raw.customer_note ?? null,
    sampleRequested: raw.sampleRequested ?? raw.sample_requested ?? false,
    sampleRequestedAt: raw.sampleRequestedAt ?? raw.sample_requested_at ?? null,
    sampleStatus: raw.sampleStatus ?? raw.sample_status ?? "none",
    designerReplyNote: raw.designerReplyNote ?? raw.designer_reply_note ?? null,
    designerReplyUpdatedAt:
      raw.designerReplyUpdatedAt ?? raw.designer_reply_updated_at ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  };
}

function normalizeShortlistItem(raw: RawShortlistItem): ShortlistItem {
  return {
    ...normalizeShortlistResponse(raw),
    product: raw.product ?? null,
    recommendations: Array.isArray(raw.recommendations)
      ? raw.recommendations
      : [],
  };
}

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
  recommendations?: DesignerRecommendationResponse[];
};

export type CreateDesignerNotePayload = {
  customerId: string;
  productId?: string;
  note: string;
};

export type CreateDesignerRecommendationPayload = {
  customerId: string;
  productId: string;
  shortlistedProductId: string;
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
  shortlistedProductId?: string | null;
  note: string;
  createdAt: string;
  product?: ShortlistProduct | null;
};

export async function getProducts(params?: {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: string;
  categoryType?: "material" | "furniture";
  q?: string;
  brand?: string;
  thickness?: string;
  colorName?: string;
  includeImages?: boolean;
  includeCategories?: boolean;
  sortBy?: "createdAt" | "updatedAt" | "name";
  sortOrder?: "asc" | "desc";
}) {
  const url = new URL(`${getApiAuthBase().replace('/auth', '')}/products`);
  if (params?.page) url.searchParams.set('page', String(params.page));
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.status) url.searchParams.set('status', params.status);
  if (params?.categoryId) url.searchParams.set('categoryId', params.categoryId);
  if (params?.categoryType) url.searchParams.set('categoryType', params.categoryType);
  if (params?.q) url.searchParams.set('q', params.q);
  if (params?.brand) url.searchParams.set('brand', params.brand);
  if (params?.thickness) url.searchParams.set('thickness', params.thickness);
  if (params?.colorName) url.searchParams.set('colorName', params.colorName);
  if (typeof params?.includeImages === 'boolean') url.searchParams.set('includeImages', String(params.includeImages));
  if (typeof params?.includeCategories === 'boolean') url.searchParams.set('includeCategories', String(params.includeCategories));
  if (params?.sortBy) url.searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) url.searchParams.set('sortOrder', params.sortOrder);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
    cache: 'no-store',
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

  const url = new URL(`${getApiAuthBase().replace('/auth', '')}/products/compare`);
  url.searchParams.set('ids', uniqueIds.join(','));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: authHeaders(),
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

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/shortlist`, {
    method: 'POST',
    headers: authHeaders(),
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
  return normalizeShortlistResponse(
    (await response.json()) as RawShortlistResponse
  );
}

export async function getShortlist() {
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/shortlist`, {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch shortlist');
  }
  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map((item) => normalizeShortlistItem(item as RawShortlistItem));
}

export async function requestShortlistSample(shortlistId: string) {
  const id = shortlistId.trim();
  if (!id) throw new Error("Shortlist id is required");

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/shortlist/${encodeURIComponent(id)}/sample`, {
    method: 'POST',
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to request sample');
  }
  return normalizeShortlistResponse(
    (await response.json()) as RawShortlistResponse
  );
}

export async function updateShortlistNote(shortlistId: string, payload: UpdateShortlistNotePayload) {
  const id = shortlistId.trim();
  if (!id) throw new Error("Shortlist id is required");

  const customerNote = typeof payload?.customerNote === "string" ? payload.customerNote.trim() : "";

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/shortlist/${encodeURIComponent(id)}/note`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ customerNote }),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update shortlist note');
  }
  return normalizeShortlistResponse(
    (await response.json()) as RawShortlistResponse
  );
}

export async function deleteShortlist(shortlistId: string) {
  const id = shortlistId.trim();
  if (!id) throw new Error("Shortlist id is required");

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/shortlist/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to remove shortlist item');
  }
  return response.json() as Promise<DeleteShortlistResponse>;
}

export async function getDesignerCustomers() {
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/designer/customers`, {
    method: 'GET',
    headers: authHeaders(),
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

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/designer/customers/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch designer customer details');
  }
  const raw = (await response.json()) as DesignerCustomerDetailResponse;
  return {
    ...raw,
    shortlist: Array.isArray(raw.shortlist)
      ? raw.shortlist.map((item) =>
          normalizeShortlistItem(item as unknown as RawShortlistItem)
        )
      : [],
  };
}

export async function createDesignerNote(payload: CreateDesignerNotePayload) {
  const customerId = payload?.customerId?.trim();
  if (!customerId) throw new Error("Customer id is required");

  const note = typeof payload?.note === "string" ? payload.note.trim() : "";
  if (!note) throw new Error("Note is required");

  const productId = typeof payload?.productId === "string" ? payload.productId.trim() : "";

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/designer/notes`, {
    method: 'POST',
    headers: authHeaders(),
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

  const shortlistedProductId = payload?.shortlistedProductId?.trim();
  if (!shortlistedProductId) throw new Error("Shortlisted product id is required");

  const note = typeof payload?.note === "string" ? payload.note.trim() : "";
  if (!note) throw new Error("Note is required");

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/designer/recommendations`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      customerId,
      productId,
      shortlistedProductId,
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

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/designer/notes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: authHeaders(),
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

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/designer/samples/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ sampleStatus }),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update sample status');
  }
  return normalizeShortlistResponse(
    (await response.json()) as RawShortlistResponse
  );
}

export async function getNotifications() {
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/notifications`, {
    method: 'GET',
    headers: authHeaders(),
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

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PUT',
    headers: authHeaders(),
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
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/notifications/read-all`, {
    method: 'PUT',
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to mark all notifications as read');
  }
  return response.json() as Promise<MarkAllNotificationsReadResponse>;
}

export async function getProductImages(productId: string) {
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/products/${productId}/images`, {
    method: 'GET',
    headers: authHeaders(),
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
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/products/${encodeURIComponent(slug)}`, {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch product');
  }
  return response.json() as Promise<ProductDetailsResponse>;
}

export async function getSimilarProductsByTags(productId: string, limit = 24) {
  const pid = productId.trim();
  if (!pid) throw new Error("Product id is required");

  const url = new URL(
    `${getApiAuthBase().replace('/auth', '')}/products/${encodeURIComponent(pid)}/similar`,
  );
  if (Number.isFinite(limit) && limit > 0) {
    url.searchParams.set("limit", String(Math.floor(limit)));
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: authHeaders(),
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch similar products");
  }
  const data: unknown = await response.json();
  return Array.isArray(data) ? (data as ProductListItem[]) : [];
}

export type DeleteProductResponse = {
  message: string;
};

export async function deleteProduct(productId: string) {
  const id = productId.trim();
  if (!id) throw new Error("Product id is required");

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
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

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/products/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    headers: authHeaders(),
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
  imsId?: string;
  name: string;
  sku: string;
  brand: string;
  description: string;
  bookName?: string | null;
  pageNumber?: string | null;
  application?: string | null;
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

export type UpdateProductPatchPayload = Partial<UpdateProductPayload>;

export type UpdateProductResponse = ProductListItem & {
  deletedAt: string | null;
};

export type BulkUpdateProductsPayload = {
  productIds: string[];
  status?: "draft" | "active" | "archived" | "published";
  brand?: string;
  materialType?: string;
  finishType?: string;
  colorName?: string;
  thickness?: string;
  dimensions?: string;
  performanceRating?: number;
  durabilityRating?: number;
  maintenanceRating?: number;
};

export type BulkUpdateProductsResponse = {
  matchedCount: number;
  updatedCount: number;
};

export async function bulkUpdateProducts(payload: BulkUpdateProductsPayload) {
  const ids = Array.from(
    new Set((payload?.productIds ?? []).map((id) => id?.trim()).filter(Boolean)),
  );
  if (ids.length === 0) throw new Error("At least one product id is required");

  const body: Record<string, unknown> = { productIds: ids };
  const stringKeys: Array<keyof Omit<BulkUpdateProductsPayload, "productIds" | "status">> = [
    "brand",
    "materialType",
    "finishType",
    "colorName",
    "thickness",
    "dimensions",
  ];
  for (const key of stringKeys) {
    const raw = payload[key];
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (trimmed) body[key] = trimmed;
  }
  if (payload.status) body.status = payload.status;
  if (typeof payload.performanceRating === "number" && Number.isFinite(payload.performanceRating)) {
    body.performanceRating = payload.performanceRating;
  }
  if (typeof payload.durabilityRating === "number" && Number.isFinite(payload.durabilityRating)) {
    body.durabilityRating = payload.durabilityRating;
  }
  if (typeof payload.maintenanceRating === "number" && Number.isFinite(payload.maintenanceRating)) {
    body.maintenanceRating = payload.maintenanceRating;
  }

  if (Object.keys(body).length <= 1) {
    throw new Error("At least one update field is required");
  }

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/products/bulk-update`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to bulk update products");
  }
  return response.json() as Promise<BulkUpdateProductsResponse>;
}

export async function updateProduct(productId: string, payload: UpdateProductPayload) {
  const id = productId.trim();
  if (!id) throw new Error("Product id is required");

  if (!payload || typeof payload !== "object") throw new Error("Payload is required");

  // Backend supports partial updates via UpdateProductDto (all fields optional).
  // We intentionally send only the fields provided here.
  const clean: Record<string, unknown> = {};
  const setIfDefined = (key: string, value: unknown) => {
    if (value !== undefined) clean[key] = value;
  };

  const trimOrUndef = (value: unknown) => {
    if (typeof value !== "string") return undefined;
    const t = value.trim();
    return t ? t : undefined;
  };

  const toCleanStringArrayOrUndef = (value: unknown) => {
    if (!Array.isArray(value)) return undefined;
    const cleaned = value
      .filter((v) => typeof v === "string")
      .map((v) => v.trim())
      .filter(Boolean);
    return cleaned;
  };

  // Strings
  setIfDefined("imsId", trimOrUndef((payload as UpdateProductPatchPayload).imsId));
  setIfDefined("name", trimOrUndef((payload as UpdateProductPatchPayload).name));
  setIfDefined("sku", trimOrUndef((payload as UpdateProductPatchPayload).sku));
  setIfDefined("brand", trimOrUndef((payload as UpdateProductPatchPayload).brand));
  setIfDefined("description", trimOrUndef((payload as UpdateProductPatchPayload).description));
  setIfDefined("bookName", trimOrUndef((payload as UpdateProductPatchPayload).bookName));
  setIfDefined("pageNumber", trimOrUndef((payload as UpdateProductPatchPayload).pageNumber));
  setIfDefined("application", trimOrUndef((payload as UpdateProductPatchPayload).application));
  setIfDefined("materialType", trimOrUndef((payload as UpdateProductPatchPayload).materialType));
  setIfDefined("finishType", trimOrUndef((payload as UpdateProductPatchPayload).finishType));
  setIfDefined("colorName", trimOrUndef((payload as UpdateProductPatchPayload).colorName));
  setIfDefined("colorHex", trimOrUndef((payload as UpdateProductPatchPayload).colorHex));
  setIfDefined("thickness", trimOrUndef((payload as UpdateProductPatchPayload).thickness));
  setIfDefined("dimensions", trimOrUndef((payload as UpdateProductPatchPayload).dimensions));

  // Numbers
  const numericKeys: Array<keyof UpdateProductPayload> = [
    "performanceRating",
    "durabilityRating",
    "priceCategory",
    "maintenanceRating",
  ];
  for (const key of numericKeys) {
    const value = (payload as UpdateProductPatchPayload)[key];
    if (value === undefined) continue;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`${String(key)} must be a finite number`);
    }
    clean[String(key)] = value;
  }

  // Arrays (NOTE: Backend DTO expects arrays (no nulls), so we omit when not provided.
  const bestUsedFor = toCleanStringArrayOrUndef((payload as UpdateProductPatchPayload).bestUsedFor);
  if (Array.isArray(bestUsedFor)) clean.bestUsedFor = bestUsedFor;
  const pros = toCleanStringArrayOrUndef((payload as UpdateProductPatchPayload).pros);
  if (Array.isArray(pros)) clean.pros = pros;
  const cons = toCleanStringArrayOrUndef((payload as UpdateProductPatchPayload).cons);
  if (Array.isArray(cons)) clean.cons = cons;

  // Status
  if ((payload as UpdateProductPatchPayload).status !== undefined) {
    clean.status = (payload as UpdateProductPatchPayload).status;
  }

  // Remove undefineds (if any slipped through)
  for (const [key, value] of Object.entries(clean)) {
    if (value === undefined) delete clean[key];
  }
  if (Object.keys(clean).length === 0) {
    throw new Error("At least one field is required to update");
  }

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(clean),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update product");
  }
  return response.json() as Promise<UpdateProductResponse>;
}

export async function createProduct(payload: CreateProductPayload) {
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Product creation failed');
  }
  return response.json();
}

export type BulkUploadProductsResponse = {
  totalRows: number;
  createdCount: number;
  failedCount: number;
  created: Array<{ row: number; id: string; sku: string; name: string }>;
  errors: Array<{ row: number; sku?: string; message: string }>;
};

export async function bulkUploadProducts(file: File, imagesZip?: File | null) {
  if (!(file instanceof File)) {
    throw new Error("XLSX file is required");
  }

  const formData = new FormData();
  formData.append("file", file);
  if (imagesZip instanceof File) {
    formData.append("imagesZip", imagesZip);
  }

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/products/bulk-upload`, {
    method: "POST",
    headers: bearerOnlyHeaders(),
    body: formData,
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Bulk product upload failed");
  }
  return response.json() as Promise<BulkUploadProductsResponse>;
}

export async function uploadProductImage(productId: string, imageFile: File) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/products/${productId}/images`, {
    method: 'POST',
    headers: bearerOnlyHeaders(),
    body: formData,
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Product image upload failed');
  }
  return response.json() as Promise<ProductImageUploadResponse>;
}

export async function uploadProductImages(productId: string, imageFiles: File[]) {
  const pid = productId.trim();
  if (!pid) throw new Error("Product id is required");

  const files = Array.isArray(imageFiles)
    ? imageFiles.filter((file) => file instanceof File)
    : [];
  if (files.length < 1 || files.length > 3) {
    throw new Error("Please select minimum 1 and maximum 3 images.");
  }

  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const response = await fetch(
    `${getApiAuthBase().replace('/auth', '')}/products/${encodeURIComponent(pid)}/images`,
    {
      method: "POST",
      headers: bearerOnlyHeaders(),
      body: formData,
      credentials: "include",
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Product image upload failed");
  }

  const data: unknown = await response.json();
  return Array.isArray(data)
    ? (data as ProductImageUploadResponse[])
    : ([data] as ProductImageUploadResponse[]);
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
    `${getApiAuthBase().replace('/auth', '')}/products/${encodeURIComponent(pid)}/images/${encodeURIComponent(iid)}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
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
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/products/${productId}/categories`, {
    method: 'POST',
    headers: authHeaders(),
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

export async function subscribeNewsletter(email: string) {
  const response = await fetch('/api/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Subscription failed');
  }

  return response.json();
}

export async function deleteProductCategory(productId: string, categoryId: string) {
  const pid = productId.trim();
  const cid = categoryId.trim();
  if (!pid) throw new Error("Product id is required");
  if (!cid) throw new Error("Category id is required");

  const response = await fetch(
    `${getApiAuthBase().replace('/auth', '')}/products/${encodeURIComponent(pid)}/categories/${encodeURIComponent(cid)}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
      credentials: 'include',
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to unlink category');
  }
  return response.json() as Promise<DeleteProductCategoryResponse>;
}

export type LinkProductTagPayload = {
  tagId: string;
};

export type LinkProductTagResponse = {
  message: string;
  linked: boolean;
};

export type UnlinkProductTagResponse = {
  message: string;
};

export async function linkProductTag(productId: string, payload: LinkProductTagPayload) {
  const pid = productId.trim();
  if (!pid) throw new Error("Product id is required");

  const tagId = payload?.tagId?.trim();
  if (!tagId) throw new Error("Tag id is required");

  const response = await fetch(
    `${getApiAuthBase().replace('/auth', '')}/products/${encodeURIComponent(pid)}/tags`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ tagId }),
      credentials: "include",
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to link tag to product");
  }
  return response.json() as Promise<LinkProductTagResponse>;
}

export async function unlinkProductTag(productId: string, tagId: string) {
  const pid = productId.trim();
  const tid = tagId.trim();
  if (!pid) throw new Error("Product id is required");
  if (!tid) throw new Error("Tag id is required");

  const response = await fetch(
    `${getApiAuthBase().replace('/auth', '')}/products/${encodeURIComponent(pid)}/tags/${encodeURIComponent(tid)}`,
    {
      method: "DELETE",
      headers: authHeaders(),
      credentials: "include",
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to unlink tag from product");
  }
  return response.json() as Promise<UnlinkProductTagResponse>;
}

export type BlogStatus = "draft" | "published" | "archived";

export type CreateBlogPayload = {
  title: string;
  slug: string;
  body: string;
  status: BlogStatus;
  publishedAt?: string | null;
  categoryId?: string | null;
  featuredImageS3Key?: string | null;
  featuredImageAlt?: string | null;
  featuredImageTitle?: string | null;
  socialImageS3Key?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  seoKeyword?: string | null;
  secondaryKeywords?: string | null;
  canonicalUrl?: string | null;
  metaRobots?: "index" | "noindex" | null;
};

export type BlogAuthor = {
  id: string;
  name?: string | null;
};

export type BlogItem = {
  id: string;
  title: string;
  slug: string;
  body: string;
  status: string;
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  featuredImageS3Key: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  featuredImageTitle: string | null;
  socialImageS3Key: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  seoKeyword: string | null;
  secondaryKeywords: string | null;
  canonicalUrl: string | null;
  metaRobots: "index" | "noindex" | null;
  author?: BlogAuthor | null;
  author_name?: string | null;
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
  categoryId?: string | null;
  category_id?: string | null;
  category?: {
    id?: string;
    name?: string;
    slug?: string;
  } | null;
  featuredImageS3Key?: string | null;
  featured_image_s3_key?: string | null;
  featuredImageUrl?: string | null;
  featured_image_url?: string | null;
  featuredImageAlt?: string | null;
  featured_image_alt?: string | null;
  featuredImageTitle?: string | null;
  featured_image_title?: string | null;
  socialImageS3Key?: string | null;
  social_image_s3_key?: string | null;
  metaTitle?: string | null;
  meta_title?: string | null;
  metaDescription?: string | null;
  meta_description?: string | null;
  seoKeyword?: string | null;
  seo_keyword?: string | null;
  secondaryKeywords?: string | null;
  secondary_keywords?: string | null;
  canonicalUrl?: string | null;
  canonical_url?: string | null;
  metaRobots?: "index" | "noindex" | null;
  meta_robots?: "index" | "noindex" | null;
  author?: BlogAuthor | null;
  author_name?: string | null;
  publishedAt?: string | null;
  published_at?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

function normalizeBlog(raw: RawBlogResponse): BlogItem {
  const metaRobots =
    raw.metaRobots ?? raw.meta_robots ?? null;
  return {
    id: raw.id ?? "",
    title: raw.title ?? "",
    slug: raw.slug ?? "",
    body: raw.body ?? "",
    status: raw.status ?? "draft",
    categoryId: raw.categoryId ?? raw.category_id ?? raw.category?.id ?? null,
    category:
      raw.category && typeof raw.category === "object"
        ? {
            id: raw.category.id ?? "",
            name: raw.category.name ?? "",
            slug: raw.category.slug,
          }
        : null,
    featuredImageS3Key: raw.featuredImageS3Key ?? raw.featured_image_s3_key ?? null,
    featuredImageUrl: raw.featuredImageUrl ?? raw.featured_image_url ?? null,
    featuredImageAlt: raw.featuredImageAlt ?? raw.featured_image_alt ?? null,
    featuredImageTitle: raw.featuredImageTitle ?? raw.featured_image_title ?? null,
    socialImageS3Key: raw.socialImageS3Key ?? raw.social_image_s3_key ?? null,
    metaTitle: raw.metaTitle ?? raw.meta_title ?? null,
    metaDescription: raw.metaDescription ?? raw.meta_description ?? null,
    seoKeyword: raw.seoKeyword ?? raw.seo_keyword ?? null,
    secondaryKeywords: raw.secondaryKeywords ?? raw.secondary_keywords ?? null,
    canonicalUrl: raw.canonicalUrl ?? raw.canonical_url ?? null,
    metaRobots: metaRobots === "noindex" ? "noindex" : metaRobots === "index" ? "index" : null,
    author:
      raw.author && typeof raw.author === "object"
        ? {
            id: raw.author.id ?? "",
            name: raw.author.name ?? raw.author_name ?? null,
          }
        : raw.author_name
          ? { id: "", name: raw.author_name }
          : null,
    publishedAt: raw.publishedAt ?? raw.published_at ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
  };
}

export async function getBlogs(params?: { publishedOnly?: boolean; includeCredentials?: boolean }) {
  const isAdminList = params?.publishedOnly === false;
  if (isAdminList) await ensureAuthenticated();
  const blogBase = `${getApiAuthBase().replace('/auth', '')}/blog`;
  const url = isAdminList ? `${blogBase}/admin` : blogBase;
  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(),
    credentials: isAdminList || params?.includeCredentials ? "include" : "omit",
  });
  if (response.status === 401) setAccessToken(null);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch blogs");
  }

  const normalizeList = (list: unknown[]) => {
    const normalized = list.map((item) => normalizeBlog(item as RawBlogResponse));
    if (params?.publishedOnly === false) return normalized;
    return normalized.filter((item) => item.status === "published");
  };

  const data: unknown = await response.json();
  if (Array.isArray(data)) {
    return normalizeList(data);
  }

  if (data && typeof data === "object") {
    const obj = data as { items?: unknown; data?: unknown; blogs?: unknown };
    const listLike = obj.items ?? obj.data ?? obj.blogs;
    if (Array.isArray(listLike)) {
      return normalizeList(listLike);
    }
  }

  return [] as BlogItem[];
}

export async function getBlogBySlug(slug: string, params?: { publishedOnly?: boolean }) {
  const cleanSlug = slug.trim();
  if (!cleanSlug) throw new Error("Blog slug is required");

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/blog/${encodeURIComponent(cleanSlug)}`, {
    method: "GET",
    headers: authHeaders(),
    credentials: "omit",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch blog");
  }

  const data = normalizeBlog((await response.json()) as RawBlogResponse);
  if (params?.publishedOnly === false) return data;
  if (data.status !== "published") {
    throw new Error("Blog not available");
  }
  return data;
}

export async function getBlogByCategoryAndSlug(
  categorySlug: string,
  postSlug: string,
  params?: { publishedOnly?: boolean }
) {
  const cat = categorySlug.trim();
  const post = postSlug.trim();
  if (!cat || !post) throw new Error("Category slug and post slug are required");

  const response = await fetch(
    `${getApiAuthBase().replace("/auth", "")}/blog/by-category/${encodeURIComponent(cat)}/${encodeURIComponent(post)}`,
    {
      method: "GET",
      headers: authHeaders(),
      credentials: "omit",
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch blog");
  }

  const data = normalizeBlog((await response.json()) as RawBlogResponse);
  if (params?.publishedOnly === false) return data;
  if (data.status !== "published") {
    throw new Error("Blog not available");
  }
  return data;
}

export type UpdateBlogPayload = {
  title: string;
  slug: string;
  body: string;
  publishedAt?: string | null;
  categoryId?: string | null;
  featuredImageS3Key?: string | null;
  featuredImageAlt?: string | null;
  featuredImageTitle?: string | null;
  socialImageS3Key?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  seoKeyword?: string | null;
  secondaryKeywords?: string | null;
  canonicalUrl?: string | null;
  metaRobots?: "index" | "noindex" | null;
  status: BlogStatus;
};

function appendBlogUpdateFields(formData: FormData, cleanPayload: {
  title: string;
  slug: string;
  body: string;
  status: BlogStatus;
  publishedAt: string | null;
  categoryId: string | null;
  featuredImageS3Key: string | null;
  featuredImageAlt: string | null;
  featuredImageTitle: string | null;
  socialImageS3Key: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  seoKeyword: string | null;
  secondaryKeywords: string | null;
  canonicalUrl: string | null;
  metaRobots: "index" | "noindex" | null;
}) {
  formData.append("title", cleanPayload.title);
  formData.append("slug", cleanPayload.slug);
  formData.append("body", cleanPayload.body);
  formData.append("status", cleanPayload.status);
  if (cleanPayload.publishedAt) formData.append("publishedAt", cleanPayload.publishedAt);
  if (cleanPayload.categoryId) formData.append("categoryId", cleanPayload.categoryId);
  if (cleanPayload.featuredImageS3Key) formData.append("featuredImageS3Key", cleanPayload.featuredImageS3Key);
  if (cleanPayload.featuredImageAlt) formData.append("featuredImageAlt", cleanPayload.featuredImageAlt);
  if (cleanPayload.featuredImageTitle) formData.append("featuredImageTitle", cleanPayload.featuredImageTitle);
  if (cleanPayload.socialImageS3Key) formData.append("socialImageS3Key", cleanPayload.socialImageS3Key);
  if (cleanPayload.metaTitle) formData.append("metaTitle", cleanPayload.metaTitle);
  if (cleanPayload.metaDescription) formData.append("metaDescription", cleanPayload.metaDescription);
  if (cleanPayload.seoKeyword) formData.append("seoKeyword", cleanPayload.seoKeyword);
  if (cleanPayload.secondaryKeywords) formData.append("secondaryKeywords", cleanPayload.secondaryKeywords);
  if (cleanPayload.canonicalUrl) formData.append("canonicalUrl", cleanPayload.canonicalUrl);
  if (cleanPayload.metaRobots) formData.append("metaRobots", cleanPayload.metaRobots);
}

export async function updateBlog(
  blogId: string,
  payload: UpdateBlogPayload,
  featuredImageFile?: File,
) {
  const id = blogId.trim();
  if (!id) throw new Error("Blog id is required");

  const metaRobots: "index" | "noindex" | null =
    payload.metaRobots === "noindex" ? "noindex" : payload.metaRobots === "index" ? "index" : null;

  const cleanPayload = {
    title: payload.title.trim(),
    slug: payload.slug.trim(),
    body: payload.body.trim(),
    categoryId: payload.categoryId?.trim() || null,
    publishedAt: payload.publishedAt?.trim() || null,
    featuredImageS3Key: payload.featuredImageS3Key?.trim() || null,
    featuredImageAlt: payload.featuredImageAlt?.trim() || null,
    featuredImageTitle: payload.featuredImageTitle?.trim() || null,
    socialImageS3Key: payload.socialImageS3Key?.trim() || null,
    metaTitle: payload.metaTitle?.trim() || null,
    metaDescription: payload.metaDescription?.trim() || null,
    seoKeyword: payload.seoKeyword?.trim() || null,
    secondaryKeywords: payload.secondaryKeywords?.trim() || null,
    canonicalUrl: payload.canonicalUrl?.trim() || null,
    metaRobots,
    status: payload.status,
  };

  const endpoint = `${getApiAuthBase().replace('/auth', '')}/blog/${encodeURIComponent(id)}`;
  const response = featuredImageFile instanceof File
    ? await fetch(endpoint, {
        method: "PUT",
        headers: bearerOnlyHeaders(),
        body: (() => {
          const formData = new FormData();
          appendBlogUpdateFields(formData, cleanPayload);
          formData.append("featuredImage", featuredImageFile);
          return formData;
        })(),
        credentials: "include",
      })
    : await fetch(endpoint, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          title: cleanPayload.title,
          slug: cleanPayload.slug,
          body: cleanPayload.body,
          status: cleanPayload.status,
          ...(cleanPayload.publishedAt ? { publishedAt: cleanPayload.publishedAt } : {}),
          ...(cleanPayload.categoryId ? { categoryId: cleanPayload.categoryId } : {}),
          ...(cleanPayload.featuredImageS3Key ? { featuredImageS3Key: cleanPayload.featuredImageS3Key } : {}),
          ...(cleanPayload.socialImageS3Key ? { socialImageS3Key: cleanPayload.socialImageS3Key } : {}),
          featuredImageAlt: cleanPayload.featuredImageAlt ?? "",
          featuredImageTitle: cleanPayload.featuredImageTitle ?? "",
          metaTitle: cleanPayload.metaTitle ?? "",
          metaDescription: cleanPayload.metaDescription ?? "",
          seoKeyword: cleanPayload.seoKeyword ?? "",
          secondaryKeywords: cleanPayload.secondaryKeywords ?? "",
          canonicalUrl: cleanPayload.canonicalUrl ?? "",
          metaRobots: cleanPayload.metaRobots ?? "index",
        }),
        credentials: "include",
      });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update blog");
  }

  return normalizeBlog((await response.json()) as RawBlogResponse);
}

export async function publishBlog(blogId: string, publishedAt?: string | null) {
  const id = blogId.trim();
  if (!id) throw new Error("Blog id is required");

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/blog/${encodeURIComponent(id)}/publish`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(publishedAt ? { publishedAt } : {}),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to publish blog");
  }

  return normalizeBlog((await response.json()) as RawBlogResponse);
}

export type DeleteBlogResponse = {
  message: string;
};

export async function deleteBlog(blogId: string) {
  const id = blogId.trim();
  if (!id) throw new Error("Blog id is required");

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/blog/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete blog");
  }

  return response.json() as Promise<DeleteBlogResponse>;
}

/** Blogadmin: check if a URL slug is unused before create/update. Use excludeId when editing. */
export async function checkBlogSlugAvailable(
  slug: string,
  options?: { excludeId?: string }
): Promise<{ available: boolean }> {
  const clean = slug.trim();
  if (!clean) {
    return { available: false };
  }

  const url = new URL(`${getApiAuthBase().replace("/auth", "")}/blog/check-slug`);
  url.searchParams.set("slug", clean);
  const exclude = options?.excludeId?.trim();
  if (exclude) url.searchParams.set("excludeId", exclude);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to check slug availability");
  }

  return response.json() as Promise<{ available: boolean }>;
}

export async function uploadBlogBodyImage(file: File): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${getApiAuthBase().replace("/auth", "")}/blog/body-image`, {
    method: "POST",
    headers: bearerOnlyHeaders(),
    body: formData,
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to upload image");
  }
  return response.json() as Promise<{ url: string; key: string }>;
}

export async function createBlog(payload: CreateBlogPayload, featuredImageFile?: File) {
  const cleanPayload = {
    title: payload.title.trim(),
    slug: payload.slug.trim(),
    body: payload.body.trim(),
    status: payload.status,
    publishedAt: payload.publishedAt?.trim() || null,
    categoryId: payload.categoryId?.trim() || null,
    featuredImageS3Key: payload.featuredImageS3Key?.trim() || null,
    featuredImageAlt: payload.featuredImageAlt?.trim() || null,
    featuredImageTitle: payload.featuredImageTitle?.trim() || null,
    socialImageS3Key: payload.socialImageS3Key?.trim() || null,
    metaTitle: payload.metaTitle?.trim() || null,
    metaDescription: payload.metaDescription?.trim() || null,
    seoKeyword: payload.seoKeyword?.trim() || null,
    secondaryKeywords: payload.secondaryKeywords?.trim() || null,
    canonicalUrl: payload.canonicalUrl?.trim() || null,
    metaRobots: payload.metaRobots === "noindex" ? "noindex" : payload.metaRobots === "index" ? "index" : null,
  };

  const endpoint = `${getApiAuthBase().replace('/auth', '')}/blog`;
  const response = featuredImageFile instanceof File
    ? await fetch(endpoint, {
        method: "POST",
        headers: bearerOnlyHeaders(),
        body: (() => {
          const formData = new FormData();
          formData.append("title", cleanPayload.title);
          formData.append("slug", cleanPayload.slug);
          formData.append("body", cleanPayload.body);
          formData.append("status", cleanPayload.status);
          if (cleanPayload.publishedAt) formData.append("publishedAt", cleanPayload.publishedAt);
          if (cleanPayload.categoryId) formData.append("categoryId", cleanPayload.categoryId);
          if (cleanPayload.featuredImageS3Key) formData.append("featuredImageS3Key", cleanPayload.featuredImageS3Key);
          if (cleanPayload.featuredImageAlt) formData.append("featuredImageAlt", cleanPayload.featuredImageAlt);
          if (cleanPayload.featuredImageTitle) formData.append("featuredImageTitle", cleanPayload.featuredImageTitle);
          if (cleanPayload.socialImageS3Key) formData.append("socialImageS3Key", cleanPayload.socialImageS3Key);
          if (cleanPayload.metaTitle) formData.append("metaTitle", cleanPayload.metaTitle);
          if (cleanPayload.metaDescription) formData.append("metaDescription", cleanPayload.metaDescription);
          if (cleanPayload.seoKeyword) formData.append("seoKeyword", cleanPayload.seoKeyword);
          if (cleanPayload.secondaryKeywords) formData.append("secondaryKeywords", cleanPayload.secondaryKeywords);
          if (cleanPayload.canonicalUrl) formData.append("canonicalUrl", cleanPayload.canonicalUrl);
          if (cleanPayload.metaRobots) formData.append("metaRobots", cleanPayload.metaRobots);
          formData.append("featuredImage", featuredImageFile);
          return formData;
        })(),
        credentials: "include",
      })
    : await fetch(endpoint, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title: cleanPayload.title,
          slug: cleanPayload.slug,
          body: cleanPayload.body,
          status: cleanPayload.status,
          ...(cleanPayload.publishedAt ? { publishedAt: cleanPayload.publishedAt } : {}),
          ...(cleanPayload.categoryId ? { categoryId: cleanPayload.categoryId } : {}),
          ...(cleanPayload.featuredImageS3Key ? { featuredImageS3Key: cleanPayload.featuredImageS3Key } : {}),
          ...(cleanPayload.featuredImageAlt ? { featuredImageAlt: cleanPayload.featuredImageAlt } : {}),
          ...(cleanPayload.featuredImageTitle ? { featuredImageTitle: cleanPayload.featuredImageTitle } : {}),
          ...(cleanPayload.socialImageS3Key ? { socialImageS3Key: cleanPayload.socialImageS3Key } : {}),
          ...(cleanPayload.metaTitle ? { metaTitle: cleanPayload.metaTitle } : {}),
          ...(cleanPayload.metaDescription ? { metaDescription: cleanPayload.metaDescription } : {}),
          ...(cleanPayload.seoKeyword ? { seoKeyword: cleanPayload.seoKeyword } : {}),
          ...(cleanPayload.secondaryKeywords ? { secondaryKeywords: cleanPayload.secondaryKeywords } : {}),
          ...(cleanPayload.canonicalUrl ? { canonicalUrl: cleanPayload.canonicalUrl } : {}),
          ...(cleanPayload.metaRobots ? { metaRobots: cleanPayload.metaRobots } : {}),
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

export async function getRelevantBlogs(slug: string, limit = 3) {
  const cleanSlug = slug.trim();
  if (!cleanSlug) throw new Error("Blog slug is required");
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 3;

  const url = new URL(`${getApiAuthBase().replace('/auth', '')}/blog/${encodeURIComponent(cleanSlug)}/relevant`);
  url.searchParams.set("limit", String(safeLimit));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: authHeaders(),
    credentials: "omit",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch relevant blogs");
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [] as BlogItem[];
  return data.map((item) => normalizeBlog(item as RawBlogResponse));
}

export type PortfolioImageInput = {
  s3Key: string;
  displayOrder: number;
};

export type CreatePortfolioPayload = {
  title: string;
  roomType: string;
  category: string;
  description: string;
  images: PortfolioImageInput[];
};

export type PortfolioCreatedBy = {
  id: string;
};

export type PortfolioItem = {
  id: string;
  title: string;
  roomType: string;
  category: string | null;
  description: string;
  createdBy: PortfolioCreatedBy | null;
  createdAt: string;
};

export type PortfolioImageItem = {
  id: string;
  portfolioId: string;
  s3Key: string;
  url: string | null;
  displayOrder: number;
};

export type PortfolioResponse = {
  portfolio: PortfolioItem;
  images: PortfolioImageItem[];
};

type RawPortfolio = {
  id?: string;
  title?: string;
  roomType?: string;
  room_type?: string;
  category?: string | null;
  description?: string;
  createdBy?: PortfolioCreatedBy | null;
  created_by?: PortfolioCreatedBy | null;
  createdAt?: string;
  created_at?: string;
};

type RawPortfolioImage = {
  id?: string;
  portfolioId?: string;
  portfolio_id?: string;
  s3Key?: string;
  s3_key?: string;
  url?: string | null;
  displayOrder?: number;
  display_order?: number;
};

function normalizePortfolio(raw: RawPortfolio): PortfolioItem {
  return {
    id: raw.id ?? "",
    title: raw.title ?? "",
    roomType: raw.roomType ?? raw.room_type ?? "",
    category: raw.category ?? null,
    description: raw.description ?? "",
    createdBy: raw.createdBy ?? raw.created_by ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  };
}

function normalizePortfolioImage(raw: RawPortfolioImage): PortfolioImageItem {
  return {
    id: raw.id ?? "",
    portfolioId: raw.portfolioId ?? raw.portfolio_id ?? "",
    s3Key: raw.s3Key ?? raw.s3_key ?? "",
    url: raw.url ?? null,
    displayOrder: typeof raw.displayOrder === "number" ? raw.displayOrder : typeof raw.display_order === "number" ? raw.display_order : 1,
  };
}

function normalizePortfolioResponse(raw: unknown): PortfolioResponse {
  const obj = (raw && typeof raw === "object" ? raw : {}) as {
    portfolio?: RawPortfolio;
    images?: RawPortfolioImage[];
  };

  const portfolioRaw = (obj.portfolio ?? obj) as RawPortfolio;
  return {
    portfolio: normalizePortfolio(portfolioRaw),
    images: Array.isArray(obj.images) ? obj.images.map((item) => normalizePortfolioImage(item)) : [],
  };
}

export async function createPortfolio(payload: CreatePortfolioPayload, imageFiles?: File[]) {
  const cleanTitle = payload?.title?.trim() || "";
  const cleanRoomType = payload?.roomType?.trim() || "";
  const cleanCategory = payload?.category?.trim() || "";
  const cleanDescription = payload?.description?.trim() || "";
  const cleanImages = Array.isArray(payload?.images)
    ? payload.images
        .map((item, index) => ({
          s3Key: item?.s3Key?.trim() || "",
          displayOrder: typeof item?.displayOrder === "number" ? item.displayOrder : index + 1,
        }))
        .filter((item) => item.s3Key)
    : [];

  if (!cleanTitle) throw new Error("Portfolio title is required");
  if (!cleanRoomType) throw new Error("Room type is required");
  if (!cleanCategory) throw new Error("Category is required");
  if (!cleanDescription) throw new Error("Description is required");

  const files = Array.isArray(imageFiles) ? imageFiles.filter((file) => file instanceof File) : [];
  if (files.length === 0 && cleanImages.length === 0) {
    throw new Error("At least one portfolio image is required");
  }

  const endpoint = `${getApiAuthBase().replace('/auth', '')}/portfolio`;
  const response =
    files.length > 0
      ? await fetch(endpoint, {
          method: "POST",
          headers: bearerOnlyHeaders(),
          body: (() => {
            const formData = new FormData();
            formData.append("title", cleanTitle);
            formData.append("roomType", cleanRoomType);
            formData.append("category", cleanCategory);
            formData.append("description", cleanDescription);
            if (cleanImages.length > 0) {
              formData.append("imagesMeta", JSON.stringify(cleanImages));
            }
            files.forEach((file) => formData.append("images", file));
            return formData;
          })(),
          credentials: "include",
        })
      : await fetch(endpoint, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            title: cleanTitle,
            roomType: cleanRoomType,
            category: cleanCategory,
            description: cleanDescription,
            images: cleanImages,
          }),
          credentials: "include",
        });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create portfolio");
  }

  return normalizePortfolioResponse(await response.json());
}

export async function getPortfolios(params?: { category?: string }) {
  const url = new URL(`${getApiAuthBase().replace('/auth', '')}/portfolio`);
  if (params?.category?.trim()) {
    url.searchParams.set("category", params.category.trim());
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: authHeaders(),
    credentials: "omit",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch portfolio");
  }

  const data: unknown = await response.json();
  const rawList = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? (((data as { items?: unknown; data?: unknown; portfolios?: unknown }).items ??
          (data as { items?: unknown; data?: unknown; portfolios?: unknown }).data ??
          (data as { items?: unknown; data?: unknown; portfolios?: unknown }).portfolios) as unknown)
      : [];

  if (!Array.isArray(rawList)) return [] as PortfolioResponse[];
  return rawList.map((item) => normalizePortfolioResponse(item));
}

export type UpdatePortfolioPayload = {
  title?: string;
  roomType?: string;
  description?: string;
  category?: string;
};

export async function updatePortfolio(portfolioId: string, payload: UpdatePortfolioPayload) {
  const id = portfolioId.trim();
  if (!id) throw new Error("Portfolio id is required");

  const body: Record<string, string> = {};
  if (payload.title !== undefined) body.title = payload.title;
  if (payload.roomType !== undefined) body.roomType = payload.roomType;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.category !== undefined) body.category = payload.category;

  if (Object.keys(body).length === 0) {
    throw new Error("At least one field is required to update");
  }

  const response = await fetch(`${getApiAuthBase().replace("/auth", "")}/portfolio/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update portfolio");
  }

  return normalizePortfolioResponse(await response.json());
}

export type DeletePortfolioResponse = {
  message?: string;
};

export async function deletePortfolio(portfolioId: string) {
  const id = portfolioId.trim();
  if (!id) throw new Error("Portfolio id is required");

  const response = await fetch(`${getApiAuthBase().replace("/auth", "")}/portfolio/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete portfolio");
  }

  return response.json() as Promise<DeletePortfolioResponse>;
}

export type CreateTrendingPayload = {
  title: string;
  styleTag: string;
  s3Key?: string | null;
  caption: string;
};

export type TrendingCreatedBy = {
  id: string;
};

export type TrendingItem = {
  id: string;
  title: string;
  styleTag: string;
  s3Key: string | null;
  caption: string;
  createdBy: TrendingCreatedBy | null;
  createdAt: string;
  imageUrl: string | null;
};

type RawTrending = {
  id?: string;
  title?: string;
  styleTag?: string;
  style_tag?: string;
  s3Key?: string | null;
  s3_key?: string | null;
  caption?: string;
  createdBy?: TrendingCreatedBy | null;
  created_by?: TrendingCreatedBy | null;
  createdAt?: string;
  created_at?: string;
  imageUrl?: string | null;
  image_url?: string | null;
  url?: string | null;
};

function normalizeTrending(raw: RawTrending): TrendingItem {
  return {
    id: raw.id ?? "",
    title: raw.title ?? "",
    styleTag: raw.styleTag ?? raw.style_tag ?? "",
    s3Key: raw.s3Key ?? raw.s3_key ?? null,
    caption: raw.caption ?? "",
    createdBy: raw.createdBy ?? raw.created_by ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    imageUrl: raw.imageUrl ?? raw.image_url ?? raw.url ?? null,
  };
}

export async function getTrendingById(trendingId: string) {
  const id = trendingId.trim();
  if (!id) throw new Error("Trending id is required");

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/trending/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: authHeaders(),
    credentials: "omit",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch trending entry");
  }

  return normalizeTrending((await response.json()) as RawTrending);
}

export async function createTrending(payload: CreateTrendingPayload, imageFile?: File) {
  const cleanPayload = {
    title: payload?.title?.trim() || "",
    styleTag: payload?.styleTag?.trim() || "",
    caption: payload?.caption?.trim() || "",
    s3Key: payload?.s3Key?.trim() || "",
  };

  if (!cleanPayload.title) throw new Error("Trending title is required");
  if (!cleanPayload.styleTag) throw new Error("Style tag is required");
  if (!cleanPayload.caption) throw new Error("Caption is required");
  if (!imageFile && !cleanPayload.s3Key) {
    throw new Error("Either system image upload or S3 key is required");
  }

  const endpoint = `${getApiAuthBase().replace('/auth', '')}/trending`;
  const response =
    imageFile instanceof File
      ? await fetch(endpoint, {
          method: "POST",
          headers: bearerOnlyHeaders(),
          body: (() => {
            const formData = new FormData();
            formData.append("title", cleanPayload.title);
            formData.append("styleTag", cleanPayload.styleTag);
            formData.append("caption", cleanPayload.caption);
            if (cleanPayload.s3Key) formData.append("s3Key", cleanPayload.s3Key);
            formData.append("image", imageFile);
            return formData;
          })(),
          credentials: "include",
        })
      : await fetch(endpoint, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            title: cleanPayload.title,
            styleTag: cleanPayload.styleTag,
            caption: cleanPayload.caption,
            s3Key: cleanPayload.s3Key,
          }),
          credentials: "include",
        });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create trending entry");
  }

  return normalizeTrending((await response.json()) as RawTrending);
}

export async function getTrendings() {
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/trending`, {
    method: "GET",
    headers: authHeaders(),
    credentials: "omit",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch trending entries");
  }

  const data: unknown = await response.json();
  const rawList = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? (((data as { items?: unknown; data?: unknown; trendings?: unknown; trending?: unknown }).items ??
          (data as { items?: unknown; data?: unknown; trendings?: unknown; trending?: unknown }).data ??
          (data as { items?: unknown; data?: unknown; trendings?: unknown; trending?: unknown }).trendings ??
          (data as { items?: unknown; data?: unknown; trendings?: unknown; trending?: unknown }).trending) as unknown)
      : [];

  if (!Array.isArray(rawList)) return [] as TrendingItem[];
  return rawList.map((item) => normalizeTrending(item as RawTrending));
}

export type DeleteTrendingResponse = {
  message: string;
};

export async function deleteTrending(trendingId: string) {
  const id = trendingId.trim();
  if (!id) throw new Error("Trending id is required");

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/trending/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete trending entry");
  }

  return response.json() as Promise<DeleteTrendingResponse>;
}

export type DesignCfImageItem = {
  id: string;
  s3Key: string;
  displayOrder: number;
  imageUrl: string | null;
};

export type DesignCfEntry = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  imageCount: number;
  coverImageUrl: string | null;
  images: DesignCfImageItem[];
};

type RawDesignCfImageItem = {
  id?: string;
  s3Key?: string;
  s3_key?: string;
  displayOrder?: number;
  display_order?: number;
  imageUrl?: string | null;
  image_url?: string | null;
  url?: string | null;
};

type RawDesignCfEntry = {
  id?: string;
  title?: string;
  description?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  imageCount?: number;
  image_count?: number;
  coverImageUrl?: string | null;
  cover_image_url?: string | null;
  images?: RawDesignCfImageItem[];
};

function normalizeDesignCfImage(item: RawDesignCfImageItem): DesignCfImageItem {
  return {
    id: item.id ?? "",
    s3Key: item.s3Key ?? item.s3_key ?? "",
    displayOrder:
      typeof item.displayOrder === "number"
        ? item.displayOrder
        : typeof item.display_order === "number"
          ? item.display_order
          : 1,
    imageUrl: item.imageUrl ?? item.image_url ?? item.url ?? null,
  };
}

function normalizeDesignCf(item: RawDesignCfEntry): DesignCfEntry {
  const images = Array.isArray(item.images) ? item.images.map((image) => normalizeDesignCfImage(image)) : [];
  return {
    id: item.id ?? "",
    title: item.title ?? "",
    description: item.description ?? null,
    createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? item.updated_at ?? new Date().toISOString(),
    imageCount:
      typeof item.imageCount === "number"
        ? item.imageCount
        : typeof item.image_count === "number"
          ? item.image_count
          : images.length,
    coverImageUrl: item.coverImageUrl ?? item.cover_image_url ?? images[0]?.imageUrl ?? null,
    images,
  };
}

export type CreateDesignCfPayload = {
  title: string;
  description?: string | null;
};

export type UpdateDesignCfPayload = {
  title?: string;
  description?: string | null;
};

export async function getDesignCfEntries() {
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/design-cf`, {
    method: "GET",
    headers: authHeaders(),
    credentials: "omit",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch Design CF entries");
  }
  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [] as DesignCfEntry[];
  return data.map((item) => normalizeDesignCf(item as RawDesignCfEntry));
}

export async function getDesignCfEntryById(id: string) {
  const cleanId = id.trim();
  if (!cleanId) throw new Error("Design CF id is required");

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/design-cf/${encodeURIComponent(cleanId)}`, {
    method: "GET",
    headers: authHeaders(),
    credentials: "omit",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch Design CF entry");
  }
  return normalizeDesignCf((await response.json()) as RawDesignCfEntry);
}

export async function createDesignCf(payload: CreateDesignCfPayload, imageFiles: File[]) {
  const title = payload?.title?.trim() || "";
  if (!title) throw new Error("Title is required");

  const files = Array.isArray(imageFiles) ? imageFiles.filter((file) => file instanceof File) : [];
  if (files.length < 1 || files.length > 3) {
    throw new Error("Please select minimum 1 and maximum 3 images.");
  }

  const formData = new FormData();
  formData.append("title", title);
  if (typeof payload?.description === "string" && payload.description.trim()) {
    formData.append("description", payload.description.trim());
  }
  files.forEach((file) => formData.append("images", file));

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/design-cf`, {
    method: "POST",
    headers: bearerOnlyHeaders(),
    body: formData,
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create Design CF entry");
  }
  return normalizeDesignCf((await response.json()) as RawDesignCfEntry);
}

export async function updateDesignCf(
  id: string,
  payload: UpdateDesignCfPayload,
  imageFiles?: File[],
) {
  const cleanId = id.trim();
  if (!cleanId) throw new Error("Design CF id is required");

  const formData = new FormData();
  if (typeof payload?.title === "string" && payload.title.trim()) {
    formData.append("title", payload.title.trim());
  }
  if (typeof payload?.description === "string") {
    formData.append("description", payload.description.trim());
  }

  const files = Array.isArray(imageFiles) ? imageFiles.filter((file) => file instanceof File) : [];
  if (files.length > 0 && (files.length < 1 || files.length > 3)) {
    throw new Error("When replacing images, please select between 1 and 3 images.");
  }
  files.forEach((file) => formData.append("images", file));

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/design-cf/${encodeURIComponent(cleanId)}`, {
    method: "PUT",
    headers: bearerOnlyHeaders(),
    body: formData,
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update Design CF entry");
  }
  return normalizeDesignCf((await response.json()) as RawDesignCfEntry);
}

export type DeleteDesignCfResponse = {
  message: string;
};

export async function deleteDesignCf(id: string) {
  const cleanId = id.trim();
  if (!cleanId) throw new Error("Design CF id is required");

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/design-cf/${encodeURIComponent(cleanId)}`, {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete Design CF entry");
  }
  return response.json() as Promise<DeleteDesignCfResponse>;
}

export async function login(payload: { email: string; password: string }) {
  const response = await fetch(`${getApiAuthBase()}/login`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!response.ok) {
     const error = await response.json().catch(() => ({}));
     throw new Error(error.message || 'Login failed');
  }
  const data = await response.json();
  if (data.access_token) setAccessToken(data.access_token);
  return data;
}

export async function logout(payload: { email: string; password: string }) {
  const response = await fetch(`${getApiAuthBase()}/logout`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  setAccessToken(null);
  if (!response.ok) {
     const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Logout failed');
  }
  return response.json();
}

export async function getMe() {
  const response = await fetch(`${getApiAuthBase()}/me`, {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    if (response.status === 401) setAccessToken(null);
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string }).message || 'Session expired. Please log in again.',
    );
  }
  return response.json();
}

export async function forgotPassword(payload: { email: string }) {
  const response = await fetch(`${getApiAuthBase()}/forgot-password`, {
    method: 'POST',
    headers: authHeaders(),
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
  const response = await fetch(`${getApiAuthBase()}/reset-password`, {
    method: 'POST',
    headers: authHeaders(),
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
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/users`, {
    method: 'POST',
    headers: authHeaders(),
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
  await ensureAuthenticated();
  let url = `${getApiAuthBase().replace('/auth', '')}/users`;
  if (role) {
    url += `?role=${role}`;
  }
  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
  });
  if (response.status === 401) setAccessToken(null);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch users');
  }
  return response.json();
}

export async function deleteUser(id: string) {
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to deactivate user');
  }
  return response.json();
}

export async function updateUser(id: string, payload: { name: string; email: string; role: string; projectName?: string; assignedDesignerId?: string }) {
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/users/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update user');
  }
  return response.json();
}

export async function createCategory(payload: { name: string; type?: 'material' | 'furniture'; parent_id?: string }) {
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/categories`, {
    method: 'POST',
    headers: authHeaders(),
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
  let url = `${getApiAuthBase().replace('/auth', '')}/categories`;
  if (type) {
    url += `?type=${type}`;
  }
  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch categories');
  }
  return response.json();
}

export type CategoryMenuProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand?: string | null;
};

export type CategoryMenuItem = {
  id: string;
  name: string;
  slug: string;
  type: "material" | "furniture";
  displayOrder: number;
  productCount: number;
  products: CategoryMenuProduct[];
  children: CategoryMenuItem[];
};

type RawCategoryMenuProduct = {
  id?: string;
  name?: string;
  slug?: string;
  sku?: string;
  brand?: string | null;
};

type RawCategoryMenuItem = {
  id?: string;
  name?: string;
  slug?: string;
  type?: "material" | "furniture";
  displayOrder?: number;
  display_order?: number;
  productCount?: number;
  product_count?: number;
  products?: RawCategoryMenuProduct[];
  children?: RawCategoryMenuItem[];
};

function normalizeCategoryMenuProduct(raw: RawCategoryMenuProduct): CategoryMenuProduct {
  return {
    id: raw.id ?? "",
    name: raw.name ?? "",
    slug: raw.slug ?? "",
    sku: raw.sku ?? "",
    brand: raw.brand ?? null,
  };
}

function normalizeCategoryMenuItem(raw: RawCategoryMenuItem): CategoryMenuItem {
  const displayOrder =
    typeof raw.displayOrder === "number"
      ? raw.displayOrder
      : typeof raw.display_order === "number"
        ? raw.display_order
        : 0;
  const productCount =
    typeof raw.productCount === "number"
      ? raw.productCount
      : typeof raw.product_count === "number"
        ? raw.product_count
        : 0;

  return {
    id: raw.id ?? "",
    name: raw.name ?? "",
    slug: raw.slug ?? "",
    type: raw.type === "furniture" ? "furniture" : "material",
    displayOrder,
    productCount,
    products: Array.isArray(raw.products)
      ? raw.products.map((item) => normalizeCategoryMenuProduct(item))
      : [],
    children: Array.isArray(raw.children)
      ? raw.children.map((item) => normalizeCategoryMenuItem(item))
      : [],
  };
}

function sortCategoryMenuItems(items: CategoryMenuItem[]): CategoryMenuItem[] {
  return [...items]
    .map((item) => ({
      ...item,
      children: sortCategoryMenuItems(item.children ?? []),
    }))
    .sort(
      (a, b) =>
        (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
        a.name.localeCompare(b.name),
    );
}

export async function getCategoryMenu(params?: {
  type?: "material" | "furniture";
  productLimit?: number;
  includeChildren?: boolean;
}) {
  const url = new URL(`${getApiAuthBase().replace('/auth', '')}/categories/menu`);
  if (params?.type) {
    url.searchParams.set("type", params.type);
  }
  if (typeof params?.productLimit === "number") {
    url.searchParams.set("productLimit", String(params.productLimit));
  }
  if (typeof params?.includeChildren === "boolean") {
    url.searchParams.set("includeChildren", String(params.includeChildren));
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch category menu");
  }
  const raw = (await response.json()) as unknown;
  if (!Array.isArray(raw)) {
    return [] as CategoryMenuItem[];
  }
  const normalized = raw.map((item) =>
    normalizeCategoryMenuItem(item as RawCategoryMenuItem),
  );
  return sortCategoryMenuItems(normalized);
}

export type CategoryDetails = {
  id: string;
  name: string;
  slug: string;
  type: "material" | "furniture";
  displayOrder?: number;
  isActive?: boolean;
  children?: CategoryDetails[];
};

export async function deleteCategory(id: string) {
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/categories/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to deactivate category');
  }
  return response.json();
}

export async function updateCategory(id: string, payload: { name?: string; type: 'material' | 'furniture'; parent_id?: string }) {
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/categories/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
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
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/categories/${slug}`, {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch category details');
  }
  return response.json() as Promise<CategoryDetails>;
}

export async function getSubcategories(categoryId: string) {
  const id = categoryId.trim();
  if (!id) throw new Error("Category id is required");

  const response = await fetch(
    `${getApiAuthBase().replace('/auth', '')}/categories/${encodeURIComponent(id)}/subcategories`,
    {
      method: "GET",
      headers: authHeaders(),
      credentials: "include",
    },
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch sub-categories");
  }
  return response.json();
}

export async function createSubcategory(
  categoryId: string,
  payload: { name: string; type?: "material" | "furniture" },
) {
  const id = categoryId.trim();
  if (!id) throw new Error("Category id is required");

  const response = await fetch(
    `${getApiAuthBase().replace('/auth', '')}/categories/${encodeURIComponent(id)}/subcategories`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
      credentials: "include",
    },
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Sub-category creation failed");
  }
  return response.json();
}

export async function updateSubcategory(
  categoryId: string,
  subCategoryId: string,
  payload: { name?: string; type?: "material" | "furniture"; parent_id?: string },
) {
  const cid = categoryId.trim();
  const sid = subCategoryId.trim();
  if (!cid) throw new Error("Category id is required");
  if (!sid) throw new Error("Sub-category id is required");

  const response = await fetch(
    `${getApiAuthBase().replace('/auth', '')}/categories/${encodeURIComponent(cid)}/subcategories/${encodeURIComponent(sid)}`,
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
      credentials: "include",
    },
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update sub-category");
  }
  return response.json();
}

export async function deleteSubcategory(categoryId: string, subCategoryId: string) {
  const cid = categoryId.trim();
  const sid = subCategoryId.trim();
  if (!cid) throw new Error("Category id is required");
  if (!sid) throw new Error("Sub-category id is required");

  const response = await fetch(
    `${getApiAuthBase().replace('/auth', '')}/categories/${encodeURIComponent(cid)}/subcategories/${encodeURIComponent(sid)}`,
    {
      method: "DELETE",
      headers: authHeaders(),
      credentials: "include",
    },
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete sub-category");
  }
  return response.json();
}

export type TagItem = {
  id: string;
  name: string;
  slug: string;
  hexCode: string;
  createdBy: string;
  createdAt: string;
};

type RawTagItem = {
  id?: string;
  name?: string;
  slug?: string;
  hexCode?: string;
  hex_code?: string;
  createdBy?: string;
  created_by?: string;
  createdAt?: string;
  created_at?: string;
};

function normalizeTag(raw: RawTagItem): TagItem {
  return {
    id: raw.id ?? "",
    name: raw.name ?? "",
    slug: raw.slug ?? "",
    hexCode: raw.hexCode ?? raw.hex_code ?? "",
    createdBy: raw.createdBy ?? raw.created_by ?? "",
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  };
}

export type CreateTagPayload = {
  name: string;
  hex_code: string;
};

export type UpdateTagPayload = {
  name: string;
  hex_code: string;
};

export type DeleteTagResponse = {
  message: string;
};

export async function createTag(payload: CreateTagPayload) {
  const name = payload?.name?.trim();
  const hexCode = payload?.hex_code?.trim();
  if (!name) throw new Error("Tag name is required");
  if (!hexCode) throw new Error("Tag hex_code is required");

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/tags`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      name,
      hex_code: hexCode,
    }),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Tag creation failed");
  }
  return normalizeTag((await response.json()) as RawTagItem);
}

export async function getTags() {
  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/tags`, {
    method: "GET",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch tags");
  }
  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [] as TagItem[];
  return data.map((item) => normalizeTag(item as RawTagItem));
}

export async function getProductTags(productId: string) {
  const pid = productId.trim();
  if (!pid) throw new Error("Product id is required");

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/products/${encodeURIComponent(pid)}/tags`, {
    method: "GET",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch product tags");
  }

  const data: unknown = await response.json();
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? (((data as { items?: unknown; data?: unknown; tags?: unknown }).items ??
          (data as { items?: unknown; data?: unknown; tags?: unknown }).data ??
          (data as { items?: unknown; data?: unknown; tags?: unknown }).tags) as unknown)
      : [];

  if (!Array.isArray(list)) return [] as TagItem[];
  return list.map((item) => normalizeTag(item as RawTagItem));
}

export async function updateTag(id: string, payload: UpdateTagPayload) {
  const tagId = id.trim();
  if (!tagId) throw new Error("Tag id is required");

  const name = payload?.name?.trim();
  const hexCode = payload?.hex_code?.trim();
  if (!name) throw new Error("Tag name is required");
  if (!hexCode) throw new Error("Tag hex_code is required");

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/tags/${encodeURIComponent(tagId)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({
      name,
      hex_code: hexCode,
    }),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update tag");
  }
  return normalizeTag((await response.json()) as RawTagItem);
}

export async function deleteTag(id: string) {
  const tagId = id.trim();
  if (!tagId) throw new Error("Tag id is required");

  const response = await fetch(`${getApiAuthBase().replace('/auth', '')}/tags/${encodeURIComponent(tagId)}`, {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete tag");
  }
  return response.json() as Promise<DeleteTagResponse>;
}
