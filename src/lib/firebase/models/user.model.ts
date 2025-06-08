import { Timestamp } from "firebase/firestore";
import { FirebaseBaseDocument, FirebaseSoftDeletableDocument } from "./index";
import { UserRoleType } from "@/constants";

// =============================================================================
// USER MODEL (Authentication & Authorization)
// Collection: users
// =============================================================================

/**
 * User document (matches Firebase Auth UID)
 * Document path: users/{userId} (userId = Firebase Auth UID)
 */
export interface FirebaseUser
  extends FirebaseBaseDocument,
    FirebaseSoftDeletableDocument {
  // Basic authentication info
  email: string;
  displayName: string;

  // Profile information
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;

  // Contact information
  phone?: string;
  address?: {
    street?: string;
    district?: string;
    city?: string;
    country: string;
    postalCode?: string;
  };

  // Role and permissions
  role: UserRoleType;
  permissions: string[]; // Computed from role
  customPermissions?: string[]; // Additional permissions

  // Employment information
  employeeId?: string; // Company employee ID
  hireDate?: Timestamp;
  department?: string;
  position?: string;
  salary?: number; // Optional for HR tracking

  // Store/location assignment
  assignedStores?: string[]; // Store IDs user can access
  primaryStore?: string; // Main store assignment
  canAccessAllStores: boolean; // Admin flag

  // Account status
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  mustChangePassword: boolean; // Force password change on next login

  // Login tracking
  lastLoginAt?: Timestamp;
  lastLoginIP?: string;
  lastLoginDevice?: string;
  totalLogins: number;

  // Password and security
  passwordLastChanged?: Timestamp;
  twoFactorEnabled: boolean;
  securityQuestions?: Array<{
    question: string;
    answerHash: string; // Hashed answer
  }>;

  // Preferences
  preferences: {
    theme: "light" | "dark" | "auto";
    language: "vi" | "en";
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
      lowStock: boolean;
      newOrders: boolean;
      returns: boolean;
    };
    dashboard: {
      defaultView: string;
      widgets: string[];
    };
  };

  // Performance tracking (for sales staff)
  performance?: {
    salesTarget?: number; // Monthly sales target
    currentMonthSales: number;
    lastMonthSales: number;
    salesGrowth: number;
    customerSatisfactionScore?: number;
    averageOrderValue: number;
    totalOrdersProcessed: number;
    returnRate: number;
  };

  // Training and certifications
  certifications?: Array<{
    name: string;
    issuedDate: Timestamp;
    expiryDate?: Timestamp;
    isValid: boolean;
  }>;

  // Additional information
  notes?: string; // Manager notes about employee
  tags?: string[]; // e.g., ["trainer", "senior", "part-time"]

  // Emergency contact
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };

  // Audit trail
  createdBy: string; // Who created this user account
  updatedBy: string; // Who last updated
  lastPasswordReset?: Timestamp;
  failedLoginAttempts: number;
  accountLockedUntil?: Timestamp;
}

/**
 * User session tracking
 * Document path: userSessions/{sessionId}
 */
export interface FirebaseUserSession extends FirebaseBaseDocument {
  // User reference
  userId: string;

  // Session details
  sessionToken: string; // JWT or session identifier
  deviceId?: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    browser?: string;
    os?: string;
    isMobile: boolean;
  };

  // Network information
  ipAddress: string;
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };

  // Session lifecycle
  loginAt: Timestamp;
  lastActivityAt: Timestamp;
  logoutAt?: Timestamp;
  expiresAt: Timestamp;

  // Session status
  isActive: boolean;
  wasForceLoggedOut: boolean;
  logoutReason?: "manual" | "timeout" | "security" | "admin";

  // Activity during session
  pageViews: number;
  actionsPerformed: number;
  lastAction?: string;

  // Security flags
  isSuspicious: boolean;
  suspiciousReasons?: string[];
}

/**
 * User activity log
 * Document path: userActivities/{activityId}
 */
export interface FirebaseUserActivity extends FirebaseBaseDocument {
  // User reference
  userId: string;
  sessionId?: string;

  // Action details
  action: string; // e.g., "login", "create_order", "update_product"
  resource: string; // e.g., "users", "salesOrders", "products"
  resourceId?: string; // Specific document ID

  // Context
  details?: Record<string, any>; // Action-specific details
  result: "success" | "failure" | "error";
  errorMessage?: string;

