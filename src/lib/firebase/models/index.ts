import { Timestamp } from "firebase/firestore";

// =============================================================================
// FIREBASE FIRESTORE MODELS & SCHEMAS
// Based on detailed business requirements document (UC01-UC05)
// =============================================================================

// Re-export all model interfaces
export * from "./product.model";
export * from "./inventory.model";
export * from "./sales.model";
export * from "./user.model";
export * from "./customer.model";
export * from "./supplier.model";
export * from "./returns.model";
export * from "./reports.model";
export * from "./pos.model";

// =============================================================================
// FIREBASE COLLECTION NAMES (Centralized)
// =============================================================================

export const FIREBASE_COLLECTIONS = {
  // Core Product Management (UC01)
  PRODUCTS: "products",
  PRODUCT_VARIANTS: "productVariants", // Subcollection of products

  // Inventory Management (UC02)
  INVENTORY_ITEMS: "inventoryItems",
  STOCK_MOVEMENTS: "stockMovements",
  PURCHASE_ORDERS: "purchaseOrders",

  // Sales Management (UC03, UC05)
  SALES_ORDERS: "salesOrders",
  ORDER_ITEMS: "orderItems", // Subcollection of salesOrders

  // Returns Management (UC05)
  RETURNS: "returns",
  RETURN_ITEMS: "returnItems", // Subcollection of returns

  // User Management
  USERS: "users",
  USER_SESSIONS: "userSessions",

  // Customer Management
  CUSTOMERS: "customers",

  // Supplier Management
  SUPPLIERS: "suppliers",

  // Reporting & Analytics (UC03)
  DAILY_REPORTS: "dailyReports",
  MONTHLY_REPORTS: "monthlyReports",
  REVENUE_REPORTS: "revenueReports",

  // Audit & Logging
  AUDIT_LOGS: "auditLogs",
  INVENTORY_LOGS: "inventoryLogs",

  // System Configuration
  SYSTEM_SETTINGS: "systemSettings",
  RETURN_POLICIES: "returnPolicies",

  // Apple Integration (UC04)
  WARRANTY_CHECKS: "warrantyChecks",
} as const;

// =============================================================================
// FIREBASE DOCUMENT PATHS (Helper Functions)
// =============================================================================

export const getDocumentPath = {
  // Product paths
  product: (productId: string) =>
    `${FIREBASE_COLLECTIONS.PRODUCTS}/${productId}`,
  productVariant: (productId: string, variantId: string) =>
    `${FIREBASE_COLLECTIONS.PRODUCTS}/${productId}/${FIREBASE_COLLECTIONS.PRODUCT_VARIANTS}/${variantId}`,

  // Inventory paths
  inventoryItem: (itemId: string) =>
    `${FIREBASE_COLLECTIONS.INVENTORY_ITEMS}/${itemId}`,
  stockMovement: (movementId: string) =>
    `${FIREBASE_COLLECTIONS.STOCK_MOVEMENTS}/${movementId}`,

  // Sales paths
  salesOrder: (orderId: string) =>
    `${FIREBASE_COLLECTIONS.SALES_ORDERS}/${orderId}`,
  orderItem: (orderId: string, itemId: string) =>
    `${FIREBASE_COLLECTIONS.SALES_ORDERS}/${orderId}/${FIREBASE_COLLECTIONS.ORDER_ITEMS}/${itemId}`,

  // Returns paths
  return: (returnId: string) => `${FIREBASE_COLLECTIONS.RETURNS}/${returnId}`,
  returnItem: (returnId: string, itemId: string) =>
    `${FIREBASE_COLLECTIONS.RETURNS}/${returnId}/${FIREBASE_COLLECTIONS.RETURN_ITEMS}/${itemId}`,

  // User paths
  user: (userId: string) => `${FIREBASE_COLLECTIONS.USERS}/${userId}`,
  customer: (customerId: string) =>
    `${FIREBASE_COLLECTIONS.CUSTOMERS}/${customerId}`,
  supplier: (supplierId: string) =>
    `${FIREBASE_COLLECTIONS.SUPPLIERS}/${supplierId}`,
};

// =============================================================================
// COMMON FIREBASE FIELD TYPES
// =============================================================================

