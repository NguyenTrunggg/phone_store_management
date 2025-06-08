// =============================================================================
// iPhone Store Management System Constants
// Based on detailed business requirements document (UC01-UC05)
// =============================================================================

// App Configuration
export const APP_CONFIG = {
  name: "iPhone Store POS",
  version: "1.0.0",
  description: "Hệ thống quản lý bán hàng iPhone tại cửa hàng",
  company: "iPhone Store",
  maxIMEILength: 15,
  minIMEILength: 15,
  defaultWarrantyMonths: 12,
} as const;

// =============================================================================
// PRODUCT & INVENTORY STATUS (Based on UC01, UC02)
// =============================================================================

// Product IMEI Status (inventory_items collection)
export const PRODUCT_STATUS = {
  IN_STOCK: "in_stock", // Trong kho
  SOLD: "sold", // Đã bán
  RESERVED: "reserved", // Đã đặt trước
  RETURNED: "returned", // Đã trả hàng
  RETURNED_AVAILABLE: "returned_available", // Trong kho - Hàng trả lại (có thể bán)
  DEFECTIVE: "defective", // Lỗi
  UNDER_REPAIR: "under_repair", // Đang sửa chữa
  WARRANTY_OUT: "warranty_out", // Gửi bảo hành
  WARRANTY_IN: "warranty_in", // Nhận về từ bảo hành
} as const;

// Product Status Display Names (Vietnamese)
export const PRODUCT_STATUS_LABELS = {
  [PRODUCT_STATUS.IN_STOCK]: "Trong kho",
  [PRODUCT_STATUS.SOLD]: "Đã bán",
  [PRODUCT_STATUS.RESERVED]: "Đã đặt trước",
  [PRODUCT_STATUS.RETURNED]: "Đã trả hàng",
  [PRODUCT_STATUS.RETURNED_AVAILABLE]: "Trong kho - Hàng trả lại",
  [PRODUCT_STATUS.DEFECTIVE]: "Lỗi",
  [PRODUCT_STATUS.UNDER_REPAIR]: "Đang sửa chữa",
  [PRODUCT_STATUS.WARRANTY_OUT]: "Gửi bảo hành",
  [PRODUCT_STATUS.WARRANTY_IN]: "Nhận về từ bảo hành",
} as const;

// Available for sale statuses
export const AVAILABLE_FOR_SALE_STATUSES = [
  PRODUCT_STATUS.IN_STOCK,
  PRODUCT_STATUS.RETURNED_AVAILABLE,
  PRODUCT_STATUS.WARRANTY_IN,
] as const;

// Product Variant Status (active/inactive for business)
export const VARIANT_STATUS = {
  ACTIVE: "active", // Đang hoạt động
  INACTIVE: "inactive", // Ngừng kinh doanh
  COMING_SOON: "coming_soon", // Sắp ra mắt
} as const;

export const VARIANT_STATUS_LABELS = {
  [VARIANT_STATUS.ACTIVE]: "Đang hoạt động",
  [VARIANT_STATUS.INACTIVE]: "Ngừng kinh doanh",
  [VARIANT_STATUS.COMING_SOON]: "Sắp ra mắt",
} as const;

// =============================================================================
// SALES & ORDERS STATUS (Based on UC03, UC05)
// =============================================================================

// Sales Order Status
export const SALE_STATUS = {
  COMPLETED: "completed", // Hoàn thành
  PENDING: "pending", // Chờ xử lý
  CANCELLED: "cancelled", // Đã hủy
  PROCESSING_RETURN: "processing_return", // Đang xử lý trả hàng
  RETURNED: "returned", // Đã trả hàng
  PARTIALLY_RETURNED: "partially_returned", // Trả hàng một phần
} as const;