  // Request information
  method?: string; // HTTP method if from API
  endpoint?: string; // API endpoint
  userAgent?: string;
  ipAddress?: string;

  // Timing
  timestamp: Timestamp;
  duration?: number; // Action duration in milliseconds

  // Additional metadata
  correlationId?: string; // For tracking related actions
  tags?: string[];
}

/**
 * Role definition with permissions
 * Document path: roles/{roleId}
 */
export interface FirebaseRole extends FirebaseBaseDocument {
  // Role identification
  name: string; // e.g., "Sales Staff", "Store Manager"
  code: UserRoleType; // e.g., "sales_staff", "store_manager"
  description: string;

  // Role hierarchy
  level: number; // Higher number = higher authority
  parentRole?: string; // Reference to parent role

  // Permissions
  permissions: string[]; // Array of permission codes

  // Role status
  isActive: boolean;
  isSystemRole: boolean; // Cannot be deleted

  // Additional metadata
  color?: string; // For UI display
  icon?: string; // For UI display

  // Audit
  createdBy: string;
  updatedBy: string;
}

/**
 * Permission definition
 * Document path: permissions/{permissionId}
 */
export interface FirebasePermission extends FirebaseBaseDocument {
  // Permission identification
  code: string; // e.g., "inventory.create", "reports.view"
  name: string; // Human-readable name
  description: string;

  // Permission categorization
  category:
    | "inventory"
    | "sales"
    | "reports"
    | "users"
    | "system"
    | "customers";
  subcategory?: string;

  // Permission details
  actions: Array<"create" | "read" | "update" | "delete" | "execute">; // CRUD + Execute
  resourceTypes: string[]; // What resources this permission applies to

  // Permission constraints
  conditions?: Array<{
    field: string;
    operator:
      | "equals"
      | "not_equals"
      | "in"
      | "not_in"
      | "greater_than"
      | "less_than";
    value: any;
  }>;

  // Status
  isActive: boolean;
  isSystemPermission: boolean; // Cannot be deleted

  // UI metadata
  group?: string; // For grouping in permission management UI
  displayOrder?: number;

  // Audit
  createdBy: string;
  updatedBy: string;
}

// =============================================================================
// INPUT/OUTPUT SCHEMAS
// =============================================================================

/**
 * Create user input
 */
export interface CreateUserInput {
  // Required fields
  email: string;
  displayName: string;
  role: UserRoleType;
  password: string;

  // Optional profile info
  firstName?: string;
  lastName?: string;
  phone?: string;
  employeeId?: string;
  department?: string;
  position?: string;

  // Store assignment
  assignedStores?: string[];
  primaryStore?: string;

  // Initial settings
  mustChangePassword?: boolean;
  sendWelcomeEmail?: boolean;

  // Additional info
  notes?: string;
  tags?: string[];
}

/**
 * Update user input
 */
export interface UpdateUserInput {
  // Profile updates
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImageUrl?: string;

  // Role and permissions
  role?: UserRoleType;
  customPermissions?: string[];

  // Employment info
  employeeId?: string;
  department?: string;
  position?: string;
  salary?: number;

  // Store assignment
  assignedStores?: string[];
  primaryStore?: string;
  canAccessAllStores?: boolean;

  // Account status
  isActive?: boolean;
  mustChangePassword?: boolean;

  // Performance targets
  performance?: {
    salesTarget?: number;
  };

  // Additional info
  notes?: string;
  tags?: string[];
}

/**
 * Password change input
 */
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Reset password input
 */
export interface ResetPasswordInput {
  email: string;
  newPassword: string;
  resetToken: string;
}

/**
 * User search and filtering
 */
export interface UserSearchFilters {
  // Basic filters
  searchTerm?: string; // Search in name, email, employeeId
  role?: UserRoleType[];
  department?: string[];
  isActive?: boolean;

  // Store filters
  assignedStores?: string[];
  primaryStore?: string;

  // Employment filters
  hiredAfter?: Date;
  hiredBefore?: Date;
  position?: string[];

  // Performance filters
  salesTargetMin?: number;
  salesTargetMax?: number;

  // Status filters
  mustChangePassword?: boolean;
  isEmailVerified?: boolean;
  twoFactorEnabled?: boolean;

  // Tags
  tags?: string[];

