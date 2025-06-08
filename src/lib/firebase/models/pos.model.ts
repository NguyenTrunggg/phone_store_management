import { Timestamp } from "firebase/firestore";
import { FirebaseAuditableDocument } from "./index";
import { ProductStatusType } from "@/constants";

// =============================================================================
// POS MODEL (Point of Sale)
// Collections: salesOrders, salesOrders/{orderId}/items
// =============================================================================

export interface FirebasePosCustomerInfo {
  name?: string;
  phone?: string;
  email?: string;
  address?: string; // For delivery or record keeping
}

/**
 * Sales Order document
 * Document path: salesOrders/{salesOrderId}
 */
export interface FirebaseSalesOrder extends FirebaseAuditableDocument {
  // Order identification
  orderNumber: string; // e.g., "SO-20240715-0001"
  orderDate: Timestamp;

  // Customer information (denormalized for simplicity, can be linked to a customers collection later)
  customerInfo?: FirebasePosCustomerInfo;
  customerId?: string; // Optional: Link to a 'customers' collection

  // Financial summary
  subtotalAmount: number; // Sum of (item.salePrice * item.quantity) before tax/discount
  taxRate: number; // e.g., 0.10 for 10% VAT
  taxAmount: number;
  discountAmount: number; // Total discount applied to the order
  shippingAmount: number; // If applicable
  totalAmount: number; // Final amount paid by customer (subtotal + tax - discount + shipping)

  // Payment details
  paymentMethod: "cash" | "card" | "transfer" | "other";
  paymentStatus: "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
  transactionId?: string; // Reference from payment gateway or manual entry
  amountReceived?: number; // For cash transactions, amount customer gave
  changeGiven?: number; // For cash transactions

  // Order status
  status:
    | "pending_payment" // Order created, awaiting payment
    | "processing" // Payment received, preparing items (e.g., for delivery)
    | "completed" // All items delivered/picked up, sale finalized
    | "cancelled" // Order cancelled by customer or system
    | "refunded" // Fully refunded
    | "partially_refunded"; // Partially refunded

  // Operational details
  salesChannel: "pos" | "online" | "phone"; // Where the sale originated
  staffId: string; // User ID of the salesperson
  staffName?: string; // Denormalized salesperson name

  // Items summary (detailed items in subcollection)
  totalItems: number; // Total number of unique IMEIs sold
  totalQuantity: number; // Sum of quantities (always totalItems if selling by IMEI)

  // Notes
  notes?: string; // Customer or internal notes
  refundReason?: string; // If refunded
}

/**
 * Sales Order Item document (specific IMEI sold)
 * Document path: salesOrders/{salesOrderId}/items/{salesOrderItemId}
 */
export interface FirebaseSalesOrderItem extends FirebaseAuditableDocument {
  // References
  salesOrderId: string; // Parent sales order
  inventoryItemId: string; // Link to the specific FirebaseInventoryItem sold
  imei: string; // Denormalized IMEI for easier access

  // Product details (denormalized from FirebaseInventoryItem)
  productId: string;
  variantId: string;
  productName: string;
  variantSku: string;
  colorName: string;
  storageCapacity: string;

  // Sale details for this item
  quantity: 1; // Always 1 when selling by IMEI
  unitCost: number; // Cost of this item when it was purchased (from inventoryItem.entryPrice) - for profit calculation
  salePrice: number; // Actual price this item was sold for (from inventoryItem.currentRetailPrice at time of sale)
  itemDiscountAmount: number; // Discount applied specifically to this item
  itemTaxAmount: number; // Tax applied specifically to this item
  finalPrice: number; // salePrice - itemDiscountAmount + itemTaxAmount

  // Status related to this specific item in the order (e.g., if part of it is returned/exchanged)
  itemStatus?: "fulfilled" | "returned" | "exchanged" | "damaged";
  returnedQuantity?: number; // if applicable
  returnReason?: string;

  // Denormalized for easier display and reporting
  entryDateOfItem?: Timestamp; // from inventoryItem.entryDate
}

/**
 * Input for creating a sales order
 */
export interface CreateSalesOrderInput {
  customerInfo?: FirebasePosCustomerInfo;
  customerId?: string;
  items: Array<{
    inventoryItemId: string; // The ID of the FirebaseInventoryItem to be sold
    imei: string;          // The IMEI of the item
    // Price details will be fetched from the inventoryItem to ensure accuracy at time of sale
  }>;
  paymentMethod: "cash" | "card" | "transfer" | "other";
  taxRate?: number; // e.g., 0.1 for 10%. If not provided, defaults to a system setting or 0.
  discountAmount?: number; // Order-level discount
  shippingAmount?: number;
  amountReceived?: number; // For cash transactions
  notes?: string;
  salesChannel?: "pos" | "online" | "phone";
} 