export const SALE_STATUS_LABELS = {
  [SALE_STATUS.COMPLETED]: "Hoàn thành",
  [SALE_STATUS.PENDING]: "Chờ xử lý",
  [SALE_STATUS.CANCELLED]: "Đã hủy",
  [SALE_STATUS.PROCESSING_RETURN]: "Đang xử lý trả hàng",
  [SALE_STATUS.RETURNED]: "Đã trả hàng",
  [SALE_STATUS.PARTIALLY_RETURNED]: "Trả hàng một phần",
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PAID: "paid", // Đã thanh toán
  PENDING: "pending", // Chờ thanh toán
  FAILED: "failed", // Thất bại
  PARTIAL_REFUND: "partial_refund", // Đã hoàn tiền một phần
  FULL_REFUND: "full_refund", // Đã hoàn tiền toàn bộ
  CANCELLED: "cancelled", // Đã hủy thanh toán
} as const;

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PAID]: "Đã thanh toán",
  [PAYMENT_STATUS.PENDING]: "Chờ thanh toán",
  [PAYMENT_STATUS.FAILED]: "Thất bại",
  [PAYMENT_STATUS.PARTIAL_REFUND]: "Đã hoàn tiền một phần",
  [PAYMENT_STATUS.FULL_REFUND]: "Đã hoàn tiền toàn bộ",
  [PAYMENT_STATUS.CANCELLED]: "Đã hủy thanh toán",
} as const;

// Payment Methods (Based on UC02, UC05)
export const PAYMENT_METHODS = {
  CASH: "cash", // Tiền mặt
  BANK_TRANSFER: "bank_transfer", // Chuyển khoản
  CREDIT_CARD: "credit_card", // Thẻ tín dụng
  DEBIT_CARD: "debit_card", // Thẻ ghi nợ
  APPLE_PAY: "apple_pay", // Apple Pay
  QR_CODE: "qr_code", // QR Code
} as const;

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: "Tiền mặt",
  [PAYMENT_METHODS.BANK_TRANSFER]: "Chuyển khoản",
  [PAYMENT_METHODS.CREDIT_CARD]: "Thẻ tín dụng",
  [PAYMENT_METHODS.DEBIT_CARD]: "Thẻ ghi nợ",
  [PAYMENT_METHODS.APPLE_PAY]: "Apple Pay",
  [PAYMENT_METHODS.QR_CODE]: "QR Code",
} as const;

// =============================================================================
// RETURNS STATUS (Based on UC05)
// =============================================================================

export const RETURN_STATUS = {
  PENDING_APPROVAL: "pending_approval", // Chờ duyệt
  APPROVED: "approved", // Đã duyệt
  REJECTED: "rejected", // Từ chối
  PROCESSED: "processed", // Đã xử lý
  REFUNDED: "refunded", // Đã hoàn tiền
  EXCHANGED: "exchanged", // Đã đổi hàng
} as const;

export const RETURN_STATUS_LABELS = {
  [RETURN_STATUS.PENDING_APPROVAL]: "Chờ duyệt",
  [RETURN_STATUS.APPROVED]: "Đã duyệt",
  [RETURN_STATUS.REJECTED]: "Từ chối",
  [RETURN_STATUS.PROCESSED]: "Đã xử lý",
  [RETURN_STATUS.REFUNDED]: "Đã hoàn tiền",
  [RETURN_STATUS.EXCHANGED]: "Đã đổi hàng",
} as const;

// Return Reasons
export const RETURN_REASONS = {
  DEFECTIVE: "defective", // Lỗi sản phẩm
  WRONG_MODEL: "wrong_model", // Sai model
  CUSTOMER_CHANGED_MIND: "customer_changed_mind", // Khách đổi ý
  DAMAGED_SHIPPING: "damaged_shipping", // Hỏng trong vận chuyển
  NOT_AS_DESCRIBED: "not_as_described", // Không đúng mô tả
  OTHER: "other", // Khác
} as const;

export const RETURN_REASON_LABELS = {
  [RETURN_REASONS.DEFECTIVE]: "Lỗi sản phẩm",
  [RETURN_REASONS.WRONG_MODEL]: "Sai model",
  [RETURN_REASONS.CUSTOMER_CHANGED_MIND]: "Khách đổi ý",
  [RETURN_REASONS.DAMAGED_SHIPPING]: "Hỏng trong vận chuyển",
  [RETURN_REASONS.NOT_AS_DESCRIBED]: "Không đúng mô tả",
  [RETURN_REASONS.OTHER]: "Khác",
} as const;

// Return Actions
export const RETURN_ACTIONS = {
  REFUND: "refund", // Hoàn tiền
  EXCHANGE: "exchange", // Đổi hàng
  REPAIR: "repair", // Sửa chữa
  STORE_CREDIT: "store_credit", // Tín dụng cửa hàng
} as const;

