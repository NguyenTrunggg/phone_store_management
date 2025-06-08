import { Timestamp } from "firebase/firestore";
import { FirebaseAuditableDocument } from "./index";

// =============================================================================
// CUSTOMER MODEL (Customer Management for Sales Orders)
// Collection: customers
// =============================================================================

/**
 * Customer document
 * Document path: customers/{customerId}
 */
export interface FirebaseCustomer extends FirebaseAuditableDocument {
  // Basic information
  name: string;
  phone?: string;
  email?: string;
  dateOfBirth?: Timestamp;

  // Address information
  addresses?: Array<{
    id: string;
    type: "home" | "work" | "billing" | "shipping";
    street: string;
    district?: string;
    city: string;
    country: string;
    postalCode?: string;
    isDefault: boolean;
    label?: string; // Custom label like "Office", "Parent's house"
  }>;

  // Customer analytics (computed by Cloud Functions)
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastPurchaseDate?: Timestamp;
  firstPurchaseDate?: Timestamp;

  // Customer segmentation
  customerTier: "new" | "regular" | "vip" | "platinum";
  loyaltyPoints: number;
  lifetimeValue: number;

  // Preferences
  preferredContactMethod: "phone" | "email" | "sms";
  communicationPreferences: {
    promotions: boolean;
    newProducts: boolean;
    appointments: boolean;
    orderUpdates: boolean;
    warrantyReminders: boolean;
  };

  // Device ownership tracking
  ownedDevices?: Array<{
    imei: string;
    productName: string;
    variantInfo: {
      colorName: string;
      storageCapacity: string;
    };
    purchaseDate: Timestamp;
    purchaseOrderId: string;
    warrantyEndDate: Timestamp;
    isActive: boolean; // Still owns device
    notes?: string;
  }>;

  // Customer service tracking
  supportTickets?: Array<{
    ticketId: string;
    subject: string;
    status: "open" | "in_progress" | "resolved" | "closed";
    priority: "low" | "medium" | "high" | "urgent";
    createdAt: Timestamp;
    resolvedAt?: Timestamp;
    assignedStaffId?: string;
  }>;

  // Financial information
  creditLimit?: number; // For corporate customers
  paymentTerms?: string; // For corporate customers
  taxId?: string; // For business customers

  // Special flags
  isVip: boolean;
  isCorporate: boolean;
  allowMarketing: boolean;
  requiresApproval: boolean; // For special pricing or credit

  // Customer source tracking
  acquisitionChannel?:
    | "walk_in"
    | "referral"
    | "online"
    | "social_media"
    | "advertisement";
  referredBy?: string; // Customer ID or staff ID who referred

  // Additional information
  notes?: string; // Staff notes about customer
  tags?: string[]; // e.g., ["influencer", "bulk_buyer", "price_sensitive"]

  // Account status
  isActive: boolean;
  isBlacklisted: boolean;
  blacklistReason?: string;
  blacklistedAt?: Timestamp;
  blacklistedBy?: string; // Staff ID who blacklisted

  // Emergency contact (for corporate or VIP customers)
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };

  // Social media information (for marketing)
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

/**
 * Customer loyalty program membership
 * Document path: customerLoyalty/{membershipId}
 */
export interface FirebaseCustomerLoyalty extends FirebaseAuditableDocument {
  customerId: string;
  membershipNumber: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";

  // Points management
  totalPointsEarned: number;
  currentPoints: number;
  pointsUsed: number;

  // Tier benefits
  discountPercentage: number;
  specialOffers: string[];
  prioritySupport: boolean;
  freeShipping: boolean;

  // Membership dates
  joinDate: Timestamp;
  tierUpgradeDate?: Timestamp;
  expiryDate?: Timestamp;

  // Status
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
}

/**
 * Customer purchase history summary
 * Document path: customerPurchaseHistory/{customerId}
 */
export interface FirebaseCustomerPurchaseHistory
  extends FirebaseAuditableDocument {
  customerId: string;

  // Purchase patterns
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  largestOrder: number;
  smallestOrder: number;

  // Product preferences
  favoriteProducts: Array<{
    productId: string;
    productName: string;
    purchaseCount: number;
    totalSpent: number;
    lastPurchaseDate: Timestamp;
  }>;

  // Color and storage preferences
  preferredColors: Array<{
    colorName: string;
    purchaseCount: number;
  }>;

  preferredStorage: Array<{
    storageCapacity: string;
    purchaseCount: number;
  }>;

  // Purchase frequency
  averageDaysBetweenPurchases: number;
  lastPurchaseDate: Timestamp;
  predictedNextPurchase?: Timestamp;

  // Seasonal patterns
  monthlyPurchasePattern: Record<string, number>; // Month -> purchase count

  // Return behavior
  returnRate: number; // Percentage of orders returned
  totalReturns: number;
  returnReasons: Array<{
    reason: string;
    count: number;
  }>;
}

// =============================================================================
// INPUT/OUTPUT SCHEMAS
// =============================================================================

/**
 * Create customer input
 */
export interface CreateCustomerInput {
  // Required fields
  name: string;
  phone?: string;
  email?: string;

  // Optional profile info
  dateOfBirth?: Date;

  // Address
  address?: {
    type: "home" | "work" | "billing" | "shipping";
    street: string;
    district?: string;
    city: string;
    country?: string; // Defaults to "Vietnam"
    postalCode?: string;
    isDefault?: boolean;
  };

