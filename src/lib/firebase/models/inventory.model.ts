import { Timestamp } from "firebase/firestore";
import { FirebaseAuditableDocument, FirebaseSupplier } from "./index";
import {
  PRODUCT_STATUS,
  STOCK_MOVEMENT_TYPES,
  type ProductStatusType,
  type StockMovementType,
} from "@/constants";

// =============================================================================
// INVENTORY MODEL (UC02: Inventory Intake Management)
// Collection: inventoryItems
// =============================================================================

/**
 * Individual inventory item (specific IMEI/Serial)
 * Document path: inventoryItems/{itemId}
 * Core entity for inventory tracking
 */
export interface FirebaseInventoryItem extends FirebaseAuditableDocument {
  // Unique identification
  imei: string; // 15-digit IMEI (indexed, unique)

  // Product references
  productId: string; // Reference to products collection
  variantId: string; // Reference to productVariants subcollection

  // Denormalized product info (for performance)
  productName: string; // e.g., "iPhone 15 Pro Max"
  variantSku: string; // e.g., "IP15PM-256-TN"
  colorName: string; // e.g., "Titan Natural"
  storageCapacity: string; // e.g., "256GB"

  // Status and lifecycle
  status: ProductStatusType;

  // Entry information
  entryDate: Timestamp;
  entryPrice: number; // Actual purchase price for this unit


  // Supply chain tracking
  supplierName?: string; // Reference to suppliers
  purchaseOrderId?: string; // Reference to purchaseOrders
  batchNumber?: string; // Supplier batch/lot number

  // Physical location and handling
  currentLocation: string; // e.g., "Main Store", "Warehouse A", "Display"
  warehouseStaffId?: string; // Who handled the item

  // Condition and quality
  condition: "new" | "excellent" | "good" | "fair" | "damaged" | "defective";
  qualityNotes?: string;

  // Warranty tracking
  warrantyStartDate?: Timestamp; // Usually sale date
  warrantyEndDate?: Timestamp; // Calculated from sale date + period
  warrantyPeriodMonths: number; // Default 12 for new iPhones

  // Apple-specific tracking
  appleWarrantyStatus?: "active" | "expired" | "void";
  lastAppleWarrantyCheck?: Timestamp;

  // Return tracking
  returnOrderId?: string; // If item was returned
  returnDate?: Timestamp;
  returnReason?: string;

  // Special flags
  isDisplayUnit: boolean; // Used for display/demo
  isRefurbished: boolean; // Refurbished unit
  hasDefects: boolean; // Any known defects
  needsRepair: boolean; // Requires repair before sale

  // Pricing history
  originalRetailPrice: number; // Retail price when first entered
  currentRetailPrice: number; // Current retail price (may change)

  // Sale information
  salesOrderId?: string;
  saleDate?: Timestamp;
  actualSalePrice?: number;

  // Additional metadata
  notes?: string;
  tags?: string[]; // e.g., ["display", "demo", "vip-customer"]

  // Last update tracking
  lastStatusChange: Timestamp;
  lastLocationChange: Timestamp;
  lastPriceUpdate: Timestamp;
}

/**
 * Stock movement log for complete audit trail
 * Document path: stockMovements/{movementId}
 */
export interface FirebaseStockMovement extends FirebaseAuditableDocument {
  // Item reference
  inventoryItemId: string;
  imei: string; // Denormalized for faster queries

  // Movement details
  movementType: StockMovementType;
  timestamp: Timestamp;

  // Quantity change (usually +1 or -1 for IMEI items)
  quantityChange: number;

  // Status changes
  previousStatus?: ProductStatusType;
  newStatus?: ProductStatusType;

  // Location changes
  fromLocation?: string;
  toLocation?: string;

  // Actor and context
  userId: string; // Who performed the action
  userRole: string; // Role at time of action
  reason?: string; // Reason for movement
  notes?: string;

  // Related documents
  relatedOrderId?: string; // Sale order, purchase order, return order
  relatedDocumentType?:
    | "sale"
    | "purchase"
    | "return"
    | "adjustment"
    | "transfer";

