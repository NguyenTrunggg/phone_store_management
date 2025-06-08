import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
  writeBatch,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
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
  FirebasePurchaseOrder,
  FirebasePurchaseOrderItem,
  FirebaseStockMovement,
  StockIntakeInput,
  CreateStockMovementInput,
  BulkInventoryUpdateInput,
  InventorySearchFilters,
} from "@/lib/firebase/models/inventory.model";
import {
  COLLECTIONS,
  SUBCOLLECTIONS,
  STOCK_MOVEMENT_TYPES,
  PRODUCT_STATUS,
} from "@/constants";

export class InventoryService extends BaseService {
  constructor() {
    super(COLLECTIONS.INVENTORY);
  }

  /**
   * UC02: Create purchase order and intake inventory
   */
  async createPurchaseOrderWithIntake(
    intakeData: StockIntakeInput,
    userId: string
  ): Promise<
    ServiceResponse<{
      purchaseOrder: FirebasePurchaseOrder;
      inventoryItems: FirebaseInventoryItem[];
    }>
  > {
    try {
      return await this.runTransaction(async (transaction) => {
        // Step 1: Validate all IMEIs before processing
        const allImeis: string[] = [];
        for (const item of intakeData.items) {
          for (const imei of item.imeis) {
            if (!validateIMEI(imei)) {
              throw new Error(
                `IMEI không hợp lệ: ${imei}. IMEI phải có đúng 15 chữ số.`
              );
            }
            if (allImeis.includes(imei)) {
              throw new Error(`IMEI trùng lặp trong phiếu nhập: ${imei}`);
            }
            allImeis.push(imei);
          }
        }

        // Step 2: Check for existing IMEIs in database
        const existingImeiChecks = await Promise.all(
          allImeis.map(async (imei) => {
            const imeiQuery = query(
              collection(db, "inventoryItems"),
              where("imei", "==", imei),
              limit(1)
            );
            const snapshot = await getDocs(imeiQuery);
            return { imei, exists: !snapshot.empty, doc: snapshot.docs[0] };
          })
        );

        // Check business rules for existing IMEIs
        for (const check of existingImeiChecks) {
          if (check.exists) {
            const existingItem = check.doc.data() as FirebaseInventoryItem;
            const status = existingItem.status;

            // BR1: Cannot re-import IMEIs that are in_stock or sold
            if (status === "in_stock" || status === "sold") {
              throw new Error(
                `IMEI ${check.imei} đã tồn tại trong kho hoặc đã bán. Không thể nhập lại.`
              );
            }

            // Allow re-import of returned items (requires confirmation in UI)
            if (status === "returned") {
              throw new Error(
                `IMEI ${check.imei} đã được trả lại. Bạn có muốn nhập lại vào kho không?`
              );
            }
          }
        }

        // Step 3: Validate product variants exist AND GATHER DATA FOR DENORMALIZATION
        const productsAndVariantsDataCache: {
          [variantId: string]: { product: DocumentData; variant: DocumentData };
        } = {};

        for (const intakeItem of intakeData.items) {
          const productRef = doc(db, COLLECTIONS.PRODUCTS, intakeItem.productId);
          const productDoc = await transaction.get(productRef); // READ

          if (!productDoc.exists()) {
            throw new Error(`Sản phẩm không tồn tại: ${intakeItem.productId}`);
          }

          const variantRef = doc(
            db,
            COLLECTIONS.PRODUCTS,
            intakeItem.productId,
            COLLECTIONS.VARIANTS, // Make sure COLLECTIONS.VARIANTS is defined, e.g., "variants"
            intakeItem.variantId
          );
          const variantDoc = await transaction.get(variantRef); // READ

          if (!variantDoc.exists()) {
            throw new Error(
              `Biến thể sản phẩm không tồn tại: ${intakeItem.variantId}`
            );
          }
          
          // Store fetched data for later use
          productsAndVariantsDataCache[intakeItem.variantId] = {
            product: productDoc.data(), 
            variant: variantDoc.data(),
          };

          if (intakeItem.unitCost <= 0) {
            throw new Error("Giá nhập phải là số dương");
          }
        }
        
        // All READS for product/variant details are now complete. Start WRITES.

        // Step 4: Create purchase order (WRITE)
        const orderNumber = generateOrderNumber("PO");
        const now = Timestamp.now();
        let subtotal = 0;
        let totalItemsOrdered = 0;
        for (const item of intakeData.items) {
          const itemTotal = item.imeis.length * item.unitCost;
          subtotal += itemTotal;
          totalItemsOrdered += item.imeis.length;
        }
        const purchaseOrderData: Omit<FirebasePurchaseOrder, "id"> = {
          orderNumber,
          supplierName: intakeData.supplier.name || "Nhà cung cấp",
          orderDate: now,
          expectedDeliveryDate: intakeData.expectedDeliveryDate
            ? Timestamp.fromDate(intakeData.expectedDeliveryDate)
            : new Timestamp(now.seconds + 7 * 24 * 60 * 60, now.nanoseconds),
          actualDeliveryDate: now,
          status: "completed",
          subtotal,
          taxAmount: 0,
          shippingCost: 0,
          totalAmount: subtotal,
          currency: "VND",
          paidAmount: 0,
          paymentStatus: "pending",
          receivedBy: userId,
          receivedByName: "", 
          qualityChecked: true,
          qualityCheckedBy: userId,
          hasDiscrepancies: false,
          totalItemsOrdered,
          totalItemsReceived: totalItemsOrdered,
          totalVariants: intakeData.items.length,
          notes: intakeData.notes || "",
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          updatedBy: userId,
        };
        const purchaseOrderRef = doc(collection(db, COLLECTIONS.PURCHASE_ORDERS));
        transaction.set(purchaseOrderRef, purchaseOrderData); // WRITE

        // Step 5: Create purchase order items (WRITE, using cached data)
        const purchaseOrderItems: FirebasePurchaseOrderItem[] = [];
        for (const intakeItem of intakeData.items) {
          const cachedData = productsAndVariantsDataCache[intakeItem.variantId];
          const productData = cachedData.product;
          const variantData = cachedData.variant;

          const orderItemData: Omit<FirebasePurchaseOrderItem, "id"> = {
            productId: intakeItem.productId,
            variantId: intakeItem.variantId,
            productName: productData?.name || "Không rõ tên sản phẩm",
            variantSku: variantData?.sku || "Không rõ SKU",
            colorName: variantData?.colorName || "Không rõ màu",
            storageCapacity: variantData?.storageCapacity || "Không rõ dung lượng",
            quantityOrdered: intakeItem.imeis.length,
            quantityReceived: intakeItem.imeis.length,
            quantityPending: 0,
            quantityRejected: 0,
            unitCost: intakeItem.unitCost,
            totalCost: intakeItem.imeis.length * intakeItem.unitCost,
            receivedImeis: intakeItem.imeis,
            receivedDate: now,
            receivedBy: userId,
            condition: intakeItem.condition || "new",
            qualityNotes: intakeItem.notes || "",
            notes: intakeItem.notes || "",
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
            updatedBy: userId,
          };
          const orderItemRef = doc(
            collection(db, COLLECTIONS.PURCHASE_ORDERS, purchaseOrderRef.id, SUBCOLLECTIONS.ORDER_ITEMS)
          );
          transaction.set(orderItemRef, orderItemData); // WRITE
          purchaseOrderItems.push({ ...orderItemData, id: orderItemRef.id });
        }

        // Step 6: Create inventory items (WRITE, using cached data)
        const inventoryItems: FirebaseInventoryItem[] = [];
        for (const intakeItem of intakeData.items) {
          const cachedData = productsAndVariantsDataCache[intakeItem.variantId];
          const productData = cachedData.product;
          const variantData = cachedData.variant;

          for (const imei of intakeItem.imeis) {
            const inventoryItemData: Omit<FirebaseInventoryItem, "id"> = {
              imei,
              productId: intakeItem.productId,
              variantId: intakeItem.variantId,
              productName: productData?.name || "Không rõ tên sản phẩm",
              variantSku: variantData?.sku || "Không rõ SKU",
              colorName: variantData?.colorName || "Không rõ màu",
              storageCapacity: variantData?.storageCapacity || "Không rõ dung lượng",
              status: PRODUCT_STATUS.IN_STOCK,
              entryDate: now,
              entryPrice: intakeItem.unitCost,
              supplierName: intakeData.supplier.name || "Nhà cung cấp",
              purchaseOrderId: purchaseOrderRef.id,
              currentLocation: intakeItem.location || "Main Store",
              warehouseStaffId: userId,
              condition: intakeItem.condition || "new",
              qualityNotes: intakeItem.notes || "",
              warrantyPeriodMonths: 12,
              isDisplayUnit: false,
              isRefurbished: false,
              hasDefects: false,
              needsRepair: false,
              originalRetailPrice: variantData?.retailPrice || 0, // Denormalize retail price
              currentRetailPrice: variantData?.retailPrice || 0,  // Denormalize retail price
              notes: intakeItem.notes || "",
              tags: [],
              lastStatusChange: now,
              lastLocationChange: now,
              lastPriceUpdate: now,
              createdAt: now,
              updatedAt: now,
              createdBy: userId,
              updatedBy: userId,
            };
            const inventoryItemRef = doc(collection(db, COLLECTIONS.INVENTORY));
            transaction.set(inventoryItemRef, inventoryItemData); // WRITE
            inventoryItems.push({ ...inventoryItemData, id: inventoryItemRef.id });

            const stockMovementData: Omit<FirebaseStockMovement, "id"> = {
              inventoryItemId: inventoryItemRef.id,
              imei,
              movementType: STOCK_MOVEMENT_TYPES.IMPORT,
              timestamp: now,
              quantityChange: 1,
              newStatus: PRODUCT_STATUS.IN_STOCK,
              fromLocation: "",
              toLocation: intakeItem.location || "Main Store",
              userId,
              userRole: "inventory_staff", 
              reason: "Nhập kho mới",
              notes: `Nhập kho từ phiếu nhập ${orderNumber}`,
              relatedOrderId: purchaseOrderRef.id,
              relatedDocumentType: "purchase",
              createdAt: now,
              updatedAt: now,
              createdBy: userId,
              updatedBy: userId,
            };
            const stockMovementRef = doc(collection(db, COLLECTIONS.STOCK_MOVEMENTS));
            transaction.set(stockMovementRef, stockMovementData); // WRITE
          }
        }

        return {
          purchaseOrder: { ...purchaseOrderData, id: purchaseOrderRef.id },
          inventoryItems,
        };
      });
    } catch (error: any) {
      console.error("Inventory intake error:", error);
      return {
        success: false,
        error: error.message || "Không thể thực hiện nhập kho",
        errorCode: "INTAKE_FAILED",
      };
    }
  }

