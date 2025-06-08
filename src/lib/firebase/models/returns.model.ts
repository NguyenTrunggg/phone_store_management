import { Timestamp } from "firebase/firestore";
import { FirebaseAuditableDocument } from "./index";
import {
  RETURN_STATUS,
  RETURN_REASONS,
  RETURN_ACTIONS,
  type ReturnStatusType,
  type ReturnReasonType,
  type ReturnActionType,
} from "@/constants";

// =============================================================================
// RETURNS MODEL (UC05: Returns Processing)
// Collection: returns
// =============================================================================

/**
 * Return order document
 * Document path: returns/{returnId}
 */
export interface FirebaseReturn extends FirebaseAuditableDocument {
  // Return identification
  returnNumber: string; // e.g., "RT-20241215-0001"

  // Original order reference
  originalOrderId: string; // Reference to sales_orders
  originalOrderNumber: string; // Denormalized for quick reference

  // Customer information
  customerId?: string;
  customerInfo: {
    name: string;
    phone?: string;
    email?: string;
  };

  // Staff handling the return
  processedBy: string; // User ID of staff processing return
  processedByName: string; // Denormalized staff name
  approvedBy?: string; // User ID of manager who approved (if required)
  approvedByName?: string; // Denormalized manager name

  // Return dates and timing
  returnDate: Timestamp; // When customer requested return
  processedDate?: Timestamp; // When return was processed
  approvedDate?: Timestamp; // When return was approved
  completedDate?: Timestamp; // When return was fully completed

  // Return details
  returnReason: ReturnReasonType;
  detailedReason?: string; // Additional explanation from customer
  customerComplaints?: string[]; // Specific issues mentioned by customer

  // Return status workflow
  returnStatus: ReturnStatusType;
  previousStatus?: ReturnStatusType;
  statusHistory: Array<{
    status: ReturnStatusType;
    timestamp: Timestamp;
    changedBy: string; // User ID
    notes?: string;
  }>;

  // Financial summary
  originalTotalAmount: number; // Total amount of original order
  returnTotalAmount: number; // Total amount being returned
  refundAmount: number; // Actual refund amount (may differ due to restocking fees)
  restockingFee: number; // Fee charged for return (if any)
  exchangeAdjustment: number; // Price difference for exchanges

  // Return policy compliance
  returnPolicyId?: string; // Reference to applicable return policy
  isWithinReturnPeriod: boolean;
  returnPeriodDays: number; // Number of days from purchase
  policyViolations?: string[]; // Any policy violations noted

  // Manager approval (for exceptions)
  requiresApproval: boolean;
  approvalReason?: string;
  isException: boolean; // Return approved despite policy violations

  // Resolution details
  resolutionAction: ReturnActionType;
  resolutionNotes?: string;

  // Refund processing
  refundMethod: "cash" | "original_payment" | "store_credit" | "exchange_only";
  refundReference?: string; // Transaction ID for refund
  refundProcessedDate?: Timestamp;
  storeCreditId?: string; // If refunded as store credit

  // Exchange details (if applicable)
  exchangeOrderId?: string; // New order created for exchange
  isExchange: boolean;

  // Quality assessment
  qualityAssessment?: {
    assessedBy: string; // User ID
    assessmentDate: Timestamp;
    overallCondition: "excellent" | "good" | "fair" | "poor" | "damaged";
    findings: Array<{
      category:
        | "physical_damage"
        | "functional_issue"
        | "cosmetic_wear"
        | "missing_parts";
      severity: "minor" | "moderate" | "major";
      description: string;
      affectsResale: boolean;
    }>;
    photos?: string[]; // URLs to assessment photos
    canResell: boolean;
    suggestedAction:
      | "resell_as_new"
      | "resell_as_refurbished"
      | "send_for_repair"
      | "dispose";
  };

  // Items summary (detailed items in subcollection)
  totalItemsReturned: number;
  totalItemsProcessed: number;

  // Additional information
  notes?: string; // Staff notes
  internalNotes?: string; // Internal processing notes
  tags?: string[]; // e.g., ["damaged", "DOA", "customer_error"]

  // Follow-up actions
  followUpRequired: boolean;
  followUpDate?: Timestamp;
  followUpNotes?: string;

  // Documentation
  hasReceipt: boolean;
  hasOriginalPackaging: boolean;
  hasAccessories: boolean;
  supportingDocuments?: Array<{
    type: "receipt" | "warranty_card" | "photo" | "other";
    url: string;
    description?: string;
  }>;
}