  // Batch operation tracking
  batchId?: string; // If part of bulk operation
  batchSequence?: number; // Order within batch

  // Additional context
  deviceInfo?: string; // Device used for operation
  locationInfo?: string; // GPS or store location
  ipAddress?: string; // For security audit
}

/**
 * Purchase order for inventory intake
 * Document path: purchaseOrders/{orderId}
 */
export interface FirebasePurchaseOrder extends FirebaseAuditableDocument {
  // Order identification
  orderNumber: string; // e.g., "PO-20241215-0001"

  // Supplier information
  supplierName: string;
  supplierContact?: {
    name: string;
    phone: string;
    email: string;
  };

  // Order dates
  orderDate: Timestamp;
  expectedDeliveryDate?: Timestamp;
  actualDeliveryDate?: Timestamp;

  // Status
  status: "pending" | "partially_received" | "completed" | "cancelled";

  // Financial information
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  currency: string; // Usually "VND"

  // Payment tracking
  paymentTerms?: string;
  paymentDueDate?: Timestamp;
  paidAmount: number;
  paymentStatus: "pending" | "partial" | "paid" | "overdue";

  // Receiving information
  receivedBy?: string; // User ID who received
  receivedByName?: string; // Denormalized
  receivingNotes?: string;

  // Quality control
  qualityChecked: boolean;
  qualityCheckedBy?: string;
  qualityNotes?: string;

  // Discrepancies
  hasDiscrepancies: boolean;
  discrepancyNotes?: string;

  // External references
  supplierInvoiceNumber?: string;
  trackingNumber?: string;

  // Items summary (detailed items in subcollection)
  totalItemsOrdered: number;
  totalItemsReceived: number;
  totalVariants: number;

  // Additional information
  notes?: string;
  internalNotes?: string; // Internal use only
}

/**
 * Purchase order items (subcollection)
 * Document path: purchaseOrders/{orderId}/orderItems/{itemId}
 */
export interface FirebasePurchaseOrderItem extends FirebaseAuditableDocument {
  // Product references
  productId: string;
  variantId: string;

  // Denormalized product info
  productName: string;
  variantSku: string;
  colorName: string;
  storageCapacity: string;

  // Order quantities
  quantityOrdered: number;
  quantityReceived: number;
  quantityPending: number;
  quantityRejected: number;

  // Pricing
  unitCost: number;
  totalCost: number;

  // Expected vs actual IMEIs
  expectedImeis?: string[]; // If known in advance
  receivedImeis: string[]; // Actually received
  rejectedImeis?: string[]; // Rejected due to defects

  // Receiving details
  receivedDate?: Timestamp;
  receivedBy?: string;

  // Quality information
  condition: "new" | "excellent" | "good" | "fair" | "damaged";
  qualityNotes?: string;

  // Additional info
  notes?: string;
}

/**
 * Inventory adjustment record
 * Document path: inventoryAdjustments/{adjustmentId}
 */
export interface FirebaseInventoryAdjustment extends FirebaseAuditableDocument {
  // Adjustment identification
  adjustmentNumber: string; // e.g., "ADJ-20241215-0001"

  // Adjustment details
  adjustmentDate: Timestamp;
  adjustmentType:
    | "count_correction"
    | "status_change"
    | "damage"
    | "theft"
    | "found"
    | "other";
  reason: string;

  // Approval workflow
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: Timestamp;
  rejectedReason?: string;

  // Items affected (summary)
  totalItemsAdjusted: number;
  totalValueAdjustment: number; // Positive or negative

  // Additional information
  notes?: string;
  supportingDocuments?: string[]; // URLs to supporting files
}

/**
 * Inventory adjustment items (subcollection)
 * Document path: inventoryAdjustments/{adjustmentId}/adjustmentItems/{itemId}
 */
