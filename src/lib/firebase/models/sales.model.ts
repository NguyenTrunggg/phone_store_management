import { Timestamp } from "firebase/firestore";
import { FirebaseAuditableDocument } from "./index";
import {
  SALE_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  type SaleStatusType,
  type PaymentStatusType,
  type PaymentMethodType,
} from "@/constants";

// =============================================================================
// SALES MODEL (UC03: Sales Management & Revenue Reporting)
// Collection: salesOrders
// =============================================================================

/**
 * Main sales order document
 * Document path: salesOrders/{orderId}
 */
export interface FirebaseSalesOrder extends FirebaseAuditableDocument {
  // Order identification
  orderNumber: string; // e.g., "SO-20241215-0001"

  // Customer information
  customerId?: string; // Reference to customers collection
  customerInfo: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  };

  // Staff information
  staffId: string; // User ID of sales staff
  staffName: string; // Denormalized for performance
  storeLocation: string; // Which store/location

  // Order timing
  orderDate: Timestamp;
  completedDate?: Timestamp;
  deliveryDate?: Timestamp; // If delivery required

  // Order status
  orderStatus: SaleStatusType;

  // Items summary (detailed items in subcollection)
  totalItems: number;
  totalQuantity: number; // Usually same as totalItems for IMEI items

  // Financial information
  subtotalAmount: number; // Before discounts and tax
  discountAmount: number; // Total discounts applied
  taxAmount: number; // Tax applied
  shippingAmount: number; // Shipping/delivery cost
  totalAmount: number; // Final amount customer pays

  // Payment information
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatusType;
  paymentReference?: string; // Transaction ID, check number, etc.

  // Discount and promotion details
  discounts?: Array<{
    type: "percentage" | "fixed_amount" | "loyalty_points";
    value: number; // Percentage or amount
    amount: number; // Actual discount amount
    reason?: string;
    couponCode?: string;
    appliedBy?: string; // Staff who applied
  }>;

  // Special order flags
  isWalkIn: boolean; // Walk-in customer vs appointment
  isDelivery: boolean; // Requires delivery
  isPickup: boolean; // Customer pickup
  isGift: boolean; // Gift order
  isExchange: boolean; // Exchange order

  // Gift and special handling
  giftMessage?: string;
  specialInstructions?: string;

  // Return and exchange tracking
  isReturnable: boolean;
  returnDeadline?: Timestamp;
  returnOrderId?: string; // If order was returned
  exchangeOrderId?: string; // If order was exchanged
  originalOrderId?: string; // If this is an exchange order

  // Customer service
  appointmentId?: string; // If from appointment booking
  salesConsultationNotes?: string;

  // Additional metadata
  notes?: string;
  internalNotes?: string; // Staff notes, not visible to customer
  tags?: string[]; // e.g., ["vip", "bulk_order", "corporate"]

  // Channel tracking
  salesChannel: "in_store" | "online" | "phone" | "social_media";
  referralSource?: string;

  // Performance tracking
  salesDuration?: number; // Minutes from start to completion
  consultationDuration?: number; // Time spent consulting

  // Receipt and documentation
  receiptNumber?: string;
  receiptPrinted: boolean;
  emailReceiptSent: boolean;
  smsNotificationSent: boolean;
}

/**
 * Sales order items (subcollection)
 * Document path: salesOrders/{orderId}/orderItems/{itemId}
 */
export interface FirebaseSalesOrderItem extends FirebaseAuditableDocument {
  // Product references
  inventoryItemId: string; // Specific IMEI being sold
  productId: string;
  variantId: string;

  // Denormalized product information (for performance)
  productName: string; // e.g., "iPhone 15 Pro Max"
  variantSku: string; // e.g., "IP15PM-256-TN"
  imei: string; // The specific IMEI sold
  colorName: string;
  storageCapacity: string;

  // Quantity (usually 1 for IMEI-tracked items)
  quantity: number;

  // Pricing at time of sale
  unitPrice: number; // Price per unit
  originalPrice: number; // MSRP or regular price
  discountAmount: number; // Discount on this item
  taxAmount: number; // Tax on this item
  totalAmount: number; // Final amount for this item

  // Cost and profit tracking
  unitCost: number; // Cost of this specific unit
  profitAmount: number; // Profit on this item
  profitMargin: number; // Profit margin percentage

  // Item-specific discounts
  itemDiscounts?: Array<{
    type: "percentage" | "fixed_amount";
    value: number;
    amount: number;
    reason?: string;
  }>;

  // Warranty information
  warrantyPeriodMonths: number;
  warrantyStartDate: Timestamp; // Usually sale date
  warrantyEndDate: Timestamp;
  extendedWarrantyOffered: boolean;
  extendedWarrantyAccepted: boolean;
  extendedWarrantyPeriod?: number; // Additional months

  // Return tracking
  isReturnable: boolean;
  returnDeadline: Timestamp;
  returnReason?: string; // If returned
  returnDate?: Timestamp;
  returnOrderId?: string;

  // Special handling
  isGift: boolean;
  giftWrapRequested: boolean;
  setupServiceRequested: boolean; // Data transfer, setup assistance

  // Additional services
  accessories?: Array<{
    name: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;

  // Notes
  notes?: string;
  setupNotes?: string; // Notes about device setup
}



// =============================================================================
// INPUT/OUTPUT SCHEMAS
// =============================================================================

/**
 * Create sales order input
 */
export interface CreateSalesOrderInput {
  // Customer information
  customerId?: string;
  customerInfo: {
    name: string;
    phone?: string;
    email?: string;
  };

