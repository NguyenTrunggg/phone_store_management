import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  runTransaction,
  writeBatch,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  BaseService,
  ServiceResponse,
  validateIMEI,
  generateOrderNumber,
} from "./base.service";
import {
  FirebaseInventoryItem,
  FirebaseStockMovement,
} from "@/lib/firebase/models/inventory.model";
import {
  FirebaseSalesOrder,
  FirebaseSalesOrderItem,
  CreateSalesOrderInput,
  FirebasePosCustomerInfo,
} from "@/lib/firebase/models/pos.model";
import { COLLECTIONS, PRODUCT_STATUS, STOCK_MOVEMENT_TYPES, SUBCOLLECTIONS, AVAILABLE_FOR_SALE_STATUSES } from "@/constants";
import { inventoryService } from './inventory.service'; // For stock movement and updates
import { customerService } from './customer.service';
import { CreateCustomerInput, FirebaseCustomer } from "../models/customer.model";

export interface PosProductVariant {
  variantId: string;
  variantSku: string;
  colorName: string;
  storageCapacity: string;
  availableImeis: Array<{
    inventoryItemId: string;
    imei: string;
    currentRetailPrice: number;
    entryDate: Timestamp;
  }>;
  totalStock: number;
}

export interface PosProduct {
  productId: string;
  productName: string;
  variants: PosProductVariant[];
}

export class PosService extends BaseService {
  constructor() {
    super(COLLECTIONS.SALES_ORDERS);
  }

  /**
   * Get products available for sale from inventory.
   * Groups by product, then variant, and lists available IMEIs for each.
   */
  async getAvailableProductsForSale(): Promise<ServiceResponse<PosProduct[]>> {
    try {
      const inventoryItemsRef = collection(db, COLLECTIONS.INVENTORY);
      const q = query(
        inventoryItemsRef,
        where("status", "in", AVAILABLE_FOR_SALE_STATUSES),
        // orderBy("productName", "asc"),
        // orderBy("variantSku", "asc"),
        // orderBy("entryDate", "asc") // FIFO for IMEI selection if needed
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return { success: true, data: [] };
      }

      const items = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as FirebaseInventoryItem)
      );

      // Group items by productId, then by variantId
      const productsMap = new Map<string, PosProduct>();

      for (const item of items) {
        if (!item.productId || !item.variantId) {
          console.warn(`Inventory item ${item.id} missing productId or variantId, skipping.`);
          continue;
        }

        let product = productsMap.get(item.productId);
        if (!product) {
          product = {
            productId: item.productId,
            productName: item.productName || "Unknown Product",
            variants: [],
          };
          productsMap.set(item.productId, product);
        }

        let variant = product.variants.find((v) => v.variantId === item.variantId);
        if (!variant) {
          variant = {
            variantId: item.variantId,
            variantSku: item.variantSku || "Unknown SKU",
            colorName: item.colorName || "Unknown Color",
            storageCapacity: item.storageCapacity || "Unknown Storage",
            availableImeis: [],
            totalStock: 0,
          };
          product.variants.push(variant);
        }

        variant.availableImeis.push({
          inventoryItemId: item.id,
          imei: item.imei,
          currentRetailPrice: item.currentRetailPrice,
          entryDate: item.entryDate,
        });
        variant.totalStock += 1;
      }

