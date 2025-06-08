import {
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  writeBatch,
  Timestamp,
  runTransaction,
  addDoc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BaseService, ServiceResponse } from "./base.service";
import { COLLECTIONS, PRODUCT_STATUS, SUBCOLLECTIONS } from "@/constants";
import {
  FirebaseReturnRequest,
  CreateReturnRequestInput,
} from "@/lib/firebase/models/returns.model";
import { FirebaseInventoryItem } from "../models/inventory.model";
import { FirebaseSalesOrder, FirebaseSalesOrderItem } from "../models/pos.model";
import { FirebaseCustomer } from "../models/customer.model";

class ReturnsService extends BaseService {
  constructor() {
    super(COLLECTIONS.RETURN_REQUESTS);
  }

  async getReturnRequests(): Promise<ServiceResponse<FirebaseReturnRequest[]>> {
    try {
        const q = query(collection(db, this.collectionName), orderBy("requestedAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirebaseReturnRequest));
        return { success: true, data };
    } catch (error) {
        return this.handleError(error);
    }
  }

  async createReturnRequest(
    input: CreateReturnRequestInput,
    userId: string
  ): Promise<ServiceResponse<FirebaseReturnRequest>> {
    try {
      const { imei, reason } = input;

      if (!imei || !imei.trim()) {
        return { success: false, error: "IMEI không được để trống" };
      }

      const trimmedImei = imei.trim();

      // Check if a pending return request for this IMEI already exists
      const existingReturnQuery = query(
        collection(db, COLLECTIONS.RETURN_REQUESTS),
        where("imei", "==", trimmedImei),
        where("status", "==", "pending")
      );
      const existingReturnSnapshot = await getDocs(existingReturnQuery);
      if (!existingReturnSnapshot.empty) {
        return { success: false, error: "Đã tồn tại yêu cầu trả hàng cho IMEI này." };
      }


      // 1. Find inventory item by IMEI
      const inventoryRef = collection(db, COLLECTIONS.INVENTORY);
      const q = query(inventoryRef, where("imei", "==", trimmedImei));
      const inventorySnapshot = await getDocs(q);

      if (inventorySnapshot.empty) {
        return { success: false, error: "Không tìm thấy sản phẩm với IMEI này" };
      }

      const inventoryItemDoc = inventorySnapshot.docs[0];
      const inventoryItem = {
        id: inventoryItemDoc.id,
        ...inventoryItemDoc.data(),
      } as FirebaseInventoryItem;

      if (inventoryItem.status !== PRODUCT_STATUS.SOLD || !inventoryItem.salesOrderId) {
        return {
          success: false,
          error: "Sản phẩm này chưa được bán hoặc không có thông tin đơn hàng",
        };
      }
      
      const salesOrderRef = doc(db, COLLECTIONS.SALES_ORDERS, inventoryItem.salesOrderId);
      const salesOrderDoc = await getDoc(salesOrderRef);
      
      if (!salesOrderDoc.exists()) {
          return { success: false, error: "Không tìm thấy đơn hàng tương ứng" };
      }
        
      const salesOrder = { id: salesOrderDoc.id, ...salesOrderDoc.data() } as FirebaseSalesOrder;
        
      const itemsSubcollectionRef = collection(salesOrderRef, SUBCOLLECTIONS.ITEMS);
      const qItems = query(itemsSubcollectionRef, where("imei", "==", trimmedImei));
      const itemsSnapshot = await getDocs(qItems);

      if (itemsSnapshot.empty) {
        return { success: false, error: "Không tìm thấy chi tiết sản phẩm trong đơn hàng" };
      }

      const salesOrderItem = itemsSnapshot.docs[0].data() as FirebaseSalesOrderItem;

      let customerName = "Khách lẻ";
      let customerPhone = "";

      if (salesOrder.customerId) {
        const customerRef = doc(db, COLLECTIONS.CUSTOMERS, salesOrder.customerId);
        const customerDoc = await getDoc(customerRef);
        if (customerDoc.exists()) {
          const customerData = customerDoc.data() as FirebaseCustomer;
          customerName = customerData.name;
          customerPhone = customerData.phone;
        }
      } else if (salesOrder.customerInfo) {
        customerName = salesOrder.customerInfo.name;
        customerPhone = salesOrder.customerInfo.phone;
      }

      const returnRequestData: Omit<FirebaseReturnRequest, "id" | "createdAt" | "updatedAt"> = {
        orderId: salesOrder.id,
        orderNumber: salesOrder.orderNumber,
        inventoryItemId: inventoryItem.id,
        imei: inventoryItem.imei,
        productId: salesOrderItem.productId,
        productName: salesOrderItem.productName,
        variantId: salesOrderItem.variantId,
        variantSku: salesOrderItem.variantSku,
        salePrice: salesOrderItem.salePrice,
        customerId: salesOrder.customerId || "",
        customerName,
        customerPhone,
        status: "pending",
        reason,
        requestedAt: Timestamp.now(),
        createdBy: userId,
        updatedBy: userId,
      };

      const result = await this.create(returnRequestData, userId);

      return result as ServiceResponse<FirebaseReturnRequest>;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async processReturnRequest(
    returnRequestId: string,
    action: "approve" | "reject",
    userId: string
  ): Promise<ServiceResponse<void>> {
    return await runTransaction(db, async (transaction) => {
        const returnRequestRef = doc(db, COLLECTIONS.RETURN_REQUESTS, returnRequestId);
        const returnRequestDoc = await transaction.get(returnRequestRef);

        if (!returnRequestDoc.exists()) {
            throw new Error("Không tìm thấy yêu cầu trả hàng.");
        }

        const returnRequest = returnRequestDoc.data() as FirebaseReturnRequest;

        if (returnRequest.status !== 'pending') {
            throw new Error("Yêu cầu đã được xử lý.");
        }
        
        const updateData: any = {
            status: action === 'approve' ? 'approved' : 'rejected',
            processedAt: Timestamp.now(),
            processedBy: userId,
            updatedAt: Timestamp.now(),
            updatedBy: userId,
        };

        if (action === "approve") {
            // Update inventory item status
            const inventoryItemRef = doc(db, COLLECTIONS.INVENTORY, returnRequest.inventoryItemId);
            const inventoryItemDoc = await transaction.get(inventoryItemRef);

            if (!inventoryItemDoc.exists() || inventoryItemDoc.data().status !== PRODUCT_STATUS.SOLD) {
                 throw new Error("Sản phẩm trong kho không hợp lệ hoặc đã được trả lại.");
            }

            transaction.update(inventoryItemRef, {
                status: PRODUCT_STATUS.IN_STOCK,
                salesOrderId: null,
                saleDate: null,
                actualSalePrice: null,
                warrantyStartDate: null,
                lastStatusChange: Timestamp.now(),
            });

            if (returnRequest.customerId) {
                const customerHistoryRef = doc(collection(db, COLLECTIONS.CUSTOMERS, returnRequest.customerId, SUBCOLLECTIONS.RETURN_HISTORY));
                transaction.set(customerHistoryRef, {
                    returnRequestId: returnRequestRef.id,
                    returnedAt: Timestamp.now(),
                    orderNumber: returnRequest.orderNumber,
                    productName: returnRequest.productName,
                    imei: returnRequest.imei,
                    amount: returnRequest.salePrice,
                });
            }
        }
        
        transaction.update(returnRequestRef, updateData);
        
        return { success: true };
    });
  }

  async findSoldProductByImei(imei: string): Promise<ServiceResponse<any>> {
    try {
      if (!imei || !imei.trim()) {
        return { success: false, error: "IMEI không được để trống" };
      }

      const trimmedImei = imei.trim();

      // 1. Find inventory item by IMEI
      const inventoryRef = collection(db, COLLECTIONS.INVENTORY);
      const q = query(inventoryRef, where("imei", "==", trimmedImei));
      const inventorySnapshot = await getDocs(q);

      if (inventorySnapshot.empty) {
        return { success: false, error: "Không tìm thấy sản phẩm với IMEI này" };
      }

      const inventoryItemDoc = inventorySnapshot.docs[0];
      const inventoryItem = {
        id: inventoryItemDoc.id,
        ...inventoryItemDoc.data(),
      } as FirebaseInventoryItem;

      if (inventoryItem.status !== PRODUCT_STATUS.SOLD || !inventoryItem.salesOrderId) {
        return {
          success: false,
          error: "Sản phẩm này chưa được bán hoặc không có thông tin đơn hàng",
        };
      }
      
      const salesOrderRef = doc(db, COLLECTIONS.SALES_ORDERS, inventoryItem.salesOrderId);
      const salesOrderDoc = await getDoc(salesOrderRef);
      
      if (!salesOrderDoc.exists()) {
          return { success: false, error: "Không tìm thấy đơn hàng tương ứng" };
      }
        
      const salesOrder = { id: salesOrderDoc.id, ...salesOrderDoc.data() } as FirebaseSalesOrder;
        
      const itemsSubcollectionRef = collection(salesOrderRef, SUBCOLLECTIONS.ITEMS);
      const qItems = query(itemsSubcollectionRef, where("imei", "==", trimmedImei));
      const itemsSnapshot = await getDocs(qItems);

      if (itemsSnapshot.empty) {
        return { success: false, error: "Không tìm thấy chi tiết sản phẩm trong đơn hàng" };
      }

      const salesOrderItem = itemsSnapshot.docs[0].data() as FirebaseSalesOrderItem;

      let customerName = "Khách lẻ";
      let customerPhone = "";

      if (salesOrder.customerId) {
        const customerRef = doc(db, COLLECTIONS.CUSTOMERS, salesOrder.customerId);
        const customerDoc = await getDoc(customerRef);
        if (customerDoc.exists()) {
          const customerData = customerDoc.data() as FirebaseCustomer;
          customerName = customerData.name;
          customerPhone = customerData.phone;
        }
      } else if (salesOrder.customerInfo) {
        customerName = salesOrder.customerInfo.name;
        customerPhone = salesOrder.customerInfo.phone;
      }
      
      return {
          success: true,
          data: {
              imei: trimmedImei,
              orderNumber: salesOrder.orderNumber,
              productName: salesOrderItem.productName,
              salePrice: salesOrderItem.salePrice,
              customerName,
              customerPhone,
          }
      }
    } catch(error) {
        return this.handleError(error);
    }
  }
}

export const returnsService = new ReturnsService(); 