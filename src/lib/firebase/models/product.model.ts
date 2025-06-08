import { Timestamp } from "firebase/firestore";
import { FirebaseAuditableDocument } from "./index";
import { type VariantStatusType } from "@/constants";

// =============================================================================
// PRODUCT MODEL (UC01: Product Identification Management)
// Collection: products
// =============================================================================

/**
 * Main product document (iPhone model like "iPhone 15 Pro Max")
 * Document path: products/{productId}
 */
export interface FirebaseProduct extends FirebaseAuditableDocument {
  // Basic information
  name: string; // e.g., "iPhone 15 Pro Max"
  description?: string;
  brand: string; // "Apple"
  category: string; // "Smartphones"

  // Media
  baseImageUrl?: string;
  images?: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
    order: number;
  }>;

  // Categorization
  tags?: string[];

  // Business attributes
  attributes?: Record<string, any>; // Flexible attributes

  // Status
  isActive: boolean;
  discontinuedAt?: Timestamp;

  // Computed fields (maintained by Cloud Functions)
  totalVariants: number;
  activeVariants: number;
  totalStock: number; // Sum across all variants
  averagePrice: number;

  // SEO & Display
  slug: string; // URL-friendly name
  displayOrder?: number;

  // Admin notes
  internalNotes?: string;
}

/**
 * Product variant document (specific color + storage combination)
 * Document path: products/{productId}/productVariants/{variantId}
 */
export interface FirebaseProductVariant extends FirebaseAuditableDocument {
  // Product reference
  productId: string; // Parent product ID

  // Variant identification
  sku: string; // Unique SKU (e.g., "IP15PM-256-TN")

  // iPhone-specific attributes
  colorName: string; // e.g., "Titanium Gray", "Blue"
  colorHex?: string; // Hex color code for UI
  storageCapacity: string; // e.g., "128GB", "256GB", "512GB", "1TB"

  // Pricing
  retailPrice: number; // Current selling price
  costPrice?: number; // Average cost price
  originalPrice?: number; // MSRP

  // Inventory summary (computed by Cloud Functions)
  stockQuantity: number; // Available for sale
  reservedQuantity: number; // Reserved/on-hold
  soldQuantity: number; // Total sold
  totalQuantity: number; // Total ever received

  // Status and lifecycle
  status: VariantStatusType;
  isActive: boolean;
  isFeatured?: boolean;

  // Display and ordering
  imageUrl?: string; // Variant-specific image
  displayOrder?: number;

  // Business attributes
  attributes?: Record<string, any>;

  // Inventory alerts
  lowStockThreshold: number; // Alert when stock below this
  reorderLevel: number; // Suggested reorder level

  // Apple-specific data
  appleModelNumber?: string; // Apple's internal model number
  applePartNumber?: string; // Apple's part number

  // Launch and lifecycle dates
  launchDate?: Timestamp;
  discontinuedDate?: Timestamp;

  // Last update tracking
  lastStockUpdate: Timestamp;
  lastSaleDate?: Timestamp;
  lastRestockDate?: Timestamp;
}

/**
 * Product creation input schema
 */
export interface CreateProductInput {
  name: string;
  description?: string;
  brand?: string; // Defaults to "Apple"
  category?: string; // Defaults to "Smartphones"
  baseImageUrl?: string;
  tags?: string[];
  attributes?: Record<string, any>;
  slug?: string; // Auto-generated if not provided
  displayOrder?: number;
  internalNotes?: string;
}

/**
 * Product variant creation input schema
 */
export interface CreateProductVariantInput {
  productId: string;
  sku?: string; // Auto-generated if not provided
  colorName: string;
  colorHex?: string;
  storageCapacity: string;
  retailPrice: number;
  costPrice?: number;
  originalPrice?: number;
  imageUrl?: string;
  attributes?: Record<string, any>;
  lowStockThreshold?: number; // Defaults to 5
  reorderLevel?: number; // Defaults to 10
  appleModelNumber?: string;
  applePartNumber?: string;
  launchDate?: Date;
  displayOrder?: number;
}

/**
 * Product update input schema
 */
export interface UpdateProductInput {
  name?: string;
  description?: string;
  brand?: string; // Add missing brand field
  category?: string; // Add missing category field
  baseImageUrl?: string;
  tags?: string[];
  attributes?: Record<string, any>;
  isActive?: boolean;
  displayOrder?: number;
  internalNotes?: string;
}

/**
 * Product variant update input schema
 */