      return { success: true, data: Array.from(productsMap.values()) };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // createSaleOrder method will be implemented next
  async createSaleOrder(
    input: CreateSalesOrderInput,
    userId: string,
    staffName?: string // Optional: denormalized staff name
  ): Promise<ServiceResponse<FirebaseSalesOrder>> {
    try {
      let finalCustomerId = input.customerId;
      let newCustomerRef: any | undefined = undefined;

      // Step 1: Find or decide to create customer BEFORE the transaction
      if (!finalCustomerId && input.customerInfo?.phone && input.customerInfo?.name) {
          const customersRef = collection(db, COLLECTIONS.CUSTOMERS);
          const q = query(customersRef, where("phone", "==", input.customerInfo.phone), limit(1));
          
          // Perform the query outside the transaction
          const existingCustomerSnapshot = await getDocs(q); 

          if (!existingCustomerSnapshot.empty) {
              // Customer exists, use their ID
              finalCustomerId = existingCustomerSnapshot.docs[0].id;
          } else {
              // Customer doesn't exist, prepare to create a new one inside the transaction
              newCustomerRef = doc(customersRef);
              finalCustomerId = newCustomerRef.id;
          }
      }

      return await this.runTransaction(async (transaction) => {
        const now = Timestamp.now();
        const salesOrderRef = doc(collection(db, COLLECTIONS.SALES_ORDERS));
        const orderNumber = generateOrderNumber("SO");
        
        // =================================================================
        // PHASE 1: READS
        // All reads must happen before any writes in a transaction.
        // =================================================================
        
        // 1. Fetch all inventory items at once
        const inventoryItemRefs = input.items.map(item => doc(db, COLLECTIONS.INVENTORY, item.inventoryItemId));
        const inventoryItemDocs = await Promise.all(inventoryItemRefs.map(ref => transaction.get(ref)));

        // 2. Fetch customer data if updating an existing customer
        let customerDoc: any | undefined = undefined;
        if (finalCustomerId && !newCustomerRef) { // Only read if we're not creating a new customer
            const customerRef = doc(db, COLLECTIONS.CUSTOMERS, finalCustomerId);
            customerDoc = await transaction.get(customerRef);
            if (!customerDoc.exists()) {
                throw new Error(`Khách hàng với ID ${finalCustomerId} không tìm thấy.`);
            }
        }

        // =================================================================
        // PHASE 2: VALIDATION & PREPARATION (NO I/O)
        // =================================================================

        let subtotalAmount = 0;
        const salesOrderItems: FirebaseSalesOrderItem[] = [];
        const inventoryUpdates: Array<{ ref: any; data: Partial<FirebaseInventoryItem> }> = [];
        const stockMovements: Array<Omit<FirebaseStockMovement, "id">> = [];

        for (let i = 0; i < inventoryItemDocs.length; i++) {
            const inventoryItemDoc = inventoryItemDocs[i];
            const cartItem = input.items[i];

            if (!inventoryItemDoc.exists()) {
                throw new Error(`Sản phẩm với IMEI ${cartItem.imei} không tìm thấy trong kho.`);
            }

            const inventoryItem = { id: inventoryItemDoc.id, ...inventoryItemDoc.data() } as FirebaseInventoryItem;

            if (inventoryItem.imei !== cartItem.imei) {
                throw new Error(`IMEI không khớp cho sản phẩm ${cartItem.inventoryItemId}.`);
            }
            if (inventoryItem.status !== PRODUCT_STATUS.IN_STOCK) {
                throw new Error(`Sản phẩm ${inventoryItem.productName} (${cartItem.imei}) không còn sẵn.`);
            }

            const salePrice = inventoryItem.currentRetailPrice;
            subtotalAmount += salePrice;

            salesOrderItems.push({ 
                id: "temp-id",
                salesOrderId: salesOrderRef.id,
                inventoryItemId: inventoryItem.id,
                imei: inventoryItem.imei,
                productId: inventoryItem.productId,
                variantId: inventoryItem.variantId,
                productName: inventoryItem.productName,
                variantSku: inventoryItem.variantSku,
                colorName: inventoryItem.colorName,
                storageCapacity: inventoryItem.storageCapacity,
                quantity: 1,
                unitCost: inventoryItem.entryPrice,
                salePrice,
                itemDiscountAmount: 0,
                itemTaxAmount: 0,
                finalPrice: salePrice,
                itemStatus: "fulfilled",
                entryDateOfItem: inventoryItem.entryDate,
                createdAt: now,
                updatedAt: now,
                createdBy: userId,
                updatedBy: userId,
             });

            inventoryUpdates.push({ 
                ref: inventoryItemRefs[i], 
                data: {
                    status: PRODUCT_STATUS.SOLD,
                    lastStatusChange: now,
                    salesOrderId: salesOrderRef.id,
                    saleDate: now,
                    actualSalePrice: salePrice,
                    warrantyStartDate: now,
                }
            });

            stockMovements.push({
                inventoryItemId: inventoryItem.id,
                imei: inventoryItem.imei,
                movementType: STOCK_MOVEMENT_TYPES.SALE,
                timestamp: now,
                quantityChange: -1,
                previousStatus: PRODUCT_STATUS.IN_STOCK,
                newStatus: PRODUCT_STATUS.SOLD,
                fromLocation: inventoryItem.currentLocation,
                toLocation: "Sold",
                userId,
                userRole: "pos_staff",
                reason: `Bán hàng qua POS - Đơn ${orderNumber}`,
                relatedOrderId: salesOrderRef.id,
                relatedDocumentType: "sale",
                createdAt: now,
                updatedAt: now,
                createdBy: userId,
                updatedBy: userId,
            });
        }
        
        // =================================================================
        // PHASE 3: WRITES
        // =================================================================

        // 1. Create new customer if necessary
        if (newCustomerRef && input.customerInfo?.name) {
           const newCustomerInput: CreateCustomerInput = {
                    name: input.customerInfo.name,
                    phone: input.customerInfo.phone,
                    email: input.customerInfo.email || "",
                    address: { street: input.customerInfo.address || "", city: "TP.HCM", type: "home" },
                    acquisitionChannel: "walk_in", 
                };
                
                const newCustomerData: Omit<FirebaseCustomer, "id"> = {
                  ...newCustomerInput,
                  dateOfBirth: Timestamp.now(), 
                  addresses: newCustomerInput.address ? [{ id: 'default', street: newCustomerInput.address.street, city: newCustomerInput.address.city, country: 'Vietnam', isDefault: true, type: 'home' }] : [],
                  totalOrders: 0,
                  totalSpent: 0,
                  averageOrderValue: 0,
                  customerTier: 'new',
                  loyaltyPoints: 0,
                  lifetimeValue: 0,
                  preferredContactMethod: 'phone',
                  communicationPreferences: { promotions: true, newProducts: true, appointments: true, orderUpdates: true, warrantyReminders: true },
                  isVip: false,
                  isCorporate: false,
                  allowMarketing: true,
                  requiresApproval: false,
                  isActive: true,
                  isBlacklisted: false,
                  createdAt: now,
                  updatedAt: now,
                  createdBy: userId,
                  updatedBy: userId
                };
                transaction.set(newCustomerRef, newCustomerData);
        }

        // 2. Prepare and create the main sales order
        const taxRate = input.taxRate || 0;
        const taxAmount = subtotalAmount * taxRate;
        const discountAmount = input.discountAmount || 0;
        const shippingAmount = input.shippingAmount || 0;
        const totalAmount = subtotalAmount + taxAmount - discountAmount + shippingAmount;

        const salesOrderData: Omit<FirebaseSalesOrder, "id" | "items"> = {
          orderNumber,
          orderDate: now,
          customerInfo: input.customerInfo,
          subtotalAmount,
          taxRate,
          taxAmount,
          discountAmount,
          shippingAmount,
          totalAmount,
          paymentMethod: input.paymentMethod,
          paymentStatus: "paid",
          status: "completed",
          salesChannel: input.salesChannel || "pos",
          staffId: userId,
          staffName: staffName || "",
          amountReceived: input.paymentMethod === "cash" ? input.amountReceived : undefined,
          changeGiven: (input.paymentMethod === "cash" && input.amountReceived) ? input.amountReceived - totalAmount : undefined,
          totalItems: input.items.length,
          totalQuantity: input.items.length,
          notes: input.notes,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          updatedBy: userId,
        };

        if (finalCustomerId) {
          (salesOrderData as FirebaseSalesOrder).customerId = finalCustomerId;
        }
        transaction.set(salesOrderRef, salesOrderData);

        // 3. Update customer analytics
        if (finalCustomerId) {
            const customerRef = doc(db, COLLECTIONS.CUSTOMERS, finalCustomerId);
            const customerData = customerDoc ? customerDoc.data() as FirebaseCustomer : { totalOrders: 0, totalSpent: 0, firstPurchaseDate: now };
            
            const newTotalOrders = (customerData.totalOrders || 0) + 1;
            const newTotalSpent = (customerData.totalSpent || 0) + totalAmount;
            
            const updateData: Partial<FirebaseCustomer> = {
                totalOrders: newTotalOrders,
                totalSpent: newTotalSpent,
                averageOrderValue: newTotalSpent / newTotalOrders,
                lastPurchaseDate: now,
                firstPurchaseDate: customerData.firstPurchaseDate || now,
            };
            transaction.update(customerRef, updateData);
        }

        // 4. Create sub-collection documents and update inventory
        for (let i = 0; i < salesOrderItems.length; i++) {
            const { id: tempId, ...orderItemToSave } = salesOrderItems[i];
            const salesOrderItemRef = doc(collection(db, salesOrderRef.path, SUBCOLLECTIONS.ORDER_ITEMS));
            transaction.set(salesOrderItemRef, orderItemToSave);
            salesOrderItems[i].id = salesOrderItemRef.id;
        }

        inventoryUpdates.forEach(update => transaction.update(update.ref, update.data));

        stockMovements.forEach(movement => {
            const stockMovementRef = doc(collection(db, COLLECTIONS.STOCK_MOVEMENTS));
            transaction.set(stockMovementRef, movement);
        });

        // Return the final order object
        return {
          ...(salesOrderData as FirebaseSalesOrder),
          id: salesOrderRef.id,
          items: salesOrderItems,
        };
      });
    } catch (error: any) {
      console.error("Create sale order error:", error);
      return this.handleError(error);
    }
  }

