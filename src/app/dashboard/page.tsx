"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  logout,
  createUser,
  createCategory,
  createProduct,
  bulkUploadProducts,
  uploadProductImages,
  bindProductCategories,
  linkProductTag,
  unlinkProductTag,
  getProducts,
  getProductsCompare,
  getTrendings,
  getDesignCfEntries,
  getBlogs,
  getTags,
  getProductTags,
  deleteProduct,
  updateProductStatus,
  getCategoryMenu,
  getShortlist,
  requestShortlistSample,
  updateShortlistNote,
  deleteShortlist,
  getDesignerCustomers,
  getDesignerCustomerDetails,
  createDesignerNote,
  createDesignerRecommendation,
  updateDesignerNote,
  updateDesignerSample,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type CreateProductPayload,
  type CreateDesignerNotePayload,
  type CreateDesignerRecommendationPayload,
  type DesignerCustomer,
  type DesignerCustomerDetailResponse,
  type ProductImageUploadResponse,
  type ProductListItem,
  type ProductCompareResponse,
  type ShortlistItem,
  type UpdateDesignerSamplePayload,
  type UpdateDesignerNotePayload,
  type NotificationItem,
  type CategoryMenuItem,
  type TrendingItem,
  type DesignCfEntry,
  type BlogItem,
  type TagItem,
} from "@/lib/api";