/**
 * Return items (subcollection)
 * Document path: returns/{returnId}/returnItems/{itemId}
 */
export interface FirebaseReturnItem extends FirebaseAuditableDocument {
  // Original order item reference
  originalOrderItemId: string;

  // Product identification
  inventoryItemId: string; // Specific IMEI being returned
  productId: string;
  variantId: string;

  // Denormalized product info
  productName: string;
  variantSku: string;
  imei: string;
  colorName: string;
  storageCapacity: string;

  // Return quantity (usually 1 for IMEI items)
  quantityReturned: number;
  quantityAccepted: number; // May be less if partially rejected
  quantityRejected: number;

  // Pricing information
  originalUnitPrice: number;
  returnUnitPrice: number; // Price for return calculation
  refundAmount: number; // Actual refund for this item
  restockingFee: number; // Fee for this specific item

  // Item-specific return details
  itemReturnReason: ReturnReasonType;
  itemDescription?: string; // Specific issue with this item

  // Item condition assessment
  receivedCondition:
    | "excellent"
    | "good"
    | "fair"
    | "poor"
    | "damaged"
    | "defective";
  conditionNotes?: string;
  hasOriginalPackaging: boolean;
  hasAccessories: boolean;
  accessoryList?: string[]; // List of included accessories

  // Item processing
  itemStatus:
    | "pending"
    | "inspected"
    | "accepted"
    | "rejected"
    | "pending_repair";
  inspectedBy?: string; // User ID who inspected item
  inspectionDate?: Timestamp;
  inspectionNotes?: string;

  // Resolution for this item
  itemAction: ReturnActionType;
  actionNotes?: string;

  // Inventory impact
  willRestockAsNew: boolean;
  willRestockAsRefurbished: boolean;
  needsRepair: boolean;
  willDispose: boolean;

  // Exchange item (if this is an exchange)
  exchangeItemId?: string; // New inventory item given in exchange

  // Warranty considerations
  isUnderWarranty: boolean;
  warrantyClaimId?: string; // If processing as warranty claim

  // Quality control
  qcPassed: boolean;
  qcNotes?: string;
  qcDate?: Timestamp;
  qcBy?: string;

  // Photos and documentation
  itemPhotos?: Array<{
    url: string;
    description: string;
    takenBy: string;
    timestamp: Timestamp;
  }>;

  // Additional item notes
  notes?: string;
}

/**
 * Return policy configuration
 * Document path: returnPolicies/{policyId}
 */
export interface FirebaseReturnPolicy extends FirebaseAuditableDocument {
  // Policy identification
  name: string; // e.g., "Standard iPhone Return Policy"
  description: string;
  version: string;

  // Policy scope
  applicableProductCategories: string[];
  applicableProductIds?: string[]; // Specific products if needed
  customerTiers?: string[]; // Which customer tiers this applies to

  // Time limits
  returnPeriodDays: number; // Days from purchase date
  exchangePeriodDays: number; // Days for exchanges (may be different)
  warrantyPeriodDays?: number; // Warranty period covered by this policy

  // Conditions
  conditions: {
    requiresOriginalPackaging: boolean;
    requiresAccessories: boolean;
    requiresReceipt: boolean;
    maxUsageAllowed: "none" | "minimal" | "normal"; // How much usage is acceptable
    allowedDamageLevel: "none" | "cosmetic" | "minor_functional";
  };

  // Financial terms
  financialTerms: {
    restockingFeePercentage: number;
    minimumRestockingFee: number;
    maximumRestockingFee: number;
    refundMethod: ("original_payment" | "store_credit" | "cash")[];
    exchangeAllowed: boolean;
    partialRefundAllowed: boolean;
  };

  // Approval requirements
  approvalRules: {
    requiresManagerApproval: boolean;
    managerApprovalThreshold?: number; // Amount above which approval needed
    autoApproveUnder?: number; // Amount below which auto-approve
    approvalReasons: string[]; // Valid reasons requiring approval
  };

  // Exceptions
  exceptions: {
    allowExceptions: boolean;
    exceptionRequiresApproval: boolean;
    maxExceptionValue?: number;
    commonExceptionReasons: string[];
  };

  // Policy status
  isActive: boolean;
  effectiveDate: Timestamp;
  expiryDate?: Timestamp;

  // Policy terms (detailed text)
  termsAndConditions?: string;
  customerFacingTerms?: string; // Simplified terms for customers
}

