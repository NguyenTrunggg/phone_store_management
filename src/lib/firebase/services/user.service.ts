import { Timestamp, query, where, increment, FieldValue } from "firebase/firestore";
import {
  BaseService,
  ServiceResponse,
  QueryOptions,
  PaginationResult,
} from "./base.service";
import {
  FirebaseUser,
  CreateUserInput,
  UpdateUserInput,
  UserSearchFilters,
  UserWithComputedFields,
  hasPermission,
  canAccessResource,
  getEffectivePermissions,
  SYSTEM_ROLES,
} from "@/lib/firebase/models/user.model";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export interface UserSession {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  permissions: string[];
  lastLoginAt: Timestamp;
}

export class UserService extends BaseService {
  constructor() {
    super("users");
  }

  /**
   * Create new user account
   */
  async createUser(
    userData: CreateUserInput,
    createdByUserId: string
  ): Promise<ServiceResponse<FirebaseUser>> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        return {
          success: false,
          error: "Email không đúng định dạng",
          errorCode: "INVALID_EMAIL",
        };
      }

      // Check if user with email already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser.success && existingUser.data) {
        return {
          success: false,
          error: "Email đã được sử dụng",
          errorCode: "EMAIL_EXISTS",
        };
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: userData.displayName,
      });

      // Get role permissions and convert readonly array to mutable array
      const rolePermissions = SYSTEM_ROLES[userData.role]?.permissions
        ? [...SYSTEM_ROLES[userData.role].permissions]
        : [];

      // Create Firestore user document
      const newUser: Omit<
        FirebaseUser,
        keyof import("./base.service").BaseDocument
      > = {
        email: userData.email,
        displayName: userData.displayName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role,
        permissions: rolePermissions,
        customPermissions: [],
        employeeId: userCredential.user.uid,
        department: userData.department ?? "",
        position: userData.position ?? "",
        assignedStores: userData.assignedStores || [],
        primaryStore: userData.primaryStore ?? "",
        canAccessAllStores: userData.role === "admin",
        isActive: true,
        isEmailVerified: firebaseUser.emailVerified,
        isPhoneVerified: false,
        mustChangePassword: userData.mustChangePassword || false,
        totalLogins: 0,
        twoFactorEnabled: false,
        preferences: {
          theme: "light",
          language: "vi",
          notifications: {
            email: true,
            sms: false,
            push: true,
            lowStock:
              userData.role === "store_manager" ||
              userData.role === "warehouse_staff",
            newOrders:
              userData.role === "sales_staff" ||
              userData.role === "store_manager",
            returns:
              userData.role === "sales_staff" ||
              userData.role === "store_manager",
          },
          dashboard: {
            defaultView: "overview",
            widgets: this.getDefaultWidgetsByRole(userData.role),
          },
        },
      
        certifications: [],
        notes: userData.notes ?? "",
        tags: userData.tags ?? [],
        failedLoginAttempts: 0,
        isDeleted: false,
      };

      // Use the Firebase Auth UID as the Firestore document ID
      const result = await this.createWithId<FirebaseUser>(
        firebaseUser.uid,
        newUser,
        createdByUserId
      );

      return result;
    } catch (error: any) {
      // Handle Firebase Auth errors
      if (error.code === "auth/email-already-in-use") {
        return {
          success: false,
          error: "Email đã được sử dụng",
          errorCode: "EMAIL_EXISTS",
        };
      }
      if (error.code === "auth/weak-password") {
        return {
          success: false,
          error: "Mật khẩu quá yếu",
          errorCode: "WEAK_PASSWORD",
        };
      }
      return this.handleError(error);
    }
  }

  /**
   * Create user with specific ID (for Firebase Auth UID)
   */
  private async createWithId<T extends import("./base.service").BaseDocument>(
    id: string,
    data: Omit<T, keyof import("./base.service").BaseDocument>,
    userId?: string
  ): Promise<ServiceResponse<T>> {
    try {
      const docData = this.addAuditFields(data, userId, false);
      const docRef = doc(db, this.collectionName, id);
      await setDoc(docRef, docData);

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
        data: { id: newDoc.id, ...newDoc.data() } as T,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update user information
   */
  async updateUser(
    userId: string,
    updateData: UpdateUserInput,
    updatedByUserId: string
  ): Promise<ServiceResponse<FirebaseUser>> {
    try {
      const updateFields: Partial<FirebaseUser> = {};

      // Update basic profile
      if (updateData.displayName)
        updateFields.displayName = updateData.displayName;
      if (updateData.firstName) updateFields.firstName = updateData.firstName;
      if (updateData.lastName) updateFields.lastName = updateData.lastName;
      if (updateData.phone) updateFields.phone = updateData.phone;
      if (updateData.profileImageUrl)
        updateFields.profileImageUrl = updateData.profileImageUrl;

      // Update role and permissions
      if (updateData.role) {
        updateFields.role = updateData.role;
        updateFields.permissions = SYSTEM_ROLES[updateData.role]?.permissions
          ? [...SYSTEM_ROLES[updateData.role].permissions]
          : [];
      }
      if (updateData.customPermissions)
        updateFields.customPermissions = updateData.customPermissions;

      // Update employment info
      if (updateData.employeeId)
        updateFields.employeeId = updateData.employeeId;
      if (updateData.department)
        updateFields.department = updateData.department;
      if (updateData.position) updateFields.position = updateData.position;
      if (updateData.salary) updateFields.salary = updateData.salary;

      // Update store assignment
      if (updateData.assignedStores)
        updateFields.assignedStores = updateData.assignedStores;
      if (updateData.primaryStore)
        updateFields.primaryStore = updateData.primaryStore;
      if (updateData.canAccessAllStores !== undefined)
        updateFields.canAccessAllStores = updateData.canAccessAllStores;

      // Update account status
      if (updateData.isActive !== undefined)
        updateFields.isActive = updateData.isActive;
      if (updateData.mustChangePassword !== undefined)
        updateFields.mustChangePassword = updateData.mustChangePassword;

      // Update performance targets
      if (updateData.performance && updateFields.performance) {
        updateFields.performance = {
          ...updateFields.performance,
          ...updateData.performance,
        };
      }

      // Update notes and tags
      if (updateData.notes) updateFields.notes = updateData.notes;
      if (updateData.tags) updateFields.tags = updateData.tags;

      return await this.update<FirebaseUser>(
        userId,
        updateFields,
        updatedByUserId
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Soft-deletes a user.
   * @param userId The ID of the user to delete.
   * @param deletedByUserId The ID of the user performing the action.
   * @returns A service response indicating the result of the operation.
   */
  async deleteUser(
    userId: string,
    deletedByUserId: string
  ): Promise<ServiceResponse<void>> {
    try {
      const response = await this.update<FirebaseUser>(
        userId,
        { isDeleted: true, isActive: false },
        deletedByUserId
      );
      if (response.success) {
        return { success: true };
      }
      return {
        success: false,
        error: response.error,
        errorCode: response.errorCode,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(
    email: string
  ): Promise<ServiceResponse<FirebaseUser | null>> {
    try {
      const result = await this.list<FirebaseUser>({
        where: [{ field: "email", operator: "==", value: email }],
        limit: 1,
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          errorCode: result.errorCode,
        };
      }

      return {
        success: true,
        data: result.data!.data.length > 0 ? result.data!.data[0] : null,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get user with computed fields
   */
  async getUserWithComputedFields(
    userId: string
  ): Promise<ServiceResponse<UserWithComputedFields>> {
    try {
      const userResult = await this.getById<FirebaseUser>(userId);
      if (!userResult.success || !userResult.data) {
        return userResult as any;
      }

      const user = userResult.data;
      const roleInfo = SYSTEM_ROLES[user.role];

      const userWithComputed: UserWithComputedFields = {
        ...user,
        roleInfo: {
          name: roleInfo?.name || "Unknown Role",
          level: roleInfo?.level || 0,
          permissions: roleInfo?.permissions ? [...roleInfo.permissions] : [],
        },
        allPermissions: getEffectivePermissions(user),
        isOnline: false, // Would need real-time tracking
        canLogin: user.isActive && !user.accountLockedUntil,
        passwordExpired: false, // Would need password expiry logic
        accountLocked: !!(
          user.accountLockedUntil &&
          user.accountLockedUntil.toDate() > new Date()
        ),
      };

      return {
        success: true,
        data: userWithComputed,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Search users with filters
   */
  async searchUsers(
    filters: UserSearchFilters
  ): Promise<ServiceResponse<PaginationResult<FirebaseUser>>> {
    try {
      const queryOptions: QueryOptions = {
        limit: filters.limit || 20,
      };

      // Build where conditions
      const whereConditions: Array<{
        field: string;
        operator: any;
        value: any;
      }> = [];

      if (filters.role && filters.role.length > 0) {
        whereConditions.push({
          field: "role",
          operator: "in",
          value: filters.role,
        });
      }

      if (filters.department && filters.department.length > 0) {
        whereConditions.push({
          field: "department",
          operator: "in",
          value: filters.department,
        });
      }

      if (filters.isActive !== undefined) {
        whereConditions.push({
          field: "isActive",
          operator: "==",
          value: filters.isActive,
        });
      }

      if (filters.assignedStores && filters.assignedStores.length > 0) {
        whereConditions.push({
          field: "assignedStores",
          operator: "array-contains-any",
          value: filters.assignedStores,
        });
      }

      if (filters.primaryStore) {
        whereConditions.push({
          field: "primaryStore",
          operator: "==",
          value: filters.primaryStore,
        });
      }

      if (filters.mustChangePassword !== undefined) {
        whereConditions.push({
          field: "mustChangePassword",
          operator: "==",
          value: filters.mustChangePassword,
        });
      }

      if (filters.isEmailVerified !== undefined) {
        whereConditions.push({
          field: "isEmailVerified",
          operator: "==",
          value: filters.isEmailVerified,
        });
      }

      if (filters.twoFactorEnabled !== undefined) {
        whereConditions.push({
          field: "twoFactorEnabled",
          operator: "==",
          value: filters.twoFactorEnabled,
        });
      }

      if (filters.hiredAfter) {
        whereConditions.push({
          field: "hireDate",
          operator: ">=",
          value: Timestamp.fromDate(filters.hiredAfter),
        });
      }

      if (filters.hiredBefore) {
        whereConditions.push({
          field: "hireDate",
          operator: "<=",
          value: Timestamp.fromDate(filters.hiredBefore),
        });
      }

      if (filters.lastLoginAfter) {
        whereConditions.push({
          field: "lastLoginAt",
          operator: ">=",
          value: Timestamp.fromDate(filters.lastLoginAfter),
        });
      }

      if (filters.lastLoginBefore) {
        whereConditions.push({
          field: "lastLoginAt",
          operator: "<=",
          value: Timestamp.fromDate(filters.lastLoginBefore),
        });
      }

      queryOptions.where = whereConditions;

      // Build order by
      if (filters.sortBy) {
        queryOptions.orderBy = [
          {
            field: filters.sortBy,
            direction: filters.sortOrder || "asc",
          },
        ];
      } else {
        queryOptions.orderBy = [{ field: "displayName", direction: "asc" }];
      }

      if (filters.startAfter) {
        queryOptions.startAfter = filters.startAfter;
      }

      const result = await this.list<FirebaseUser>(queryOptions);

      // If we have a search term, filter results on client side
      if (result.success && filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        result.data!.data = result.data!.data.filter(
          (user) =>
            user.displayName.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            (user.employeeId &&
              user.employeeId.toLowerCase().includes(searchTerm))
        );
      }

      return result;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: string): Promise<ServiceResponse<FirebaseUser[]>> {
    try {
      const result = await this.list<FirebaseUser>({
        where: [
          { field: "role", operator: "==", value: role },
          { field: "isActive", operator: "==", value: true },
        ],
        orderBy: [{ field: "displayName", direction: "asc" }],
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          errorCode: result.errorCode,
        };
      }

      return {
        success: true,
        data: result.data!.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update user login information
   */
  async updateUserLogin(
    userId: string,
    loginInfo: {
      lastLoginAt: Timestamp;
      lastLoginIP?: string;
      lastLoginDevice?: string;
    }
  ): Promise<ServiceResponse<FirebaseUser>> {
    try {
      const updateData: any = {
        lastLoginAt: loginInfo.lastLoginAt,
        lastLoginIP: loginInfo.lastLoginIP,
        lastLoginDevice: loginInfo.lastLoginDevice,
        totalLogins: increment(1), // This would need Firestore increment
        failedLoginAttempts: 0, // Reset on successful login
      };

      return await this.update<FirebaseUser>(userId, updateData, userId);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Check user permissions
   */
  checkUserPermission(
    user: FirebaseUser,
    permission: string,
    resourceData?: any
  ): { hasPermission: boolean; reason?: string } {
    if (!hasPermission(user, permission)) {
      return {
        hasPermission: false,
        reason: "Insufficient permissions",
      };
    }

    const accessResult = canAccessResource(
      user,
      permission.split(".")[0],
      permission.split(".")[1],
      resourceData
    );

    return {
      hasPermission: accessResult.hasPermission,
      reason: accessResult.reason,
    };
  }

  /**
   * Get default dashboard widgets by role
   */
  private getDefaultWidgetsByRole(role: string): string[] {
    switch (role) {
      case "admin":
        return [
          "revenue_overview",
          "sales_summary",
          "inventory_alerts",
          "user_activity",
          "system_health",
        ];
      case "store_manager":
        return [
          "revenue_overview",
          "sales_summary",
          "inventory_alerts",
          "staff_performance",
          "customer_analytics",
        ];
      case "sales_staff":
        return [
          "daily_sales",
          "my_performance",
          "customer_list",
          "product_catalog",
        ];
      case "warehouse_staff":
        return [
          "inventory_summary",
          "stock_movements",
          "low_stock_alerts",
          "recent_shipments",
        ];
      default:
        return ["overview"];
    }
  }

  // ...existing code...
}

// Export singleton instance
export const userService = new UserService();