const PRODUCT_IMAGE_BASE_URL = "https://products-customfurnish.s3.ap-south-1.amazonaws.com";
const BLOG_IMAGE_BASE_URL = "https://products-customfurnish.s3.ap-south-1.amazonaws.com";
const FALLBACK_MENU_NAMES = [
  "Flooring",
  "Laminates",
  "Louvers & Panels",
  "Wallpaper",
  "Kitchen",
  "Bathroom",
  "Wardrobe",
  "TV Unit",
  "Outdoor",
];
const CATEGORY_TILE_IMAGES = [
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop",
];

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isShortlistOpen, setIsShortlistOpen] = useState(false);
  const [isUsersMenuOpen, setIsUsersMenuOpen] = useState(false);
  const [isCategoriesMenuOpen, setIsCategoriesMenuOpen] = useState(false);
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false);
  const [isBlogMenuOpen, setIsBlogMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isMarkingAllNotificationsRead, setIsMarkingAllNotificationsRead] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [menuCategories, setMenuCategories] = useState<CategoryMenuItem[]>([]);
  const [isLoadingMenuCategories, setIsLoadingMenuCategories] = useState(false);
  const [activeMenuCategoryId, setActiveMenuCategoryId] = useState<string | null>(null);
  const [trendingDesigns, setTrendingDesigns] = useState<TrendingItem[]>([]);
  const [isLoadingTrendingDesigns, setIsLoadingTrendingDesigns] = useState(false);
  const [trendingDesignsError, setTrendingDesignsError] = useState("");
  const [designCfEntries, setDesignCfEntries] = useState<DesignCfEntry[]>([]);
  const [isLoadingDesignCfEntries, setIsLoadingDesignCfEntries] = useState(false);
  const [designCfEntriesError, setDesignCfEntriesError] = useState("");
  const [latestBlogs, setLatestBlogs] = useState<BlogItem[]>([]);
  const [isLoadingLatestBlogs, setIsLoadingLatestBlogs] = useState(false);
  const [latestBlogsError, setLatestBlogsError] = useState("");

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    name: "",
    role: "customer",
    projectName: ""
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");
  const [createError, setCreateError] = useState("");

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatData, setNewCatData] = useState({
    name: "",
    parent_id: "",
    type: "material" as "material" | "furniture",
  });
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [catMsg, setCatMsg] = useState("");
  const [catError, setCatError] = useState("");

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProductData, setNewProductData] = useState({
    imsId: "",
    name: "",
    sku: "",
    brand: "",
    description: "",
    bookName: "",
    pageNumber: "",
    application: "",
    materialType: "",
    colorName: "",
    dimensions: "",
    status: "draft",
    performanceRating: 4,
    durabilityRating: 3.5,
    priceCategory: 2,
    maintenanceRating: 4,
    prosText: "",
    consText: ""
  });
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productMsg, setProductMsg] = useState("");
  const [productError, setProductError] = useState("");
  const [createProductImageFiles, setCreateProductImageFiles] = useState<File[]>([]);
  const [createdProductImages, setCreatedProductImages] = useState<ProductImageUploadResponse[]>([]);

  const [isUploadImageModalOpen, setIsUploadImageModalOpen] = useState(false);
  const [uploadProductId, setUploadProductId] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadedImages, setUploadedImages] = useState<ProductImageUploadResponse[]>([]);
  const [isBulkUploadingProducts, setIsBulkUploadingProducts] = useState(false);
  const [bulkUploadMsg, setBulkUploadMsg] = useState("");
  const [bulkUploadError, setBulkUploadError] = useState("");
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [bulkUploadImagesZipFile, setBulkUploadImagesZipFile] = useState<File | null>(null);
  const categoryTilesScrollRef = useRef<HTMLDivElement | null>(null);

  const [isBindCategoriesOpen, setIsBindCategoriesOpen] = useState(false);
  const [bindProductId, setBindProductId] = useState("");
  type Category = {
    id: string;
    name: string;
    type: "material" | "furniture";
    parentId?: string;
    parentName?: string;
  };
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [topLevelCategories, setTopLevelCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [isBindingCats, setIsBindingCats] = useState(false);
  const [bindMsg, setBindMsg] = useState("");
  const [bindError, setBindError] = useState("");
  const [isProductTagsOpen, setIsProductTagsOpen] = useState(false);
  const [productTagProductId, setProductTagProductId] = useState("");
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [selectedLinkTagId, setSelectedLinkTagId] = useState("");
  const [selectedUnlinkTagId, setSelectedUnlinkTagId] = useState("");
  const [productLinkedTagIds, setProductLinkedTagIds] = useState<string[]>([]);
  const [hasLinkedTagData, setHasLinkedTagData] = useState(false);
  const [isLoadingLinkedTags, setIsLoadingLinkedTags] = useState(false);

  const closeAdminActionModals = () => {
    setIsCreateModalOpen(false);
    setIsCategoryModalOpen(false);
    setIsProductModalOpen(false);
    setIsUploadImageModalOpen(false);
    setIsBulkUploadModalOpen(false);
    setIsBindCategoriesOpen(false);
    setIsProductTagsOpen(false);
  };

  const [isLinkingTag, setIsLinkingTag] = useState(false);
  const [isUnlinkingTag, setIsUnlinkingTag] = useState(false);
  const [productTagMsg, setProductTagMsg] = useState("");
  const [productTagError, setProductTagError] = useState("");
  const [createSelectedCategoryIds, setCreateSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [isCreateCategoriesDropdownOpen, setIsCreateCategoriesDropdownOpen] = useState(false);
  const [createSelectedTagIds, setCreateSelectedTagIds] = useState<Set<string>>(new Set());
  const [isCreateTagsDropdownOpen, setIsCreateTagsDropdownOpen] = useState(false);

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productsPage, setProductsPage] = useState(1);
  const [productsLimit, setProductsLimit] = useState(20);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [latestProducts, setLatestProducts] = useState<ProductListItem[]>([]);
  const [isLoadingLatestProducts, setIsLoadingLatestProducts] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"" | "active" | "draft" | "archived">("");
  const [filterCategoryType, setFilterCategoryType] = useState<"" | "material" | "furniture">("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState("");
  const [filterQ, setFilterQ] = useState("");
  const [filterIncludeImages, setFilterIncludeImages] = useState(true);
  const [filterIncludeCategories, setFilterIncludeCategories] = useState(false);
  const [filterBrands, setFilterBrands] = useState<Set<string>>(new Set());
  const [filterThicknesses, setFilterThicknesses] = useState<Set<string>>(new Set());
  const [filterColors, setFilterColors] = useState<Set<string>>(new Set());
  const [appliedFilters, setAppliedFilters] = useState<{
    status?: "" | "active" | "draft" | "archived";
    categoryType?: "" | "material" | "furniture";
    categoryId?: string;
    q?: string;
    brands: string[];
    thicknesses: string[];
    colors: string[];
    includeImages: boolean;
    includeCategories: boolean;
  }>({
    status: "",
    categoryType: "",
    categoryId: "",
    q: "",
    brands: [],
    thicknesses: [],
    colors: [],
    includeImages: true,
    includeCategories: false
  });

  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState("");
  const [compareData, setCompareData] = useState<ProductCompareResponse | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deleteProductMsg, setDeleteProductMsg] = useState("");
  const [deleteProductError, setDeleteProductError] = useState("");
  const [isUpdatingProductStatus, setIsUpdatingProductStatus] = useState(false);
  const [updatingProductStatusId, setUpdatingProductStatusId] = useState<string | null>(null);
  const [updateProductStatusMsg, setUpdateProductStatusMsg] = useState("");
  const [updateProductStatusError, setUpdateProductStatusError] = useState("");
  const [bulkTagSelectedIds, setBulkTagSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkTagging, setIsBulkTagging] = useState(false);
  const [bulkTagId, setBulkTagId] = useState("");
  const [bulkTagMsg, setBulkTagMsg] = useState("");
  const [bulkTagError, setBulkTagError] = useState("");
  const [shortlistItems, setShortlistItems] = useState<ShortlistItem[]>([]);
  const [shortlistCompareSelectedIds, setShortlistCompareSelectedIds] = useState<Set<string>>(new Set());
  const [isLoadingShortlist, setIsLoadingShortlist] = useState(false);
  const [shortlistError, setShortlistError] = useState("");
  const [shortlistMsg, setShortlistMsg] = useState("");
  const [requestingSampleId, setRequestingSampleId] = useState<string | null>(null);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [deletingShortlistId, setDeletingShortlistId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [designerCustomers, setDesignerCustomers] = useState<DesignerCustomer[]>([]);
  const [isLoadingDesignerCustomers, setIsLoadingDesignerCustomers] = useState(false);
  const [designerCustomersError, setDesignerCustomersError] = useState("");
  const [isDesignerCustomerDetailsOpen, setIsDesignerCustomerDetailsOpen] = useState(false);
  const [selectedDesignerCustomerId, setSelectedDesignerCustomerId] = useState("");
  const [designerCustomerDetails, setDesignerCustomerDetails] = useState<DesignerCustomerDetailResponse | null>(null);
  const [isLoadingDesignerCustomerDetails, setIsLoadingDesignerCustomerDetails] = useState(false);
  const [designerCustomerDetailsError, setDesignerCustomerDetailsError] = useState("");
  const [designerSampleDrafts, setDesignerSampleDrafts] = useState<Record<string, string>>({});
  const [savingDesignerSampleId, setSavingDesignerSampleId] = useState<string | null>(null);
  const [designerSampleMsg, setDesignerSampleMsg] = useState("");
  const [designerSampleError, setDesignerSampleError] = useState("");
  const [designerReplyDrafts, setDesignerReplyDrafts] = useState<Record<string, string>>({});
  const [savingDesignerReplyId, setSavingDesignerReplyId] = useState<string | null>(null);
  const [designerReplyMsg, setDesignerReplyMsg] = useState("");
  const [designerReplyError, setDesignerReplyError] = useState("");
  const [designerNoteDraft, setDesignerNoteDraft] = useState("");
  const [designerNoteProductId, setDesignerNoteProductId] = useState("");
  const [isCreatingDesignerNote, setIsCreatingDesignerNote] = useState(false);
  const [designerNoteMsg, setDesignerNoteMsg] = useState("");
  const [designerNoteError, setDesignerNoteError] = useState("");
  const [designerNoteDrafts, setDesignerNoteDrafts] = useState<Record<string, string>>({});
  const [savingDesignerNoteId, setSavingDesignerNoteId] = useState<string | null>(null);
  const [designerRecommendationDrafts, setDesignerRecommendationDrafts] = useState<Record<string, string>>({});
  const [designerRecommendationProductSelections, setDesignerRecommendationProductSelections] = useState<Record<string, string>>({});
  const [isCreatingDesignerRecommendation, setIsCreatingDesignerRecommendation] = useState(false);
  const [creatingDesignerRecommendationShortlistId, setCreatingDesignerRecommendationShortlistId] = useState<string | null>(null);
  const [designerRecommendationMsg, setDesignerRecommendationMsg] = useState("");
  const [designerRecommendationError, setDesignerRecommendationError] = useState("");

  const cleanUrl = (value: string) => value.trim().replace(/^`+/, "").replace(/`+$/, "").replace(/^"+/, "").replace(/"+$/, "").trim();
  const buildProductImageUrl = (value?: string | null) => {
    const clean = typeof value === "string" ? cleanUrl(value) : "";
    if (!clean) return null;
    if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
    return `${PRODUCT_IMAGE_BASE_URL}/${clean.replace(/^\/+/, "")}`;
  };
  const isInteractiveTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    Boolean(target.closest("button, textarea, input, select, a"));

  const generateSkuFromName = (name: string) =>
    name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");

  const toTitleCase = (value: string) =>
    value
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase()
      .replace(/\b[a-z]/g, (char) => char.toUpperCase());

  const truncateText = (value: string, maxChars: number) => {
    const normalized = value.trim();
    if (normalized.length <= maxChars) return normalized;
    return `${normalized.slice(0, maxChars)}...`;
  };

  const pickBestImageUrl = (images: ProductImageUploadResponse[] | null | undefined) => {
    const list = Array.isArray(images) ? images : [];
    const primary = list.find((img) => img.isPrimary && Boolean(buildProductImageUrl(img.url ?? img.s3Key)));
    if (primary) {
      const primaryUrl = buildProductImageUrl(primary.url ?? primary.s3Key);
      if (primaryUrl) return primaryUrl;
    }
    const byOrder = [...list].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const first = byOrder.find((img) => Boolean(buildProductImageUrl(img.url ?? img.s3Key)));
    if (!first) return null;
    return buildProductImageUrl(first.url ?? first.s3Key);
  };

  const inlineProductImageUrl = (p: ProductListItem) => {
    const obj = p as unknown as Record<string, unknown>;
    const url = obj.imageUrl;
    if (typeof url === "string") {
      const directUrl = buildProductImageUrl(url);
      if (directUrl) return directUrl;
    }
    const primaryUrl = obj.primaryImageUrl;
    if (typeof primaryUrl === "string") {
      const resolvedPrimaryUrl = buildProductImageUrl(primaryUrl);
      if (resolvedPrimaryUrl) return resolvedPrimaryUrl;
    }
    const images = obj.images;
    if (Array.isArray(images)) {
      const normalized = images.map((raw) => {
        const img = raw as ProductImageUploadResponse & {
          s3_key?: string | null;
          url?: string | null;
        };
        return {
          ...img,
          s3Key: img.s3Key ?? img.s3_key ?? "",
          url: typeof img.url === "string" ? img.url : null,
        } as ProductImageUploadResponse;
      });
      if (normalized.length > 0) return pickBestImageUrl(normalized);
    }
    return null;
  };

  const getDesignerNoteText = (note: Record<string, unknown>) => {
    const candidates = [note.title, note.note, note.content, note.message];
    const found = candidates.find((value) => typeof value === "string" && value.trim());
    return typeof found === "string" ? found.trim() : "Designer note";
  };

  const findDesignerNoteForProduct = (
    notes: Record<string, unknown>[],
    productId: string
  ) => {
    const normalizedProductId = productId.trim();
    if (!normalizedProductId) return null;
    return (
      notes.find((note) => {
        const noteProductId = typeof note.productId === "string" ? note.productId.trim() : "";
        return noteProductId === normalizedProductId;
      }) ?? null
    );
  };

  const getProductLabelForNote = (productId?: string | null) => {
    const id = typeof productId === "string" ? productId.trim() : "";
    if (!id || !designerCustomerDetails) return null;
    const shortlistItem = designerCustomerDetails.shortlist.find((item) => item.productId === id);
    const product = shortlistItem?.product ?? null;
    if (!product) {
      const dashboardProduct = products.find((item) => item.id === id);
      return dashboardProduct ? [dashboardProduct.name, dashboardProduct.sku].filter(Boolean).join(" • ") : id;
    }
    return [product.name, product.sku].filter(Boolean).join(" • ");
  };

  const dashboardShellClass = "mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-8 2xl:px-10";
  const unreadNotificationsCount = notifications.filter((item) => !item.isRead).length;
  const totalDesignerRecommendations = designerCustomerDetails
    ? designerCustomerDetails.shortlist.reduce(
        (sum, item) => sum + (Array.isArray(item.recommendations) ? item.recommendations.length : 0),
        0
      )
    : 0;
  const formatNotificationTime = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const shortlistCompareSelectedList = Array.from(shortlistCompareSelectedIds);
  const bulkTagSelectedList = Array.from(bulkTagSelectedIds);
  const trendingCards: Array<TrendingItem | null> = [
    ...trendingDesigns.slice(0, 4),
    ...Array.from({ length: Math.max(0, 4 - trendingDesigns.length) }, () => null),
  ].slice(0, 4);
  const latestProductCards: Array<ProductListItem | null> = [
    ...latestProducts.slice(0, 4),
    ...Array.from({ length: Math.max(0, 4 - latestProducts.length) }, () => null),
  ].slice(0, 4);
  const showcaseDesignCards: Array<DesignCfEntry | null> = [
    ...designCfEntries.slice(0, 5),
    ...Array.from({ length: Math.max(0, 5 - designCfEntries.length) }, () => null),
  ].slice(0, 5);
  const openCompareByIds = async (ids: string[]) => {
    const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
    if (uniqueIds.length < 2) {
      setCompareError("Please select at least 2 products to compare.");
      return;
    }
    if (uniqueIds.length > 4) {
      setCompareError("You can compare maximum 4 products.");
      return;
    }

    setCompareError("");
    setIsCompareOpen(true);
    setIsComparing(true);
    setCompareData(null);
    try {
      const data = await getProductsCompare(uniqueIds);
      setCompareData(data);
    } catch (err: unknown) {
      setCompareError(err instanceof Error ? err.message : "Failed to compare products.");
    } finally {
      setIsComparing(false);
    }
  };

  const isSelectedForShortlistCompare = (productId: string) =>
    shortlistCompareSelectedIds.has(productId);

  const toggleShortlistCompareSelection = (productId: string) => {
    setShortlistError("");
    setCompareError("");
    setShortlistCompareSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
        return next;
      }
      if (next.size >= 4) {
        setShortlistError("You can compare maximum 4 products.");
        return next;
      }
      next.add(productId);
      return next;
    });
  };

  const clearShortlistCompareSelection = () => {
    setShortlistCompareSelectedIds(new Set());
    setShortlistError("");
    setCompareError("");
    setCompareData(null);
  };

  const openShortlistCompare = async () => {
    setIsShortlistOpen(false);
    await openCompareByIds(shortlistCompareSelectedList);
  };

  const isSelectedForBulkTag = (id: string) => bulkTagSelectedIds.has(id);

  const toggleBulkTagSelection = (id: string) => {
    setBulkTagMsg("");
    setBulkTagError("");
    setBulkTagSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearBulkTagSelection = () => {
    setBulkTagSelectedIds(new Set());
    setBulkTagMsg("");
    setBulkTagError("");
  };

  const selectAllVisibleProducts = (ids: string[]) => {
    setBulkTagMsg("");
    setBulkTagError("");
    setBulkTagSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const deselectVisibleProducts = (ids: string[]) => {
    setBulkTagMsg("");
    setBulkTagError("");
    setBulkTagSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const handleBulkDeleteSelected = async () => {
    setDeleteProductMsg("");
    setDeleteProductError("");
    setUpdateProductStatusMsg("");
    setUpdateProductStatusError("");
    if (userRole !== "admin") {
      setDeleteProductError("Only admin can delete products.");
      return;
    }
    const selectedIds = Array.from(bulkTagSelectedIds).filter(Boolean);
    if (selectedIds.length === 0) {
      setDeleteProductError("Select at least one product to delete.");
      return;
    }
    const ok = window.confirm(`Delete ${selectedIds.length} selected product(s)? This cannot be undone.`);
    if (!ok) return;

    setIsDeletingProduct(true);
    try {
      const results = await Promise.all(
        selectedIds.map(async (id) => {
          try {
            await deleteProduct(id);
            return { ok: true };
          } catch {
            return { ok: false };
          }
        }),
      );
      const deletedCount = results.filter((item) => item.ok).length;
      const failedCount = results.length - deletedCount;
      setDeleteProductMsg(`${deletedCount} product(s) deleted.${failedCount ? ` Failed: ${failedCount}.` : ""}`);
      if (failedCount > 0) {
        setDeleteProductError(`${failedCount} product(s) failed to delete.`);
      }
      if (deletedCount > 0) {
        setBulkTagSelectedIds(new Set());
      }
      await loadProducts();
    } catch (err: unknown) {
      setDeleteProductError(err instanceof Error ? err.message : "Failed to bulk delete products.");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleBulkTagApply = async () => {
    setBulkTagMsg("");
    setBulkTagError("");
    if (userRole !== "admin") {
      setBulkTagError("Only admin can bulk tag products.");
      return;
    }
    const selectedIds = Array.from(bulkTagSelectedIds);
    if (selectedIds.length === 0) {
      setBulkTagError("Select at least one product.");
      return;
    }
    const selectedTagId = bulkTagId.trim();
    if (!selectedTagId) {
      setBulkTagError("Please select a tag.");
      return;
    }

    setIsBulkTagging(true);
    try {
      const tagName =
        allTags.find((tag) => tag.id === selectedTagId)?.name ??
        "selected";
      if (!tagName) {
        setBulkTagError("Selected tag not found.");
        return;
      }

      const results = await Promise.all(
        selectedIds.map(async (productId) => {
          try {
            const res = await linkProductTag(productId, { tagId: selectedTagId });
            return { ok: true, linked: Boolean(res.linked) };
          } catch {
            return { ok: false, linked: false };
          }
        }),
      );

      const successCount = results.filter((item) => item.ok).length;
      const newlyLinkedCount = results.filter((item) => item.ok && item.linked).length;
      const failedCount = results.length - successCount;
      setBulkTagMsg(
        `"${tagName}" tag processed for ${results.length} selected products. Newly tagged: ${newlyLinkedCount}, already tagged: ${
          successCount - newlyLinkedCount
        }, failed: ${failedCount}.`,
      );
      if (failedCount > 0) {
        setBulkTagError(`${failedCount} product(s) failed while tagging.`);
      }
      await Promise.all([loadProducts(), loadLatestProducts()]);
    } catch (err: unknown) {
      setBulkTagError(err instanceof Error ? err.message : "Failed to bulk tag products.");
    } finally {
      setIsBulkTagging(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setDeleteProductMsg("");
    setDeleteProductError("");
    setUpdateProductStatusMsg("");
    setUpdateProductStatusError("");
    if (userRole !== "admin") {
      setDeleteProductError("Only admin can delete products.");
      return;
    }
    if (!id) return;
    const ok = window.confirm("Delete this product? This cannot be undone.");
    if (!ok) return;

    setIsDeletingProduct(true);
    try {
      const res = await deleteProduct(id);
      setDeleteProductMsg(res.message || "Product deleted.");
      setBulkTagSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await loadProducts();
    } catch (err: unknown) {
      setDeleteProductError(err instanceof Error ? err.message : "Failed to delete product.");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const allowedStatuses = ["draft", "active", "archived"] as const;

  const handleUpdateProductStatus = async (id: string, nextStatus: string) => {
    setUpdateProductStatusMsg("");
    setUpdateProductStatusError("");
    setDeleteProductMsg("");
    setDeleteProductError("");

    if (userRole !== "admin") {
      setUpdateProductStatusError("Only admin can update product status.");
      return;
    }
    if (!id) return;
    const trimmed = nextStatus.trim();
    if (!trimmed) return;

    setIsUpdatingProductStatus(true);
    setUpdatingProductStatusId(id);
    try {
      const updated = await updateProductStatus(id, { status: trimmed });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: updated.status,
                updatedAt: updated.updatedAt,
              }
            : p
        )
      );
      setUpdateProductStatusMsg(`Status updated to "${updated.status}".`);
    } catch (err: unknown) {
      setUpdateProductStatusError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setIsUpdatingProductStatus(false);
      setUpdatingProductStatusId(null);
    }
  };

  const filtersKey = (f: {
    status?: "" | "active" | "draft" | "archived";
    categoryType?: "" | "material" | "furniture";
    categoryId?: string;
    q?: string;
    brands: string[];
    thicknesses: string[];
    colors: string[];
    includeImages: boolean;
    includeCategories: boolean;
  }) =>
    [
      f.status || "",
      f.categoryType || "",
      f.categoryId || "",
      f.q || "",
      f.brands.join(","),
      f.thicknesses.join(","),
      f.colors.join(","),
      f.includeImages ? "1" : "0",
      f.includeCategories ? "1" : "0",
    ].join("|");

  const buildAppliedFilters = useCallback(
    () => ({
      status: filterStatus,
      categoryType: filterCategoryType,
      categoryId: (filterCategoryId || selectedParentCategoryId).trim(),
      q: filterQ.trim(),
      brands: Array.from(filterBrands).map((value) => value.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b)),
      thicknesses: Array.from(filterThicknesses).map((value) => value.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b)),
      colors: Array.from(filterColors).map((value) => value.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b)),
      includeImages: filterIncludeImages,
      includeCategories: filterIncludeCategories,
    }),
    [
      filterStatus,
      filterCategoryType,
      filterCategoryId,
      selectedParentCategoryId,
      filterQ,
      filterBrands,
      filterThicknesses,
      filterColors,
      filterIncludeImages,
      filterIncludeCategories,
    ]
  );

  const applyProductFilters = () => {
    const next = buildAppliedFilters();
    if (filtersKey(next) === filtersKey(appliedFilters)) return;
    setProductsPage(1);
    setAppliedFilters(next);
  };

  useEffect(() => {
    const next = buildAppliedFilters();
    if (filtersKey(next) === filtersKey(appliedFilters)) return;
    setProductsPage(1);
    setAppliedFilters(next);
  }, [filterStatus, filterCategoryType, filterIncludeImages, filterIncludeCategories, appliedFilters, buildAppliedFilters]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = buildAppliedFilters();
      if (filtersKey(next) === filtersKey(appliedFilters)) return;
      setProductsPage(1);
      setAppliedFilters(next);
    }, 450);
    return () => window.clearTimeout(handle);
  }, [filterQ, filterCategoryId, filterBrands, filterThicknesses, filterColors, appliedFilters, buildAppliedFilters]);

  useEffect(() => {
    const next = buildAppliedFilters();
    if (filtersKey(next) === filtersKey(appliedFilters)) return;
    setProductsPage(1);
    setAppliedFilters(next);
  }, [selectedParentCategoryId, appliedFilters, buildAppliedFilters]);

  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setProductsError("");
    try {
      const res = await getProducts({
        page: productsPage,
        limit: productsLimit,
        status: appliedFilters.status || undefined,
        categoryType: appliedFilters.categoryType || undefined,
        categoryId: appliedFilters.categoryId?.trim() || undefined,
        q: appliedFilters.q?.trim() || undefined,
        brand: undefined,
        thickness: undefined,
        colorName: undefined,
        includeImages: appliedFilters.includeImages,
        includeCategories: appliedFilters.includeCategories,
      });
      setProducts(res.items || []);
      setProductsTotal(res.total || 0);
      setProductsPage(res.page || 1);
      setProductsLimit(res.limit || productsLimit);
    } catch (err: unknown) {
      setProductsError(err instanceof Error ? err.message : "Failed to fetch products.");
      setProducts([]);
      setProductsTotal(0);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [appliedFilters, productsLimit, productsPage]);

  const loadLatestProducts = useCallback(async () => {
    setIsLoadingLatestProducts(true);
    try {
      const res = await getProducts({
        page: 1,
        limit: 4,
        includeImages: true,
        includeCategories: true,
      });
      const items = Array.isArray(res.items) ? res.items : [];
      const sortedByNewest = [...items].sort((a, b) => {
        const aTime = new Date(a.createdAt || "").getTime();
        const bTime = new Date(b.createdAt || "").getTime();
        return bTime - aTime;
      });
      setLatestProducts(sortedByNewest.slice(0, 4));
    } catch {
      setLatestProducts([]);
    } finally {
      setIsLoadingLatestProducts(false);
    }
  }, []);

  const makeBlogImageUrl = useCallback((blog: BlogItem) => {
    const directUrl = blog.featuredImageUrl?.trim() || "";
    if (directUrl) return directUrl;
    const key = blog.featuredImageS3Key?.trim() || "";
    if (!key) return null;
    if (key.startsWith("http://") || key.startsWith("https://")) return key;
    return `${BLOG_IMAGE_BASE_URL}/${key.replace(/^\/+/, "")}`;
  }, []);

  const loadLatestBlogs = useCallback(async () => {
    setIsLoadingLatestBlogs(true);
    setLatestBlogsError("");
    try {
      const blogs = await getBlogs({ publishedOnly: true });
      const sortedByNewest = [...(Array.isArray(blogs) ? blogs : [])].sort((a, b) => {
        const aTime = new Date(a.createdAt || "").getTime();
        const bTime = new Date(b.createdAt || "").getTime();
        return bTime - aTime;
      });
      setLatestBlogs(sortedByNewest.slice(0, 4));
    } catch (err: unknown) {
      setLatestBlogs([]);
      setLatestBlogsError(err instanceof Error ? err.message : "Failed to load latest blogs.");
    } finally {
      setIsLoadingLatestBlogs(false);
    }
  }, []);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const storedRole = localStorage.getItem("userRole");
    if (storedName) {
      setUserName(storedName);
      setUserRole(storedRole || "");
    } else {
      setUserName("");
      setUserRole("");
    }
  }, [router]);

  useEffect(() => {
    const close = () => {
      setIsShortlistOpen(false);
      setIsUsersMenuOpen(false);
      setIsCategoriesMenuOpen(false);
      setIsProductsMenuOpen(false);
      setIsBlogMenuOpen(false);
      setIsNotificationsOpen(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    setBulkTagSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const visibleIds = new Set(products.map((item) => item.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visibleIds.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [products]);

  useEffect(() => {
    loadLatestProducts();
  }, [loadLatestProducts]);

  useEffect(() => {
    loadLatestBlogs();
  }, [loadLatestBlogs]);

  useEffect(() => {
    if (userRole !== "customer") {
      setShortlistItems([]);
      setShortlistCompareSelectedIds(new Set());
      setShortlistError("");
      setShortlistMsg("");
      setNoteDrafts({});
      setSavingNoteId(null);
      setIsLoadingShortlist(false);
      return;
    }

    const loadShortlist = async () => {
      setIsLoadingShortlist(true);
      setShortlistError("");
      try {
        const items = await getShortlist();
        const shortlist = Array.isArray(items) ? items : [];
        setShortlistItems(shortlist);
        const shortlistProductIds = new Set(
          shortlist
            .map((item) => item.productId?.trim())
            .filter((id): id is string => Boolean(id))
        );
        setShortlistCompareSelectedIds((prev) => {
          const next = new Set<string>();
          prev.forEach((id) => {
            if (shortlistProductIds.has(id)) next.add(id);
          });
          return next;
        });
        setNoteDrafts(
          shortlist.reduce<Record<string, string>>((acc, item) => {
            acc[item.id] = item.customerNote || "";
            return acc;
          }, {})
        );
      } catch (err: unknown) {
        setShortlistError(err instanceof Error ? err.message : "Failed to fetch shortlist.");
        setShortlistItems([]);
        setNoteDrafts({});
      } finally {
        setIsLoadingShortlist(false);
      }
    };

    loadShortlist();
  }, [userRole]);

  useEffect(() => {
    if (userRole !== "designer") {
      setDesignerCustomers([]);
      setDesignerCustomersError("");
      setIsLoadingDesignerCustomers(false);
      setDesignerReplyDrafts({});
      setSavingDesignerReplyId(null);
      setDesignerReplyError("");
      setDesignerReplyMsg("");
      return;
    }

    const loadDesignerCustomers = async () => {
      setIsLoadingDesignerCustomers(true);
      setDesignerCustomersError("");
      try {
        const customers = await getDesignerCustomers();
        setDesignerCustomers(Array.isArray(customers) ? customers : []);
      } catch (err: unknown) {
        setDesignerCustomersError(err instanceof Error ? err.message : "Failed to fetch designer customers.");
        setDesignerCustomers([]);
      } finally {
        setIsLoadingDesignerCustomers(false);
      }
    };

    loadDesignerCustomers();
  }, [userRole]);

  useEffect(() => {
    const eligibleRoles = new Set(["customer", "designer", "admin", "blogadmin"]);
    if (!eligibleRoles.has(userRole)) {
      setNotifications([]);
      setNotificationsError("");
      setIsLoadingNotifications(false);
      return;
    }

    let isMounted = true;
    const loadNotifications = async () => {
      if (isMounted) setIsLoadingNotifications(true);
      if (isMounted) setNotificationsError("");
      try {
        const items = await getNotifications();
        if (!isMounted) return;
        setNotifications(Array.isArray(items) ? items : []);
      } catch (err: unknown) {
        if (!isMounted) return;
        setNotificationsError(err instanceof Error ? err.message : "Failed to fetch notifications.");
        setNotifications([]);
      } finally {
        if (isMounted) setIsLoadingNotifications(false);
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [userRole]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    setIsNotificationsOpen(false);
    if (!notification.isRead) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item
        )
      );
      try {
        const updated = await markNotificationAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
      } catch {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, isRead: false } : item
          )
        );
      }
    }
    const target = typeof notification.link === "string" ? notification.link.trim() : "";
    if (!target) return;
    if (target.startsWith("/shortlist/")) {
      if (userRole === "customer") {
        setIsShortlistOpen(true);
      }
      router.push("/dashboard");
      return;
    }
    if (target.startsWith("http://") || target.startsWith("https://")) {
      window.open(target, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(target.startsWith("/") ? target : `/${target}`);
  };

  const handleMarkAllNotificationsRead = async () => {
    if (unreadNotificationsCount <= 0 || isMarkingAllNotificationsRead) return;
    setIsMarkingAllNotificationsRead(true);
    setNotificationsError("");
    const previous = notifications;
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    try {
      await markAllNotificationsAsRead();
    } catch (err: unknown) {
      setNotifications(previous);
      setNotificationsError(err instanceof Error ? err.message : "Failed to mark all notifications as read.");
    } finally {
      setIsMarkingAllNotificationsRead(false);
    }
  };

  const handleRequestSample = async (shortlistId: string) => {
    setShortlistError("");
    setShortlistMsg("");
    if (userRole !== "customer") {
      setShortlistError("Only customer can request a physical sample.");
      return;
    }
    const id = shortlistId.trim();
    if (!id) {
      setShortlistError("Shortlist id is required.");
      return;
    }

    setRequestingSampleId(id);
    try {
      const updated = await requestShortlistSample(id);
      setShortlistItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                sampleRequested: updated.sampleRequested,
                sampleRequestedAt: updated.sampleRequestedAt,
                sampleStatus: updated.sampleStatus,
              }
            : item
        )
      );
      setShortlistMsg("Physical sample requested successfully.");
    } catch (err: unknown) {
      setShortlistError(err instanceof Error ? err.message : "Failed to request physical sample.");
    } finally {
      setRequestingSampleId(null);
    }
  };

  const handleUpdateShortlistNote = async (shortlistId: string) => {
    setShortlistError("");
    setShortlistMsg("");
    if (userRole !== "customer") {
      setShortlistError("Only customer can update shortlist note.");
      return;
    }
    const id = shortlistId.trim();
    if (!id) {
      setShortlistError("Shortlist id is required.");
      return;
    }
    const customerNote = (noteDrafts[id] ?? "").trim();

    setSavingNoteId(id);
    try {
      const updated = await updateShortlistNote(id, { customerNote });
      setShortlistItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                customerNote: updated.customerNote,
              }
            : item
        )
      );
      setNoteDrafts((prev) => ({ ...prev, [id]: updated.customerNote || "" }));
      setShortlistMsg("Shortlist note updated successfully.");
    } catch (err: unknown) {
      setShortlistError(err instanceof Error ? err.message : "Failed to update shortlist note.");
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleDeleteShortlist = async (shortlistId: string) => {
    setShortlistError("");
    setShortlistMsg("");
    if (userRole !== "customer") {
      setShortlistError("Only customer can remove shortlist items.");
      return;
    }
    const id = shortlistId.trim();
    if (!id) {
      setShortlistError("Shortlist id is required.");
      return;
    }
    const ok = window.confirm("Remove this item from shortlist?");
    if (!ok) return;

    setDeletingShortlistId(id);
    try {
      const result = await deleteShortlist(id);
      setShortlistItems((prev) => {
        const deletedItem = prev.find((item) => item.id === id);
        if (deletedItem?.productId) {
          setShortlistCompareSelectedIds((selectedPrev) => {
            const next = new Set(selectedPrev);
            next.delete(deletedItem.productId);
            return next;
          });
        }
        return prev.filter((item) => item.id !== id);
      });
      setNoteDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setShortlistMsg(result.message || "Removed from shortlist.");
    } catch (err: unknown) {
      setShortlistError(err instanceof Error ? err.message : "Failed to remove shortlist item.");
    } finally {
      setDeletingShortlistId(null);
    }
  };

  const handleOpenDesignerCustomerDetails = async (customerId: string) => {
    setDesignerCustomerDetailsError("");
    setDesignerCustomerDetails(null);
    setDesignerSampleDrafts({});
    setSavingDesignerSampleId(null);
    setDesignerSampleMsg("");
    setDesignerSampleError("");
    setDesignerReplyDrafts({});
    setSavingDesignerReplyId(null);
    setDesignerReplyMsg("");
    setDesignerReplyError("");
    setDesignerNoteDraft("");
    setDesignerNoteProductId("");
    setDesignerNoteMsg("");
    setDesignerNoteError("");
    setDesignerNoteDrafts({});
    setSavingDesignerNoteId(null);
    setDesignerRecommendationDrafts({});
    setDesignerRecommendationProductSelections({});
    setCreatingDesignerRecommendationShortlistId(null);
    setDesignerRecommendationMsg("");
    setDesignerRecommendationError("");
    if (userRole !== "designer") {
      setDesignerCustomersError("Only designer can view customer details.");
      return;
    }
    const id = customerId.trim();
    if (!id) {
      setDesignerCustomersError("Customer id is required.");
      return;
    }

    setSelectedDesignerCustomerId(id);
    setIsDesignerCustomerDetailsOpen(true);
    setIsLoadingDesignerCustomerDetails(true);
    try {
      const data = await getDesignerCustomerDetails(id);
      setDesignerCustomerDetails(data);
      setDesignerSampleDrafts(
        (Array.isArray(data.shortlist) ? data.shortlist : []).reduce<Record<string, string>>((acc, item) => {
          acc[item.id] = item.sampleStatus || "none";
          return acc;
        }, {})
      );
      setDesignerRecommendationProductSelections(
        (Array.isArray(data.shortlist) ? data.shortlist : []).reduce<Record<string, string>>((acc, item) => {
          acc[item.id] = "";
          return acc;
        }, {})
      );
      const notesList = Array.isArray(data.notes)
        ? data.notes.map((note) => note as Record<string, unknown>)
        : [];
      setDesignerReplyDrafts(
        (Array.isArray(data.shortlist) ? data.shortlist : []).reduce<Record<string, string>>((acc, item) => {
          const matchedNote = findDesignerNoteForProduct(notesList, item.productId || "");
          acc[item.id] = matchedNote ? getDesignerNoteText(matchedNote) : "";
          return acc;
        }, {})
      );
      setDesignerNoteDrafts(
        (Array.isArray(data.notes) ? data.notes : []).reduce<Record<string, string>>((acc, note) => {
          if (typeof note.id === "string") acc[note.id] = getDesignerNoteText(note);
          return acc;
        }, {})
      );
    } catch (err: unknown) {
      setDesignerCustomerDetailsError(err instanceof Error ? err.message : "Failed to fetch customer details.");
    } finally {
      setIsLoadingDesignerCustomerDetails(false);
    }
  };

  const handleUpdateDesignerSample = async (shortlistId: string) => {
    setDesignerSampleError("");
    setDesignerSampleMsg("");
    if (userRole !== "designer") {
      setDesignerSampleError("Only designer can update sample status.");
      return;
    }
    const id = shortlistId.trim();
    if (!id) {
      setDesignerSampleError("Shortlist id is required.");
      return;
    }
    const sampleStatus = (designerSampleDrafts[id] ?? "").trim();
    if (!sampleStatus) {
      setDesignerSampleError("Sample status is required.");
      return;
    }

    const payload: UpdateDesignerSamplePayload = { sampleStatus };

    setSavingDesignerSampleId(id);
    try {
      const updated = await updateDesignerSample(id, payload);
      setDesignerCustomerDetails((prev) =>
        prev
          ? {
              ...prev,
              shortlist: prev.shortlist.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      sampleRequested: updated.sampleRequested,
                      sampleRequestedAt: updated.sampleRequestedAt,
                      sampleStatus: updated.sampleStatus,
                    }
                  : item
              ),
            }
          : prev
      );
      setDesignerSampleDrafts((prev) => ({ ...prev, [id]: updated.sampleStatus || sampleStatus }));
      setDesignerSampleMsg("Sample status updated successfully.");
    } catch (err: unknown) {
      setDesignerSampleError(err instanceof Error ? err.message : "Failed to update sample status.");
    } finally {
      setSavingDesignerSampleId(null);
    }
  };

  const handleSaveDesignerReply = async (shortlistId: string, productId: string) => {
    setDesignerReplyError("");
    setDesignerReplyMsg("");
    if (userRole !== "designer") {
      setDesignerReplyError("Only designer can save replies.");
      return;
    }
    const shortlistItemId = shortlistId.trim();
    const linkedProductId = productId.trim();
    const customerId = selectedDesignerCustomerId.trim();
    if (!shortlistItemId || !linkedProductId || !customerId) {
      setDesignerReplyError("Shortlist context is missing.");
      return;
    }

    const noteText = (designerReplyDrafts[shortlistItemId] ?? "").trim();
    if (!noteText) {
      setDesignerReplyError("Reply note is required.");
      return;
    }

    const existingNote =
      designerCustomerDetails?.notes.find((note) => {
        const noteProductId = typeof note.productId === "string" ? note.productId.trim() : "";
        return noteProductId === linkedProductId && typeof note.id === "string";
      }) ?? null;

    setSavingDesignerReplyId(shortlistItemId);
    try {
      if (existingNote && typeof existingNote.id === "string") {
        const updated = await updateDesignerNote(existingNote.id, { note: noteText });
        setDesignerCustomerDetails((prev) =>
          prev
            ? {
                ...prev,
                notes: prev.notes.map((item) =>
                  item.id === existingNote.id
                    ? {
                        ...item,
                        ...updated,
                      }
                    : item
                ),
              }
            : prev
        );
        setDesignerNoteDrafts((prev) => ({ ...prev, [existingNote.id as string]: getDesignerNoteText(updated) }));
      } else {
        const payload: CreateDesignerNotePayload = {
          customerId,
          productId: linkedProductId,
          note: noteText,
        };
        const created = await createDesignerNote(payload);
        setDesignerCustomerDetails((prev) =>
          prev
            ? {
                ...prev,
                notes: [created, ...(Array.isArray(prev.notes) ? prev.notes : [])],
              }
            : prev
        );
        if (typeof created.id === "string") {
          setDesignerNoteDrafts((prev) => ({ ...prev, [created.id as string]: getDesignerNoteText(created) }));
        }
      }

      setDesignerReplyDrafts((prev) => ({ ...prev, [shortlistItemId]: noteText }));
      setDesignerReplyMsg("Reply saved successfully.");
    } catch (err: unknown) {
      setDesignerReplyError(err instanceof Error ? err.message : "Failed to save reply.");
    } finally {
      setSavingDesignerReplyId(null);
    }
  };

  const handleCreateDesignerNote = async () => {
    setDesignerNoteError("");
    setDesignerNoteMsg("");
    if (userRole !== "designer") {
      setDesignerNoteError("Only designer can add notes.");
      return;
    }
    const customerId = selectedDesignerCustomerId.trim();
    if (!customerId) {
      setDesignerNoteError("Customer id is required.");
      return;
    }
    const note = designerNoteDraft.trim();
    if (!note) {
      setDesignerNoteError("Note is required.");
      return;
    }

    const payload: CreateDesignerNotePayload = {
      customerId,
      note,
      ...(designerNoteProductId.trim() ? { productId: designerNoteProductId.trim() } : {}),
    };

    setIsCreatingDesignerNote(true);
    try {
      const created = await createDesignerNote(payload);
      setDesignerCustomerDetails((prev) =>
        prev
          ? {
              ...prev,
              notes: [created, ...(Array.isArray(prev.notes) ? prev.notes : [])],
            }
          : prev
      );
      if (typeof created.id === "string") {
        setDesignerNoteDrafts((prev) => ({ ...prev, [created.id as string]: getDesignerNoteText(created) }));
      }
      setDesignerNoteDraft("");
      setDesignerNoteProductId("");
      setDesignerNoteMsg("Designer note added successfully.");
    } catch (err: unknown) {
      setDesignerNoteError(err instanceof Error ? err.message : "Failed to add designer note.");
    } finally {
      setIsCreatingDesignerNote(false);
    }
  };

  const handleUpdateDesignerNote = async (noteId: string) => {
    setDesignerNoteError("");
    setDesignerNoteMsg("");
    if (userRole !== "designer") {
      setDesignerNoteError("Only designer can update notes.");
      return;
    }
    const id = noteId.trim();
    if (!id) {
      setDesignerNoteError("Note id is required.");
      return;
    }
    const note = (designerNoteDrafts[id] ?? "").trim();
    if (!note) {
      setDesignerNoteError("Note is required.");
      return;
    }

    const payload: UpdateDesignerNotePayload = { note };

    setSavingDesignerNoteId(id);
    try {
      const updated = await updateDesignerNote(id, payload);
      setDesignerCustomerDetails((prev) =>
        prev
          ? {
              ...prev,
              notes: prev.notes.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      ...updated,
                    }
                  : item
              ),
            }
          : prev
      );
      setDesignerNoteDrafts((prev) => ({ ...prev, [id]: getDesignerNoteText(updated) }));
      setDesignerNoteMsg("Designer note updated successfully.");
    } catch (err: unknown) {
      setDesignerNoteError(err instanceof Error ? err.message : "Failed to update designer note.");
    } finally {
      setSavingDesignerNoteId(null);
    }
  };

  const handleCreateDesignerRecommendation = async (
    shortlistItemId: string,
    selectedProductId: string,
    shortlistedProductId: string
  ) => {
    setDesignerRecommendationError("");
    setDesignerRecommendationMsg("");
    if (userRole !== "designer") {
      setDesignerRecommendationError("Only designer can add recommendations.");
      return;
    }
    const customerId = selectedDesignerCustomerId.trim();
    if (!customerId) {
      setDesignerRecommendationError("Customer id is required.");
      return;
    }
    const linkedProductId = selectedProductId.trim();
    if (!linkedProductId) {
      setDesignerRecommendationError("Product is required.");
      return;
    }
    const baseShortlistedProductId = shortlistedProductId.trim();
    if (baseShortlistedProductId && linkedProductId === baseShortlistedProductId) {
      setDesignerRecommendationError("Recommended product must be different from shortlisted product.");
      return;
    }
    const shortlistId = shortlistItemId.trim();
    if (!shortlistId) {
      setDesignerRecommendationError("Shortlist item id is required.");
      return;
    }
    const note = (designerRecommendationDrafts[shortlistId] ?? "").trim();
    if (!note) {
      setDesignerRecommendationError("Recommendation note is required.");
      return;
    }

    const payload: CreateDesignerRecommendationPayload = {
      customerId,
      productId: linkedProductId,
      shortlistedProductId: baseShortlistedProductId,
      note,
    };

    setIsCreatingDesignerRecommendation(true);
    setCreatingDesignerRecommendationShortlistId(shortlistId);
    try {
      const created = await createDesignerRecommendation(payload);
      setDesignerCustomerDetails((prev) =>
        prev
          ? {
              ...prev,
              shortlist: prev.shortlist.map((item) =>
                item.id === shortlistId
                  ? {
                      ...item,
                      recommendations: [created, ...(Array.isArray(item.recommendations) ? item.recommendations : [])],
                    }
                  : item
              ),
            }
          : prev
      );
      setDesignerRecommendationDrafts((prev) => ({ ...prev, [shortlistId]: "" }));
      setDesignerRecommendationMsg("Recommendation added successfully.");
    } catch (err: unknown) {
      setDesignerRecommendationError(err instanceof Error ? err.message : "Failed to add recommendation.");
    } finally {
      setIsCreatingDesignerRecommendation(false);
      setCreatingDesignerRecommendationShortlistId(null);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const email = localStorage.getItem("userEmail") || "";
      const password = localStorage.getItem("userPassword") || "";
      await logout({ email, password });
      localStorage.clear();
      setUserName("");
      setUserRole("");
      router.push("/dashboard");
    } catch {
      localStorage.clear();
      setUserName("");
      setUserRole("");
      router.push("/dashboard");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateMsg("");
    setCreateError("");
    try {
      await createUser(newUserData);
      setCreateMsg("User created successfully!");
      setNewUserData({ email: "", name: "", role: "customer", projectName: "" });
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateMsg("");
      }, 2000);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCat(true);
    setCatMsg("");
    setCatError("");
    try {
      const payload: {
        name: string;
        type: "material" | "furniture";
        parent_id?: string;
      } = {
        name: newCatData.name,
        type: newCatData.type,
      };
      if (newCatData.parent_id.trim()) {
        payload.parent_id = newCatData.parent_id.trim();
      }
      
      await createCategory(payload);
      setCatMsg("Category created successfully!");
      setNewCatData({ name: "", parent_id: "", type: "material" });
      setTimeout(() => {
        setIsCategoryModalOpen(false);
        setCatMsg("");
      }, 2000);
    } catch (err: unknown) {
      setCatError(err instanceof Error ? err.message : "Failed to create category.");
    } finally {
      setIsCreatingCat(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProduct(true);
    setProductMsg("");
    setProductError("");
    setCreatedProductImages([]);

    if (userRole !== "admin") {
      setIsCreatingProduct(false);
      setProductError("Only admin can create products.");
      return;
    }

    if (createProductImageFiles.length < 1 || createProductImageFiles.length > 3) {
      setIsCreatingProduct(false);
      setProductError("Please select minimum 1 and maximum 3 product images.");
      return;
    }

    const splitList = (value: string) =>
      value
        .split(/\r?\n|,/g)
        .map((item) => item.trim())
        .filter(Boolean);

    try {
      const payload: CreateProductPayload = {
        imsId: newProductData.imsId,
        name: newProductData.name,
        sku: newProductData.sku,
        brand: newProductData.brand,
        description: newProductData.description,
        bookName: newProductData.bookName || undefined,
        pageNumber: newProductData.pageNumber || undefined,
        application: newProductData.application || undefined,
        materialType: newProductData.materialType,
        colorName: newProductData.colorName,
        dimensions: newProductData.dimensions,
        status: newProductData.status,
        performanceRating: Number(newProductData.performanceRating),
        durabilityRating: Number(newProductData.durabilityRating),
        priceCategory: Number(newProductData.priceCategory),
        maintenanceRating: Number(newProductData.maintenanceRating),
        pros: splitList(newProductData.prosText),
        cons: splitList(newProductData.consText)
      };

      const created = await createProduct(payload);
      let uploadedImages: ProductImageUploadResponse[] = [];
      if (createProductImageFiles.length > 0) {
        if (!created?.id) {
          throw new Error("Product created, but product id is missing so image upload cannot continue.");
        }
        uploadedImages = await uploadProductImages(created.id, createProductImageFiles);
        setCreatedProductImages(uploadedImages);
      }

      let bindNote = "";
      if (createSelectedCategoryIds.size > 0) {
        if (!created?.id) {
          throw new Error("Product created, but product id is missing so category binding cannot continue.");
        }
        try {
          const bound = await bindProductCategories(created.id, Array.from(createSelectedCategoryIds));
          bindNote = ` • Categories added: ${bound.added}`;
        } catch (err: unknown) {
          bindNote = " • Category bind failed";
          setProductError(err instanceof Error ? err.message : "Failed to bind categories.");
        }
      }

      let tagLinkNote = "";
      if (createSelectedTagIds.size > 0) {
        if (!created?.id) {
          throw new Error("Product created, but product id is missing so tag linking cannot continue.");
        }
        let linkedCount = 0;
        try {
          for (const tagId of Array.from(createSelectedTagIds)) {
            const linked = await linkProductTag(created.id, { tagId });
            if (linked?.linked) linkedCount += 1;
          }
          tagLinkNote = ` • Tags linked: ${linkedCount}`;
        } catch (err: unknown) {
          tagLinkNote = " • Tag linking failed";
          setProductError(err instanceof Error ? err.message : "Failed to link tags.");
        }
      }

      setProductMsg(() => {
        const base = `Product created: ${created?.name || payload.name}${created?.id ? ` (ID: ${created.id})` : ""}`;
        const imageNote =
          uploadedImages.length > 0
            ? ` • ${uploadedImages.length} image${uploadedImages.length > 1 ? "s" : ""} uploaded`
            : createProductImageFiles.length > 0
              ? " • Image upload skipped"
              : "";
        return `${base}${imageNote}${bindNote}${tagLinkNote}`;
      });
      await Promise.all([loadProducts(), loadLatestProducts()]);
      setNewProductData({
        imsId: "",
        name: "",
        sku: "",
        brand: "",
        description: "",
        bookName: "",
        pageNumber: "",
        application: "",
        materialType: "",
        colorName: "",
        dimensions: "",
        status: "draft",
        performanceRating: 4,
        durabilityRating: 3.5,
        priceCategory: 2,
        maintenanceRating: 4,
        prosText: "",
        consText: ""
      });
      setCreateProductImageFiles([]);
      setCreateSelectedCategoryIds(new Set());
      setCreateSelectedTagIds(new Set());
      setIsCreateCategoriesDropdownOpen(false);
      setIsCreateTagsDropdownOpen(false);
      setTimeout(() => {
        setIsProductModalOpen(false);
        setProductMsg("");
      }, 2000);
    } catch (err: unknown) {
      setProductError(err instanceof Error ? err.message : "Failed to create product.");
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleUploadProductImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploadingImage(true);
    setUploadMsg("");
    setUploadError("");
    setUploadedImages([]);

    if (userRole !== "admin") {
      setIsUploadingImage(false);
      setUploadError("Only admin can upload product images.");
      return;
    }

    const productId = uploadProductId.trim();
    if (!productId) {
      setIsUploadingImage(false);
      setUploadError("Product ID is required.");
      return;
    }
    if (uploadFiles.length < 1 || uploadFiles.length > 3) {
      setIsUploadingImage(false);
      setUploadError("Please select minimum 1 and maximum 3 images.");
      return;
    }

    try {
      const uploaded = await uploadProductImages(productId, uploadFiles);
      setUploadedImages(uploaded);
      setUploadMsg(
        `${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded successfully!`
      );
      setUploadProductId("");
      setUploadFiles([]);
      await Promise.all([loadProducts(), loadLatestProducts()]);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const triggerBulkUploadPicker = () => {
    if (userRole !== "admin") {
      setBulkUploadError("Only admin can bulk upload products.");
      return;
    }
    setBulkUploadMsg("");
    setBulkUploadError("");
    setBulkUploadFile(null);
    setBulkUploadImagesZipFile(null);
    setIsBulkUploadModalOpen(true);
  };

  const handleBulkUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = bulkUploadFile;
    const imagesZip = bulkUploadImagesZipFile;
    if (!file) {
      setBulkUploadError("Please select an .xlsx file to upload.");
      return;
    }

    setBulkUploadMsg("");
    setBulkUploadError("");

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx")) {
      setBulkUploadError("Please upload an .xlsx file.");
      return;
    }
    if (imagesZip) {
      const zipName = imagesZip.name.toLowerCase();
      if (!zipName.endsWith(".zip")) {
        setBulkUploadError("Images ZIP must be a .zip file.");
        return;
      }
    }

    setIsBulkUploadingProducts(true);
    try {
      const result = await bulkUploadProducts(file, imagesZip);
      setBulkUploadMsg(
        `Bulk upload completed. Rows: ${result.totalRows}, Created: ${result.createdCount}, Failed: ${result.failedCount}`
      );
      if (result.failedCount > 0) {
        const firstError = result.errors?.[0]?.message || "Some rows failed.";
        setBulkUploadError(`Some rows failed: ${firstError}`);
      }
      await Promise.all([loadProducts(), loadLatestProducts()]);
    } catch (err: unknown) {
      setBulkUploadError(
        err instanceof Error ? err.message : "Bulk product upload failed."
      );
    } finally {
      setIsBulkUploadingProducts(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadMenuCategories = async () => {
      setIsLoadingMenuCategories(true);
      try {
        const data = await getCategoryMenu({ includeChildren: true, productLimit: 8 });
        if (isMounted) {
          setMenuCategories(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isMounted) {
          setMenuCategories([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingMenuCategories(false);
        }
      }
    };
    loadMenuCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadTrendingDesigns = async () => {
      setIsLoadingTrendingDesigns(true);
      setTrendingDesignsError("");
      try {
        const data = await getTrendings();
        if (isMounted) {
          setTrendingDesigns(Array.isArray(data) ? data.slice(0, 4) : []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setTrendingDesigns([]);
          setTrendingDesignsError(
            err instanceof Error ? err.message : "Failed to load trending designs.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingTrendingDesigns(false);
        }
      }
    };
    loadTrendingDesigns();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadDesignCfEntries = async () => {
      setIsLoadingDesignCfEntries(true);
      setDesignCfEntriesError("");
      try {
        const data = await getDesignCfEntries();
        if (isMounted) {
          setDesignCfEntries(Array.isArray(data) ? data.slice(0, 5) : []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setDesignCfEntries([]);
          setDesignCfEntriesError(
            err instanceof Error ? err.message : "Failed to load Design CF entries.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingDesignCfEntries(false);
        }
      }
    };
    loadDesignCfEntries();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const loadCats = async () => {
      if (userRole === "customer") return;
      try {
        const menu = await getCategoryMenu({ includeChildren: true, productLimit: 1 });
        const top: Category[] = [];
        const sub: Category[] = [];

        for (const root of Array.isArray(menu) ? menu : []) {
          const rootType: Category["type"] =
            root.type === "furniture" ? "furniture" : "material";
          top.push({
            id: root.id,
            name: root.name,
            type: rootType,
          });

          const children = Array.isArray(root.children) ? root.children : [];
          for (const child of children) {
            sub.push({
              id: child.id,
              name: child.name,
              type: rootType,
              parentId: root.id,
              parentName: root.name,
            });
          }
        }

        setTopLevelCategories(top);
        setAllCategories(sub);
      } catch {
        setTopLevelCategories([]);
        setAllCategories([]);
      }
    };
    loadCats();
  }, [isBindCategoriesOpen, isProductModalOpen, userRole]);

  useEffect(() => {
    const loadAllTags = async () => {
      if (userRole !== "admin" && !isProductTagsOpen && !isProductModalOpen) return;
      try {
        const data = await getTags();
        const tags = Array.isArray(data) ? data : [];
        setAllTags(tags);
        setBulkTagId((prev) => {
          if (prev && tags.some((tag) => tag.id === prev)) return prev;
          return tags[0]?.id ?? "";
        });
      } catch {
        setAllTags([]);
        setBulkTagId("");
      }
    };
    void loadAllTags();
  }, [isProductTagsOpen, isProductModalOpen, userRole]);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCreateCategory = (id: string) => {
    setCreateSelectedCategoryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCreateTag = (id: string) => {
    setCreateSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadLinkedTagsForProduct = useCallback(async (productId: string) => {
    const pid = productId.trim();
    if (!pid) {
      setProductLinkedTagIds([]);
      setHasLinkedTagData(false);
      return;
    }

    setIsLoadingLinkedTags(true);
    try {
      const tags = await getProductTags(pid);
      setProductLinkedTagIds(tags.map((tag) => tag.id));
      setHasLinkedTagData(true);
    } catch {
      setProductLinkedTagIds([]);
      setHasLinkedTagData(false);
    } finally {
      setIsLoadingLinkedTags(false);
    }
  }, []);

  useEffect(() => {
    void loadLinkedTagsForProduct(productTagProductId);
  }, [productTagProductId, loadLinkedTagsForProduct]);

  const handleBindCategories = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBindingCats(true);
    setBindMsg("");
    setBindError("");
    if (userRole !== "admin") {
      setIsBindingCats(false);
      setBindError("Only admin can bind categories.");
      return;
    }
    const pid = bindProductId.trim();
    if (!pid) {
      setIsBindingCats(false);
      setBindError("Product ID is required.");
      return;
    }
    const ids = Array.from(selectedCategoryIds);
    if (ids.length === 0) {
      setIsBindingCats(false);
      setBindError("Select at least one category.");
      return;
    }
    try {
      const result = await bindProductCategories(pid, ids);
      setBindMsg(`Added: ${result.added} • Skipped: ${result.skipped.length} • Invalid: ${result.invalid.length}`);
      setBindProductId("");
      setSelectedCategoryIds(new Set());
      await Promise.all([loadProducts(), loadLatestProducts()]);
    } catch (err: unknown) {
      setBindError(err instanceof Error ? err.message : "Failed to bind categories.");
    } finally {
      setIsBindingCats(false);
    }
  };

  const handleLinkProductTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLinkingTag(true);
    setProductTagMsg("");
    setProductTagError("");

    if (userRole !== "admin") {
      setIsLinkingTag(false);
      setProductTagError("Only admin can link tags.");
      return;
    }

    const pid = productTagProductId.trim();
    const tagId = selectedLinkTagId.trim();
    if (!pid) {
      setIsLinkingTag(false);
      setProductTagError("Product ID is required.");
      return;
    }
    if (!tagId) {
      setIsLinkingTag(false);
      setProductTagError("Please select a tag to link.");
      return;
    }
    if (productLinkedTagIds.includes(tagId)) {
      setIsLinkingTag(false);
      setProductTagError("This tag is already linked to the selected product.");
      return;
    }

    try {
      const result = await linkProductTag(pid, { tagId });
      setProductTagMsg(result.message || "Tag linked successfully.");
      await loadLinkedTagsForProduct(pid);
      await Promise.all([loadProducts(), loadLatestProducts()]);
    } catch (err: unknown) {
      setProductTagError(err instanceof Error ? err.message : "Failed to link tag.");
    } finally {
      setIsLinkingTag(false);
    }
  };

  const handleUnlinkProductTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUnlinkingTag(true);
    setProductTagMsg("");
    setProductTagError("");

    if (userRole !== "admin") {
      setIsUnlinkingTag(false);
      setProductTagError("Only admin can delink tags.");
      return;
    }

    const pid = productTagProductId.trim();
    const tagId = selectedUnlinkTagId.trim();
    if (!pid) {
      setIsUnlinkingTag(false);
      setProductTagError("Product ID is required.");
      return;
    }
    if (!tagId) {
      setIsUnlinkingTag(false);
      setProductTagError("Please select a tag to delink.");
      return;
    }

    try {
      const result = await unlinkProductTag(pid, tagId);
      setProductTagMsg(result.message || "Tag delinked successfully.");
      await loadLinkedTagsForProduct(pid);
      await Promise.all([loadProducts(), loadLatestProducts()]);
    } catch (err: unknown) {
      setProductTagError(err instanceof Error ? err.message : "Failed to delink tag.");
    } finally {
      setIsUnlinkingTag(false);
    }
  };

  const activeMenuCategory =
    menuCategories.find((category) => category.id === activeMenuCategoryId) ?? null;
  const resolvedMenuCategories =
    menuCategories.length > 0
      ? menuCategories
      : FALLBACK_MENU_NAMES.map((name, index) => ({
          id: `fallback-${index}`,
          name,
          slug: "",
          type: "material" as const,
          displayOrder: index,
          productCount: 0,
          products: [],
          children: [],
        }));

  const scrollCategoryTiles = (direction: "left" | "right") => {
    if (!categoryTilesScrollRef.current) return;
    categoryTilesScrollRef.current.scrollBy({
      left: direction === "left" ? -420 : 420,
      behavior: "smooth",
    });
  };

  const visibleSubcategories = allCategories.filter((category) => {
    if (filterCategoryType && category.type !== filterCategoryType) return false;
    if (selectedParentCategoryId && category.parentId !== selectedParentCategoryId) return false;
    return true;
  });

  const toggleSetFilterValue = (
    setter: (updater: (prev: Set<string>) => Set<string>) => void,
    value: string,
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const availableBrandFilters = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => (product.brand ?? "").trim())
            .filter((value) => Boolean(value) && /[a-z0-9]/i.test(value)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const availableThicknessFilters = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => (product.thickness ?? "").trim())
            .filter((value) => Boolean(value) && /[a-z0-9]/i.test(value)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const availableColorFilters = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => (product.colorName ?? "").trim())
            .filter((value) => Boolean(value) && /[a-z0-9]/i.test(value)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const visibleDashboardProducts = useMemo(
    () =>
      products.filter((product) => {
        if (appliedFilters.brands.length > 0) {
          const brand = (product.brand ?? "").trim();
          if (!brand || !appliedFilters.brands.includes(brand)) return false;
        }
        if (appliedFilters.thicknesses.length > 0) {
          const thickness = (product.thickness ?? "").trim();
          if (!thickness || !appliedFilters.thicknesses.includes(thickness)) return false;
        }
        if (appliedFilters.colors.length > 0) {
          const color = (product.colorName ?? "").trim();
          if (!color || !appliedFilters.colors.includes(color)) return false;
        }
        return true;
      }),
    [products, appliedFilters.brands, appliedFilters.thicknesses, appliedFilters.colors],
  );

  const visibleDashboardProductIds = useMemo(
    () => visibleDashboardProducts.map((product) => product.id).filter(Boolean),
    [visibleDashboardProducts],
  );

  const allVisibleSelected =
    visibleDashboardProductIds.length > 0 &&
    visibleDashboardProductIds.every((id) => bulkTagSelectedIds.has(id));

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8F0E4] font-sans text-gray-900">
      {/* Top Header */}
      <header className="relative z-[320] border-b border-gray-100 bg-[#F8F0E4] px-4 py-3 sm:px-6 lg:px-8">
        <div className={`${dashboardShellClass} flex items-center justify-between gap-2 px-0 sm:gap-4`}>
          {/* Logo */}
          <div className="flex min-w-0 items-center gap-2">
            <div className="max-w-[190px] truncate text-[22px] leading-none text-[#1f1f1f] sm:max-w-none sm:text-[34px]">
              <span className="font-serif">CustomFurnish</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div className="hidden md:block">
              <button
                type="button"
                onClick={() => {
                  setIsUsersMenuOpen(false);
                  setIsCategoriesMenuOpen(false);
                  setIsProductsMenuOpen(false);
                  setIsBlogMenuOpen(false);
                  router.push("/blog");
                }}
                className="rounded-md border-2 border-black px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-black shadow-sm transition-all hover:bg-black hover:text-white"
              >
                Blogs
              </button>
            </div>
            {userRole === "blogadmin" && (
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBlogMenuOpen((v) => !v);
                    setIsUsersMenuOpen(false);
                    setIsCategoriesMenuOpen(false);
                    setIsProductsMenuOpen(false);
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-wider text-gray-700"
                >
                  Blog
                  <svg className="ml-2 inline-block" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                {isBlogMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full right-0 z-[360] mt-10 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsBlogMenuOpen(false);
                        router.push("/blog/create");
                      }}
                      className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                    >
                      Create Blog
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBlogMenuOpen(false);
                        router.push("/portfolio/create");
                      }}
                      className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                    >
                      Create Portfolio
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBlogMenuOpen(false);
                        router.push("/trending/create");
                      }}
                      className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                    >
                      Create Trending
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBlogMenuOpen(false);
                        router.push("/blog/manage");
                      }}
                      className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                    >
                      Manage Blogs
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBlogMenuOpen(false);
                        router.push("/trending/manage");
                      }}
                      className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                    >
                      Manage Trending
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBlogMenuOpen(false);
                        router.push("/blog");
                      }}
                      className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                    >
                      View Blog
                    </button>
                  </div>
                )}
              </div>
            )}
            {userRole === "admin" && (
                <>
                  <div className="relative hidden md:block">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsUsersMenuOpen((v) => !v);
                        setIsCategoriesMenuOpen(false);
                        setIsProductsMenuOpen(false);
                        setIsBlogMenuOpen(false);
                      }}
                      className="rounded-md border-2 border-black px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-black shadow-sm hover:bg-black hover:text-white transition-all"
                    >
                      Users
                      <svg className="ml-2 inline-block" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    {isUsersMenuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-full right-0 z-[360] mt-10 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setIsUsersMenuOpen(false);
                            router.push("/users");
                          }}
                          className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                        >
                          Manage Users
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUsersMenuOpen(false);
                            closeAdminActionModals();
                            setIsCreateModalOpen(true);
                          }}
                          className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                        >
                          Create User
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative hidden md:block">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCategoriesMenuOpen((v) => !v);
                        setIsUsersMenuOpen(false);
                        setIsProductsMenuOpen(false);
                        setIsBlogMenuOpen(false);
                      }}
                      className="rounded-md border-2 border-[#4d2c1e] px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#4d2c1e] shadow-sm hover:bg-[#4d2c1e] hover:text-white transition-all"
                    >
                      Categories
                      <svg className="ml-2 inline-block" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    {isCategoriesMenuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-full right-0 z-[360] mt-10 w-64 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setIsCategoriesMenuOpen(false);
                            router.push("/categories");
                          }}
                          className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                        >
                          Manage Categories
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCategoriesMenuOpen(false);
                            router.push("/subcategories");
                          }}
                          className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                        >
                          Manage Subcategories
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCategoriesMenuOpen(false);
                            router.push("/tags");
                          }}
                          className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                        >
                          Manage Tags
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCategoriesMenuOpen(false);
                            router.push("/design-cf/manage");
                          }}
                          className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                        >
                          Manage Design CF
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCategoriesMenuOpen(false);
                            closeAdminActionModals();
                            setIsCategoryModalOpen(true);
                          }}
                          className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                        >
                          Create Category
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCategoriesMenuOpen(false);
                            closeAdminActionModals();
                            setIsBindCategoriesOpen(true);
                            setBindError("");
                            setBindMsg("");
                          }}
                          className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                        >
                          Bind Subcategories
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCategoriesMenuOpen(false);
                            closeAdminActionModals();
                            setIsProductTagsOpen(true);
                            setProductTagError("");
                            setProductTagMsg("");
                          }}
                          className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                        >
                          Link/Delink Tags
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative hidden md:block">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProductsMenuOpen((v) => !v);
                        setIsUsersMenuOpen(false);
                        setIsCategoriesMenuOpen(false);
                        setIsBlogMenuOpen(false);
                      }}
                      className="rounded-md bg-[#0468a3] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white shadow-sm hover:opacity-95"
                    >
                      Products
                      <svg className="ml-2 inline-block" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    {isProductsMenuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-full right-0 z-[360] mt-10 w-60 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setIsProductsMenuOpen(false);
                            closeAdminActionModals();
                            setIsProductModalOpen(true);
                            setProductError("");
                            setProductMsg("");
                            setCreateProductImageFiles([]);
                            setCreatedProductImages([]);
                            setCreateSelectedCategoryIds(new Set());
                            setCreateSelectedTagIds(new Set());
                            setIsCreateCategoriesDropdownOpen(false);
                            setIsCreateTagsDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                        >
                          Create Product
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsProductsMenuOpen(false);
                            closeAdminActionModals();
                            setIsUploadImageModalOpen(true);
                          }}
                          className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                        >
                          Upload Image
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsProductsMenuOpen(false);
                            triggerBulkUploadPicker();
                          }}
                          className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                        >
                          Bulk Upload
                        </button>
                      </div>
                    )}
                  </div>
                </>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNotificationsOpen((v) => !v);
                }}
                className="relative"
                aria-label="Open notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.674C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
                  {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                </span>
              </button>
              {isNotificationsOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-[340px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg z-[350]"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <div className="text-[11px] font-black uppercase tracking-widest text-gray-600">
                      Notifications
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                        disabled={unreadNotificationsCount <= 0 || isMarkingAllNotificationsRead}
                        className="text-[10px] font-black uppercase tracking-widest text-[#0468a3] disabled:cursor-not-allowed disabled:text-gray-300"
                      >
                        {isMarkingAllNotificationsRead ? "Marking..." : "Mark all read"}
                      </button>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {unreadNotificationsCount} unread
                      </div>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {isLoadingNotifications ? (
                      <div className="px-4 py-6 text-center text-xs font-bold text-gray-500">Loading notifications...</div>
                    ) : notificationsError ? (
                      <div className="px-4 py-6 text-center text-xs font-bold text-red-600">{notificationsError}</div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs font-bold text-gray-500">No notifications yet.</div>
                    ) : (
                      notifications.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNotificationClick(item)}
                          className={`w-full border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 ${item.isRead ? "bg-white" : "bg-[#fffaf0]"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className={`text-xs leading-5 ${item.isRead ? "text-gray-700" : "font-semibold text-gray-900"}`}>
                              {item.message}
                            </p>
                            {!item.isRead && <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#0468a3]" />}
                          </div>
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {formatNotificationTime(item.createdAt)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (userRole !== "customer") return;
                setIsShortlistOpen((v) => !v);
              }}
              className="relative"
              aria-label="Open shortlist"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                {userRole === "customer" ? shortlistItems.length : 0}
              </span>
            </button>
             {/* Profile/Menu (Mobile replacement for logout) */}
             {userName ? (
               <button 
                  onClick={handleLogout}
                  className="ml-2 flex flex-col items-center justify-center"
               >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-[#ffcb05]">
                      {userName.charAt(0)}
                  </div>
                  <span className="mt-0.5 hidden text-[10px] font-bold uppercase sm:block">{isLoggingOut ? "..." : "Logout"}</span>
               </button>
             ) : (
               <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="ml-2 rounded-md border border-[#0468a3] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#0468a3] shadow-sm transition-all hover:bg-[#0468a3] hover:text-white"
               >
                  Login
               </button>
             )}
          </div>
        </div>
      </header>

      {userRole === "admin" && (
        <div className="relative z-[315] border-b border-gray-100 bg-[#F8F0E4] px-3 py-2 md:hidden">
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUsersMenuOpen((v) => !v);
                  setIsCategoriesMenuOpen(false);
                  setIsProductsMenuOpen(false);
                  setIsBlogMenuOpen(false);
                }}
                className="flex w-full items-center justify-center gap-1 rounded-md border-2 border-black px-2 py-2 text-[10px] font-black uppercase tracking-wider text-black shadow-sm"
              >
                Users
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {isUsersMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 right-0 z-[320] mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsUsersMenuOpen(false);
                      router.push("/users");
                    }}
                    className="w-full px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                  >
                    Manage Users
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUsersMenuOpen(false);
                      closeAdminActionModals();
                      setIsCreateModalOpen(true);
                    }}
                    className="w-full px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                  >
                    Create User
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCategoriesMenuOpen((v) => !v);
                  setIsUsersMenuOpen(false);
                  setIsProductsMenuOpen(false);
                  setIsBlogMenuOpen(false);
                }}
                className="flex w-full items-center justify-center gap-1 rounded-md border-2 border-[#4d2c1e] px-2 py-2 text-[10px] font-black uppercase tracking-wider text-[#4d2c1e] shadow-sm"
              >
                Categories
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {isCategoriesMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 right-0 z-[320] mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoriesMenuOpen(false);
                      router.push("/categories");
                    }}
                    className="w-full px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                  >
                    Manage Categories
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoriesMenuOpen(false);
                      router.push("/subcategories");
                    }}
                    className="w-full px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                  >
                    Manage Subcategories
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoriesMenuOpen(false);
                      router.push("/tags");
                    }}
                    className="w-full px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                  >
                    Manage Tags
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoriesMenuOpen(false);
                      closeAdminActionModals();
                      setIsCategoryModalOpen(true);
                    }}
                    className="w-full px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                  >
                    Create Category
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoriesMenuOpen(false);
                      closeAdminActionModals();
                      setIsBindCategoriesOpen(true);
                      setBindError("");
                      setBindMsg("");
                    }}
                    className="w-full px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                  >
                    Bind Subcategories
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoriesMenuOpen(false);
                      closeAdminActionModals();
                      setIsProductTagsOpen(true);
                      setProductTagError("");
                      setProductTagMsg("");
                    }}
                    className="w-full px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                  >
                    Link/Delink Tags
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProductsMenuOpen((v) => !v);
                  setIsUsersMenuOpen(false);
                  setIsCategoriesMenuOpen(false);
                  setIsBlogMenuOpen(false);
                }}
                className="flex w-full items-center justify-center gap-1 rounded-md bg-[#0468a3] px-2 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-sm"
              >
                Products
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {isProductsMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 right-0 z-[320] mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsProductsMenuOpen(false);
                      closeAdminActionModals();
                      setIsProductModalOpen(true);
                      setProductError("");
                      setProductMsg("");
                      setCreateProductImageFiles([]);
                      setCreatedProductImages([]);
                      setCreateSelectedCategoryIds(new Set());
                      setCreateSelectedTagIds(new Set());
                      setIsCreateCategoriesDropdownOpen(false);
                      setIsCreateTagsDropdownOpen(false);
                    }}
                    className="w-full px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                  >
                    Create Product
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProductsMenuOpen(false);
                      closeAdminActionModals();
                      setIsUploadImageModalOpen(true);
                    }}
                    className="w-full px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                  >
                    Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProductsMenuOpen(false);
                      triggerBulkUploadPicker();
                    }}
                    className="w-full px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                  >
                    {isBulkUploadingProducts ? "Uploading..." : "Bulk Upload"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav
        className="relative z-[210] text-white"
        style={{
          background:
            "linear-gradient(90deg, #8A6A3A 0%, #A9844F 25%, #C9A46A 50%, #B8925A 75%, #7A5C2E 100%)",
        }}
        onMouseLeave={() => setActiveMenuCategoryId(null)}
      >
        <div
          className={`${dashboardShellClass} flex items-center justify-center gap-8 py-2.5 text-[16px] font-semibold leading-6 overflow-x-auto whitespace-nowrap scrollbar-hide`}
        >
          {resolvedMenuCategories.map((category) => {
            const hasFlyout =
              category.products.length > 0 || category.children.length > 0;
            return (
              <div
                key={category.id}
                onMouseEnter={() => setActiveMenuCategoryId(category.id)}
                className="flex-shrink-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (category.slug) {
                      router.push(`/categories/${category.slug}`);
                    }
                  }}
                  className="flex items-center gap-1 hover:text-[#ffcb05]"
                >
                  {toTitleCase(category.name)}
                  {hasFlyout && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {activeMenuCategory && (
          <div className="absolute left-0 right-0 top-full z-[260] hidden border-t border-[#e6dccd] bg-[#F8F0E4] text-gray-900 shadow-2xl md:block">
            <div className={`${dashboardShellClass} py-4`}>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-[#AE8953]" />
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#977543]">
                  {toTitleCase(activeMenuCategory.name)}
                </div>
              </div>
              <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {activeMenuCategory.products.length > 0 && (
                  <div className="rounded-xl border border-[#eadfce] bg-white p-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#977543]">
                      Featured Products
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {activeMenuCategory.products.map((product) => (
                        <a
                          key={product.id}
                          href={product.slug ? `/products/${product.slug}` : "#"}
                          className="block rounded-md px-2 py-1.5 text-xs font-medium text-[#5f4b2e] hover:bg-[#f7f0e4] hover:text-[#8f6a33]"
                        >
                          {toTitleCase(product.name)}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {activeMenuCategory.children.map((child) => (
                  <div key={child.id} className="rounded-xl border border-[#eadfce] bg-white p-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#8f6a33]">
                      {toTitleCase(child.name)}
                    </div>
                    {child.products.length > 0 ? (
                      <div className="mt-2 space-y-1.5">
                        {child.products.map((product) => (
                          <a
                            key={product.id}
                            href={product.slug ? `/products/${product.slug}` : "#"}
                            className="block rounded-md px-2 py-1.5 text-xs font-medium text-[#5f4b2e] hover:bg-[#f7f0e4] hover:text-[#8f6a33]"
                          >
                            {toTitleCase(product.name)}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-gray-400">No products available.</div>
                    )}
                  </div>
                ))}
              </div>

              {!isLoadingMenuCategories &&
                activeMenuCategory.products.length === 0 &&
                activeMenuCategory.children.length === 0 && (
                  <div className="mt-3 text-xs text-gray-500">
                    No products mapped to this category yet.
                  </div>
                )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="w-full">
          <div className="relative bg-[url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=2600&auto=format&fit=crop')] bg-cover bg-center h-[280px] lg:h-[450px] 2xl:h-[520px]">
             {/* Overlay for text readability */}
             <div className="absolute inset-0 bg-gradient-to-r from-[#4d2c1e]/60 to-transparent flex items-center p-8 lg:p-20">
                <div className="max-w-xl text-white">
                   <div className="flex items-center gap-2 mb-4">
                      <div className="h-0.5 w-8 bg-[#ffcb05]" />
                      <span className="text-xl italic font-serif leading-none tracking-wide">Newly Launched</span>
                      <div className="h-0.5 w-8 bg-[#ffcb05]" />
                   </div>
                   <h2 className="text-4xl lg:text-7xl font-black uppercase italic leading-tight tracking-tighter">
                      का​री​गरी
                   </h2>
                   <p className="text-2xl lg:text-5xl font-black uppercase mt-2 tracking-tight">
                    Laminate Collection
                   </p>
                   <p className="mt-4 text-xs lg:text-lg font-medium opacity-90 italic">
                    Celebration of <span className="font-bold">Faith, Folklore & Creativity</span>
                   </p>
                </div>
             </div>

          </div>
        </div>
      </section>

      <section className={`${dashboardShellClass} pt-10 pb-7`}>
        <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-left text-[30px] font-bold leading-[38px] tracking-normal text-[#977543] sm:text-[32px] sm:leading-[40px] md:ml-[70px]">
            Shop Interior Materials by Category
          </h3>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => scrollCategoryTiles("left")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#9f7a47] text-white"
              aria-label="Scroll category tiles left"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button
              type="button"
              onClick={() => scrollCategoryTiles("right")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#9f7a47] text-white"
              aria-label="Scroll category tiles right"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        <div
          ref={categoryTilesScrollRef}
          className="flex w-full gap-3 overflow-x-auto pb-1 pr-2 scrollbar-hide md:ml-[70px] md:w-[calc(100%-70px)]"
        >
          {(menuCategories.length > 0 ? menuCategories : resolvedMenuCategories).map(
            (category, index) => (
              <button
                type="button"
                key={`tile-${category.id}`}
                onClick={() => {
                  if (category.slug) router.push(`/categories/${category.slug}`);
                }}
                className="w-[203px] flex-shrink-0"
              >
                <div className="overflow-hidden rounded-[16px] border border-white bg-white shadow-sm">
                  <div className="relative h-[203px] w-[203px] bg-[#eadfcf]">
                    <Image
                      src={CATEGORY_TILE_IMAGES[index % CATEGORY_TILE_IMAGES.length]}
                      alt={category.name}
                      fill
                      sizes="203px"
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="mt-2 text-center text-sm font-medium text-[#977543]">
                  {toTitleCase(category.name)}
                </div>
              </button>
            ),
          )}
        </div>
      </section>

      <section
        className="py-12 lg:py-14"
        style={{
          background:
            "linear-gradient(90deg, #8A6A3A 0%, #A9844F 25%, #C9A46A 50%, #B8925A 75%, #7A5C2E 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-[1600px] px-10 sm:px-12 lg:px-16 2xl:px-20">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-[36px] font-bold leading-[40px] tracking-normal text-white">
                Trending Designs
              </h3>
              <p className="mt-3 text-sm text-white/90">
                Get inspired by the latest styles loved by modern homeowners.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/trending/manage")}
              className="text-[14px] font-medium text-white"
            >
              View All Designs
            </button>
          </div>

          {trendingDesignsError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600">
              {trendingDesignsError}
            </div>
          )}

          {isLoadingTrendingDesigns ? (
            <div className="rounded-xl bg-white/20 p-4 text-sm text-white">
              Loading trending designs...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trendingCards.map((trending, idx) => {
                  const imageUrl = trending
                    ? buildProductImageUrl(trending.imageUrl ?? trending.s3Key ?? "")
                    : "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop";
                  const title = truncateText(trending?.title || "Modern Minimalist Kitchen", 16);
                  const tag = trending?.styleTag || "Kitchen";

                  return (
                    <article
                      key={trending?.id ?? `trending-placeholder-${idx}`}
                      className="h-[430px] w-full max-w-[360px] overflow-hidden rounded-2xl border border-white bg-white p-2.5 shadow-sm"
                    >
                      <div className="relative h-[312px] w-full overflow-hidden rounded-[14px] bg-[#eadfcf]">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            sizes="(max-width: 1024px) 50vw, 360px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs font-semibold text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <span className="inline-flex rounded-sm bg-[#E8D4AE] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#977543]">
                          {tag}
                        </span>
                        <div className="mt-1 line-clamp-2 text-[26px] font-semibold leading-[40px] tracking-normal text-[#977543]">
                          {title}
                        </div>
                      </div>
                    </article>
                  );
                })}
            </div>
          )}
        </div>
      </section>

      <section className={`${dashboardShellClass} bg-[#F8F0E4] py-10 lg:py-12`}>
        <h3 className="text-center text-[36px] font-bold leading-[40px] text-[#977543]">
          Why Choose CustomFurnish?
        </h3>
        <div className="mx-auto mt-8 grid max-w-[1320px] grid-cols-1 gap-y-7 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3 lg:gap-x-14">
          {[
            {
              title: "Wide Product Range",
              subtitle: "Explore 10,000+ interior materials across categories",
              icon: "list",
            },
            {
              title: "Curated by Designers",
              subtitle: "Handpicked collections by industry experts",
              icon: "list",
            },
            {
              title: "Quality Assured",
              subtitle: "Every product is tested for durability & finish",
              icon: "spark",
            },
            {
              title: "Easy Comparison",
              subtitle: "Compare materials, textures & pricing easily",
              icon: "wave",
            },
            {
              title: "Fast Delivery",
              subtitle: "Get materials delivered within 10 days",
              icon: "spark",
            },
            {
              title: "End-to-End Support",
              subtitle: "From selection to execution — we guide you",
              icon: "spark",
            },
          ].map((feature, index) => (
            <article
              key={`${feature.title}-${index}`}
              className="flex min-h-[96px] items-center gap-5"
            >
              <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full bg-[#AC8852] text-white">
                {feature.icon === "wave" ? (
                  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M3 7c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2" />
                    <path d="M3 12c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2" />
                    <path d="M3 17c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2" />
                  </svg>
                ) : feature.icon === "spark" ? (
                  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <circle cx="12" cy="12" r="2.2" />
                    <path d="M12 3.5v3M12 17.5v3M20.5 12h-3M6.5 12h-3M17.8 6.2l-2.1 2.1M8.3 15.7l-2.1 2.1M17.8 17.8l-2.1-2.1M8.3 8.3 6.2 6.2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M6 6v12h12" />
                    <path d="M10 6v8h8" />
                  </svg>
                )}
              </div>
              <div className="flex h-[96px] w-[303px] flex-col justify-center">
                <h4 className="text-[26px] font-semibold leading-[34px] text-[#977543]">{feature.title}</h4>
                <p className="mt-1 text-[13px] leading-[18px] text-[#977543]">{feature.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="py-12 lg:py-14"
        style={{
          background:
            "linear-gradient(90deg, #8A6A3A 0%, #A9844F 25%, #C9A46A 50%, #B8925A 75%, #7A5C2E 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-[1600px] px-10 sm:px-12 lg:px-16 2xl:px-20">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-[36px] font-bold leading-[40px] tracking-normal text-white">
                Latest Products
              </h3>
              <p className="mt-3 text-sm text-white/90">
                Get inspired by the latest styles loved by modern homeowners.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/products")}
              className="text-[14px] font-medium text-white"
            >
              View All Products
            </button>
          </div>

          {isLoadingLatestProducts ? (
            <div className="rounded-xl bg-white/20 p-4 text-sm text-white">
              Loading latest products...
            </div>
          ) : (
            <div className="grid grid-cols-1 justify-items-center gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
              {latestProductCards.map((product, idx) => {
                const imageUrl =
                  (product ? inlineProductImageUrl(product) : null) ||
                  CATEGORY_TILE_IMAGES[idx % CATEGORY_TILE_IMAGES.length];
                const title = product?.name || "Modern Minimalist Kitchen";
                const displayTitle = title.length > 16 ? `${title.slice(0, 16)}...` : title;
                const label = toTitleCase(product?.materialType || "Kitchen");

                return (
                  <article
                    key={product?.id ?? `latest-product-${idx}`}
                    role={product?.slug ? "button" : undefined}
                    tabIndex={product?.slug ? 0 : undefined}
                    onClick={() => {
                      if (product?.slug) router.push(`/products/${product.slug}`);
                    }}
                    onKeyDown={(e) => {
                      if (!product?.slug) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/products/${product.slug}`);
                      }
                    }}
                    className={`min-h-[410px] w-full max-w-[340px] overflow-hidden rounded-2xl border border-white bg-white p-2.5 shadow-sm ${
                      product?.slug ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8A6A3A] focus:ring-offset-2" : ""
                    }`}
                  >
                    <div className="relative h-[296px] w-full overflow-hidden rounded-[14px] bg-[#eadfcf]">
                      <Image src={imageUrl} alt={title} fill sizes="(max-width: 1024px) 50vw, 340px" className="object-cover" />
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex rounded-sm bg-[#E8D4AE] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#977543]">
                        {label}
                      </span>
                      <div className="mt-1 text-[24px] font-semibold leading-[30px] tracking-normal text-black">
                        {displayTitle}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#F8F0E4] py-12">
        <div className="mx-auto w-full max-w-[1600px] px-10 sm:px-12 lg:px-16 2xl:px-20">
          <div className="mx-auto max-w-[1449px] text-center">
          <h3 className="text-[36px] font-bold leading-[40px] text-[#977543]">Designs done by CustomFurnish</h3>
          <p className="mt-2 text-sm text-[#8B6E46]">
            See how we transform spaces into beautiful homes.
          </p>
          </div>
          {designCfEntriesError && (
            <div className="mx-auto mt-4 max-w-[1449px] rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600">
              {designCfEntriesError}
            </div>
          )}
          <div className="mx-auto mt-8 flex w-full max-w-[1449px] flex-wrap justify-center gap-5 lg:flex-nowrap">
          {isLoadingDesignCfEntries ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={`design-cf-loading-${idx}`}
                className="h-[320px] w-[248px] animate-pulse rounded-[28px] bg-[#d8ccbb]"
              />
            ))
          ) : (
          showcaseDesignCards.map((product, idx) => {
            const imageUrl = CATEGORY_TILE_IMAGES[idx % CATEGORY_TILE_IMAGES.length];
            const showcaseLabels = [
              "Bed Room Design",
              "Kitchen Design",
              "Living Room Design",
              "Dining Room Design",
              "Puja Room Design",
            ] as const;
            const label = (product?.title || showcaseLabels[idx] || "Design").trim();
            const cardImageUrl = product?.coverImageUrl || imageUrl;

            return (
              <article
                key={product?.id ?? `cf-design-${idx}`}
                className={`h-[320px] w-[248px] overflow-hidden rounded-[28px] bg-[#585858] shadow-[0_6px_14px_rgba(0,0,0,0.18)] ${
                  product?.id ? "cursor-pointer" : ""
                }`}
                onClick={() => {
                  if (!product?.id) return;
                  router.push(`/design-cf/${encodeURIComponent(product.id)}`);
                }}
              >
                <div className="relative h-[285px] w-full overflow-hidden rounded-t-[28px] bg-[#eadfcf]">
                  <Image src={cardImageUrl} alt={label} fill sizes="248px" className="object-cover" />
                </div>
                <div className="flex h-[37px] items-center justify-center bg-[#AE8953]">
                  <span className="text-[18px] font-medium leading-none text-white">{label}</span>
                </div>
              </article>
            );
          })
          )}
          </div>
        </div>
      </section>

      <section className="bg-[#F8F0E4] pb-16">
        <div className={`${dashboardShellClass} px-4 sm:px-0`}>
          <div className="flex items-center justify-between">
            <h3 className="ml-[60px] text-[36px] font-bold leading-[40px] text-[#977543]">
              Relevant Articles
            </h3>
            <div className="mr-[80px] hidden items-center gap-2 md:flex">
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-[#AE8953] text-white"
                aria-label="Previous relevant article"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-[#AE8953] text-white"
                aria-label="Next relevant article"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-5">
            {isLoadingLatestBlogs ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={`relevant-article-loading-${idx}`}
                  className="h-[332px] w-full max-w-[280px] animate-pulse rounded-[18px] bg-[#d8ccbb]"
                />
              ))
            ) : latestBlogs.length === 0 ? (
              <div className="w-full text-center text-sm text-[#8B6E46]">
                {latestBlogsError || "No relevant articles available right now."}
              </div>
            ) : (
              latestBlogs.map((blog, idx) => {
                const imageUrl = makeBlogImageUrl(blog) || CATEGORY_TILE_IMAGES[idx % CATEGORY_TILE_IMAGES.length];
                const articleTitle = (blog.title || "Blog").trim() || "Blog";
                const displayTitle = articleTitle.length > 26 ? `${articleTitle.slice(0, 23)}...` : articleTitle;
                const blogSlug = (blog.slug || "").trim();
                return (
                  <article
                    key={blog.id || `relevant-article-${idx}`}
                    className={`w-full max-w-[280px] overflow-hidden rounded-[18px] bg-[#585858] shadow-[0_6px_14px_rgba(0,0,0,0.18)] ${
                      blogSlug ? "cursor-pointer" : ""
                    }`}
                    onClick={() => {
                      if (!blogSlug) return;
                      router.push(`/blog/${encodeURIComponent(blogSlug)}`);
                    }}
                  >
                    <div className="relative h-[270px] w-full">
                      <Image
                        src={imageUrl}
                        alt={blog.title || "Relevant article"}
                        fill
                        loading={idx === 0 ? "eager" : "lazy"}
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-center bg-[#AE8953] px-3 py-2.5">
                      <span className="text-center text-[18px] font-medium leading-tight text-white">{displayTitle}</span>
                    </div>
                    <div className="flex items-center justify-center bg-[#262626] py-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!blogSlug) return;
                          router.push(`/blog/${encodeURIComponent(blogSlug)}`);
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-[#AE8953] px-5 py-1 text-[11px] font-medium text-white"
                      >
                        Read Now
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M5 12h14" />
                          <path d="m13 6 6 6-6 6" />
                        </svg>
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      {Boolean(userName) && userRole !== "customer" && (
        <>
          {/* Product Section Intro */}
          <section className={dashboardShellClass}>
            <div className="py-8">
             <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center gap-1 rounded-full bg-white border border-gray-200 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-gray-500 shadow-sm">
                    <div className="h-1 w-1 rounded-full bg-[#ffcb05]" />
                    Newly Launched
                    <div className="h-1 w-1 rounded-full bg-[#ffcb05]" />
                </span>
             </div>
             <h3 className="text-3xl lg:text-4xl font-black uppercase italic tracking-tighter">
                Karigari Laminates
             </h3>
            </div>
          </section>
        </>
      )}

      {userRole === "designer" && (
        <section className={`${dashboardShellClass} relative z-[30] bg-[#F8F0E4]`}>
          <div className="pb-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Designer</div>
              <h3 className="mt-1 text-2xl font-black uppercase tracking-tight text-black">My Customers</h3>
              <p className="mt-1 text-sm text-gray-500">Customers assigned to your designer account.</p>
            </div>
            <div className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-gray-700 shadow-sm">
              {designerCustomers.length} Customers
            </div>
          </div>

          {designerCustomersError && (
            <div className="mb-6 rounded-lg bg-red-50 p-3 text-center text-xs font-bold text-red-600">
              {designerCustomersError}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {isLoadingDesignerCustomers ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="h-4 w-1/3 rounded bg-gray-100" />
                  <div className="mt-4 h-6 w-2/3 rounded bg-gray-100" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-gray-100" />
                  <div className="mt-6 h-20 rounded bg-gray-100" />
                </div>
              ))
            ) : designerCustomers.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
                No customers assigned to this designer.
              </div>
            ) : (
              designerCustomers.map((customer) => (
                <div key={customer.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4d2c1e] text-sm font-black uppercase text-[#ffde59]">
                        {customer.name?.charAt(0) || "C"}
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          {customer.role}
                        </div>
                        <div className="mt-1 text-base font-black text-gray-900">
                          {customer.name}
                        </div>
                      </div>
                    </div>
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                        customer.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      ].join(" ")}
                    >
                      {customer.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-gray-700">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</div>
                      <div className="mt-1 break-all font-medium text-gray-900">{customer.email}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Project</div>
                        <div className="mt-1 font-medium text-gray-900">{customer.projectName || "-"}</div>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Joined</div>
                        <div className="mt-1 font-medium text-gray-900">{new Date(customer.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Assigned Designer</div>
                      <div className="mt-1 font-medium text-gray-900">
                        {customer.assignedDesigner?.name || "-"}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenDesignerCustomerDetails(customer.id)}
                        className="rounded-full bg-black px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        </section>
      )}

      {Boolean(userName) && userRole !== "customer" && (
        <section className={dashboardShellClass}>
          <div className="pb-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black uppercase tracking-tight text-black">All Products</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProductsPage((p) => Math.max(1, p - 1))}
                  disabled={isLoadingProducts || productsPage <= 1}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-gray-700 shadow-sm disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setProductsPage((p) => p + 1)}
                  disabled={isLoadingProducts || products.length < productsLimit}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-gray-700 shadow-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
              <aside className="relative z-10 rounded-2xl border border-[#d5c7b1] bg-[#e7ded1] p-5 shadow-sm">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8b6b45]">Filter</div>
                <div className="mt-1 text-[28px] font-black uppercase leading-none tracking-tight text-[#3d4f67]">Finishes</div>
                <div className="mt-4 space-y-3">
                  <input
                    value={filterQ}
                    onChange={(e) => setFilterQ(e.target.value)}
                    placeholder="Search name/sku/brand"
                    className="w-full rounded-md border border-[#cbbca6] bg-white px-3 py-2 text-sm"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) =>
                      setFilterStatus(
                        e.target.value === "active" ? "active" : e.target.value === "draft" ? "draft" : e.target.value === "archived" ? "archived" : ""
                      )
                    }
                    className="w-full rounded-md border border-[#cbbca6] bg-white px-3 py-2 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                  <select
                    value={filterCategoryType}
                    onChange={(e) => setFilterCategoryType((e.target.value === "material" ? "material" : e.target.value === "furniture" ? "furniture" : ""))}
                    className="w-full rounded-md border border-[#cbbca6] bg-white px-3 py-2 text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="material">Material</option>
                    <option value="furniture">Furniture</option>
                  </select>
                  <select
                    value={productsLimit}
                    onChange={(e) => setProductsLimit(Number(e.target.value))}
                    className="w-full rounded-md border border-[#cbbca6] bg-white px-3 py-2 text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>

                  <div className="rounded-xl border border-[#cbbca6] bg-[#f4eee5] p-3">
                    <div className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#8b6b45]">Category</div>
                    <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedParentCategoryId("");
                          setFilterCategoryId("");
                        }}
                        className={[
                          "w-full rounded-lg px-2 py-1.5 text-left text-xs font-bold transition",
                          !selectedParentCategoryId ? "bg-black text-white" : "bg-white text-gray-700 hover:bg-gray-100",
                        ].join(" ")}
                      >
                        All Categories
                      </button>
                      {topLevelCategories
                        .filter((category) => (filterCategoryType ? category.type === filterCategoryType : true))
                        .map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => {
                              setSelectedParentCategoryId(category.id);
                              setFilterCategoryId("");
                            }}
                            className={[
                              "w-full rounded-lg px-2 py-1.5 text-left text-xs font-bold transition",
                              selectedParentCategoryId === category.id ? "bg-black text-white" : "bg-white text-gray-700 hover:bg-gray-100",
                            ].join(" ")}
                          >
                            {category.name}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="mt-2 border-t border-[#cbbca6] pt-4">
                    <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8b6b45]">Brand</div>
                    <div className="mt-3 max-h-32 space-y-2 overflow-y-auto pr-1">
                      {availableBrandFilters.length === 0 ? (
                        <div className="text-xs text-gray-400">No brand options</div>
                      ) : (
                        availableBrandFilters.map((brand) => (
                          <label key={brand} className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3d4f67]">
                            <input
                              type="checkbox"
                              checked={filterBrands.has(brand)}
                              onChange={() => toggleSetFilterValue(setFilterBrands, brand)}
                              className="h-4 w-4 rounded-[3px] border border-[#8f8a80] bg-white accent-[#3d4f67]"
                            />
                            <span className="truncate">{brand}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-2 border-t border-[#cbbca6] pt-4">
                    <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8b6b45]">Thickness</div>
                    <div className="mt-3 max-h-32 space-y-2 overflow-y-auto pr-1">
                      {availableThicknessFilters.length === 0 ? (
                        <div className="text-xs text-gray-400">No thickness options</div>
                      ) : (
                        availableThicknessFilters.map((thickness) => (
                          <label key={thickness} className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3d4f67]">
                            <input
                              type="checkbox"
                              checked={filterThicknesses.has(thickness)}
                              onChange={() => toggleSetFilterValue(setFilterThicknesses, thickness)}
                              className="h-4 w-4 rounded-[3px] border border-[#8f8a80] bg-white accent-[#3d4f67]"
                            />
                            <span className="truncate">{thickness}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-2 border-t border-[#cbbca6] pt-4">
                    <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8b6b45]">Color</div>
                    <div className="mt-3 max-h-32 space-y-2 overflow-y-auto pr-1">
                      {availableColorFilters.length === 0 ? (
                        <div className="text-xs text-gray-400">No color options</div>
                      ) : (
                        availableColorFilters.map((color) => (
                          <label key={color} className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3d4f67]">
                            <input
                              type="checkbox"
                              checked={filterColors.has(color)}
                              onChange={() => toggleSetFilterValue(setFilterColors, color)}
                              className="h-4 w-4 rounded-[3px] border border-[#8f8a80] bg-white accent-[#3d4f67]"
                            />
                            <span className="truncate">{color}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-2 border-t border-[#cbbca6] pt-4">
                    <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8b6b45]">Include</div>
                    <div className="mt-3 space-y-2">
                      <label className="flex items-center gap-2.5 text-sm text-[#3d4f67]">
                        <input
                          type="checkbox"
                          checked={filterIncludeImages}
                          onChange={(e) => setFilterIncludeImages(e.target.checked)}
                          className="h-4 w-4 rounded-[3px] border border-[#8f8a80] bg-white accent-[#3d4f67]"
                        />
                        Images
                      </label>
                      <label className="flex items-center gap-2.5 text-sm text-[#3d4f67]">
                        <input
                          type="checkbox"
                          checked={filterIncludeCategories}
                          onChange={(e) => setFilterIncludeCategories(e.target.checked)}
                          className="h-4 w-4 rounded-[3px] border border-[#8f8a80] bg-white accent-[#3d4f67]"
                        />
                        Categories
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={applyProductFilters}
                    disabled={isLoadingProducts}
                    className="w-full rounded-md border-2 border-black px-3 py-2 text-[11px] font-black uppercase tracking-wider text-black shadow-sm transition-all hover:bg-black hover:text-white disabled:opacity-50"
                  >
                    {isLoadingProducts ? "Loading..." : "Apply"}
                  </button>
                </div>
              </aside>

              <div className="relative z-10 min-w-0">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sub-Category</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFilterCategoryId("")}
                      className={[
                        "rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition",
                        !filterCategoryId ? "border-black bg-black text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
                      ].join(" ")}
                    >
                      All
                    </button>
                    {visibleSubcategories.map((subCategory) => (
                      <button
                        key={subCategory.id}
                        type="button"
                        onClick={() => setFilterCategoryId(subCategory.id)}
                        className={[
                          "rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition",
                          filterCategoryId === subCategory.id ? "border-black bg-black text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
                        ].join(" ")}
                      >
                        {subCategory.name}
                      </button>
                    ))}
                  </div>
                </div>
              

        {productsError && (
          <div className="mt-4 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">
            {productsError}
          </div>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {isLoadingProducts ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="aspect-[4/3] w-full bg-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-100 rounded" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded" />
                </div>
              </div>
            ))
          ) : visibleDashboardProducts.length === 0 ? (
            <div className="col-span-full text-center text-sm text-gray-500 py-10">No products found.</div>
          ) : (
            visibleDashboardProducts.map((p) => {
              const imageUrl = inlineProductImageUrl(p);
              const hasImage = Boolean(imageUrl);
              const statusClass =
                p.status === "draft"
                  ? "bg-gray-100 text-gray-700"
                  : p.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700";

              return (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/products/${p.slug}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") router.push(`/products/${p.slug}`);
                  }}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm cursor-pointer"
                >
                  <div className="relative aspect-[4/3] w-full bg-gray-100">
                    {hasImage ? (
                      <Image src={imageUrl as string} alt={p.name} fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-black uppercase tracking-widest text-gray-400">
                        No Image
                      </div>
                    )}

                    <div className="absolute left-3 right-24 top-3 flex flex-wrap items-center gap-2 overflow-hidden">
                      <span className={["inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest", statusClass].join(" ")}>
                        {p.status}
                      </span>
                      {userRole === "admin" && (
                        <select
                          value={p.status}
                          disabled={isUpdatingProductStatus && updatingProductStatusId === p.id}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleUpdateProductStatus(p.id, e.target.value);
                          }}
                          className="max-w-[120px] rounded-full border border-gray-200 bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-800"
                        >
                          {Array.from(new Set([p.status, ...allowedStatuses])).filter(Boolean).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      )}
                      <span
                        className={[
                          "inline-flex max-w-[100px] items-center truncate rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                          hasImage ? "bg-black text-white" : "bg-white text-gray-700 border border-gray-200"
                        ].join(" ")}
                      >
                        {hasImage ? "Image" : "No Image"}
                      </span>
                    </div>

                    {userRole === "admin" && (
                      <label
                        className="absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Select for bulk tag"
                        title="Select for bulk tag"
                      >
                        <input
                          type="checkbox"
                          checked={isSelectedForBulkTag(p.id)}
                          onChange={() => toggleBulkTagSelection(p.id)}
                          className="h-4 w-4 accent-[#A9844F]"
                        />
                      </label>
                    )}

                    {userRole === "admin" && (
                      <button
                        type="button"
                        disabled={isDeletingProduct}
                        className="absolute right-14 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-sm disabled:opacity-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(p.id);
                        }}
                        aria-label="Delete product"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                      </button>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{p.materialType}</div>
                    <div className="mt-1 font-black text-gray-900 leading-snug line-clamp-2">{p.name}</div>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-gray-600">
                      <span>SKU: {p.sku}</span>
                      {userRole !== "customer" ? <span>{p.brand}</span> : null}
                    </div>
                    <div className="mt-2 text-[11px] font-bold text-gray-500">{p.id}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {deleteProductError && (
          <div className="mt-3 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">
            {deleteProductError}
          </div>
        )}
        {userRole === "admin" && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                Bulk Tag: {bulkTagSelectedList.length} selected
              </div>
              <select
                value={bulkTagId}
                onChange={(e) => {
                  setBulkTagId(e.target.value);
                  setBulkTagError("");
                  setBulkTagMsg("");
                }}
                className="rounded-full border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-gray-800"
              >
                <option value="">Select tag</option>
                {allTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={visibleDashboardProductIds.length === 0}
                onClick={() => selectAllVisibleProducts(visibleDashboardProductIds)}
                className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-gray-800 shadow-sm disabled:opacity-50"
              >
                {allVisibleSelected ? "All Selected" : "Select All"}
              </button>
              <button
                type="button"
                disabled={bulkTagSelectedList.length === 0}
                onClick={() => deselectVisibleProducts(visibleDashboardProductIds)}
                className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-gray-800 shadow-sm disabled:opacity-50"
              >
                Deselect
              </button>
              <button
                type="button"
                disabled={bulkTagSelectedList.length === 0 || isBulkTagging || !bulkTagId}
                onClick={handleBulkTagApply}
                className="rounded-full bg-[#A9844F] px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-[#8A6A3A] disabled:opacity-50"
              >
                {isBulkTagging ? "Tagging..." : "Apply Selected Tag"}
              </button>
              <button
                type="button"
                disabled={bulkTagSelectedList.length === 0 || isDeletingProduct}
                onClick={handleBulkDeleteSelected}
                className="rounded-full bg-[#7a1f1f] px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-[#5f1717] disabled:opacity-50"
              >
                {isDeletingProduct ? "Deleting..." : "Delete Selected"}
              </button>
              <button
                type="button"
                disabled={bulkTagSelectedList.length === 0}
                onClick={clearBulkTagSelection}
                className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-gray-800 shadow-sm disabled:opacity-50"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
        {bulkTagError && (
          <div className="mt-3 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">
            {bulkTagError}
          </div>
        )}
        {bulkTagMsg && (
          <div className="mt-3 text-xs font-bold text-green-600 bg-green-50 p-3 rounded-lg text-center">
            {bulkTagMsg}
          </div>
        )}
        {deleteProductMsg && (
          <div className="mt-3 text-xs font-bold text-green-600 bg-green-50 p-3 rounded-lg text-center">
            {deleteProductMsg}
          </div>
        )}

        {updateProductStatusError && (
          <div className="mt-3 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">
            {updateProductStatusError}
          </div>
        )}
        {updateProductStatusMsg && (
          <div className="mt-3 text-xs font-bold text-green-600 bg-green-50 p-3 rounded-lg text-center">
            {updateProductStatusMsg}
          </div>
        )}

                <div className="mt-2 text-[11px] font-bold text-gray-500">Total: {productsTotal} • Page: {productsPage} • Limit: {productsLimit}</div>
              </div>
            </div>
          </div>
        </div>
        </section>
      )}

      {userRole === "customer" && isShortlistOpen && (
        <div
          className="fixed inset-0 z-[140] bg-black/40 backdrop-blur-sm"
          onClick={() => setIsShortlistOpen(false)}
        >
          <div
            className="absolute right-4 top-20 h-[calc(100vh-6rem)] w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-black">My Shortlist</h3>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  {shortlistItems.length} Saved
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShortlistOpen(false)}
                className="text-gray-400 hover:text-black"
                aria-label="Close shortlist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="h-[calc(100%-4.5rem)] overflow-y-auto p-4">
              {shortlistMsg && (
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-center text-xs font-bold text-green-600">
                  {shortlistMsg}
                </div>
              )}
              {shortlistError && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-xs font-bold text-red-600">
                  {shortlistError}
                </div>
              )}

              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                      Compare: {shortlistCompareSelectedList.length}/4 selected
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={shortlistCompareSelectedList.length < 2 || isComparing}
                        onClick={openShortlistCompare}
                        className="rounded-full bg-black px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-sm disabled:opacity-50"
                      >
                        {isComparing ? "Comparing..." : "Compare"}
                      </button>
                      <button
                        type="button"
                        disabled={shortlistCompareSelectedList.length === 0}
                        onClick={clearShortlistCompareSelection}
                        className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-800 shadow-sm disabled:opacity-50"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                {isLoadingShortlist ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                      <div className="aspect-[4/3] w-full bg-gray-100" />
                      <div className="space-y-2 p-4">
                        <div className="h-4 w-2/3 rounded bg-gray-100" />
                        <div className="h-3 w-1/2 rounded bg-gray-100" />
                        <div className="h-3 w-3/4 rounded bg-gray-100" />
                      </div>
                    </div>
                  ))
                ) : shortlistItems.length === 0 ? (
                  <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
                    No shortlist items found.
                  </div>
                ) : (
                  shortlistItems.map((item) => {
                    const shortlistedProduct = item.product ?? null;
                    const imageUrl = shortlistedProduct ? inlineProductImageUrl(shortlistedProduct) : null;
                    const productRecommendations = Array.isArray(item.recommendations)
                      ? item.recommendations
                      : [];
                    return (
                      <div
                        key={item.id}
                        role={shortlistedProduct?.slug ? "button" : undefined}
                        tabIndex={shortlistedProduct?.slug ? 0 : -1}
                        onClick={(e) => {
                          if (!shortlistedProduct?.slug) return;
                          if (isInteractiveTarget(e.target)) return;
                          setIsShortlistOpen(false);
                          router.push(`/products/${shortlistedProduct.slug}`);
                        }}
                        onKeyDown={(e) => {
                          if (!shortlistedProduct?.slug) return;
                          if (isInteractiveTarget(e.target)) return;
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setIsShortlistOpen(false);
                            router.push(`/products/${shortlistedProduct.slug}`);
                          }
                        }}
                        className={[
                          "overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm",
                          shortlistedProduct?.slug ? "cursor-pointer" : ""
                        ].join(" ")}
                      >
                        <div className="relative aspect-[4/3] w-full bg-gray-100">
                          {imageUrl ? (
                            <Image src={imageUrl} alt={shortlistedProduct?.name || "Shortlisted product"} fill sizes="(max-width: 768px) 100vw, 28rem" className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-black uppercase tracking-widest text-gray-400">
                              No Image
                            </div>
                          )}
                          <div className="absolute left-3 top-3 flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-black px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                              {item.sampleStatus}
                            </span>
                            {item.sampleRequested && (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                                Sample Requested
                              </span>
                            )}
                          </div>
                          {shortlistedProduct?.id && (
                            <button
                              type="button"
                              aria-label={
                                isSelectedForShortlistCompare(shortlistedProduct.id)
                                  ? "Untick from compare"
                                  : "Tick for compare"
                              }
                              className={[
                                "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm",
                                isSelectedForShortlistCompare(shortlistedProduct.id)
                                  ? "border-black bg-black text-white"
                                  : "border-gray-200 bg-white/95 text-gray-800"
                              ].join(" ")}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleShortlistCompareSelection(shortlistedProduct.id);
                              }}
                            >
                              <input
                                type="checkbox"
                                className="pointer-events-none h-4 w-4 accent-black"
                                checked={isSelectedForShortlistCompare(shortlistedProduct.id)}
                                readOnly
                                tabIndex={-1}
                                aria-hidden="true"
                              />
                            </button>
                          )}
                        </div>

                        <div className="space-y-3 p-4">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              {shortlistedProduct?.materialType || "Shortlisted Product"}
                            </div>
                            <div className="mt-1 font-black leading-snug text-gray-900">
                              {shortlistedProduct?.name || item.productId}
                            </div>
                            {shortlistedProduct && (
                              <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-gray-600">
                                <span>SKU: {shortlistedProduct.sku}</span>
                                {userRole !== "customer" ? <span>{shortlistedProduct.brand}</span> : null}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={Boolean(item.sampleRequested) || requestingSampleId === item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequestSample(item.id);
                              }}
                              className="rounded-full bg-[#0468a3] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {requestingSampleId === item.id
                                ? "Requesting..."
                                : item.sampleRequested
                                  ? "Sample Requested"
                                  : "Request Sample"}
                            </button>
                            <button
                              type="button"
                              disabled={deletingShortlistId === item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteShortlist(item.id);
                              }}
                              className="rounded-full border border-red-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingShortlistId === item.id ? "Removing..." : "Remove"}
                            </button>
                          </div>

                          <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer Note</div>
                              <button
                                type="button"
                                disabled={savingNoteId === item.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateShortlistNote(item.id);
                                }}
                                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {savingNoteId === item.id ? "Saving..." : "Save Note"}
                              </button>
                            </div>
                            <textarea
                              value={noteDrafts[item.id] ?? item.customerNote ?? ""}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setNoteDrafts((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              placeholder="Updated note text"
                              className="mt-2 block min-h-[96px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-inner"
                            />
                          </div>

                          <div className="rounded-xl bg-[#f4f8fb] p-3 text-sm text-gray-700">
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              Designer Reply
                            </div>
                            <div className="mt-1 whitespace-pre-wrap">
                              {item.designerReplyNote?.trim() || "-"}
                            </div>
                            <div className="mt-2 text-[11px] font-bold text-gray-600">
                              Updated:{" "}
                              {item.designerReplyUpdatedAt
                                ? new Date(item.designerReplyUpdatedAt).toLocaleDateString()
                                : "-"}
                            </div>
                          </div>

                          <div className="rounded-xl bg-[#f4f8fb] p-3 text-sm text-gray-700">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Recommended By Designer
                              </div>
                              <div className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                {productRecommendations.length} Added
                              </div>
                            </div>
                            <div className="mt-2 space-y-2">
                              {productRecommendations.length === 0 ? (
                                <div className="rounded-lg bg-white p-3 text-xs text-gray-500">
                                  No recommendations from designer yet.
                                </div>
                              ) : (
                                productRecommendations.map((recommendation) => (
                                  <button
                                    key={recommendation.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const slug =
                                        recommendation.product?.slug ||
                                        products.find((product) => product.id === recommendation.productId)?.slug ||
                                        null;
                                      if (!slug) return;
                                      setIsShortlistOpen(false);
                                      router.push(`/products/${slug}`);
                                    }}
                                    className="w-full rounded-lg bg-white p-3 text-left transition hover:bg-gray-100"
                                  >
                                    <div className="text-sm font-semibold text-gray-900">
                                      {recommendation.note}
                                    </div>
                                    <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-[#0468a3]">
                                      Recommended Product:{" "}
                                      {recommendation.product
                                        ? [recommendation.product.name, recommendation.product.sku]
                                            .filter(Boolean)
                                            .join(" • ")
                                        : getProductLabelForNote(recommendation.productId) || recommendation.productId}
                                    </div>
                                    <div className="mt-1 text-[11px] font-bold text-gray-500">
                                      Recommended on {new Date(recommendation.createdAt).toLocaleString()}
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[11px] font-bold text-gray-600">
                            <div>Created: {new Date(item.createdAt).toLocaleDateString()}</div>
                            <div>Requested: {item.sampleRequestedAt ? new Date(item.sampleRequestedAt).toLocaleDateString() : "-"}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {userRole === "designer" && isDesignerCustomerDetailsOpen && (
        <div
          className="fixed inset-0 z-[145] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => {
            setIsDesignerCustomerDetailsOpen(false);
            setDesignerCustomerDetailsError("");
            setDesignerSampleDrafts({});
            setSavingDesignerSampleId(null);
            setDesignerSampleError("");
            setDesignerSampleMsg("");
            setDesignerReplyDrafts({});
            setSavingDesignerReplyId(null);
            setDesignerReplyError("");
            setDesignerReplyMsg("");
            setDesignerNoteError("");
            setDesignerNoteMsg("");
            setDesignerNoteDrafts({});
            setSavingDesignerNoteId(null);
            setDesignerRecommendationError("");
            setDesignerRecommendationMsg("");
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black">Customer Details</h3>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  {selectedDesignerCustomerId}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDesignerCustomerDetailsOpen(false);
                  setDesignerCustomerDetailsError("");
                  setDesignerSampleDrafts({});
                  setSavingDesignerSampleId(null);
                  setDesignerSampleError("");
                  setDesignerSampleMsg("");
                  setDesignerNoteError("");
                  setDesignerNoteMsg("");
                  setDesignerNoteDrafts({});
                  setSavingDesignerNoteId(null);
                  setDesignerRecommendationError("");
                  setDesignerRecommendationMsg("");
                }}
                className="text-gray-400 hover:text-black"
                aria-label="Close customer details"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="max-h-[calc(90vh-4.5rem)] overflow-y-auto p-6">
              {designerCustomerDetailsError && (
                <div className="mb-6 rounded-lg bg-red-50 p-3 text-center text-xs font-bold text-red-600">
                  {designerCustomerDetailsError}
                </div>
              )}

              {isLoadingDesignerCustomerDetails ? (
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-1">
                    <div className="h-5 w-1/2 rounded bg-gray-100" />
                    <div className="mt-4 h-24 rounded bg-gray-100" />
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
                    <div className="h-5 w-1/3 rounded bg-gray-100" />
                    <div className="mt-4 h-40 rounded bg-gray-100" />
                  </div>
                </div>
              ) : designerCustomerDetails ? (
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="space-y-6 lg:col-span-1">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer Profile</div>
                      <div className="mt-3 text-xl font-black text-gray-900">{designerCustomerDetails.customer.name}</div>
                      <div className="mt-1 break-all text-sm text-gray-600">{designerCustomerDetails.customer.email}</div>
                      <div className="mt-4 grid gap-3 text-sm text-gray-700">
                        <div className="rounded-xl bg-gray-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Project</div>
                          <div className="mt-1 font-medium text-gray-900">{designerCustomerDetails.customer.projectName || "-"}</div>
                        </div>
                        <div className="rounded-xl bg-gray-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</div>
                          <div className="mt-1 font-medium text-gray-900">
                            {designerCustomerDetails.customer.isActive ? "Active" : "Inactive"}
                          </div>
                        </div>
                        <div className="rounded-xl bg-gray-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Assigned Designer</div>
                          <div className="mt-1 font-medium text-gray-900">
                            {designerCustomerDetails.customer.assignedDesigner?.name || "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer Shortlist</div>
                          <div className="mt-1 text-sm text-gray-500">Products saved by this customer.</div>
                        </div>
                        <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700">
                          {designerCustomerDetails.shortlist.length} Items
                        </div>
                      </div>

                      {designerSampleError && (
                        <div className="mt-4 rounded-lg bg-red-50 p-3 text-center text-xs font-bold text-red-600">
                          {designerSampleError}
                        </div>
                      )}
                      {designerSampleMsg && (
                        <div className="mt-4 rounded-lg bg-green-50 p-3 text-center text-xs font-bold text-green-600">
                          {designerSampleMsg}
                        </div>
                      )}
                      {designerReplyError && (
                        <div className="mt-4 rounded-lg bg-red-50 p-3 text-center text-xs font-bold text-red-600">
                          {designerReplyError}
                        </div>
                      )}
                      {designerReplyMsg && (
                        <div className="mt-4 rounded-lg bg-green-50 p-3 text-center text-xs font-bold text-green-600">
                          {designerReplyMsg}
                        </div>
                      )}

                      <div className="mt-4 space-y-4">
                        {designerCustomerDetails.shortlist.length === 0 ? (
                          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">No shortlist items found.</div>
                        ) : (
                          designerCustomerDetails.shortlist.map((item) => {
                            const shortlistProduct = item.product ?? null;
                            const imageUrl = shortlistProduct ? inlineProductImageUrl(shortlistProduct) : null;
                            const itemRecommendations = Array.isArray(item.recommendations) ? item.recommendations : [];
                            const selectedRecommendationProductId =
                              designerRecommendationProductSelections[item.id] ?? "";
                            return (
                              <div key={item.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                                <div className="grid gap-4 md:grid-cols-[140px_1fr]">
                                  <div className="relative min-h-[140px] bg-gray-100">
                                    {imageUrl ? (
                                      <Image src={imageUrl} alt={shortlistProduct?.name || "Shortlist product"} fill sizes="140px" className="object-cover" />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        No Image
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="text-base font-black text-gray-900">
                                        {shortlistProduct?.name || item.productId}
                                      </div>
                                      <span className="inline-flex rounded-full bg-black px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                        {item.sampleStatus}
                                      </span>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600">
                                      {shortlistProduct?.brand || "-"}{shortlistProduct?.sku ? ` • ${shortlistProduct.sku}` : ""}
                                    </div>
                                    <div className="mt-2 grid grid-cols-1 gap-2 text-[11px] font-bold text-gray-600 sm:grid-cols-3">
                                      <div className="rounded-lg bg-white px-2.5 py-2">
                                        <span className="text-gray-400">IMS ID: </span>
                                        <span className="text-gray-800">{shortlistProduct?.imsId || "-"}</span>
                                      </div>
                                      <div className="rounded-lg bg-white px-2.5 py-2">
                                        <span className="text-gray-400">Book Name: </span>
                                        <span className="text-gray-800">{shortlistProduct?.bookName || "-"}</span>
                                      </div>
                                      <div className="rounded-lg bg-white px-2.5 py-2">
                                        <span className="text-gray-400">Page Number: </span>
                                        <span className="text-gray-800">{shortlistProduct?.pageNumber || "-"}</span>
                                      </div>
                                    </div>
                                    <div className="mt-3 rounded-xl bg-white p-3 text-sm text-gray-700">
                                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer Note</div>
                                      <div className="mt-1">{item.customerNote || "-"}</div>
                                    </div>
                                    <div className="mt-3 rounded-xl bg-white p-3 text-sm text-gray-700">
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Designer Reply</div>
                                        <button
                                          type="button"
                                          disabled={savingDesignerReplyId === item.id}
                                          onClick={() => handleSaveDesignerReply(item.id, item.productId)}
                                          className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                          {savingDesignerReplyId === item.id ? "Saving..." : "Save Reply"}
                                        </button>
                                      </div>
                                      <textarea
                                        value={designerReplyDrafts[item.id] ?? ""}
                                        onChange={(e) =>
                                          setDesignerReplyDrafts((prev) => ({
                                            ...prev,
                                            [item.id]: e.target.value,
                                          }))
                                        }
                                        placeholder="Reply to this customer note"
                                        className="mt-2 block min-h-[56px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-inner"
                                      />
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-end gap-3 rounded-xl bg-white p-3">
                                      <div className="min-w-[180px] flex-1">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sample Status</div>
                                        <select
                                          value={designerSampleDrafts[item.id] ?? item.sampleStatus ?? "none"}
                                          onChange={(e) =>
                                            setDesignerSampleDrafts((prev) => ({
                                              ...prev,
                                              [item.id]: e.target.value,
                                            }))
                                          }
                                          className="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-inner"
                                        >
                                          {Array.from(
                                            new Set([
                                              item.sampleStatus || "none",
                                              "none",
                                              "pending",
                                              "ready",
                                              "not available",
                                            ])
                                          ).map((status) => (
                                            <option key={status} value={status}>
                                              {status}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <button
                                        type="button"
                                        disabled={savingDesignerSampleId === item.id}
                                        onClick={() => handleUpdateDesignerSample(item.id)}
                                        className="rounded-full border border-[#0468a3] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#0468a3] disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {savingDesignerSampleId === item.id ? "Saving..." : "Update Sample"}
                                      </button>
                                    </div>
                                    <div className="mt-3 rounded-xl bg-white p-3 text-sm text-gray-700">
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recommendations</div>
                                        <div className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                          {itemRecommendations.length} Added
                                        </div>
                                      </div>
                                      <div className="mt-2 space-y-2">
                                        <select
                                          value={selectedRecommendationProductId}
                                          onChange={(e) =>
                                            setDesignerRecommendationProductSelections((prev) => ({
                                              ...prev,
                                              [item.id]: e.target.value,
                                            }))
                                          }
                                          className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-inner"
                                        >
                                          <option value="">Select recommended product</option>
                                          {products
                                            .filter((product) => product.id !== item.productId)
                                            .map((product) => (
                                            <option key={`${item.id}-${product.id}`} value={product.id}>
                                              {[product.name, product.sku].filter(Boolean).join(" • ")}
                                            </option>
                                          ))}
                                        </select>
                                        <textarea
                                          value={designerRecommendationDrafts[item.id] ?? ""}
                                          onChange={(e) =>
                                            setDesignerRecommendationDrafts((prev) => ({
                                              ...prev,
                                              [item.id]: e.target.value,
                                            }))
                                          }
                                          placeholder="Add recommendation for this product"
                                          className="block min-h-[56px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-inner"
                                        />
                                        <button
                                          type="button"
                                          disabled={isCreatingDesignerRecommendation && creatingDesignerRecommendationShortlistId === item.id}
                                          onClick={() =>
                                            handleCreateDesignerRecommendation(
                                              item.id,
                                              selectedRecommendationProductId,
                                              item.productId
                                            )
                                          }
                                          className="rounded-full bg-[#0468a3] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                          {isCreatingDesignerRecommendation && creatingDesignerRecommendationShortlistId === item.id
                                            ? "Saving..."
                                            : "Add Recommendation"}
                                        </button>
                                      </div>
                                      <div className="mt-3 space-y-2">
                                        {itemRecommendations.length === 0 ? (
                                          <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
                                            No recommendations for this product.
                                          </div>
                                        ) : (
                                          itemRecommendations.map((recommendation) => (
                                            <div key={recommendation.id} className="rounded-lg bg-gray-50 p-3">
                                              <div className="text-sm font-semibold text-gray-900">
                                                {recommendation.note}
                                              </div>
                                              <div className="mt-1 text-[11px] font-bold text-gray-500">
                                                Created: {new Date(recommendation.createdAt).toLocaleString()}
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-4 text-[11px] font-bold text-gray-600">
                                      <div>Created: {new Date(item.createdAt).toLocaleDateString()}</div>
                                      <div>Requested: {item.sampleRequestedAt ? new Date(item.sampleRequestedAt).toLocaleDateString() : "-"}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recommendations</div>
                          <div className="mt-1 text-sm text-gray-500">Use each shortlist card above to add product-wise recommendations.</div>
                        </div>
                        <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700">
                          {totalDesignerRecommendations} Added
                        </div>
                      </div>
                      {designerRecommendationError && (
                        <div className="mt-4 rounded-lg bg-red-50 p-3 text-center text-xs font-bold text-red-600">
                          {designerRecommendationError}
                        </div>
                      )}
                      {designerRecommendationMsg && (
                        <div className="mt-4 rounded-lg bg-green-50 p-3 text-center text-xs font-bold text-green-600">
                          {designerRecommendationMsg}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Designer Notes</div>
                          <div className="mt-1 text-sm text-gray-500">Use Designer Reply inside each shortlist item above for product-wise customer replies.</div>
                        </div>
                        <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700">
                          {designerCustomerDetails.notes.length} Notes
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Add Designer Note</div>
                        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_220px]">
                          <textarea
                            value={designerNoteDraft}
                            onChange={(e) => setDesignerNoteDraft(e.target.value)}
                            placeholder="Matte better than gloss for this kitchen direction"
                            className="min-h-[110px] w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 shadow-inner"
                          />
                          <div className="space-y-3">
                            <select
                              value={designerNoteProductId}
                              onChange={(e) => setDesignerNoteProductId(e.target.value)}
                              className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 shadow-inner"
                            >
                              <option value="">No linked product</option>
                              {designerCustomerDetails.shortlist.map((item) => (
                                <option key={item.id} value={item.productId}>
                                  {item.product?.name || item.productId}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={isCreatingDesignerNote}
                              onClick={handleCreateDesignerNote}
                              className="w-full rounded-full bg-black px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isCreatingDesignerNote ? "Saving..." : "Add Note"}
                            </button>
                          </div>
                        </div>
                        {designerNoteError && (
                          <div className="mt-3 rounded-lg bg-red-50 p-3 text-center text-xs font-bold text-red-600">
                            {designerNoteError}
                          </div>
                        )}
                        {designerNoteMsg && (
                          <div className="mt-3 rounded-lg bg-green-50 p-3 text-center text-xs font-bold text-green-600">
                            {designerNoteMsg}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 space-y-3">
                        {designerCustomerDetails.notes.length === 0 ? (
                          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">No designer notes found.</div>
                        ) : (
                          designerCustomerDetails.notes.map((note, index) => (
                            <div key={String(note.id ?? index)} className="rounded-xl bg-gray-50 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <textarea
                                    value={typeof note.id === "string" ? (designerNoteDrafts[note.id] ?? getDesignerNoteText(note)) : getDesignerNoteText(note)}
                                    onChange={(e) => {
                                      if (typeof note.id !== "string") return;
                                      setDesignerNoteDrafts((prev) => ({
                                        ...prev,
                                        [note.id as string]: e.target.value,
                                      }));
                                    }}
                                    className="min-h-[88px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-inner"
                                  />
                                </div>
                                {typeof note.id === "string" && (
                                  <button
                                    type="button"
                                    disabled={savingDesignerNoteId === note.id}
                                    onClick={() => handleUpdateDesignerNote(note.id as string)}
                                    className="rounded-full border border-gray-300 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {savingDesignerNoteId === note.id ? "Saving..." : "Save"}
                                  </button>
                                )}
                              </div>
                              <div className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-500">
                                Product: {getProductLabelForNote(typeof note.productId === "string" ? note.productId : null) || "-"}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-4 text-[11px] font-bold text-gray-500">
                                <div>Created: {typeof note.createdAt === "string" && note.createdAt ? new Date(note.createdAt).toLocaleDateString() : "-"}</div>
                                <div>Updated: {typeof note.updatedAt === "string" && note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : "-"}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">No customer details found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {isCompareOpen && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-6xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e]">Compare Products</h2>
                <div className="mt-1 text-[11px] font-bold text-gray-600 break-all">
                  {(compareData?.ids ?? shortlistCompareSelectedList).join(", ")}
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCompareOpen(false);
                  setCompareError("");
                }}
                className="text-gray-400 hover:text-black"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            {isComparing && (
              <div className="text-sm font-bold text-gray-600 py-10 text-center">Loading comparison...</div>
            )}

            {!isComparing && compareError && (
              <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">{compareError}</div>
            )}

            {!isComparing && compareData && (
              <div className="space-y-4">
                {compareData.missingIds?.length > 0 && (
                  <div className="text-xs font-bold text-amber-700 bg-amber-50 p-3 rounded-lg">
                    Missing IDs: {compareData.missingIds.join(", ")}
                  </div>
                )}

                <div className="overflow-auto rounded-xl border border-gray-100">
                  <table className="min-w-full text-left">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-gray-500">Field</th>
                        {compareData.products.map((p) => {
                          const url = typeof p.primaryImageUrl === "string" && cleanUrl(p.primaryImageUrl) ? cleanUrl(p.primaryImageUrl) : null;
                          return (
                            <th key={p.id} className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                                  {url ? (
                                    <Image src={url} alt={p.name} fill sizes="48px" className="object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                                      No Image
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-[220px]">
                                  <div className="text-[11px] font-black text-gray-900 leading-snug">{p.name}</div>
                                  <div className="mt-0.5 text-[10px] font-bold text-gray-500">SKU: {p.sku}</div>
                                  <div className="mt-0.5 text-[10px] font-bold text-gray-400 break-all">{p.id}</div>
                                </div>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {compareData.fields.map((field) => (
                        <tr key={field.key} className="border-b border-gray-100">
                          <td className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">
                            {field.key}
                          </td>
                          {compareData.products.map((p, idx) => {
                            const v = field.values?.[idx];
                            const display = v === null || typeof v === "undefined" ? "-" : String(v);
                            return (
                              <td key={`${field.key}-${p.id}`} className="px-4 py-3 text-[12px] font-bold text-gray-800">
                                {display}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e]">Create New User</h2>
              <button 
                onClick={() => {
                   setIsCreateModalOpen(false);
                   setCreateError("");
                   setCreateMsg("");
                }}
                className="text-gray-400 hover:text-black"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Full Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="e.g. Priya"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="e.g. priya@gmail.com"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Role</label>
                <select
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                >
                  <option value="customer">Customer</option>
                  <option value="designer">Designer</option>
                </select>
              </div>

              {createError && <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">{createError}</div>}
              {createMsg && <div className="text-xs font-bold text-green-600 bg-green-50 p-3 rounded-lg text-center">{createMsg}</div>}

              <button
                type="submit"
                disabled={isCreating}
                className="w-full rounded-full bg-[#ffcb05] py-3.5 text-sm font-black uppercase tracking-widest text-black shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-4"
              >
                {isCreating ? "Creating User..." : "Confirm & Create"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e]">Create New Category</h2>
              <button 
                onClick={() => {
                   setIsCategoryModalOpen(false);
                   setCatError("");
                   setCatMsg("");
                }}
                className="text-gray-400 hover:text-black"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Category Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={newCatData.name}
                  onChange={(e) => setNewCatData({ ...newCatData, name: e.target.value })}
                  placeholder="e.g. Laminates"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Type</label>
                <select
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={newCatData.type}
                  onChange={(e) =>
                    setNewCatData({
                      ...newCatData,
                      type: e.target.value === "furniture" ? "furniture" : "material",
                    })
                  }
                >
                  <option value="material">Material</option>
                  <option value="furniture">Furniture</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Parent Category (Optional)</label>
                <select
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={newCatData.parent_id}
                  onChange={(e) => setNewCatData({ ...newCatData, parent_id: e.target.value })}
                >
                  <option value="">No parent (Top-level category)</option>
                  {topLevelCategories
                    .filter((cat) => cat.type === newCatData.type)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              {catError && <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">{catError}</div>}
              {catMsg && <div className="text-xs font-bold text-green-600 bg-green-50 p-3 rounded-lg text-center">{catMsg}</div>}

              <button
                type="submit"
                disabled={isCreatingCat}
                className="w-full rounded-full bg-[#ffcb05] py-3.5 text-sm font-black uppercase tracking-widest text-black shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-4"
              >
                {isCreatingCat ? "Creating Category..." : "Confirm & Create"}
              </button>
            </form>
          </div>
        </div>
      )}

      {isProductModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-2xl md:p-8">
            <div className="mb-6 flex shrink-0 items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#0468a3]">Create New Product</h2>
              <button
                onClick={() => {
                  setIsProductModalOpen(false);
                  setProductError("");
                  setProductMsg("");
                  setCreateProductImageFiles([]);
                  setCreatedProductImages([]);
                  setCreateSelectedCategoryIds(new Set());
                  setCreateSelectedTagIds(new Set());
                  setIsCreateCategoriesDropdownOpen(false);
                  setIsCreateTagsDropdownOpen(false);
                }}
                className="text-gray-400 hover:text-black"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Bind Sub-Categories (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreateCategoriesDropdownOpen((v) => !v)}
                    className="mt-1 flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-800 shadow-inner"
                  >
                    <span>
                      {createSelectedCategoryIds.size > 0 ? `${createSelectedCategoryIds.size} selected` : "Select sub-categories"}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </button>

                  {isCreateCategoriesDropdownOpen && (
                    <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white p-2">
                      {allCategories.length === 0 ? (
                        <div className="px-2 py-2 text-xs text-gray-500">No sub-categories available.</div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          {allCategories.map((c) => (
                            <label key={c.id} className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                              <input
                                type="checkbox"
                                checked={createSelectedCategoryIds.has(c.id)}
                                onChange={() => toggleCreateCategory(c.id)}
                              />
                              <span className="font-medium">
                                {c.parentName ? `${c.parentName} > ${c.name}` : c.name}
                              </span>
                              <span className="ml-auto text-[10px] uppercase tracking-widest text-gray-400">{c.type}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Link Tags (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreateTagsDropdownOpen((v) => !v)}
                    className="mt-1 flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-800 shadow-inner"
                  >
                    <span>
                      {createSelectedTagIds.size > 0 ? `${createSelectedTagIds.size} selected` : "Select tags"}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </button>

                  {isCreateTagsDropdownOpen && (
                    <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white p-2">
                      {allTags.length === 0 ? (
                        <div className="px-2 py-2 text-xs text-gray-500">No tags available.</div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          {allTags.map((tag) => (
                            <label key={tag.id} className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                              <input
                                type="checkbox"
                                checked={createSelectedTagIds.has(tag.id)}
                                onChange={() => toggleCreateTag(tag.id)}
                              />
                              <span className="font-medium">{tag.name}</span>
                              <span className="ml-auto text-[10px] uppercase tracking-widest text-gray-400">{tag.hexCode}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">IMS ID</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={newProductData.imsId}
                    onChange={(e) => setNewProductData({ ...newProductData, imsId: e.target.value })}
                    placeholder="e.g. IMS-1001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={newProductData.name}
                    onChange={(e) => {
                      const nextName = e.target.value;
                      setNewProductData((prev) => ({
                        ...prev,
                        name: nextName,
                        sku: generateSkuFromName(nextName)
                      }));
                    }}
                    placeholder="e.g. Classic Sheesham Wood Coffee Table"
                  />
                </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</label>
                    <select
                      className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                      value={newProductData.status}
                      onChange={(e) => setNewProductData({ ...newProductData, status: e.target.value })}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Brand</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={newProductData.brand}
                    onChange={(e) => setNewProductData({ ...newProductData, brand: e.target.value })}
                    placeholder="e.g. RusticHome"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Material Type</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={newProductData.materialType}
                    onChange={(e) => setNewProductData({ ...newProductData, materialType: e.target.value })}
                    placeholder="e.g. Sheesham Wood"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Book Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={newProductData.bookName}
                    onChange={(e) => setNewProductData({ ...newProductData, bookName: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Page Number</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={newProductData.pageNumber}
                    onChange={(e) => setNewProductData({ ...newProductData, pageNumber: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Application</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={newProductData.application}
                    onChange={(e) => setNewProductData({ ...newProductData, application: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Color Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={newProductData.colorName}
                    onChange={(e) => setNewProductData({ ...newProductData, colorName: e.target.value })}
                    placeholder="e.g. Natural Brown"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Dimensions</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={newProductData.dimensions}
                    onChange={(e) => setNewProductData({ ...newProductData, dimensions: e.target.value })}
                    placeholder="e.g. 100cm x 60cm x 45cm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</label>
                <textarea
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner min-h-[90px]"
                  value={newProductData.description}
                  onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
                  placeholder="A sturdy and elegant coffee table made from solid sheesham wood."
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Product Images (Required, min 1 max 3)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    setCreateProductImageFiles((prev) => {
                      const merged = [...prev, ...picked];
                      const deduped = Array.from(
                        new Map(
                          merged.map((file) => [
                            `${file.name}-${file.size}-${file.lastModified}`,
                            file,
                          ]),
                        ).values(),
                      );
                      return deduped.slice(0, 3);
                    });
                    e.currentTarget.value = "";
                  }}
                />
                <div className="mt-1 text-[10px] font-semibold text-gray-500">
                  You can select up to 3 images (multiple picks supported).
                </div>
                {createProductImageFiles.length > 0 && (
                  <div className="mt-2 text-[11px] font-bold text-gray-500">
                    Selected:{" "}
                    {createProductImageFiles.map((file) => file.name).join(", ")}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Performance</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={newProductData.performanceRating}
                    onChange={(e) => setNewProductData({ ...newProductData, performanceRating: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Durability</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={newProductData.durabilityRating}
                    onChange={(e) => setNewProductData({ ...newProductData, durabilityRating: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Price Category</label>
                  <input
                    type="number"
                    step="1"
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={newProductData.priceCategory}
                    onChange={(e) => setNewProductData({ ...newProductData, priceCategory: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Maintenance</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={newProductData.maintenanceRating}
                    onChange={(e) => setNewProductData({ ...newProductData, maintenanceRating: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pros</label>
                  <textarea
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner min-h-[90px]"
                    value={newProductData.prosText}
                    onChange={(e) => setNewProductData({ ...newProductData, prosText: e.target.value })}
                    placeholder={"Strong build\nNatural finish\nCompact design"}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cons</label>
                  <textarea
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner min-h-[90px]"
                    value={newProductData.consText}
                    onChange={(e) => setNewProductData({ ...newProductData, consText: e.target.value })}
                    placeholder={"Needs polishing over time"}
                  />
                </div>
              </div>

                {productError && <div className="rounded-lg bg-red-50 p-3 text-center text-xs font-bold text-red-600">{productError}</div>}
                {productMsg && <div className="rounded-lg bg-green-50 p-3 text-center text-xs font-bold text-green-600">{productMsg}</div>}
                {createdProductImages.length > 0 && (
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Uploaded URLs
                    </div>
                    <div className="mt-2 space-y-2">
                      {createdProductImages.map((image) => (
                        <a
                          key={image.id}
                          href={image.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block break-all text-sm font-bold text-[#0468a3] underline"
                        >
                          {image.url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isCreatingProduct}
                className="mt-4 w-full shrink-0 rounded-full bg-[#0468a3] py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-md transition-transform active:scale-95 disabled:opacity-50"
              >
                {isCreatingProduct ? "Creating Product..." : "Confirm & Create"}
              </button>
            </form>
          </div>
        </div>
      )}

      {isBindCategoriesOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e]">Bind Sub-Categories to Product</h2>
              <button
                onClick={() => {
                  setIsBindCategoriesOpen(false);
                  setBindError("");
                  setBindMsg("");
                  setBindProductId("");
                  setSelectedCategoryIds(new Set());
                }}
                className="text-gray-400 hover:text-black"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleBindCategories} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Product ID</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={bindProductId}
                  onChange={(e) => setBindProductId(e.target.value)}
                  placeholder="e.g. 0a3a16c9-ad60-43f0-b2cf-b6f4e39ffb3e"
                />
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Select Sub-Categories</div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {allCategories.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.has(c.id)}
                        onChange={() => toggleCategory(c.id)}
                      />
                      <span className="font-medium">
                        {c.parentName ? `${c.parentName} > ${c.name}` : c.name}
                      </span>
                      <span className="ml-auto text-[10px] uppercase tracking-widest text-gray-400">{c.type}</span>
                    </label>
                  ))}
                  {allCategories.length === 0 && (
                    <div className="text-xs text-gray-500">No sub-categories available.</div>
                  )}
                </div>
              </div>

              {bindError && <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">{bindError}</div>}
              {bindMsg && <div className="text-xs font-bold text-green-600 bg-green-50 p-3 rounded-lg text-center">{bindMsg}</div>}

              <button
                type="submit"
                disabled={isBindingCats}
                className="w-full rounded-full bg-[#4d2c1e] py-3.5 text-sm font-black uppercase tracking-widest text-[#ffcb05] shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-4"
              >
                {isBindingCats ? "Binding..." : "Bind Selected Sub-Categories"}
              </button>
            </form>
          </div>
        </div>
      )}

      {isProductTagsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e]">Link / Delink Product Tags</h2>
              <button
                onClick={() => {
                  setIsProductTagsOpen(false);
                  setProductTagError("");
                  setProductTagMsg("");
                  setProductTagProductId("");
                  setSelectedLinkTagId("");
                  setSelectedUnlinkTagId("");
                  setProductLinkedTagIds([]);
                  setHasLinkedTagData(false);
                }}
                className="text-gray-400 hover:text-black"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Step 1: Product ID</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={productTagProductId}
                  onChange={(e) => setProductTagProductId(e.target.value)}
                  placeholder="e.g. f6eed0e7-ffa0-4272-b9b9-aaccd47a6488"
                />
                <p className="mt-1 text-[11px] font-medium text-gray-500">
                  Enter the product ID once, then use either action below.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Currently linked tags</div>
                {!productTagProductId.trim() ? (
                  <div className="mt-1 text-xs text-gray-500">Enter product ID to view linked tags.</div>
                ) : isLoadingLinkedTags ? (
                  <div className="mt-1 text-xs text-gray-500">Loading linked tags...</div>
                ) : !hasLinkedTagData ? (
                  <div className="mt-1 text-xs text-gray-500">Could not fetch linked tags for this product. You can still use link/delink actions below.</div>
                ) : productLinkedTagIds.length === 0 ? (
                  <div className="mt-1 text-xs text-gray-500">No tags linked yet.</div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {productLinkedTagIds.map((id) => {
                      const tag = allTags.find((item) => item.id === id);
                      return (
                        <span key={id} className="inline-flex items-center rounded-full border border-gray-300 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-700">
                          {tag ? `${tag.name} (${tag.hexCode})` : id}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <form onSubmit={handleLinkProductTag} className="space-y-3 rounded-xl border border-green-100 bg-green-50/40 p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-green-700">Step 2A: Link Tag</div>
                  <select
                    className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={selectedLinkTagId}
                    onChange={(e) => setSelectedLinkTagId(e.target.value)}
                    required
                  >
                    <option value="">Select tag to link</option>
                    {allTags.map((tag) => (
                      <option key={tag.id} value={tag.id} disabled={productLinkedTagIds.includes(tag.id)}>
                        {tag.name} ({tag.hexCode}){productLinkedTagIds.includes(tag.id) ? " - already linked" : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={isLinkingTag || !productTagProductId.trim() || !selectedLinkTagId}
                    className="w-full rounded-full bg-green-700 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-md transition-transform active:scale-95 disabled:opacity-50"
                  >
                    {isLinkingTag ? "Linking..." : "Link Tag"}
                  </button>
                </form>

                <form onSubmit={handleUnlinkProductTag} className="space-y-3 rounded-xl border border-red-100 bg-red-50/40 p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-red-700">Step 2B: Delink Tag</div>
                  <select
                    className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={selectedUnlinkTagId}
                    onChange={(e) => setSelectedUnlinkTagId(e.target.value)}
                    required
                  >
                    <option value="">Select tag to delink</option>
                    {allTags
                      .filter((tag) => productLinkedTagIds.includes(tag.id))
                      .map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.name} ({tag.hexCode})
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    disabled={isUnlinkingTag || !productTagProductId.trim() || !selectedUnlinkTagId}
                    className="w-full rounded-full bg-red-600 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-md transition-transform active:scale-95 disabled:opacity-50"
                  >
                    {isUnlinkingTag ? "Delinking..." : "Delink Tag"}
                  </button>
                </form>
              </div>

              {productTagError && <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">{productTagError}</div>}
              {productTagMsg && <div className="text-xs font-bold text-green-700 bg-green-50 p-3 rounded-lg text-center">{productTagMsg}</div>}
            </div>
          </div>
        </div>
      )}

      {isUploadImageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#0468a3]">Upload Product Image</h2>
              <button
                onClick={() => {
                  setIsUploadImageModalOpen(false);
                  setUploadError("");
                  setUploadMsg("");
                  setUploadedImages([]);
                  setUploadProductId("");
                  setUploadFiles([]);
                }}
                className="text-gray-400 hover:text-black"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleUploadProductImage} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Product ID</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={uploadProductId}
                  onChange={(e) => setUploadProductId(e.target.value)}
                  placeholder="e.g. 0a3a16c9-ad60-43f0-b2cf-b6f4e39ffb3e"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Images (min 1, max 3)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setUploadFiles(files.slice(0, 3));
                  }}
                />
                {uploadFiles.length > 0 && (
                  <div className="mt-2 text-[11px] font-bold text-gray-500">
                    Selected: {uploadFiles.map((file) => file.name).join(", ")}
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">
                  {uploadError}
                </div>
              )}
              {uploadMsg && (
                <div className="text-xs font-bold text-green-600 bg-green-50 p-3 rounded-lg text-center">
                  {uploadMsg}
                </div>
              )}

              {uploadedImages.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Uploaded URL{uploadedImages.length > 1 ? "s" : ""}
                  </div>
                  <div className="mt-2 space-y-1">
                    {uploadedImages.map((image) => (
                      <a
                        key={image.id}
                        href={image.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block break-all text-sm font-bold text-[#0468a3] underline"
                      >
                        {image.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isUploadingImage}
                className="w-full rounded-full bg-[#0468a3] py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-4"
              >
                {isUploadingImage ? "Uploading..." : "Upload"}
              </button>
            </form>
          </div>
        </div>
      )}

      {isBulkUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#0468a3]">
                Bulk Upload Products
              </h2>
              <button
                onClick={() => {
                  setIsBulkUploadModalOpen(false);
                  setBulkUploadError("");
                  setBulkUploadMsg("");
                  setBulkUploadFile(null);
                  setBulkUploadImagesZipFile(null);
                }}
                className="text-gray-400 hover:text-black"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleBulkUploadSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  XLSX File
                </label>
                <input
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  onChange={(e) => {
                    const selected = e.target.files?.[0] ?? null;
                    setBulkUploadFile(selected);
                    setBulkUploadError("");
                  }}
                />
                <p className="mt-2 text-[11px] font-bold text-gray-500">
                  Upload Excel file in `.xlsx` format.
                </p>
                <p className="mt-1 text-[11px] font-bold text-gray-500">
                  Required columns: <span className="font-black">imsId</span>, <span className="font-black">name</span>, <span className="font-black">sku</span>
                </p>
                <p className="mt-1 text-[11px] font-bold text-gray-500">
                  Optional columns: brand, description, bookName, pageNumber, application, materialType, finishType, colorName, colorHex, thickness, dimensions, performanceRating, durabilityRating, priceCategory, maintenanceRating, bestUsedFor, pros, cons, status, categoryIds
                </p>
                <a
                  href="/templates/products-bulk-upload-template-latest.xlsx"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-[11px] font-black uppercase tracking-wider text-[#0468a3] underline"
                >
                  Download Latest XLSX Template
                </a>
                {bulkUploadFile && (
                  <div className="mt-1 text-[11px] font-bold text-gray-600">
                    Selected: {bulkUploadFile.name}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Images ZIP (Optional)
                </label>
                <input
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  onChange={(e) => {
                    const selected = e.target.files?.[0] ?? null;
                    setBulkUploadImagesZipFile(selected);
                    setBulkUploadError("");
                  }}
                />
                <p className="mt-2 text-[11px] font-bold text-gray-500">
                  Optional: add a ZIP with files like `SKU-1.jpg`, `SKU-2.jpg`, `SKU-3.jpg`.
                </p>
                {bulkUploadImagesZipFile && (
                  <div className="mt-1 text-[11px] font-bold text-gray-600">
                    Selected: {bulkUploadImagesZipFile.name}
                  </div>
                )}
              </div>

              {bulkUploadError && (
                <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">
                  {bulkUploadError}
                </div>
              )}
              {bulkUploadMsg && (
                <div className="text-xs font-bold text-green-700 bg-green-50 p-3 rounded-lg text-center">
                  {bulkUploadMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isBulkUploadingProducts}
                className="w-full rounded-full bg-[#0468a3] py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-4"
              >
                {isBulkUploadingProducts ? "Uploading..." : "Upload"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