  /**
   * Validate IMEI and check for duplicates
   */
  async validateImeiForIntake(imei: string): Promise<
    ServiceResponse<{
      isValid: boolean;
      exists: boolean;
      currentStatus?: string;
      canReimport?: boolean;
    }>
  > {
    try {
      // Validate format
      if (!validateIMEI(imei)) {
        return {
          success: true,
          data: {
            isValid: false,
            exists: false,
            canReimport: false,
          },
        };
      }

      // Check if exists in database
      const imeiQuery = query(
        collection(db, "inventoryItems"),
        where("imei", "==", imei),
        limit(1)
      );

      const snapshot = await getDocs(imeiQuery);

      if (snapshot.empty) {
        return {
          success: true,
          data: {
            isValid: true,
            exists: false,
            canReimport: false,
          },
        };
      }

      const existingItem = snapshot.docs[0].data() as FirebaseInventoryItem;
      const canReimport = existingItem.status === "returned";

      return {
        success: true,
        data: {
          isValid: true,
          exists: true,
          currentStatus: existingItem.status,
          canReimport,
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Bulk validate IMEIs
   */
  async validateImeiList(imeis: string[]): Promise<
    ServiceResponse<{
      valid: string[];
      invalid: string[];
      existing: Array<{ imei: string; status: string; canReimport: boolean }>;
    }>
  > {
    try {
      const valid: string[] = [];
      const invalid: string[] = [];
      const existing: Array<{
        imei: string;
        status: string;
        canReimport: boolean;
      }> = [];

      // Validate each IMEI
      for (const imei of imeis) {
        if (!validateIMEI(imei)) {
          invalid.push(imei);
          continue;
        }

        valid.push(imei);
      }

      // Check for existing IMEIs in batches
      const existingChecks = await Promise.all(
        valid.map(async (imei) => {
          const result = await this.validateImeiForIntake(imei);
          return { imei, result: result.data };
        })
      );

      for (const check of existingChecks) {
        if (check.result?.exists) {
          existing.push({
            imei: check.imei,
            status: check.result.currentStatus || "",
            canReimport: check.result.canReimport || false,
          });
        }
      }

      return {
        success: true,
        data: { valid, invalid, existing },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get available stock for a variant
   */
  async getAvailableStockByVariant(
    variantId: string
  ): Promise<ServiceResponse<FirebaseInventoryItem[]>> {
    try {
      const q = query(
        collection(db, "inventoryItems"),
        where("variantId", "==", variantId),
        where("status", "in", ["in_stock", "returned_available"]),
        orderBy("entryDate", "asc") // FIFO order
      );

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as FirebaseInventoryItem)
      );

      return {
        success: true,
        data: items,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Find inventory item by IMEI
   */
  async findByImei(
    imei: string
  ): Promise<ServiceResponse<FirebaseInventoryItem | null>> {
    try {
      const q = query(
        collection(db, "inventoryItems"),
        where("imei", "==", imei),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return {
          success: true,
          data: null,
        };
      }

      const item = {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      } as FirebaseInventoryItem;

      return {
        success: true,
        data: item,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create stock movement record
   */
  async createStockMovement(
    movementData: CreateStockMovementInput,
    userId: string
  ): Promise<ServiceResponse<FirebaseStockMovement>> {
    try {
      // Get the inventory item
      const itemResult = await this.getById<FirebaseInventoryItem>(
        movementData.inventoryItemId
      );
      if (!itemResult.success || !itemResult.data) {
        return {
          success: false,
          error: "Không tìm thấy sản phẩm trong kho",
          errorCode: "ITEM_NOT_FOUND",
        };
      }

      const item = itemResult.data;
      const now = Timestamp.now();

      const stockMovementData: Omit<
        FirebaseStockMovement,
        "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
      > = {
        inventoryItemId: movementData.inventoryItemId,
        imei: item.imei,
        movementType: movementData.movementType,
        timestamp: now,
        quantityChange: this.getQuantityChange(movementData.movementType),
        previousStatus: item.status,
        newStatus: movementData.newStatus || item.status,
        fromLocation: item.currentLocation,
        toLocation: movementData.toLocation || item.currentLocation,
        userId,
        userRole: "inventory_staff", // Should be passed from auth context
        reason: movementData.reason || "",
        notes: movementData.notes || "",
        relatedOrderId: movementData.relatedOrderId,
        relatedDocumentType: movementData.relatedDocumentType,
      };

      return await this.create<FirebaseStockMovement>(
        stockMovementData,
        userId
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get stock movements for an item
   */
  async getItemMovementHistory(
    inventoryItemId: string
  ): Promise<ServiceResponse<FirebaseStockMovement[]>> {
    try {
      const q = query(
        collection(db, "stockMovements"),
        where("inventoryItemId", "==", inventoryItemId),
        orderBy("timestamp", "desc")
      );

      const snapshot = await getDocs(q);
      const movements = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as FirebaseStockMovement)
      );

      return {
        success: true,
        data: movements,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Search inventory with filters
   */
  async searchInventory(
    filters: InventorySearchFilters
  ): Promise<ServiceResponse<FirebaseInventoryItem[]>> {
    try {
      const constraints: any[] = [];

      // Add where conditions based on filters
      if (filters.variantId) {
        constraints.push(where("variantId", "==", filters.variantId));
      }

      if (filters.status && filters.status.length > 0) {
        constraints.push(where("status", "in", filters.status));
      }

      if (filters.imei) {
        constraints.push(where("imei", "==", filters.imei));
      }

      if (filters.location && filters.location.length > 0) {
        constraints.push(where("currentLocation", "in", filters.location));
      }

      // Add ordering
      const orderField = filters.sortBy || "entryDate";
      const orderDirection = filters.sortOrder || "desc";
      constraints.push(orderBy(orderField, orderDirection));

      // Add limit
      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }

      const q = query(collection(db, "inventoryItems"), ...constraints);
      const snapshot = await getDocs(q);

      const items = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as FirebaseInventoryItem)
      );

      return {
        success: true,
        data: items,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get recent purchase orders
   */
  async getRecentPurchaseOrders(
    count: number = 20
  ): Promise<ServiceResponse<FirebasePurchaseOrder[]>> {
    try {
      const q = query(
        collection(db, "purchaseOrders"),
        orderBy("orderDate", "desc"),
        limit(count)
      );

      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as FirebasePurchaseOrder)
      );

      return {
        success: true,
        data: orders,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get purchase order with items
   */
  async getPurchaseOrderWithItems(orderId: string): Promise<
    ServiceResponse<{
      order: FirebasePurchaseOrder;
      items: FirebasePurchaseOrderItem[];
    }>
  > {
    try {
      // Get purchase order directly from 'purchaseOrders' collection
      const orderRef = doc(db, COLLECTIONS.PURCHASE_ORDERS, orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        return {
          success: false,
          error: "Không tìm thấy phiếu nhập kho với ID: " + orderId,
          errorCode: "ORDER_NOT_FOUND",
        };
      }
      const orderData = { id: orderDoc.id, ...orderDoc.data() } as FirebasePurchaseOrder;

      // Get order items
      const itemsQuery = query(
        collection(db, COLLECTIONS.PURCHASE_ORDERS, orderId, SUBCOLLECTIONS.ORDER_ITEMS),
        orderBy("createdAt", "asc")
      );

      const itemsSnapshot = await getDocs(itemsQuery);
      const items = itemsSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as FirebasePurchaseOrderItem)
      );

      return {
        success: true,
        data: {
          order: orderData,
          items,
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Helper methods

  private getQuantityChange(movementType: string): number {
    switch (movementType) {
      case STOCK_MOVEMENT_TYPES.IMPORT:
      case STOCK_MOVEMENT_TYPES.RETURN:
      case STOCK_MOVEMENT_TYPES.WARRANTY_IN:
        return 1;
      case STOCK_MOVEMENT_TYPES.SALE:
      case STOCK_MOVEMENT_TYPES.WARRANTY_OUT:
      case STOCK_MOVEMENT_TYPES.DAMAGED:
      case STOCK_MOVEMENT_TYPES.LOST:
        return -1;
      default:
        return 0;
    }
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();