  /**
   * Get Sales Order by ID with its items
   */
  async getSalesOrderByIdWithItems(orderId: string): Promise<ServiceResponse<{ order: FirebaseSalesOrder; items: FirebaseSalesOrderItem[] }>> {
    try {
      // Fetch the main sales order document
      const orderRef = doc(db, COLLECTIONS.SALES_ORDERS, orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        return {
          success: false,
          error: `Không tìm thấy đơn hàng với ID: ${orderId}`,
          errorCode: "ORDER_NOT_FOUND",
        };
      }
      const orderData = { id: orderDoc.id, ...orderDoc.data() } as FirebaseSalesOrder;

      // Fetch the items from the subcollection
      const itemsRef = collection(db, COLLECTIONS.SALES_ORDERS, orderId, SUBCOLLECTIONS.ORDER_ITEMS);
      const itemsSnapshot = await getDocs(query(itemsRef, orderBy("createdAt", "asc"))); // Assuming items are ordered by creation time
      
      const itemsData = itemsSnapshot.docs.map(
        (itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() } as FirebaseSalesOrderItem)
      );

      return {
        success: true,
        data: {
          order: orderData,
          items: itemsData,
        },
      };
    } catch (error) {
      console.error(`Error fetching order ${orderId} with items:`, error);
      return this.handleError(error);
    }
  }

  /**
   * Get all sales orders for a specific customer
   */
  async getSalesOrdersByCustomerId(customerId: string): Promise<ServiceResponse<FirebaseSalesOrder[]>> {
    try {
      const ordersRef = collection(db, COLLECTIONS.SALES_ORDERS);
      const q = query(
        ordersRef,
        where("customerId", "==", customerId),
        orderBy("orderDate", "desc")
      );

      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as FirebaseSalesOrder)
      );

      return { success: true, data: orders };
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const posService = new PosService(); 