export interface FirebaseInventoryAdjustmentItem
  extends FirebaseAuditableDocument {
  // Item reference
  inventoryItemId: string;
  imei: string;

  // Changes made
  previousStatus: ProductStatusType;
  newStatus: ProductStatusType;
  previousLocation?: string;
  newLocation?: string;
  previousCondition?: string;
  newCondition?: string;

  // Financial impact
  valueAdjustment: number; // Change in inventory value

  // Reason and notes
  reason: string;
  notes?: string;

  // Evidence
  photoUrls?: string[]; // Photos of damaged items, etc.
}

// =============================================================================
// INPUT/OUTPUT SCHEMAS
// =============================================================================

/**
 * Stock intake input (UC02)
 */
export interface StockIntakeInput {
  // Purchase order info
  supplierName?: string;
  orderNumber?: string;
  expectedDeliveryDate?: Date;

  // Items to add
  items: Array<{
    productId: string;
    variantId: string;
    imeis: string[]; // List of IMEIs for this variant
    unitCost: number;
    condition?: "new" | "excellent" | "good" | "fair" | "damaged";
    location?: string; // Defaults to main store
    notes?: string;
  }>;

  // Additional info
  notes?: string;
  qualityNotes?: string;
  supplier: FirebaseSupplier; // Supplier details
}

/**
 * Stock movement input
 */
export interface CreateStockMovementInput {
  inventoryItemId: string;
  movementType: StockMovementType;
  newStatus?: ProductStatusType;
  toLocation?: string;
  reason?: string;
  notes?: string;
  relatedOrderId?: string;
  relatedDocumentType?:
    | "sale"
    | "purchase"
    | "return"
    | "adjustment"
    | "transfer";
}

/**
 * Bulk inventory update
 */
export interface BulkInventoryUpdateInput {
  imeis: string[];
  updates: {
    status?: ProductStatusType;
    location?: string;
    condition?: string;
    notes?: string;
  };
  reason: string;
  movementType: StockMovementType;
}

/**
 * Inventory search filters
 */
export interface InventorySearchFilters {
  // Product filters
  productId?: string;
  variantId?: string;
  productName?: string;
  colorName?: string;
  storageCapacity?: string;

  // IMEI/Serial search
  imei?: string;

  // Status filters
  status?: ProductStatusType[];
  condition?: string[];

  // Location filters
  location?: string[];

  // Date filters
  entryDateFrom?: Date;
  entryDateTo?: Date;

  // Price filters
  minPrice?: number;
  maxPrice?: number;

  // Special flags
  isDisplayUnit?: boolean;
  isRefurbished?: boolean;
  hasDefects?: boolean;
  needsRepair?: boolean;

  // Supplier/Order filters
  supplierName?: string;
  purchaseOrderId?: string;
  saleOrderId?: string;

  // Sorting
  sortBy?: "entryDate" | "soldDate" | "price" | "status" | "location" | "imei";
  sortOrder?: "asc" | "desc";

  // Pagination
  limit?: number;
  startAfter?: any;
}

// =============================================================================
// QUERY HELPERS
// =============================================================================

export const InventoryQueries = {
  // Get available stock for a variant
  getAvailableStock: (variantId: string) => ({
    collection: "inventoryItems",
    where: [
      ["variantId", "==", variantId],
      ["status", "in", ["in_stock", "returned_available"]],
    ],
    orderBy: [["entryDate", "asc"]], // FIFO
  }),

  // Find item by IMEI
  findByImei: (imei: string) => ({
    collection: "inventoryItems",
    where: [["imei", "==", imei]],
    limit: 1,
  }),

  // Get low stock items
  getLowStockItems: () => ({
    collection: "inventoryItems",
    where: [
      ["status", "in", ["in_stock", "returned_available"]],
      // Note: Low stock determination requires aggregation by variant
    ],
  }),

  // Get stock movements for an item
  getItemMovements: (inventoryItemId: string) => ({
    collection: "stockMovements",
    where: [["inventoryItemId", "==", inventoryItemId]],
    orderBy: [["timestamp", "desc"]],
  }),

  // Get recent stock movements
  getRecentMovements: (limit: number = 50) => ({
    collection: "stockMovements",
    orderBy: [["timestamp", "desc"]],
    limit,
  }),
} as const;
