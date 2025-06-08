import { Timestamp } from "firebase/firestore";
import { FirebaseAuditableDocument } from "./index";

// =============================================================================
// SUPPLIER MODEL (Supplier Management for Purchase Orders)
// Collection: suppliers
// =============================================================================

/**
 * Supplier document
 * Document path: suppliers/{supplierId}
 */
export interface FirebaseSupplier extends FirebaseAuditableDocument {
  // Basic information
  name: string;
  code: string; // Unique supplier code (e.g., "SPL001")
  displayName?: string; // Short name for UI

  // Contact information
  primaryContact: {
    name: string;
    title?: string;
    phone: string;
    email: string;
    isMainContact: boolean;
  };

  additionalContacts?: Array<{
    id: string;
    name: string;
    title?: string;
    phone?: string;
    email?: string;
    department?: string; // Sales, Support, Accounting
    isActive: boolean;
  }>;

  // Address information
  addresses: Array<{
    id: string;
    type: "head_office" | "warehouse" | "billing" | "shipping";
    street: string;
    district?: string;
    city: string;
    country: string;
    postalCode?: string;
    isDefault: boolean;
    label?: string;
  }>;

  // Business information
  businessInfo: {
    registrationNumber?: string; // Business registration number
    taxId?: string;
    website?: string;
    businessType:
      | "manufacturer"
      | "distributor"
      | "wholesaler"
      | "retailer"
      | "other";
    establishedYear?: number;
    employeeCount?: number;
  };

  // Financial information
  financialInfo: {
    paymentTerms: string; // e.g., "Net 30", "Cash on Delivery"
    creditLimit?: number;
    currency: string; // Default currency for transactions
    preferredPaymentMethod:
      | "bank_transfer"
      | "check"
      | "cash"
      | "letter_of_credit";
    bankAccountInfo?: {
      bankName: string;
      accountNumber: string;
      routingNumber?: string;
      swiftCode?: string;
    };
  };

  // Supplier performance metrics (computed by Cloud Functions)
  performance: {
    totalOrders: number;
    totalPurchaseValue: number;
    averageOrderValue: number;
    onTimeDeliveryRate: number; // Percentage
    qualityRating: number; // 1-5 scale
    responsiveness: number; // 1-5 scale
    lastOrderDate?: Timestamp;
    firstOrderDate?: Timestamp;
  };

  // Product categories they supply
  productCategories: Array<{
    category: string; // e.g., "iPhone", "Accessories", "Spare Parts"
    isPrimary: boolean;
    brands?: string[]; // Brands they supply in this category
  }>;

  // Shipping and logistics
  shippingInfo: {
    defaultShippingMethod: string;
    averageLeadTimeDays: number;
    minimumOrderQuantity?: number;
    minimumOrderValue?: number;
    shippingTerms: "FOB" | "CIF" | "DDP" | "EXW" | "other";
    canDropShip: boolean;
  };

  // Quality and certifications
  qualityInfo: {
    certifications: Array<{
      name: string; // ISO 9001, Apple Authorized, etc.
      issuedBy: string;
      issuedDate: Timestamp;
      expiryDate?: Timestamp;
      certificateNumber?: string;
      isValid: boolean;
    }>;
    qualityPolicies?: string[];
    returnPolicy?: string;
    warrantyTerms?: string;
  };

  // Relationship management
  relationship: {
    partnershipLevel: "preferred" | "strategic" | "standard" | "trial";
    contractStartDate?: Timestamp;
    contractEndDate?: Timestamp;
    exclusiveProducts?: string[]; // Products only available from this supplier
    volumeDiscounts?: Array<{
      minimumQuantity: number;
      discountPercentage: number;
    }>;
    negotiatedRates?: Record<string, number>; // Product ID -> special rate
  };

  // Communication preferences
  communicationPreferences: {
    preferredContactMethod: "email" | "phone" | "fax" | "portal";
    orderNotifications: boolean;
    invoiceNotifications: boolean;
    promotionNotifications: boolean;
    language: "en" | "vi" | "zh";
    timezone: string;
  };

  // Status and flags
  status:
    | "active"
    | "inactive"
    | "pending_approval"
    | "suspended"
    | "terminated";
  isPreferred: boolean;
  isApproved: boolean;
  requiresApproval: boolean; // For orders above certain threshold

  // Risk assessment
  riskAssessment?: {
    riskLevel: "low" | "medium" | "high";
    riskFactors: string[];
    lastAssessmentDate: Timestamp;
    assessedBy: string; // User ID
    notes?: string;
  };