  // Items to sell
  items: Array<{
    inventoryItemId: string; // Specific IMEI to sell
    unitPrice?: number; // Override default price if needed
    discountAmount?: number;
    notes?: string;
    isGift?: boolean;
    giftWrapRequested?: boolean;
    setupServiceRequested?: boolean;
    extendedWarrantyOffered?: boolean;
    extendedWarrantyAccepted?: boolean;
    extendedWarrantyPeriod?: number;
  }>;

  // Order-level discounts
  discounts?: Array<{
    type: "percentage" | "fixed_amount" | "loyalty_points";
    value: number;
    reason?: string;
    couponCode?: string;
  }>;

  // Payment information
  paymentMethod: PaymentMethodType;
  paymentReference?: string;

  // Special handling
  isDelivery?: boolean;
  isPickup?: boolean;
  isGift?: boolean;
  giftMessage?: string;
  specialInstructions?: string;

  // Additional info
  notes?: string;
  salesChannel?: "in_store" | "online" | "phone" | "social_media";
  referralSource?: string;
  appointmentId?: string;
}

/**
 * Update sales order input
 */
export interface UpdateSalesOrderInput {
  orderStatus?: SaleStatusType;
  paymentStatus?: PaymentStatusType;
  paymentReference?: string;
  deliveryDate?: Date;
  specialInstructions?: string;
  notes?: string;
  internalNotes?: string;
  tags?: string[];
}

/**
 * Sales search and filtering
 */
export interface SalesSearchFilters {
  // Order identification
  orderNumber?: string;
  orderStatus?: SaleStatusType[];
  paymentStatus?: PaymentStatusType[];

  // Date range
  orderDateFrom?: Date;
  orderDateTo?: Date;
  completedDateFrom?: Date;
  completedDateTo?: Date;

  // Staff and location
  staffId?: string;
  storeLocation?: string;

  // Customer filters
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerTier?: string[];

  // Product filters
  productId?: string;
  variantId?: string;
  imei?: string;

  // Financial filters
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: PaymentMethodType[];

  // Special flags
  isWalkIn?: boolean;
  isDelivery?: boolean;
  isGift?: boolean;
  isExchange?: boolean;
  isVip?: boolean;

  // Channel and source
  salesChannel?: string[];
  referralSource?: string;

  // Tags
  tags?: string[];

  // Sorting
  sortBy?:
    | "orderDate"
    | "completedDate"
    | "totalAmount"
    | "orderNumber"
    | "customerName";
  sortOrder?: "asc" | "desc";

  // Pagination
  limit?: number;
  startAfter?: any;
}

/**
 * Sales analytics result
 */
export interface SalesAnalyticsResult {
  // Period
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Timestamp;

  // Overall metrics
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  averageOrderValue: number;
  profitMargin: number;

  // Order status breakdown
  orderStatusBreakdown: Record<
    SaleStatusType,
    {
      count: number;
      revenue: number;
    }
  >;

  // Payment method breakdown
  paymentMethodBreakdown: Record<
    PaymentMethodType,
    {
      count: number;
      amount: number;
      percentage: number;
    }
  >;

  // Staff performance
  staffPerformance: Array<{
    staffId: string;
    staffName: string;
    orderCount: number;
    revenue: number;
    averageOrderValue: number;
    profit: number;
  }>;

  // Product performance
  topProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
    profit: number;
    profitMargin: number;
  }>;

  // Customer insights
  newCustomers: number;
  returningCustomers: number;
  vipCustomers: number;

  // Channel performance
  channelBreakdown: Record<
    string,
    {
      count: number;
      revenue: number;
      percentage: number;
    }
  >;

  // Time-based trends
  dailyTrends: Array<{
    date: string;
    orders: number;
    revenue: number;
    profit: number;
  }>;

  // Comparison with previous period
  previousPeriodComparison?: {
    revenueGrowth: number;
    orderGrowth: number;
    profitGrowth: number;
    avgOrderValueGrowth: number;
  };
}

// =============================================================================
// QUERY HELPERS
// =============================================================================

export const SalesQueries = {
  // Get orders by date range
  getOrdersByDateRange: (startDate: Date, endDate: Date) => ({
    collection: "salesOrders",
    where: [
      ["orderDate", ">=", Timestamp.fromDate(startDate)],
      ["orderDate", "<=", Timestamp.fromDate(endDate)],
    ],
    orderBy: [["orderDate", "desc"]],
  }),

  // Get orders by staff
  getOrdersByStaff: (staffId: string) => ({
    collection: "salesOrders",
    where: [["staffId", "==", staffId]],
    orderBy: [["orderDate", "desc"]],
  }),

  // Get customer orders
  getCustomerOrders: (customerId: string) => ({
    collection: "salesOrders",
    where: [["customerId", "==", customerId]],
    orderBy: [["orderDate", "desc"]],
  }),

  // Get orders by status
  getOrdersByStatus: (status: SaleStatusType) => ({
    collection: "salesOrders",
    where: [["orderStatus", "==", status]],
    orderBy: [["orderDate", "desc"]],
  }),

  // Get orders with specific IMEI
  getOrdersByImei: (imei: string) => ({
    collectionGroup: "orderItems",
    where: [["imei", "==", imei]],
    limit: 1,
  }),

  // Get today's sales
  getTodaysSales: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      collection: "salesOrders",
      where: [
        ["orderDate", ">=", Timestamp.fromDate(today)],
        ["orderDate", "<", Timestamp.fromDate(tomorrow)],
        ["orderStatus", "==", "completed"],
      ],
    };
  },
} as const;
