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
  QueryConstraint,
  startAfter,
  limit,
  endBefore,
  limitToLast,
  Query,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  BaseService,
  ServiceResponse,
  PaginationResult,
} from "./base.service";
import {
  FirebaseCustomer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerSearchFilters,
} from "@/lib/firebase/models/customer.model";
import { FirebaseSalesOrder } from "@/lib/firebase/models/pos.model";
import { COLLECTIONS } from "@/constants";

class CustomerService extends BaseService {
  constructor() {
    super(COLLECTIONS.CUSTOMERS);
  }

  /**
   * Create a new customer with initial values.
   * @param input - Data for the new customer.
   * @param userId - The ID of the user creating the customer.
   * @returns The newly created customer document.
   */
  async createCustomer(
    input: CreateCustomerInput,
    userId: string
  ): Promise<ServiceResponse<FirebaseCustomer>> {
    try {
      // Check for duplicate phone number
      if (input.phone) {
        const phoneQuery = query(
          this.collectionRef,
          where("phone", "==", input.phone)
        );
        const existingCustomer = await getDocs(phoneQuery);
        if (!existingCustomer.empty) {
          return {
            success: false,
            error: "Số điện thoại đã tồn tại.",
            errorCode: "DUPLICATE_PHONE",
          };
        }
      }

      const now = Timestamp.now();
      const newCustomerData: Omit<FirebaseCustomer, "id"> = {
        // Basic Info
        name: input.name,
        phone: input.phone || "",
        email: input.email || "",
     

        // Address
        addresses: input.address
          ? [
              {
                id: "default", // Simple ID for the first address
                type: input.address.type || "home",
                street: input.address.street,
                district: input.address.district || "",
                city: input.address.city,
                country: input.address.country || "Vietnam",
                postalCode: input.address.postalCode || "",
                isDefault: true,
                label: input.address.type,
              },
            ]
          : [],

        // Analytics (initialized)
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        lastPurchaseDate: Timestamp.now(),
        firstPurchaseDate: Timestamp.now(),

        // Segmentation (initialized)
        customerTier: "new",
        loyaltyPoints: 0,
        lifetimeValue: 0,

        // Preferences
        preferredContactMethod: input.preferredContactMethod || "phone",
        communicationPreferences: {
          promotions: input.allowMarketing ?? true,
          newProducts: input.allowMarketing ?? true,
          appointments: true,
          orderUpdates: true,
          warrantyReminders: true,
        },

        // Special Flags
        isVip: input.isVip || false,
        isCorporate: input.isCorporate || false,
        allowMarketing: input.allowMarketing ?? true,
        requiresApproval: false,

        // Source Tracking
        acquisitionChannel: input.acquisitionChannel || "walk_in",
        referredBy: input.referredBy ?? "",

        // Status
        isActive: true,
        isBlacklisted: false,

        // Audit
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
      };

      const docRef = await this.create<FirebaseCustomer>(newCustomerData, userId);
      return docRef;
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Searches and filters customers based on provided criteria.
   * @param filters - The search and filter criteria.
   * @returns A paginated list of customers.
   */
  async searchCustomers(
    filters: CustomerSearchFilters
  ): Promise<ServiceResponse<PaginationResult<FirebaseCustomer>>> {
    try {
      const { searchTerm, limit: pageLimit = 10, isActive = true } = filters;

      if (!searchTerm) {
        // Return empty if no search term is provided for this function's purpose
        return { success: true, data: { data: [], hasMore: false } };
      }

      const endTerm = searchTerm + "\uf8ff";

      // --- Define queries for name and phone ---
      const nameQuery = query(
        this.collectionRef,
        where("isActive", "==", isActive),
        where("name", ">=", searchTerm),
        where("name", "<=", endTerm)
      );

      const phoneQuery = query(
        this.collectionRef,
        where("isActive", "==", isActive),
        where("phone", ">=", searchTerm),
        where("phone", "<=", endTerm)
      );

      // --- Execute queries in parallel ---
      const [nameSnapshot, phoneSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(phoneQuery),
      ]);

      // --- Merge and deduplicate results ---
      const customersMap = new Map<string, FirebaseCustomer>();

      nameSnapshot.docs.forEach(doc => {
        if (!customersMap.has(doc.id)) {
          customersMap.set(doc.id, { id: doc.id, ...doc.data() } as FirebaseCustomer);
        }
      });

      phoneSnapshot.docs.forEach(doc => {
        if (!customersMap.has(doc.id)) {
          customersMap.set(doc.id, { id: doc.id, ...doc.data() } as FirebaseCustomer);
        }
      });
      
      // --- Sort and paginate results ---
      const combinedData = Array.from(customersMap.values())
        .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name
      
      const data = combinedData.slice(0, pageLimit);

      // Note: True pagination with this client-side merge is complex.
      // This approach is suitable for small, quick search results like in a dropdown.
      return {
        success: true,
        data: {
          data,
          lastDoc: undefined, // Pagination cursor is not feasible with this merge strategy
          hasMore: combinedData.length > pageLimit,
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Updates an existing customer's information.
   * @param customerId - The ID of the customer to update.
   * @param input - The data to update.
   * @param userId - The ID of the user performing the update.
   * @returns The updated customer data.
   */
  async updateCustomer(
    customerId: string,
    input: UpdateCustomerInput,
    userId: string
  ): Promise<ServiceResponse<FirebaseCustomer>> {
    try {
      const updateData: { [key: string]: any } = { ...input };

      

      // We are using our generic update method from BaseService
      const result = await this.update<FirebaseCustomer>(
        customerId,
        updateData,
        userId
      );
      return result;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Soft deletes a customer by setting isActive to false.
   * @param customerId - The ID of the customer to delete.
   * @param userId - The ID of the user performing the deletion.
   * @returns ServiceResponse<void>
   */
  async deleteCustomer(
    customerId: string,
    userId: string
  ): Promise<ServiceResponse<void>> {
    try {
      await this.update(customerId, { isActive: false }, userId);
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Updates customer analytics after a new sale.
   * This should be called within the sale creation transaction.
   * @param transaction - Firestore transaction object.
   * @param customerId - The ID of the customer.
   * @param order - The newly created sales order.
   */
  async addOrderToCustomer(
    transaction: any,
    customerId: string,
    order: FirebaseSalesOrder
  ) {
    const customerRef = doc(db, COLLECTIONS.CUSTOMERS, customerId);
    const customerDoc = await transaction.get(customerRef);

    if (!customerDoc.exists()) {
      // Or handle this case gracefully if customer might not exist
      throw new Error(`Customer with ID ${customerId} not found.`);
    }

    const customerData = customerDoc.data() as FirebaseCustomer;
    
    const newTotalOrders = (customerData.totalOrders || 0) + 1;
    const newTotalSpent = (customerData.totalSpent || 0) + order.totalAmount;
    const newAverageOrderValue = newTotalSpent / newTotalOrders;

    const updateData: Partial<FirebaseCustomer> = {
      totalOrders: newTotalOrders,
      totalSpent: newTotalSpent,
      averageOrderValue: newAverageOrderValue,
      lastPurchaseDate: order.orderDate,
      firstPurchaseDate: customerData.firstPurchaseDate || order.orderDate,
      // TODO: Could add logic here to update customerTier based on totalSpent
    };

    transaction.update(customerRef, updateData);
  }

  async findCustomerByPhone(phone: string): Promise<ServiceResponse<FirebaseCustomer | null>> {
    try {
        const q = query(
            this.collectionRef,
            where("phone", "==", phone),
            limit(1)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { success: true, data: null };
        }

        const customer = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as FirebaseCustomer;
        return { success: true, data: customer };

    } catch (error) {
        return this.handleError(error);
    }
  }
}

export const customerService = new CustomerService(); 