export interface FirebaseBaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseAuditableDocument extends FirebaseBaseDocument {
  createdBy: string;
  updatedBy: string;
}

export interface FirebaseSoftDeletableDocument extends FirebaseBaseDocument {
  isDeleted: boolean;
  deletedAt?: Timestamp;
  deletedBy?: string;
}

// =============================================================================
// FIREBASE VALIDATION SCHEMAS (Using TypeScript for runtime validation)
// =============================================================================

export const VALIDATION_PATTERNS = {
  IMEI: /^\d{15}$/,
  SERIAL_NUMBER: /^[A-Z0-9]{8,20}$/,
  SKU: /^[A-Z0-9\-]{3,50}$/,
  PHONE: /^(\+84|0)[0-9]{9,10}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ORDER_NUMBER: /^(SO|PO|RT)-\d{8}-\d{4}$/,
} as const;

export const VALIDATION_RULES = {
  PRODUCT_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  PRICE: {
    MIN: 0,
    MAX: 999999999,
  },
  IMEI: {
    LENGTH: 15,
  },
  SERIAL_NUMBER: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 20,
  },
  CUSTOMER_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  ORDER_QUANTITY: {
    MIN: 1,
    MAX: 1000,
  },
} as const;

// =============================================================================
// FIREBASE COMPOSITE INDEX REQUIREMENTS
// =============================================================================

export const REQUIRED_FIRESTORE_INDEXES = [
  // Inventory queries (UC02)
  {
    collectionGroup: FIREBASE_COLLECTIONS.INVENTORY_ITEMS,
    fields: [
      { field: "variantId", order: "ASCENDING" },
      { field: "status", order: "ASCENDING" },
      { field: "entryDate", order: "DESCENDING" },
    ],
  },
  {
    collectionGroup: FIREBASE_COLLECTIONS.INVENTORY_ITEMS,
    fields: [{ field: "imei", order: "ASCENDING" }],
  },
  // UC02: IMEI validation queries
  {
    collectionGroup: FIREBASE_COLLECTIONS.INVENTORY_ITEMS,
    fields: [
      { field: "imei", order: "ASCENDING" },
      { field: "status", order: "ASCENDING" },
    ],
  },
  // UC02: Available stock queries
  {
    collectionGroup: FIREBASE_COLLECTIONS.INVENTORY_ITEMS,
    fields: [
      { field: "variantId", order: "ASCENDING" },
      { field: "status", order: "ASCENDING" },
      { field: "entryDate", order: "ASCENDING" }, // FIFO ordering
    ],
  },
  // UC02: Purchase order queries
  {
    collectionGroup: FIREBASE_COLLECTIONS.PURCHASE_ORDERS,
    fields: [
      { field: "orderDate", order: "DESCENDING" },
      { field: "status", order: "ASCENDING" },
    ],
  },
  // UC02: Stock movement tracking
  {
    collectionGroup: FIREBASE_COLLECTIONS.STOCK_MOVEMENTS,
    fields: [
      { field: "inventoryItemId", order: "ASCENDING" },
      { field: "timestamp", order: "DESCENDING" },
    ],
  },
  // UC02: Recent stock movements
  {
    collectionGroup: FIREBASE_COLLECTIONS.STOCK_MOVEMENTS,
    fields: [
      { field: "timestamp", order: "DESCENDING" },
      { field: "movementType", order: "ASCENDING" },
    ],
  },

  // Sales queries (UC03)
  {
    collectionGroup: FIREBASE_COLLECTIONS.SALES_ORDERS,
    fields: [
      { field: "orderDate", order: "DESCENDING" },
      { field: "orderStatus", order: "ASCENDING" },
      { field: "paymentStatus", order: "ASCENDING" },
    ],
  },
  {
    collectionGroup: FIREBASE_COLLECTIONS.SALES_ORDERS,
    fields: [
      { field: "staffId", order: "ASCENDING" },
      { field: "orderDate", order: "DESCENDING" },
    ],
  },
  {
    collectionGroup: FIREBASE_COLLECTIONS.RETURNS,
    fields: [
      { field: "returnDate", order: "DESCENDING" },
      { field: "returnStatus", order: "ASCENDING" },
    ],
  },
  {
    collectionGroup: FIREBASE_COLLECTIONS.PRODUCTS,
    fields: [
      { field: "name", order: "ASCENDING" },
      { field: "isActive", order: "ASCENDING" },
    ],
  },
] as const;

