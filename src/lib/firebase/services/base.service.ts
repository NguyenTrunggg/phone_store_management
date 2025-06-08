import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  writeBatch,
  runTransaction,
  FirestoreError,
  CollectionReference,
  DocumentReference,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// =============================================================================
// BASE SERVICE CLASS
// Provides common Firebase operations and error handling
// =============================================================================

export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  updatedBy?: string;
}

export interface QueryOptions {
  limit?: number;
  orderBy?: Array<{ field: string; direction: "asc" | "desc" }>;
  where?: Array<{ field: string; operator: any; value: any }>;
  startAfter?: QueryDocumentSnapshot<DocumentData>;
}

export interface PaginationResult<T> {
  data: T[];
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
  hasMore: boolean;
  total?: number;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export class BaseService {
  protected collectionName: string;
  protected collectionRef: CollectionReference<DocumentData>;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.collectionRef = collection(db, collectionName);
  }

  /**
   * Handle Firebase errors and convert to user-friendly messages
   */
  protected handleError(error: any): ServiceResponse<never> {
    console.error(`${this.collectionName} service error:`, error);

    if (error instanceof FirestoreError) {
      switch (error.code) {
        case "permission-denied":
          return {
            success: false,
            error: "Bạn không có quyền thực hiện thao tác này",
            errorCode: "PERMISSION_DENIED",
          };
        case "not-found":
          return {
            success: false,
            error: "Không tìm thấy dữ liệu yêu cầu",
            errorCode: "NOT_FOUND",
          };
        case "unavailable":
          return {
            success: false,
            error: "Dịch vụ tạm thời không khả dụng, vui lòng thử lại",
            errorCode: "UNAVAILABLE",
          };
        case "deadline-exceeded":
          return {
            success: false,
            error: "Thao tác quá thời gian chờ, vui lòng thử lại",
            errorCode: "TIMEOUT",
          };
        default:
          return {
            success: false,
            error: `Lỗi hệ thống: ${error.message}`,
            errorCode: error.code.toUpperCase(),
          };
      }
    }

    return {
      success: false,
      error: "Đã xảy ra lỗi không xác định",
      errorCode: "UNKNOWN_ERROR",
    };
  }

  /**
   * Build Firestore query from options
   */
  protected buildQuery(options: QueryOptions = {}) {
    const constraints: QueryConstraint[] = [];

    // Add where conditions
    if (options.where) {
      options.where.forEach((condition) => {
        constraints.push(
          where(condition.field, condition.operator, condition.value)
        );
      });
    }

    // Add order by
    if (options.orderBy) {
      options.orderBy.forEach((order) => {
        constraints.push(orderBy(order.field, order.direction));
      });
    }

    // Add pagination
    if (options.startAfter) {
      constraints.push(startAfter(options.startAfter));
    }

    // Add limit
    if (options.limit) {
      constraints.push(limit(options.limit));
    }

    return query(this.collectionRef, ...constraints);
  }

  /**
   * Add audit fields to document data
   */
  protected addAuditFields(
    data: any,
    userId?: string,
    isUpdate: boolean = false
  ): any {
    const now = Timestamp.now();
    const auditFields: any = {
      updatedAt: now,
    };

    if (userId) {
      auditFields.updatedBy = userId;
    }

    if (!isUpdate) {
      auditFields.createdAt = now;
      if (userId) {
        auditFields.createdBy = userId;
      }
    }

    return { ...data, ...auditFields };
  }

  /**
   * Convert Firestore document to typed object
   */
  protected documentToObject<T extends BaseDocument>(
    doc: QueryDocumentSnapshot<DocumentData>
  ): T {
    return {
      id: doc.id,
      ...doc.data(),
    } as T;
  }