  // Internal notes and tags
  notes?: string;
  tags?: string[]; // e.g., ["apple_authorized", "fast_delivery", "bulk_discounts"]

  // Audit trail
  approvedBy?: string; // User ID who approved the supplier
  approvedAt?: Timestamp;
  lastReviewDate?: Timestamp;
  nextReviewDate?: Timestamp;
}

/**
 * Supplier price list
 * Document path: supplierPriceLists/{priceListId}
 */
export interface FirebaseSupplierPriceList extends FirebaseAuditableDocument {
  supplierId: string;
  name: string; // e.g., "Q1 2024 Price List"

  // Validity
  effectiveDate: Timestamp;
  expiryDate?: Timestamp;
  isActive: boolean;

  // Price items
  items: Array<{
    productId?: string; // Reference to our product
    supplierSku: string; // Supplier's SKU
    productName: string;
    description?: string;

    // Pricing
    unitPrice: number;
    currency: string;
    minimumOrderQuantity: number;

    // Discounts
    volumeBreaks?: Array<{
      minimumQuantity: number;
      unitPrice: number;
      discountPercentage?: number;
    }>;

    // Availability
    isAvailable: boolean;
    leadTimeDays?: number;
    stockQuantity?: number;

    // Product specifications
    specifications?: Record<string, any>;

    // Validity for this item
    itemEffectiveDate?: Timestamp;
    itemExpiryDate?: Timestamp;
  }>;

  // Terms and conditions
  terms?: {
    paymentTerms: string;
    shippingTerms: string;
    warranties?: string[];
    returnPolicy?: string;
  };

  // Version control
  version: string;
  previousVersionId?: string;
  isCurrentVersion: boolean;
}

/**
 * Supplier evaluation/review
 * Document path: supplierEvaluations/{evaluationId}
 */
export interface FirebaseSupplierEvaluation extends FirebaseAuditableDocument {
  supplierId: string;
  evaluationPeriod: {
    startDate: Timestamp;
    endDate: Timestamp;
  };

  // Evaluation criteria scores (1-5 scale)
  scores: {
    quality: number;
    delivery: number;
    pricing: number;
    service: number;
    communication: number;
    flexibility: number;
  };

  // Detailed metrics
  metrics: {
    totalOrders: number;
    onTimeDeliveries: number;
    qualityIssues: number;
    priceCompetitiveness: number; // Percentage vs market average
    responseTime: number; // Average response time in hours
  };

  // Qualitative feedback
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];

  // Overall rating and decision
  overallRating: number; // 1-5 scale
  performanceLevel:
    | "excellent"
    | "good"
    | "satisfactory"
    | "needs_improvement"
    | "poor";

  // Actions and follow-up
  actionItems: Array<{
    description: string;
    assignedTo: string; // User ID
    dueDate: Timestamp;
    status: "pending" | "in_progress" | "completed";
  }>;

  // Evaluation details
  evaluatedBy: string; // User ID
  reviewedBy?: string; // Manager/approver user ID
  evaluationMethod: "automated" | "manual" | "mixed";

  // Comparison with previous evaluations
  previousEvaluationId?: string;
  improvementTrend: "improving" | "stable" | "declining";
}

// =============================================================================
// INPUT/OUTPUT SCHEMAS
// =============================================================================

/**
 * Create supplier input
 */
export interface CreateSupplierInput {
  // Required fields
  name: string;
  code?: string; // Auto-generated if not provided

  // Contact info
  primaryContact: {
    name: string;
    title?: string;
    phone: string;
    email: string;
  };

  // Address
  address: {
    type: "head_office" | "warehouse" | "billing";
    street: string;
    district?: string;
    city: string;
    country?: string; // Defaults to current country
    postalCode?: string;
  };

  // Business info
  businessType:
    | "manufacturer"
    | "distributor"
    | "wholesaler"
    | "retailer"
    | "other";
  paymentTerms: string;
  currency?: string; // Defaults to VND

  // Categories
  productCategories: Array<{
    category: string;
    isPrimary: boolean;
  }>;

  // Additional info
  notes?: string;
  tags?: string[];
}

/**
 * Update supplier input
 */
export interface UpdateSupplierInput {
  // Basic info
  name?: string;
  displayName?: string;

  // Business info
  businessType?:
    | "manufacturer"
    | "distributor"
    | "wholesaler"
    | "retailer"
    | "other";

  // Financial terms
  paymentTerms?: string;
  creditLimit?: number;
  currency?: string;