export const RETURN_ACTION_LABELS = {
  [RETURN_ACTIONS.REFUND]: "Hoàn tiền",
  [RETURN_ACTIONS.EXCHANGE]: "Đổi hàng",
  [RETURN_ACTIONS.REPAIR]: "Sửa chữa",
  [RETURN_ACTIONS.STORE_CREDIT]: "Tín dụng cửa hàng",
} as const;

// =============================================================================
// PURCHASE ORDERS STATUS (Based on UC02)
// =============================================================================

export const PURCHASE_ORDER_STATUS = {
  PENDING: "pending", // Đang chờ hàng
  PARTIALLY_RECEIVED: "partially_received", // Đã nhận một phần
  COMPLETED: "completed", // Đã hoàn thành
  CANCELLED: "cancelled", // Đã hủy
} as const;

export const PURCHASE_ORDER_STATUS_LABELS = {
  [PURCHASE_ORDER_STATUS.PENDING]: "Đang chờ hàng",
  [PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED]: "Đã nhận một phần",
  [PURCHASE_ORDER_STATUS.COMPLETED]: "Đã hoàn thành",
  [PURCHASE_ORDER_STATUS.CANCELLED]: "Đã hủy",
} as const;

// =============================================================================
// USER ROLES & PERMISSIONS (Based on UC01-UC05 Actors)
// =============================================================================

export const USER_ROLES = {
  WAREHOUSE_STAFF: "warehouse_staff", // Nhân viên Kho (UC02)
  SALES_STAFF: "sales_staff", // Nhân viên Bán hàng (UC04, UC05)
  STORE_MANAGER: "store_manager", // Quản lý Cửa hàng (UC01, UC03)
  ADMIN: "admin", // Quản trị viên
} as const;

export const USER_ROLE_LABELS = {
  [USER_ROLES.WAREHOUSE_STAFF]: "Nhân viên Kho",
  [USER_ROLES.SALES_STAFF]: "Nhân viên Bán hàng",
  [USER_ROLES.STORE_MANAGER]: "Quản lý Cửa hàng",
  [USER_ROLES.ADMIN]: "Quản trị viên",
} as const;

// Role Permissions Matrix
export const ROLE_PERMISSIONS = {
  [USER_ROLES.WAREHOUSE_STAFF]: [
    "inventory.create",
    "inventory.read",
    "inventory.update",
    "purchase_orders.create",
    "purchase_orders.read",
    "purchase_orders.update",
    "products.read",
  ],
  [USER_ROLES.SALES_STAFF]: [
    "sales.create",
    "sales.read",
    "sales.update",
    "returns.create",
    "returns.read",
    "returns.update",
    "products.read",
    "inventory.read",
    "customers.create",
    "customers.read",
    "customers.update",
    "warranty.check",
  ],
  [USER_ROLES.STORE_MANAGER]: [
    "products.create",
    "products.read",
    "products.update",
    "products.delete",
    "reports.read",
    "sales.read",
    "inventory.read",
    "users.read",
    "users.update",
    "settings.read",
    "settings.update",
  ],
  [USER_ROLES.ADMIN]: ["*"], // All permissions
} as const;

// =============================================================================
// STOCK MOVEMENTS (Audit Trail)
// =============================================================================

export const STOCK_MOVEMENT_TYPES = {
  IMPORT: "import", // Nhập kho
  SALE: "sale", // Bán hàng
  RETURN: "return", // Trả hàng
  ADJUSTMENT: "adjustment", // Điều chỉnh
  TRANSFER: "transfer", // Chuyển kho
  WARRANTY_OUT: "warranty_out", // Gửi bảo hành
  WARRANTY_IN: "warranty_in", // Nhận về từ bảo hành
  DAMAGED: "damaged", // Hư hỏng
  LOST: "lost", // Mất hàng
} as const;