  // Preferences
  preferredContactMethod?: "phone" | "email" | "sms";
  allowMarketing?: boolean;

  // Customer classification
  isCorporate?: boolean;
  isVip?: boolean;

  // Additional info
  notes?: string;
  tags?: string[];
  acquisitionChannel?:
    | "walk_in"
    | "referral"
    | "online"
    | "social_media"
    | "advertisement";
  referredBy?: string;
}

/**
 * Update customer input
 */
export interface UpdateCustomerInput {
  // Basic info
  name?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: Date;

  // Preferences
  preferredContactMethod?: "phone" | "email" | "sms";
  communicationPreferences?: {
    promotions?: boolean;
    newProducts?: boolean;
    appointments?: boolean;
    orderUpdates?: boolean;
    warrantyReminders?: boolean;
  };

  // Classification
  customerTier?: "new" | "regular" | "vip" | "platinum";
  isVip?: boolean;
  isCorporate?: boolean;
  allowMarketing?: boolean;

  // Status
  isActive?: boolean;
  isBlacklisted?: boolean;
  blacklistReason?: string;

  // Additional info
  notes?: string;
  tags?: string[];
}

/**
 * Customer search and filtering
 */
export interface CustomerSearchFilters {
  // Basic search
  searchTerm?: string; // Search in name, phone, email
  phone?: string;
  email?: string;

  // Classification filters
  customerTier?: ("new" | "regular" | "vip" | "platinum")[];
  isVip?: boolean;
  isCorporate?: boolean;

  // Purchase behavior
  minTotalSpent?: number;
  maxTotalSpent?: number;
  minOrders?: number;
  maxOrders?: number;

  // Date filters
  firstPurchaseAfter?: Date;
  firstPurchaseBefore?: Date;
  lastPurchaseAfter?: Date;
  lastPurchaseBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;

  // Status filters
  isActive?: boolean;
  isBlacklisted?: boolean;
  allowMarketing?: boolean;

  // Acquisition
  acquisitionChannel?: string[];

  // Tags
  tags?: string[];

  // Location
  city?: string;
  district?: string;

  // Sorting
  sortBy?:
    | "name"
    | "totalSpent"
    | "totalOrders"
    | "lastPurchaseDate"
    | "createdAt";
  sortOrder?: "asc" | "desc";

  // Pagination
  limit?: number;
  startAfter?: any;
}

/**
 * Customer analytics result
 */
export interface CustomerAnalyticsResult {
  // Period
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Timestamp;

  // Customer metrics
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  activeCustomers: number; // Customers who made purchases in period

  // Customer segmentation
  tierDistribution: Record<
    string,
    {
      count: number;
      percentage: number;
      totalSpent: number;
    }
  >;

  // Customer lifetime value
  averageLifetimeValue: number;
  averageOrderValue: number;
  customerRetentionRate: number;

  // Top customers
  topCustomersBySpent: Array<{
    customerId: string;
    customerName: string;
    totalSpent: number;
    orderCount: number;
    lastPurchaseDate: Timestamp;
  }>;

  // Customer acquisition
  acquisitionChannels: Record<
    string,
    {
      newCustomers: number;
      totalSpent: number;
      averageOrderValue: number;
    }
  >;

  // Geographic distribution
  locationDistribution: Record<
    string,
    {
      customerCount: number;
      totalSpent: number;
    }
  >;

  // Trends
  customerGrowthTrend: Array<{
    date: string;
    newCustomers: number;
    cumulativeCustomers: number;
  }>;
}

// =============================================================================
// QUERY HELPERS
// =============================================================================

export const CustomerQueries = {
  // Get active customers
  getActiveCustomers: () => ({
    collection: "customers",
    where: [
      ["isActive", "==", true],
      ["isBlacklisted", "==", false],
    ],
    orderBy: [["name", "asc"]],
  }),

  // Get VIP customers
  getVipCustomers: () => ({
    collection: "customers",
    where: [
      ["isVip", "==", true],
      ["isActive", "==", true],
    ],
    orderBy: [["totalSpent", "desc"]],
  }),

  // Search customers by phone
  searchCustomersByPhone: (phone: string) => ({
    collection: "customers",
    where: [["phone", "==", phone]],
    limit: 10,
  }),

  // Get customers by tier
  getCustomersByTier: (tier: string) => ({
    collection: "customers",
    where: [
      ["customerTier", "==", tier],
      ["isActive", "==", true],
    ],
    orderBy: [["totalSpent", "desc"]],
  }),

  // Get customers needing follow-up
  getCustomersNeedingFollowUp: (daysSinceLastPurchase: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastPurchase);

    return {
      collection: "customers",
      where: [
        ["lastPurchaseDate", "<=", cutoffDate],
        ["isActive", "==", true],
        ["allowMarketing", "==", true],
      ],
      orderBy: [["lastPurchaseDate", "asc"]],
    };
  },

  // Get customers with high lifetime value
  getHighValueCustomers: (minLifetimeValue: number) => ({
    collection: "customers",
    where: [
      ["lifetimeValue", ">=", minLifetimeValue],
      ["isActive", "==", true],
    ],
    orderBy: [["lifetimeValue", "desc"]],
  }),
} as const;