/**
 * Store credit document
 * Document path: storeCredits/{creditId}
 */
export interface FirebaseStoreCredit extends FirebaseAuditableDocument {
  // Credit identification
  creditNumber: string; // e.g., "SC-20241215-0001"

  // Customer reference
  customerId: string;
  customerName: string; // Denormalized

  // Credit details
  originalAmount: number;
  currentBalance: number;
  usedAmount: number;

  // Origin
  sourceType:
    | "return_refund"
    | "exchange_difference"
    | "compensation"
    | "promotion"
    | "manual";
  sourceOrderId?: string; // Original order that generated this credit
  sourceReturnId?: string; // Return that generated this credit
  sourceNotes?: string;

  // Validity
  issuedDate: Timestamp;
  expiryDate?: Timestamp;
  isActive: boolean;

  // Usage tracking
  usageHistory: Array<{
    usedAmount: number;
    usedDate: Timestamp;
    usedInOrderId: string;
    remainingBalance: number;
    usedBy: string; // Staff user ID
  }>;

  // Additional info
  notes?: string;
  isTransferable: boolean; // Can be transferred to another customer

  // Approval (for manual credits)
  issuedBy: string; // User ID
  approvedBy?: string; // Manager approval if required
}

// =============================================================================
// INPUT/OUTPUT SCHEMAS
// =============================================================================

/**
 * Create return input
 */
export interface CreateReturnInput {
  // Original order reference
  originalOrderId?: string; // Can be provided if known
  originalOrderNumber?: string; // Alternative lookup method
  imei?: string; // Alternative lookup by IMEI

  // Customer info (if not found through order)
  customerInfo?: {
    name: string;
    phone?: string;
    email?: string;
  };

  // Return details
  returnReason: ReturnReasonType;
  detailedReason?: string;
  customerComplaints?: string[];

  // Items being returned
  items: Array<{
    inventoryItemId?: string; // If known
    imei: string; // For lookup if inventoryItemId not provided
    quantityReturned: number; // Usually 1
    itemReturnReason?: ReturnReasonType;
    itemDescription?: string;
    receivedCondition:
      | "excellent"
      | "good"
      | "fair"
      | "poor"
      | "damaged"
      | "defective";
    hasOriginalPackaging: boolean;
    hasAccessories: boolean;
    conditionNotes?: string;
  }>;

  // Desired resolution
  preferredResolution: ReturnActionType;

  // Documentation
  hasReceipt: boolean;
  notes?: string;
}

/**
 * Process return input
 */
export interface ProcessReturnInput {
  // Processing decisions
  resolutionAction: ReturnActionType;
  resolutionNotes?: string;

  // Item-level decisions
  itemDecisions: Array<{
    returnItemId: string;
    itemAction: ReturnActionType;
    quantityAccepted: number;
    quantityRejected: number;
    willRestockAsNew?: boolean;
    willRestockAsRefurbished?: boolean;
    needsRepair?: boolean;
    actionNotes?: string;
  }>;

  // Financial adjustments
  refundAmount: number;
  restockingFee: number;
  refundMethod: "cash" | "original_payment" | "store_credit" | "exchange_only";

  // Quality assessment
  qualityAssessment?: {
    overallCondition: "excellent" | "good" | "fair" | "poor" | "damaged";
    canResell: boolean;
    findings: Array<{
      category:
        | "physical_damage"
        | "functional_issue"
        | "cosmetic_wear"
        | "missing_parts";
      severity: "minor" | "moderate" | "major";
      description: string;
    }>;
  };

  // Processing notes
  notes?: string;
  internalNotes?: string;
}

/**
 * Return search and filtering
 */
export interface ReturnSearchFilters {
  // Basic search
  returnNumber?: string;
  originalOrderNumber?: string;
  imei?: string;

  // Status filters
  returnStatus?: ReturnStatusType[];
  resolutionAction?: ReturnActionType[];

  // Date filters
  returnDateFrom?: Date;
  returnDateTo?: Date;
  processedDateFrom?: Date;
  processedDateTo?: Date;

  // Staff filters
  processedBy?: string;
  approvedBy?: string;

  // Customer filters
  customerId?: string;
  customerName?: string;
  customerPhone?: string;

  // Reason filters
  returnReason?: ReturnReasonType[];

  // Financial filters
  minRefundAmount?: number;
  maxRefundAmount?: number;
  hasRestockingFee?: boolean;

  // Quality filters
  requiresApproval?: boolean;
  isException?: boolean;
  qualityCondition?: string[];