  /**
   * Generic create operation
   */
  async create<T extends BaseDocument>(
    data: Omit<T, keyof BaseDocument>,
    userId?: string
  ): Promise<ServiceResponse<T>> {
    try {
      const docData = this.addAuditFields(data, userId, false);
      const docRef = await addDoc(this.collectionRef, docData);
      const newDoc = await getDoc(docRef);

      if (!newDoc.exists()) {
        return {
          success: false,
          error: "Không thể tạo mới dữ liệu",
          errorCode: "CREATE_FAILED",
        };
      }

      return {
        success: true,
        data: this.documentToObject<T>(
          newDoc as QueryDocumentSnapshot<DocumentData>
        ),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generic read operation by ID
   */
  async getById<T extends BaseDocument>(
    id: string
  ): Promise<ServiceResponse<T>> {
    try {
      const docRef = doc(this.collectionRef, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: "Không tìm thấy dữ liệu",
          errorCode: "NOT_FOUND",
        };
      }

      return {
        success: true,
        data: this.documentToObject<T>(
          docSnap as QueryDocumentSnapshot<DocumentData>
        ),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generic update operation
   */
  async update<T extends BaseDocument>(
    id: string,
    data: Partial<Omit<T, keyof BaseDocument>>,
    userId?: string
  ): Promise<ServiceResponse<T>> {
    try {
      const docRef = doc(this.collectionRef, id);
      const updateData = this.addAuditFields(data, userId, true);

      await updateDoc(docRef, updateData);

      const updatedDoc = await getDoc(docRef);
      if (!updatedDoc.exists()) {
        return {
          success: false,
          error: "Không thể cập nhật dữ liệu",
          errorCode: "UPDATE_FAILED",
        };
      }

      return {
        success: true,
        data: this.documentToObject<T>(
          updatedDoc as QueryDocumentSnapshot<DocumentData>
        ),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generic delete operation (soft delete if supported)
   */
  async delete(id: string, userId?: string): Promise<ServiceResponse<void>> {
    try {
      const docRef = doc(this.collectionRef, id);

      // Try soft delete first (if the document has isDeleted field)
      try {
        await updateDoc(docRef, {
          isDeleted: true,
          deletedAt: Timestamp.now(),
          deletedBy: userId,
          updatedAt: Timestamp.now(),
          updatedBy: userId,
        });

        return { success: true };
      } catch (updateError) {
        // If soft delete fails, perform hard delete
        await deleteDoc(docRef);
        return { success: true };
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generic list operation with pagination
   */
  async list<T extends BaseDocument>(
    options: QueryOptions = {}
  ): Promise<ServiceResponse<PaginationResult<T>>> {
    try {
      const q = this.buildQuery(options);
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => this.documentToObject<T>(doc));
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      const hasMore = snapshot.docs.length === (options.limit || data.length);

      return {
        success: true,
        data: {
          data,
          lastDoc,
          hasMore,
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generic search operation
   */
  async search<T extends BaseDocument>(
    searchTerm: string,
    searchFields: string[],
    options: QueryOptions = {}
  ): Promise<ServiceResponse<T[]>> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a simple implementation that searches for exact matches
      // For production, consider using Algolia or Elasticsearch

      const searchPromises = searchFields.map(async (field) => {
        const searchQuery = query(
          this.collectionRef,
          where(field, ">=", searchTerm),
          where(field, "<=", searchTerm + "\uf8ff"),
          ...(options.limit ? [limit(options.limit)] : [])
        );

        const snapshot = await getDocs(searchQuery);
        return snapshot.docs.map((doc) => this.documentToObject<T>(doc));
      });

      const results = await Promise.all(searchPromises);
      const combinedResults = results.flat();

      // Remove duplicates based on ID
      const uniqueResults = combinedResults.filter(
        (item, index, self) => index === self.findIndex((t) => t.id === item.id)
      );

      return {
        success: true,
        data: uniqueResults,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Batch operations
   */
  async batchCreate<T extends BaseDocument>(
    items: Array<Omit<T, keyof BaseDocument>>,
    userId?: string
  ): Promise<ServiceResponse<T[]>> {
    try {
      const batch = writeBatch(db);
      const docRefs: DocumentReference[] = [];

      items.forEach((item) => {
        const docRef = doc(this.collectionRef);
        const docData = this.addAuditFields(item, userId, false);
        batch.set(docRef, docData);
        docRefs.push(docRef);
      });

      await batch.commit();

      // Fetch the created documents
      const createdDocs = await Promise.all(
        docRefs.map(async (docRef) => {
          const docSnap = await getDoc(docRef);
          return this.documentToObject<T>(
            docSnap as QueryDocumentSnapshot<DocumentData>
          );
        })
      );

      return {
        success: true,
        data: createdDocs,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Transaction wrapper
   */
  async runTransaction<T>(
    updateFunction: (transaction: any) => Promise<T>
  ): Promise<ServiceResponse<T>> {
    try {
      const result = await runTransaction(db, updateFunction);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Check if document exists
   */
  async exists(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const docRef = doc(this.collectionRef, id);
      const docSnap = await getDoc(docRef);

      return {
        success: true,
        data: docSnap.exists(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Count documents (limited by Firestore constraints)
   */
  async count(options: QueryOptions = {}): Promise<ServiceResponse<number>> {
    try {
      const q = this.buildQuery(options);
      const snapshot = await getDocs(q);

      return {
        success: true,
        data: snapshot.size,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validate IMEI format
 */
export const validateIMEI = (imei: string): boolean => {
  const imeiRegex = /^\d{15}$/;
  return imeiRegex.test(imei);
};

/**
 * Validate SKU format
 */
export function validateSKU(sku: string): boolean {
  if (!sku || typeof sku !== "string") {
    return false;
  }

  // SKU validation rules:
  // - Must be 3-20 characters long
  // - Can contain letters, numbers, hyphens, and underscores
  // - Must start with a letter or number
  // - Must end with a letter or number
  const skuPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{1,18}[A-Za-z0-9]$/;

  return skuPattern.test(sku.trim());
}

/**
 * Validate phone number format
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate order number
 */
export const generateOrderNumber = (prefix: string = "SO"): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = date.getTime().toString().slice(-4);
  return `${prefix}-${dateStr}-${timeStr}`;
};

/**
 * Format currency (Vietnamese Dong)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

/**
 * Format date for Vietnamese locale
 */
export const formatDate = (date: Date | Timestamp): string => {
  const jsDate = date instanceof Timestamp ? date.toDate() : date;
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(jsDate);
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (part: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((part / total) * 100 * 100) / 100; // Round to 2 decimal places
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Retry function for failed operations
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(2, i))
        );
      }
    }
  }

  throw lastError!;
};