export const STOCK_MOVEMENT_TYPE_LABELS = {
  [STOCK_MOVEMENT_TYPES.IMPORT]: "Nhập kho",
  [STOCK_MOVEMENT_TYPES.SALE]: "Bán hàng",
  [STOCK_MOVEMENT_TYPES.RETURN]: "Trả hàng",
  [STOCK_MOVEMENT_TYPES.ADJUSTMENT]: "Điều chỉnh",
  [STOCK_MOVEMENT_TYPES.TRANSFER]: "Chuyển kho",
  [STOCK_MOVEMENT_TYPES.WARRANTY_OUT]: "Gửi bảo hành",
  [STOCK_MOVEMENT_TYPES.WARRANTY_IN]: "Nhận về từ bảo hành",
  [STOCK_MOVEMENT_TYPES.DAMAGED]: "Hư hỏng",
  [STOCK_MOVEMENT_TYPES.LOST]: "Mất hàng",
} as const;

// =============================================================================
// FIREBASE COLLECTIONS (Database Structure)
// =============================================================================

// Collections
export const COLLECTIONS = {
  USERS: "users",
  PRODUCTS: "products",
  VARIANTS: "variants",
  INVENTORY: "inventory",
  SALES_ORDERS: "salesOrders",
  ORDER_ITEMS: "orderItems",
  CUSTOMERS: "customers",
  SUPPLIERS: "suppliers",
  PURCHASE_ORDERS: "purchaseOrders",
  RETURNS: "returns",
  RETURN_ITEMS: "returnItems",
  STOCK_MOVEMENTS: "stockMovements",
  REPORTS: "reports",
} as const;

// Subcollections
export const SUBCOLLECTIONS = {
  VARIANTS: "variants", // products/{productId}/variants
  ORDER_ITEMS: "orderItems", // salesOrders/{orderId}/orderItems
  RETURN_ITEMS: "returnItems", // returns/{returnId}/returnItems
} as const;

// =============================================================================
// APPLE PRODUCT SPECIFICATIONS
// =============================================================================

// iPhone Storage Options
export const IPHONE_STORAGE_OPTIONS = [
  "64GB",
  "128GB",
  "256GB",
  "512GB",
  "1TB",
] as const;

// iPhone Colors (Common across models)
export const IPHONE_COLORS = {
  // iPhone 15 Series Colors
  NATURAL_TITANIUM: "Titan Tự Nhiên",
  BLUE_TITANIUM: "Titan Xanh Dương",
  WHITE_TITANIUM: "Titan Trắng",
  BLACK_TITANIUM: "Titan Đen",

  // Standard Colors
  PINK: "Hồng",
  YELLOW: "Vàng",
  GREEN: "Xanh Lá",
  BLUE: "Xanh Dương",
  BLACK: "Đen",
  WHITE: "Trắng",
  PURPLE: "Tím",
  RED: "Đỏ",
  STARLIGHT: "Ánh Sao",
  MIDNIGHT: "Nửa Đêm",
  SPACE_GRAY: "Xám Không Gian",
  GOLD: "Vàng",
  ROSE_GOLD: "Vàng Hồng",
  SILVER: "Bạc",
} as const;

// =============================================================================
// BUSINESS RULES & VALIDATIONS
// =============================================================================

// Return Policy
export const RETURN_POLICY = {
  RETURN_PERIOD_DAYS: 7, // 7 ngày đổi trả
  WARRANTY_PERIOD_MONTHS: 12, // 12 tháng bảo hành
  MAX_RETURN_VALUE_WITHOUT_APPROVAL: 10000000, // 10 triệu VND
} as const;

// Inventory Alerts
export const INVENTORY_ALERTS = {
  LOW_STOCK_THRESHOLD: 5, // Cảnh báo hết hàng khi < 5
  OUT_OF_STOCK_THRESHOLD: 0, // Hết hàng
  OVERSTOCK_THRESHOLD: 100, // Tồn kho quá nhiều > 100
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  IMEI: {
    LENGTH: 15,
    PATTERN: /^\d{15}$/,
  },
  SERIAL_NUMBER: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 20,
    PATTERN: /^[A-Z0-9]+$/,
  },
  PHONE: {
    PATTERN: /^(\+84|0)[0-9]{9,10}$/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PRICE: {
    MIN: 0,
    MAX: 999999999,
  },
} as const;

// =============================================================================
// UI/UX CONSTANTS (Apple Design System)
// =============================================================================