// =============================================================================
// FIREBASE SECURITY RULES TEMPLATES
// =============================================================================

export const SECURITY_RULE_FUNCTIONS = {
  // Check if user is authenticated
  isAuthenticated: () => "request.auth != null",

  // Check user role
  hasRole: (role: string) => `
    request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "${role}"
  `,

  // Check if user owns document
  isOwner: (field: string = "createdBy") => `
    request.auth != null && 
    resource.data.${field} == request.auth.uid
  `,

  // Check if user is staff (sales_staff, warehouse_staff, store_manager, admin)
  isStaff: () => `
    request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in 
    ["sales_staff", "warehouse_staff", "store_manager", "admin"]
  `,

  // Check if user is manager or admin
  isManagerOrAdmin: () => `
    request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in 
    ["store_manager", "admin"]
  `,

  // Validate required fields
  hasRequiredFields: (fields: string[]) =>
    fields.map((field) => `"${field}" in request.resource.data`).join(" && "),

  // Validate IMEI format
  isValidIMEI: (field: string = "imei") => `
    request.resource.data.${field} is string && 
    request.resource.data.${field}.matches('^\\\\d{15}$')
  `,

  // Validate price is positive
  isValidPrice: (field: string = "price") => `
    request.resource.data.${field} is number && 
    request.resource.data.${field} >= 0
  `,
} as const;

// =============================================================================
// FIREBASE CLOUD FUNCTION TRIGGERS
// =============================================================================

export const CLOUD_FUNCTION_TRIGGERS = {
  // Inventory management triggers
  onInventoryItemCreate: `${FIREBASE_COLLECTIONS.INVENTORY_ITEMS}/{itemId}`,
  onInventoryItemUpdate: `${FIREBASE_COLLECTIONS.INVENTORY_ITEMS}/{itemId}`,

  // Sales order triggers
  onSalesOrderCreate: `${FIREBASE_COLLECTIONS.SALES_ORDERS}/{orderId}`,
  onSalesOrderUpdate: `${FIREBASE_COLLECTIONS.SALES_ORDERS}/{orderId}`,

  // Stock movement triggers
  onStockMovementCreate: `${FIREBASE_COLLECTIONS.STOCK_MOVEMENTS}/{movementId}`,

  // Return processing triggers
  onReturnCreate: `${FIREBASE_COLLECTIONS.RETURNS}/{returnId}`,
  onReturnUpdate: `${FIREBASE_COLLECTIONS.RETURNS}/{returnId}`,

  // Daily aggregation triggers (Scheduled functions)
  dailyReportGeneration: "daily-report-generation",
  monthlyReportGeneration: "monthly-report-generation",
  inventoryValuation: "inventory-valuation",
} as const;

// =============================================================================
// ERROR CODES FOR FIREBASE OPERATIONS
// =============================================================================

export const FIREBASE_ERROR_CODES = {
  // Authentication errors
  UNAUTHENTICATED: "unauthenticated",
  PERMISSION_DENIED: "permission-denied",

  // Data validation errors
  INVALID_IMEI: "invalid-imei",
  DUPLICATE_IMEI: "duplicate-imei",
  INVALID_SKU: "invalid-sku",
  DUPLICATE_SKU: "duplicate-sku",
  INVALID_PRICE: "invalid-price",

  // Business logic errors
  INSUFFICIENT_STOCK: "insufficient-stock",
  PRODUCT_NOT_AVAILABLE: "product-not-available",
  RETURN_PERIOD_EXPIRED: "return-period-expired",
  INVALID_ORDER_STATUS: "invalid-order-status",

  // System errors
  DOCUMENT_NOT_FOUND: "not-found",
  NETWORK_ERROR: "unavailable",
  QUOTA_EXCEEDED: "resource-exhausted",
} as const;

export type FirebaseErrorCode =
  (typeof FIREBASE_ERROR_CODES)[keyof typeof FIREBASE_ERROR_CODES];