  // Login activity
  lastLoginAfter?: Date;
  lastLoginBefore?: Date;

  // Sorting
  sortBy?:
    | "displayName"
    | "email"
    | "role"
    | "hireDate"
    | "lastLoginAt"
    | "performance.currentMonthSales";
  sortOrder?: "asc" | "desc";

  // Pagination
  limit?: number;
  startAfter?: any;
}

/**
 * User with computed fields
 */
export interface UserWithComputedFields extends FirebaseUser {
  // Computed role information
  roleInfo: {
    name: string;
    level: number;
    permissions: string[];
  };

  // Computed permissions (role + custom)
  allPermissions: string[];

  // Computed status
  isOnline: boolean;
  canLogin: boolean;
  passwordExpired: boolean;
  accountLocked: boolean;

  // Performance metrics (if applicable)
  performanceMetrics?: {
    salesTargetProgress: number; // Percentage
    salesGrowthRate: number;
    customerSatisfactionTrend: "up" | "down" | "stable";
    performanceRating: "excellent" | "good" | "average" | "needs_improvement";
  };
}

/**
 * User performance summary
 */
export interface UserPerformanceSummary {
  userId: string;
  displayName: string;
  role: UserRoleType;

  // Current period metrics
  currentPeriod: {
    startDate: Date;
    endDate: Date;
    sales: number;
    orders: number;
    averageOrderValue: number;
    target: number;
    achievement: number; // Percentage
  };

  // Previous period comparison
  previousPeriod: {
    sales: number;
    orders: number;
    averageOrderValue: number;
    growth: {
      sales: number;
      orders: number;
      averageOrderValue: number;
    };
  };

  // Year-to-date metrics
  yearToDate: {
    sales: number;
    orders: number;
    averageOrderValue: number;
    target: number;
    achievement: number;
  };

  // Customer metrics
  customerMetrics: {
    newCustomers: number;
    returningCustomers: number;
    customerSatisfactionScore?: number;
    complaintsHandled: number;
    returnRate: number;
  };

  // Productivity metrics
  productivity: {
    hoursWorked: number;
    salesPerHour: number;
    ordersPerHour: number;
    consultationTime: number; // Average minutes per customer
  };

  // Rankings
  rankings: {
    salesRank: number;
    ordersRank: number;
    customerSatisfactionRank?: number;
    totalStaff: number;
  };
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  reason?: string;
  requiredRole?: UserRoleType;
  requiredPermissions?: string[];
  conditions?: Record<string, any>;
}

/**
 * Role hierarchy
 */
export interface RoleHierarchy {
  role: UserRoleType;
  level: number;
  permissions: string[];
  children: RoleHierarchy[];
  parent?: UserRoleType;
}

// =============================================================================
// PREDEFINED ROLES AND PERMISSIONS
// =============================================================================

/**
 * System roles with their permissions
 */