// Apple iOS Colors
export const IOS_COLORS = {
  // System Colors
  BLUE: "#007AFF",
  GREEN: "#34C759",
  RED: "#FF3B30",
  ORANGE: "#FF9500",
  YELLOW: "#FFCC00",
  PURPLE: "#AF52DE",
  PINK: "#FF2D92",

  // Gray Scale
  GRAY_50: "#F5F5F7",
  GRAY_100: "#F2F2F7",
  GRAY_200: "#E5E5EA",
  GRAY_300: "#D1D1D6",
  GRAY_400: "#C7C7CC",
  GRAY_500: "#AEAEB2",
  GRAY_600: "#8E8E93",
  GRAY_700: "#636366",
  GRAY_800: "#48484A",
  GRAY_900: "#1D1D1F",

  // Semantic Colors
  SUCCESS: "#34C759",
  WARNING: "#FF9500",
  ERROR: "#FF3B30",
  INFO: "#007AFF",
} as const;

// =============================================================================
// ROUTES & NAVIGATION
// =============================================================================

export const ROUTES = {
  // Authentication
  LOGIN: "/login",
  LOGOUT: "/logout",
  FORGOT_PASSWORD: "/forgot-password",

  // Main App
  DASHBOARD: "/dashboard",

  // Products & Inventory
  PRODUCTS: "/products",
  PRODUCT_DETAIL: "/products/[id]",
  INVENTORY: "/inventory",
  STOCK_INTAKE: "/inventory/stock-intake",

  // Sales & POS
  POS: "/pos",
  SALES: "/sales",
  SALE_DETAIL: "/sales/[id]",

  // Returns
  RETURNS: "/returns",
  RETURN_DETAIL: "/returns/[id]",

  // Reports
  REPORTS: "/reports",
  SALES_REPORTS: "/reports/sales",
  INVENTORY_REPORTS: "/reports/inventory",
  REVENUE_REPORTS: "/reports/revenue",

  // Administration
  USERS: "/users",
  SETTINGS: "/settings",
  PROFILE: "/profile",

  // Warranty
  WARRANTY_CHECK: "/warranty-check",
} as const;

// =============================================================================
// DATE & TIME FORMATS
// =============================================================================

export const DATE_FORMATS = {
  DISPLAY: "dd/MM/yyyy",
  DISPLAY_WITH_TIME: "dd/MM/yyyy HH:mm",
  DISPLAY_SHORT: "dd/MM",
  API: "yyyy-MM-dd",
  MONTH_YEAR: "MM/yyyy",
  TIME_ONLY: "HH:mm",
  DATETIME_ISO: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

// =============================================================================
// PAGINATION & LIMITS
// =============================================================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 1000,
} as const;

// =============================================================================
// LOCAL STORAGE KEYS
// =============================================================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: "iphone_store_auth_token",
  USER_PREFERENCES: "iphone_store_user_preferences",
  THEME: "iphone_store_theme",
  LANGUAGE: "iphone_store_language",
  POS_CART: "iphone_store_pos_cart",
  LAST_LOGIN: "iphone_store_last_login",
} as const;

// =============================================================================
// ERROR & SUCCESS MESSAGES
// =============================================================================

export const ERROR_MESSAGES = {
  // Network & Connection
  NETWORK_ERROR: "Lỗi kết nối mạng. Vui lòng kiểm tra và thử lại.",
  TIMEOUT_ERROR: "Kết nối quá thời gian chờ. Vui lòng thử lại.",

  // Authentication
  UNAUTHORIZED: "Bạn không có quyền truy cập chức năng này.",
  SESSION_EXPIRED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  INVALID_CREDENTIALS: "Thông tin đăng nhập không đúng.",

  // Data & Validation
  NOT_FOUND: "Không tìm thấy dữ liệu yêu cầu.",
  VALIDATION_ERROR: "Dữ liệu nhập vào không hợp lệ. Vui lòng kiểm tra lại.",
  DUPLICATE_IMEI: "IMEI đã tồn tại trong hệ thống.",
  DUPLICATE_SKU: "Mã SKU đã tồn tại.",
  INVALID_IMEI: "IMEI không đúng định dạng (phải có 15 chữ số).",

  // Business Logic
  INSUFFICIENT_STOCK: "Không đủ hàng trong kho.",
  PRODUCT_NOT_AVAILABLE: "Sản phẩm hiện không có sẵn.",
  CANNOT_DELETE_IN_USE: "Không thể xóa vì đang được sử dụng.",
  RETURN_PERIOD_EXPIRED: "Đã quá thời hạn đổi trả.",

  // System
  SERVER_ERROR: "Lỗi hệ thống. Vui lòng thử lại sau.",
  UNKNOWN_ERROR: "Đã xảy ra lỗi không xác định.",
  PERMISSION_DENIED: "Không có quyền thực hiện thao tác này.",
} as const;