export interface UpdateProductVariantInput {
  sku?: string;
  colorName?: string;
  colorHex?: string;
  storageCapacity?: string;
  retailPrice?: number;
  costPrice?: number;
  originalPrice?: number;
  imageUrl?: string;
  status?: VariantStatusType;
  isActive?: boolean;
  isFeatured?: boolean;
  attributes?: Record<string, any>;
  lowStockThreshold?: number;
  reorderLevel?: number;
  displayOrder?: number;
}

/**
 * Product search and filtering
 */
export interface ProductSearchFilters {
  // Text search
  searchTerm?: string;

  // Basic filters
  brand?: string;
  category?: string;
  tags?: string[];
  isActive?: boolean;

  // Price range
  minPrice?: number;
  maxPrice?: number;

  // iPhone-specific filters
  colors?: string[];
  storageOptions?: string[];

  // Inventory filters
  inStock?: boolean;
  lowStock?: boolean;

  // Status filters
  variantStatus?: VariantStatusType[];

  // Date filters
  launchedAfter?: Date;
  launchedBefore?: Date;

  // Sorting
  sortBy?:
    | "name"
    | "price"
    | "stock"
    | "createdAt"
    | "lastSaleDate"
    | "displayOrder";
  sortOrder?: "asc" | "desc";

  // Pagination
  limit?: number;
  startAfter?: any; // Firestore cursor
}

/**
 * Product with variants (denormalized for UI)
 */
export interface ProductWithVariants extends FirebaseProduct {
  variants: FirebaseProductVariant[];
}

/**
 * Variant with product info (denormalized for performance)
 */
export interface VariantWithProductInfo extends FirebaseProductVariant {
  productName: string;
  productBrand: string;
  productCategory: string;
  productSlug: string;
  productBaseImageUrl?: string;
}

/**
 * Product analytics summary
 */
export interface ProductAnalyticsSummary {
  productId: string;
  productName: string;

  // Sales metrics
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;

  // Inventory metrics
  totalVariants: number;
  variantsInStock: number;
  totalStock: number;
  stockValue: number;

  // Performance metrics
  conversionRate?: number;
  viewCount?: number;
  wishlistCount?: number;

  // Time-based metrics
  salesThisMonth: number;
  salesLastMonth: number;
  salesGrowth: number;

  // Top variant
  topVariant?: {
    variantId: string;
    sku: string;
    colorName: string;
    storageCapacity: string;
    salesCount: number;
    revenue: number;
  };

  // Period
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Timestamp;
}

/**
 * Product stock summary (for quick inventory checks)
 */
export interface ProductStockSummary {
  productId: string;
  productName: string;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  lowStockVariants: Array<{
    variantId: string;
    sku: string;
    colorName: string;
    storageCapacity: string;
    currentStock: number;
    threshold: number;
  }>;
  outOfStockVariants: Array<{
    variantId: string;
    sku: string;
    colorName: string;
    storageCapacity: string;
  }>;
  lastUpdated: Timestamp;
}

// =============================================================================
// FIRESTORE QUERY HELPERS
// =============================================================================

export const ProductQueries = {
  // Get all active products
  getActiveProducts: () => ({
    collection: "products",
    where: [["isActive", "==", true]],
    orderBy: [
      ["displayOrder", "asc"],
      ["name", "asc"],
    ],
  }),

  // Get variants for a product
  getProductVariants: (productId: string) => ({
    collection: `products/${productId}/productVariants`,
    where: [["isActive", "==", true]],
    orderBy: [
      ["displayOrder", "asc"],
      ["colorName", "asc"],
      ["storageCapacity", "asc"],
    ],
  }),

  // Get variants with available stock
  getAvailableVariants: (productId: string) => ({
    collection: `products/${productId}/productVariants`,
    where: [
      ["isActive", "==", true],
      ["status", "==", "active"],
      ["stockQuantity", ">", 0],
    ],
    orderBy: [["stockQuantity", "desc"]],
  }),

  // Search products by name
  searchProductsByName: (searchTerm: string) => ({
    collection: "products",
    where: [
      ["isActive", "==", true],
      ["name", ">=", searchTerm],
      ["name", "<=", searchTerm + "\uf8ff"],
    ],
  }),

  // Get low stock variants across all products
  getLowStockVariants: () => ({
    collectionGroup: "productVariants",
    where: [
      ["isActive", "==", true],
      ["stockQuantity", "<=", "lowStockThreshold"], // This would need to be a Cloud Function query
    ],
  }),
} as const;