export const SYSTEM_ROLES = {
  admin: {
    name: "Administrator",
    level: 100,
    permissions: [
      // Full system access
      "system.*",
      "users.*",
      "roles.*",
      "permissions.*",
      "stores.*",
      "settings.*",
      "audit.*",

      // All business operations
      "inventory.*",
      "sales.*",
      "customers.*",
      "suppliers.*",
      "reports.*",
      "returns.*",
      "warranty.*",
    ],
  },

  store_manager: {
    name: "Store Manager",
    level: 80,
    permissions: [
      // User management (limited)
      "users.read",
      "users.update",
      "users.create", // Can create sales staff

      // Full inventory management
      "inventory.read",
      "inventory.create",
      "inventory.update",
      "inventory.delete",
      "inventory.adjust",
      "inventory.transfer",

      // Full sales management
      "sales.read",
      "sales.create",
      "sales.update",
      "sales.process_returns",
      "sales.apply_discounts",
      "sales.override_prices",

      // Customer management
      "customers.read",
      "customers.create",
      "customers.update",
      "customers.delete",

      // Reports and analytics
      "reports.read",
      "reports.create",
      "reports.export",
      "analytics.read",

      // Supplier management
      "suppliers.read",
      "suppliers.create",
      "suppliers.update",

      // Store settings
      "settings.read",
      "settings.update",
    ],
  },

  sales_staff: {
    name: "Sales Staff",
    level: 50,
    permissions: [
      // Basic sales operations
      "sales.read",
      "sales.create",
      "sales.update_own", // Can only update own sales
      "sales.process_simple_returns",

      // Limited inventory access
      "inventory.read",
      "inventory.check_availability",
      "inventory.reserve",

      // Customer management
      "customers.read",
      "customers.create",
      "customers.update",

      // Basic reports
      "reports.read_own", // Can only see own sales reports
      "reports.daily_summary",

      // Product information
      "products.read",
      "warranty.check",

      // Limited user access
      "users.read_own", // Can only see own profile
      "users.update_own",
    ],
  },

  warehouse_staff: {
    name: "Warehouse Staff",
    level: 40,
    permissions: [
      // Full inventory management
      "inventory.read",
      "inventory.create",
      "inventory.update",
      "inventory.receive",
      "inventory.move",
      "inventory.count",
      "inventory.adjust",

      // Product management
      "products.read",
      "products.create",
      "products.update",

      // Supplier interactions
      "suppliers.read",
      "purchase_orders.read",
      "purchase_orders.receive",

      // Limited sales access
      "sales.read", // For processing returns
      "sales.process_returns",

      // Inventory reports
      "reports.inventory",
      "reports.stock_movements",

      // Basic user access
      "users.read_own",
      "users.update_own",
    ],
  },

  viewer: {
    name: "Viewer",
    level: 10,
    permissions: [
      // Read-only access
      "products.read",
      "inventory.read",
      "sales.read",
      "customers.read",
      "reports.read",
      "users.read_own",

      // Basic warranty checks
      "warranty.check",
    ],
  },
} as const;

/**
 * Permission categories and their definitions
 */