  // Shipping
  averageLeadTimeDays?: number;
  minimumOrderQuantity?: number;
  minimumOrderValue?: number;

  // Relationship
  partnershipLevel?: "preferred" | "strategic" | "standard" | "trial";
  isPreferred?: boolean;

  // Status
  status?:
    | "active"
    | "inactive"
    | "pending_approval"
    | "suspended"
    | "terminated";
  isApproved?: boolean;

  // Additional info
  notes?: string;
  tags?: string[];
}

/**
 * Supplier search and filtering
 */
export interface SupplierSearchFilters {
  // Basic search
  searchTerm?: string; // Search in name, code, contact info
  code?: string;

  // Status filters
  status?: ("active" | "inactive" | "pending_approval" | "suspended")[];
  isPreferred?: boolean;
  isApproved?: boolean;

  // Business filters
  businessType?: (
    | "manufacturer"
    | "distributor"
    | "wholesaler"
    | "retailer"
    | "other"
  )[];
  partnershipLevel?: ("preferred" | "strategic" | "standard" | "trial")[];

  // Product categories
  productCategories?: string[];

  // Location
  city?: string;
  country?: string;

  // Performance
  minQualityRating?: number;
  minOnTimeDeliveryRate?: number;

  // Financial
  currency?: string[];
  maxLeadTimeDays?: number;

  // Tags
  tags?: string[];

  // Date filters
  createdAfter?: Date;
  createdBefore?: Date;
  lastOrderAfter?: Date;
  lastOrderBefore?: Date;

  // Sorting
  sortBy?:
    | "name"
    | "code"
    | "performance.qualityRating"
    | "performance.totalPurchaseValue"
    | "createdAt";
  sortOrder?: "asc" | "desc";

  // Pagination
  limit?: number;
  startAfter?: any;
}

/**
 * Supplier performance summary
 */
export interface SupplierPerformanceSummary {
  supplierId: string;
  supplierName: string;

  // Period
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Timestamp;

  // Order metrics
  totalOrders: number;
  totalPurchaseValue: number;
  averageOrderValue: number;

  // Delivery performance
  onTimeDeliveries: number;
  lateDeliveries: number;
  onTimeDeliveryRate: number;
  averageLeadTime: number;

  // Quality metrics
  qualityIssues: number;
  defectRate: number;
  returnRate: number;

  // Financial metrics
  totalPaid: number;
  outstandingAmount: number;
  averagePaymentDelay: number;

  // Communication metrics
  averageResponseTime: number; // Hours
  communicationRating: number;

  // Comparison with previous period
  previousPeriodComparison?: {
    orderGrowth: number;
    valueGrowth: number;
    qualityImprovement: number;
    deliveryImprovement: number;
  };

  // Rankings
  rankings: {
    byValue: number; // Rank by purchase value
    byQuality: number; // Rank by quality score
    byDelivery: number; // Rank by delivery performance
    totalSuppliers: number;
  };
}

// =============================================================================
// QUERY HELPERS
// =============================================================================

export const SupplierQueries = {
  // Get active suppliers
  getActiveSuppliers: () => ({
    collection: "suppliers",
    where: [
      ["status", "==", "active"],
      ["isApproved", "==", true],
    ],
    orderBy: [["name", "asc"]],
  }),

  // Get preferred suppliers
  getPreferredSuppliers: () => ({
    collection: "suppliers",
    where: [
      ["isPreferred", "==", true],
      ["status", "==", "active"],
    ],
    orderBy: [["performance.qualityRating", "desc"]],
  }),

  // Get suppliers by category
  getSuppliersByCategory: (category: string) => ({
    collection: "suppliers",
    where: [
      ["productCategories", "array-contains-any", [category]],
      ["status", "==", "active"],
    ],
  }),

  // Get suppliers needing review
  getSuppliersNeedingReview: () => {
    const reviewDate = new Date();
    return {
      collection: "suppliers",
      where: [
        ["nextReviewDate", "<=", reviewDate],
        ["status", "==", "active"],
      ],
      orderBy: [["nextReviewDate", "asc"]],
    };
  },

  // Get top performing suppliers
  getTopSuppliers: (limit: number = 10) => ({
    collection: "suppliers",
    where: [["status", "==", "active"]],
    orderBy: [["performance.qualityRating", "desc"]],
    limit,
  }),

  // Search suppliers by code
  searchSuppliersByCode: (code: string) => ({
    collection: "suppliers",
    where: [["code", "==", code]],
    limit: 1,
  }),
} as const;