export const SUCCESS_MESSAGES = {
  // CRUD Operations
  CREATED: "Tạo mới thành công!",
  UPDATED: "Cập nhật thành công!",
  DELETED: "Xóa thành công!",
  SAVED: "Lưu thành công!",

  // Business Operations
  SALE_COMPLETED: "Hoàn thành bán hàng thành công!",
  RETURN_PROCESSED: "Xử lý trả hàng thành công!",
  STOCK_IMPORTED: "Nhập kho thành công!",
  PAYMENT_PROCESSED: "Xử lý thanh toán thành công!",

  // Data Operations
  IMPORTED: "Nhập dữ liệu thành công!",
  EXPORTED: "Xuất dữ liệu thành công!",
  BACKUP_CREATED: "Sao lưu dữ liệu thành công!",

  // User Actions
  LOGIN_SUCCESS: "Đăng nhập thành công!",
  LOGOUT_SUCCESS: "Đăng xuất thành công!",
  PASSWORD_CHANGED: "Đổi mật khẩu thành công!",
} as const;

// =============================================================================
// FILE UPLOAD SETTINGS
// =============================================================================

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 10,
  ACCEPTED_IMAGE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic", // iPhone photos
  ],
  ACCEPTED_DOCUMENT_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
} as const;

// =============================================================================
// TYPE EXPORTS (TypeScript Support)
// =============================================================================

export type ProductStatusType =
  (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];
export type VariantStatusType =
  (typeof VARIANT_STATUS)[keyof typeof VARIANT_STATUS];
export type SaleStatusType = (typeof SALE_STATUS)[keyof typeof SALE_STATUS];
export type PaymentStatusType =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export type PaymentMethodType =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];
export type UserRoleType = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type ReturnStatusType =
  (typeof RETURN_STATUS)[keyof typeof RETURN_STATUS];
export type ReturnReasonType =
  (typeof RETURN_REASONS)[keyof typeof RETURN_REASONS];
export type ReturnActionType =
  (typeof RETURN_ACTIONS)[keyof typeof RETURN_ACTIONS];
export type PurchaseOrderStatusType =
  (typeof PURCHASE_ORDER_STATUS)[keyof typeof PURCHASE_ORDER_STATUS];
export type StockMovementType =
  (typeof STOCK_MOVEMENT_TYPES)[keyof typeof STOCK_MOVEMENT_TYPES];
export type CollectionNameType = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
export type SubcollectionNameType =
  (typeof SUBCOLLECTIONS)[keyof typeof SUBCOLLECTIONS];
export type RouteType = (typeof ROUTES)[keyof typeof ROUTES];
export type IPhoneStorageType = (typeof IPHONE_STORAGE_OPTIONS)[number];
export type IPhoneColorType =
  (typeof IPHONE_COLORS)[keyof typeof IPHONE_COLORS];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const getStatusLabel = (
  status: string,
  statusType: "product" | "sale" | "payment" | "return" | "purchase"
) => {
  switch (statusType) {
    case "product":
      return PRODUCT_STATUS_LABELS[status as ProductStatusType] || status;
    case "sale":
      return SALE_STATUS_LABELS[status as SaleStatusType] || status;
    case "payment":
      return PAYMENT_STATUS_LABELS[status as PaymentStatusType] || status;
    case "return":
      return RETURN_STATUS_LABELS[status as ReturnStatusType] || status;
    case "purchase":
      return (
        PURCHASE_ORDER_STATUS_LABELS[status as PurchaseOrderStatusType] ||
        status
      );
    default:
      return status;
  }
};

export const isProductAvailableForSale = (
  status: ProductStatusType
): boolean => {
  return AVAILABLE_FOR_SALE_STATUSES.includes(status as any);
};

export const getUserRoleLabel = (role: UserRoleType): string => {
  return USER_ROLE_LABELS[role] || role;
};

export const validateIMEI = (imei: string): boolean => {
  return VALIDATION_RULES.IMEI.PATTERN.test(imei);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);
};