export const PERMISSION_CATEGORIES = {
  // System administration
  system: [
    "system.configure",
    "system.backup",
    "system.restore",
    "system.maintenance",
  ],

  // User and role management
  users: [
    "users.read",
    "users.read_own",
    "users.create",
    "users.update",
    "users.update_own",
    "users.delete",
    "users.manage_permissions",
    "users.reset_passwords",
    "users.view_activity",
  ],

  roles: [
    "roles.read",
    "roles.create",
    "roles.update",
    "roles.delete",
    "roles.assign",
  ],

  permissions: [
    "permissions.read",
    "permissions.create",
    "permissions.update",
    "permissions.delete",
  ],
  inventory: [
    "inventory.read",
    "inventory.create",
    "inventory.update",
    "inventory.delete",
    "inventory.receive",
    "inventory.move",
    "inventory.count",
    "inventory.adjust",
    "inventory.transfer",
    "inventory.check_availability",
    "inventory.reserve",
    "inventory.import", // UC02: Main permission for inventory intake
    "inventory.validate_imei", // UC02: Validate IMEI before import
    "inventory.bulk_import", // UC02: Bulk IMEI import
    "inventory.reimport_returned", // UC02: Allow reimporting returned items
    "inventory.view_movements", // Track stock movements
    "inventory.create_purchase_orders", // Create purchase orders
    "inventory.receive_purchase_orders", // Receive purchase orders
  ],

  // Product management
  products: [
    "products.read",
    "products.create",
    "products.update",
    "products.delete",
    "products.manage_variants",
    "products.manage_pricing",
  ],

  // Sales operations
  sales: [
    "sales.read",
    "sales.read_own",
    "sales.create",
    "sales.update",
    "sales.update_own",
    "sales.delete",
    "sales.process_returns",
    "sales.process_simple_returns",
    "sales.apply_discounts",
    "sales.override_prices",
    "sales.void_transactions",
    "sales.refund",
  ],

  // Customer management
  customers: [
    "customers.read",
    "customers.create",
    "customers.update",
    "customers.delete",
    "customers.view_history",
    "customers.manage_loyalty",
  ],

  // Supplier management
  suppliers: [
    "suppliers.read",
    "suppliers.create",
    "suppliers.update",
    "suppliers.delete",
  ],
  purchase_orders: [
    "purchase_orders.read",
    "purchase_orders.create",
    "purchase_orders.update",
    "purchase_orders.delete",
    "purchase_orders.approve",
    "purchase_orders.receive",
    "purchase_orders.validate_items", // UC02: Validate items in purchase orders
    "purchase_orders.import_imei", // UC02: Import IMEIs from purchase orders
  ],
  reports: [
    "reports.read",
    "reports.read_own",
    "reports.create",
    "reports.update",
    "reports.delete",
    "reports.export",
    "reports.schedule",
    "reports.daily_summary",
    "reports.inventory",
    "reports.stock_movements",
  ],

  analytics: ["analytics.read", "analytics.advanced", "analytics.export"],
  warranty: ["warranty.check", "warranty.register", "warranty.process_claims"],
  stores: ["stores.read", "stores.create", "stores.update", "stores.delete"],

  settings: ["settings.read", "settings.update", "settings.system"],
  audit: ["audit.read", "audit.export"],
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if user has specific permission
 */
export function hasPermission(user: FirebaseUser, permission: string): boolean {
  // Admin has all permissions
  if (user.role === "admin") {
    return true;
  }

  // Check direct permissions
  if (user.permissions.includes(permission)) {
    return true;
  }

  // Check custom permissions
  if (user.customPermissions?.includes(permission)) {
    return true;
  }

  // Check wildcard permissions
  const permissionParts = permission.split(".");
  for (let i = permissionParts.length - 1; i >= 0; i--) {
    const wildcardPermission = permissionParts.slice(0, i).join(".") + ".*";
    if (
      user.permissions.includes(wildcardPermission) ||
      user.customPermissions?.includes(wildcardPermission)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user can access resource
 */
export function canAccessResource(
  user: FirebaseUser,
  resource: string,
  action: string,
  resourceData?: any
): PermissionCheckResult {
  const permission = `${resource}.${action}`;

  // Basic permission check
  if (!hasPermission(user, permission)) {
    return {
      hasPermission: false,
      reason: "Insufficient permissions",
      requiredPermissions: [permission],
    };
  }

  // Additional checks for "own" permissions
  if (permission.endsWith("_own") && resourceData) {
    const userIdField =
      resourceData.userId || resourceData.createdBy || resourceData.staffId;
    if (userIdField !== user.id) {
      return {
        hasPermission: false,
        reason: "Can only access own resources",
      };
    }
  }


  return { hasPermission: true };
}

/**
 * Get user's effective permissions (role + custom)
 */
export function getEffectivePermissions(user: FirebaseUser): string[] {
  const rolePermissions = SYSTEM_ROLES[user.role]?.permissions || [];
  const customPermissions = user.customPermissions || [];

  // Convert to Set to remove duplicates, then back to array
  const uniquePermissions = new Set([...rolePermissions, ...customPermissions]);
  return Array.from(uniquePermissions);
}

/**
 * Check if user can manage another user
 */
export function canManageUser(
  manager: FirebaseUser,
  targetUser: FirebaseUser
): boolean {
  // Admin can manage everyone
  if (manager.role === "admin") {
    return true;
  }

  // Store manager can manage sales staff and warehouse staff
  if (manager.role === "store_manager") {
    return ["sales_staff", "warehouse_staff", "viewer"].includes(
      targetUser.role
    );
  }

  // Users can only manage themselves (update_own)
  return manager.id === targetUser.id;
}

// =============================================================================
// QUERY HELPERS
// =============================================================================

export const UserQueries = {
  // Get active users by role
  getActiveUsersByRole: (role: UserRoleType) => ({
    collection: "users",
    where: [
      ["role", "==", role],
      ["isActive", "==", true],
      ["isDeleted", "==", false],
    ],
    orderBy: [["displayName", "asc"]],
  }),


  // Get users needing password change
  getUsersNeedingPasswordChange: () => ({
    collection: "users",
    where: [
      ["mustChangePassword", "==", true],
      ["isActive", "==", true],
    ],
  }),

  // Get user sessions
  getUserSessions: (userId: string) => ({
    collection: "userSessions",
    where: [
      ["userId", "==", userId],
      ["isActive", "==", true],
    ],
    orderBy: [["loginAt", "desc"]],
  }),

  // Get user activities
  getUserActivities: (userId: string, limit: number = 50) => ({
    collection: "userActivities",
    where: [["userId", "==", userId]],
    orderBy: [["timestamp", "desc"]],
    limit,
  }),

  // Get users with performance data
  getSalesStaffWithPerformance: () => ({
    collection: "users",
    where: [
      ["role", "==", "sales_staff"],
      ["isActive", "==", true],
    ],
    orderBy: [["performance.currentMonthSales", "desc"]],
  }),
} as const;