  // Product filters
  productId?: string;
  variantId?: string;

  // Tags
  tags?: string[];

  // Sorting
  sortBy?: "returnDate" | "processedDate" | "refundAmount" | "returnNumber";
  sortOrder?: "asc" | "desc";

  // Pagination
  limit?: number;
  startAfter?: any;
}

/**
 * Return analytics result
 */
export interface ReturnAnalyticsResult {
  // Period
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Timestamp;

  // Overall metrics
  totalReturns: number;
  totalReturnValue: number;
  totalRefundAmount: number;
  averageReturnValue: number;
  returnRate: number; // Percentage of sales that were returned

  // Return reasons breakdown
  reasonBreakdown: Record<
    ReturnReasonType,
    {
      count: number;
      percentage: number;
      totalValue: number;
    }
  >;

  // Resolution actions breakdown
  actionBreakdown: Record<
    ReturnActionType,
    {
      count: number;
      percentage: number;
      totalValue: number;
    }
  >;

  // Product analysis
  topReturnedProducts: Array<{
    productId: string;
    productName: string;
    returnCount: number;
    returnRate: number;
    totalReturnValue: number;
    commonReasons: string[];
  }>;

  // Staff performance
  staffPerformance: Array<{
    staffId: string;
    staffName: string;
    returnsProcessed: number;
    averageProcessingTime: number; // Hours
    customerSatisfactionScore?: number;
  }>;

  // Time analysis
  processingMetrics: {
    averageProcessingTime: number; // Hours from request to completion
    sameDay: number; // Returns processed same day
    withinSLA: number; // Returns processed within SLA
  };

  // Financial impact
  financialImpact: {
    totalRefunds: number;
    totalRestockingFees: number;
    netFinancialImpact: number; // Total refunds minus restocking fees
    exchangeValue: number; // Value of items given in exchanges
  };

  // Quality insights
  qualityMetrics: {
    itemsRestockedAsNew: number;
    itemsRestockedAsRefurbished: number;
    itemsNeedingRepair: number;
    itemsDisposed: number;
  };
}

// =============================================================================
// QUERY HELPERS
// =============================================================================

export const ReturnQueries = {
  // Get pending returns
  getPendingReturns: () => ({
    collection: "returns",
    where: [["returnStatus", "in", ["pending", "processing"]]],
    orderBy: [["returnDate", "asc"]],
  }),

  // Get returns requiring approval
  getReturnsRequiringApproval: () => ({
    collection: "returns",
    where: [
      ["requiresApproval", "==", true],
      ["returnStatus", "==", "pending"],
    ],
    orderBy: [["returnDate", "asc"]],
  }),

  // Get returns by original order
  getReturnsByOriginalOrder: (orderId: string) => ({
    collection: "returns",
    where: [["originalOrderId", "==", orderId]],
    orderBy: [["returnDate", "desc"]],
  }),

  // Get returns by customer
  getReturnsByCustomer: (customerId: string) => ({
    collection: "returns",
    where: [["customerId", "==", customerId]],
    orderBy: [["returnDate", "desc"]],
  }),

  // Get returns by IMEI
  getReturnsByImei: (imei: string) => ({
    collectionGroup: "returnItems",
    where: [["imei", "==", imei]],
    orderBy: [["createdAt", "desc"]],
  }),

  // Get returns in date range
  getReturnsByDateRange: (startDate: Date, endDate: Date) => ({
    collection: "returns",
    where: [
      ["returnDate", ">=", Timestamp.fromDate(startDate)],
      ["returnDate", "<=", Timestamp.fromDate(endDate)],
    ],
    orderBy: [["returnDate", "desc"]],
  }),

  // Get high-value returns
  getHighValueReturns: (minAmount: number) => ({
    collection: "returns",
    where: [["returnTotalAmount", ">=", minAmount]],
    orderBy: [["returnTotalAmount", "desc"]],
  }),
} as const;

export interface FirebaseReturnRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  inventoryItemId: string;
  imei: string;
  productId: string;
  productName: string;
  variantId: string;
  variantSku: string;
  salePrice: number;
  customerId: string;
  customerName: string;
  customerPhone: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  requestedAt: Timestamp;
  processedAt?: Timestamp;
  processedBy?: string; // User ID of the staff who processed the request
}

export interface CreateReturnRequestInput {
  imei: string;
  reason?: string;
}

export interface ProcessReturnRequestInput {
  action: "approve" | "reject";
}
