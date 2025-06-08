import { Timestamp } from "firebase/firestore";
import { FirebaseAuditableDocument } from "./index";

// =============================================================================
// REPORTS MODEL (UC03: Revenue Reporting & Business Intelligence)
// Collections: dailyReports, monthlyReports, revenueReports
// =============================================================================

/**
 * Daily sales report
 * Document path: dailyReports/{reportDate}
 * Document ID format: YYYY-MM-DD (e.g., "2024-12-15")
 */
export interface FirebaseDailyReport extends FirebaseAuditableDocument {
  // Report identification
  reportDate: string; // YYYY-MM-DD format
  reportTimestamp: Timestamp; // Actual date for querying

  // Generation info
  generatedAt: Timestamp;
  generatedBy: string; // User ID or "system"
  isFinalized: boolean; // Can't be regenerated once finalized

  // Sales metrics
  salesMetrics: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    pendingOrders: number;

    totalRevenue: number;
    totalQuantitySold: number;
    averageOrderValue: number;

    // Payment method breakdown
    paymentMethods: Record<
      string,
      {
        orderCount: number;
        totalAmount: number;
        percentage: number;
      }
    >;

    // Hour-by-hour breakdown
    hourlyBreakdown: Array<{
      hour: number; // 0-23
      orders: number;
      revenue: number;
      topProduct?: string;
    }>;
  };

  // Product performance
  productPerformance: {
    totalProductsSold: number;
    uniqueProductsSold: number;

    // Top performing products
    topProducts: Array<{
      [x: string]: any;
      productId: string;
      productName: string;
      quantitySold: number;
      revenue: number;
      profitMargin: number;
    }>;

    // Product category breakdown
    categoryBreakdown: Record<
      string,
      {
        quantitySold: number;
        revenue: number;
        orderCount: number;
      }
    >;

    // Variant performance
    topVariants: Array<{
      variantId: string;
      productName: string;
      colorName: string;
      storageCapacity: string;
      quantitySold: number;
      revenue: number;
    }>;
  };

  // Staff performance
  staffPerformance: {
    activeStaff: number;

    // Individual performance
    staffMetrics: Array<{
      staffId: string;
      staffName: string;
      ordersProcessed: number;
      revenue: number;
      averageOrderValue: number;
      customerCount: number;
      hoursWorked?: number;
      revenuePerHour?: number;
    }>;

    // Top performers
    topSalesPerson: {
      staffId: string;
      staffName: string;
      revenue: number;
    };
  };

  // Customer metrics
  customerMetrics: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    vipCustomers: number;

    // Customer segments
    customerSegments: Record<
      string,
      {
        count: number;
        revenue: number;
        averageOrderValue: number;
      }
    >;
  };

  // Inventory impact
  inventoryMetrics: {
    itemsSold: number;
    stockMovements: number;
    lowStockAlerts: number;
    outOfStockItems: number;

    // Most moved items
    topMovingItems: Array<{
      productId: string;
      variantId: string;
      productName: string;
      colorName: string;
      storageCapacity: string;
      quantityMoved: number;
    }>;
  };

  // Returns and exchanges
  returnMetrics: {
    totalReturns: number;
    returnValue: number;
    returnRate: number; // Percentage of sales
    exchangeCount: number;
    refundAmount: number;

    // Return reasons
    returnReasons: Record<string, number>;
  };

  // Financial summary
  financialSummary: {
    grossRevenue: number;
    discountAmount: number;
    taxAmount: number;
    netRevenue: number;
    totalCost: number; // Cost of goods sold
    grossProfit: number;
    grossProfitMargin: number; // Percentage
    operatingExpenses?: number; // If tracked
  };

  // Comparative metrics
  comparativeMetrics: {
    previousDay: {
      revenueGrowth: number; // Percentage
      orderGrowth: number;
      customerGrowth: number;
    };
    previousWeek: {
      revenueGrowth: number;
      orderGrowth: number;
      averageOrderValueGrowth: number;
    };
    monthToDate: {
      totalRevenue: number;
      totalOrders: number;
      targetProgress: number; // If monthly targets are set
    };
  };

  // Operational metrics
  operationalMetrics: {
    averageTransactionTime?: number; // Minutes
    peakHours: number[]; // Hours with highest sales
    averageItemsPerOrder: number;
    conversionRate?: number; // If foot traffic is tracked

    // Efficiency metrics
    ordersPerStaff: number;
    revenuePerStaff: number;
  };

  // Quality metrics
  qualityMetrics: {
    customerComplaints: number;
    warrantyIssues: number;
    productDefects: number;
    customerSatisfactionScore?: number;
  };
}

/**
 * Monthly consolidated report
 * Document path: monthlyReports/{reportMonth}
 * Document ID format: YYYY-MM (e.g., "2024-12")
 */
export interface FirebaseMonthlyReport extends FirebaseAuditableDocument {
  // Report identification
  reportMonth: string; // YYYY-MM format
  reportYear: number;
  reportMonthNumber: number; // 1-12

  // Period details
  periodStart: Timestamp;
  periodEnd: Timestamp;
  totalDays: number;
  businessDays: number;

  // Generation info
  generatedAt: Timestamp;
  generatedBy: string;
  isFinalized: boolean;

  // Executive summary
  executiveSummary: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    grossProfitMargin: number;

    // Growth metrics
    revenueGrowth: number; // vs previous month
    orderGrowth: number;
    customerGrowth: number;

    // Key achievements
    achievements: string[];
    concerns: string[];
    recommendations: string[];
  };

  // Detailed sales analysis
  salesAnalysis: {
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    averageOrderValue: number;

    // Weekly breakdown
    weeklyBreakdown: Array<{
      weekNumber: number;
      weekStart: string; // YYYY-MM-DD
      weekEnd: string;
      orders: number;
      revenue: number;
      averageOrderValue: number;
    }>;

    // Daily trends
    dailyTrends: Array<{
      date: string; // YYYY-MM-DD
      dayOfWeek: string;
      orders: number;
      revenue: number;
      isWeekend: boolean;
      isHoliday?: boolean;
    }>;

    // Best and worst days
    bestDay: {
      date: string;
      orders: number;
      revenue: number;
    };

    worstDay: {
      date: string;
      orders: number;
      revenue: number;
    };
  };

  // Product performance analysis
  productAnalysis: {
    totalProductsSold: number;
    uniqueProductsSold: number;

    // Top performers
    topProducts: Array<{
      productId: string;
      productName: string;
      quantitySold: number;
      revenue: number;
      profitMargin: number;
      marketShare: number; // Percentage of total sales
    }>;

    // Variant analysis
    variantAnalysis: Array<{
      variantId: string;
      productName: string;
      colorName: string;
      storageCapacity: string;
      quantitySold: number;
      revenue: number;
      inventoryTurnover: number;
    }>;

    // Color preferences
    colorPreferences: Array<{
      colorName: string;
      quantitySold: number;
      percentage: number;
    }>;

    // Storage preferences
    storagePreferences: Array<{
      storageCapacity: string;
      quantitySold: number;
      percentage: number;
    }>;
  };

  // Customer analysis
  customerAnalysis: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    customerRetentionRate: number;

    // Customer segments
    segmentAnalysis: Record<
      string,
      {
        count: number;
        revenue: number;
        averageOrderValue: number;
        growthRate: number;
      }
    >;

    // Customer lifetime value
    averageCustomerLifetimeValue: number;
    customerAcquisitionCost?: number;

    // Geographic distribution
    locationDistribution: Record<
      string,
      {
        customerCount: number;
        revenue: number;
      }
    >;
  };

  // Staff performance analysis
  staffAnalysis: {
    totalStaff: number;
    activeStaff: number;

    // Overall performance
    staffPerformance: Array<{
      staffId: string;
      staffName: string;
      role: string;
      ordersProcessed: number;
      revenue: number;
      averageOrderValue: number;
      customerCount: number;
      performanceRating: number; // 1-5 scale
      growthRate: number;
    }>;

    // Team metrics
    teamMetrics: {
      totalRevenue: number;
      revenuePerStaff: number;
      ordersPerStaff: number;
      teamEfficiency: number;
    };
  };

  // Financial performance
  financialPerformance: {
    revenue: {
      gross: number;
      net: number;
      growth: number;
    };

    costs: {
      costOfGoodsSold: number;
      operatingExpenses?: number;
      totalCosts: number;
    };

    profit: {
      gross: number;
      grossMargin: number;
      net?: number;
      netMargin?: number;
    };

    // Profitability by category
    categoryProfitability: Record<
      string,
      {
        revenue: number;
        cost: number;
        profit: number;
        margin: number;
      }
    >;
  };

  // Inventory analysis
  inventoryAnalysis: {
    averageInventoryValue: number;
    inventoryTurnover: number;
    stockouts: number;
    overstock: number;

    // Fast/slow moving items
    fastMovingItems: Array<{
      productId: string;
      productName: string;
      turnoverRate: number;
      quantitySold: number;
    }>;

    slowMovingItems: Array<{
      productId: string;
      productName: string;
      turnoverRate: number;
      daysInStock: number;
    }>;
  };

  // Market trends analysis
  marketTrends: {
    seasonalPatterns: Array<{
      period: string;
      trend: "up" | "down" | "stable";
      percentage: number;
    }>;

    productTrends: Array<{
      productName: string;
      trend: "rising" | "declining" | "stable";
      growthRate: number;
    }>;
  };
}

/**
 * Revenue report (flexible period)
 * Document path: revenueReports/{reportId}
 */
export interface FirebaseRevenueReport extends FirebaseAuditableDocument {
  // Report identification
  reportName: string;
  reportType:
    | "daily"
    | "weekly"
    | "monthly"
    | "quarterly"
    | "yearly"
    | "custom";

  // Period details
  periodStart: Timestamp;
  periodEnd: Timestamp;

  // Filters applied
  filters: {
    storeIds?: string[];
    staffIds?: string[];
    productIds?: string[];
    customerSegments?: string[];
    paymentMethods?: string[];
  };

  // Revenue breakdown
  revenueBreakdown: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;

    // By time period
    timeSeriesData: Array<{
      period: string; // Date or period label
      revenue: number;
      orders: number;
      averageOrderValue: number;
    }>;

    // By product
    productBreakdown: Array<{
      productId: string;
      productName: string;
      revenue: number;
      quantity: number;
      percentage: number;
    }>;

    // By staff
    staffBreakdown: Array<{
      staffId: string;
      staffName: string;
      revenue: number;
      orders: number;
      commission?: number;
    }>;

    // By customer segment
    segmentBreakdown: Array<{
      segment: string;
      revenue: number;
      customerCount: number;
      averageOrderValue: number;
    }>;

    // By payment method
    paymentBreakdown: Array<{
      method: string;
      revenue: number;
      orderCount: number;
      percentage: number;
    }>;
  };

  // Profit analysis
  profitAnalysis: {
    totalProfit: number;
    profitMargin: number;

    // Cost breakdown
    costs: {
      costOfGoodsSold: number;
      operatingExpenses?: number;
      discounts: number;
      returns: number;
    };

    // Profit by product
    productProfitability: Array<{
      productId: string;
      productName: string;
      revenue: number;
      cost: number;
      profit: number;
      margin: number;
    }>;
  };

  // Growth analysis
  growthAnalysis: {
    revenueGrowth: number;
    orderGrowth: number;
    customerGrowth: number;

    // Comparison periods
    comparisonPeriods: Array<{
      periodName: string;
      periodStart: Timestamp;
      periodEnd: Timestamp;
      revenue: number;
      orders: number;
      growthRate: number;
    }>;
  };

  // KPI metrics
  kpiMetrics: {
    totalRevenue: number;
    averageOrderValue: number;
    customerLifetimeValue: number;
    inventoryTurnover: number;
    returnRate: number;
    grossProfitMargin: number;
    netProfitMargin?: number;
    salesGrowthRate: number;
    customerAcquisitionCost?: number;
    customerRetentionRate: number;
  };
}

/**
 * Inventory valuation report
 * Document path: inventoryReports/{reportId}
 */
export interface FirebaseInventoryReport extends FirebaseAuditableDocument {
  // Report identification
  reportDate: Timestamp;
  reportType: "snapshot" | "movement" | "valuation" | "aging";

  // Inventory snapshot
  inventorySnapshot: {
    totalValue: number;
    totalQuantity: number;
    totalProducts: number;
    totalVariants: number;

    // By product
    productBreakdown: Array<{
      productId: string;
      productName: string;
      totalQuantity: number;
      totalValue: number;
      averageCost: number;
      variants: Array<{
        variantId: string;
        colorName: string;
        storageCapacity: string;
        quantity: number;
        value: number;
        averageCost: number;
      }>;
    }>;

    // By status
    statusBreakdown: Record<
      string,
      {
        quantity: number;
        value: number;
        percentage: number;
      }
    >;
  };

  // Stock movement analysis
  movementAnalysis: {
    totalMovements: number;
    inboundMovements: number;
    outboundMovements: number;

    // Movement types
    movementTypes: Record<
      string,
      {
        count: number;
        quantity: number;
        value: number;
      }
    >;

    // Fast/slow movers
    fastMovers: Array<{
      productId: string;
      productName: string;
      movementCount: number;
      turnoverRate: number;
    }>;

    slowMovers: Array<{
      productId: string;
      productName: string;
      daysInStock: number;
      turnoverRate: number;
    }>;
  };

  // Stock aging analysis
  agingAnalysis: {
    ageCategories: Array<{
      ageRange: string; // e.g., "0-30 days", "31-60 days"
      quantity: number;
      value: number;
      percentage: number;
    }>;

    // Products by age
    productAging: Array<{
      productId: string;
      productName: string;
      averageAge: number;
      oldestItem: number; // Days
      quantity: number;
      value: number;
    }>;
  };

  // Alerts and recommendations
  alerts: {
    lowStock: Array<{
      productId: string;
      productName: string;
      variantId: string;
      currentStock: number;
      minimumStock: number;
      recommended: string;
    }>;

    overstock: Array<{
      productId: string;
      productName: string;
      variantId: string;
      currentStock: number;
      recommendedStock: number;
      excessQuantity: number;
    }>;

    slowMoving: Array<{
      productId: string;
      productName: string;
      daysInStock: number;
      lastSale?: Timestamp;
      recommended: string;
    }>;
  };
}

/**
 * Customer analytics report
 * Document path: customerReports/{reportId}
 */
export interface FirebaseCustomerReport extends FirebaseAuditableDocument {
  // Report period
  periodStart: Timestamp;
  periodEnd: Timestamp;
  reportType: "summary" | "segmentation" | "lifetime_value" | "retention";

  // Customer overview
  customerOverview: {
    totalCustomers: number;
    newCustomers: number;
    activeCustomers: number;
    returningCustomers: number;

    // Growth metrics
    customerGrowthRate: number;
    retentionRate: number;
    churnRate: number;
  };

  // Customer segmentation
  segmentation: {
    byValue: Array<{
      segment: string; // e.g., "High Value", "Medium Value"
      customerCount: number;
      totalSpent: number;
      averageOrderValue: number;
      percentage: number;
    }>;

    byFrequency: Array<{
      segment: string; // e.g., "Frequent", "Occasional"
      customerCount: number;
      averageOrders: number;
      totalRevenue: number;
    }>;

    byRecency: Array<{
      segment: string; // e.g., "Recent", "Lapsed"
      customerCount: number;
      lastPurchaseRange: string;
      reactivationPotential: "high" | "medium" | "low";
    }>;
  };

  // Lifetime value analysis
  lifetimeValueAnalysis: {
    averageLifetimeValue: number;
    topCustomers: Array<{
      customerId: string;
      customerName: string;
      lifetimeValue: number;
      totalOrders: number;
      firstPurchase: Timestamp;
      lastPurchase: Timestamp;
    }>;

    // LTV by acquisition channel
    ltv_by_channel: Array<{
      channel: string;
      customerCount: number;
      averageLTV: number;
      acquisitionCost?: number;
      roi?: number;
    }>;
  };

  // Purchase behavior
  purchaseBehavior: {
    averageOrderValue: number;
    averageOrderFrequency: number; // Orders per month
    popularProducts: Array<{
      productId: string;
      productName: string;
      purchaseCount: number;
      customerCount: number;
      repeatPurchaseRate: number;
    }>;

    seasonalPatterns: Array<{
      month: number;
      orderCount: number;
      revenue: number;
      trend: "up" | "down" | "stable";
    }>;
  };

  // Customer satisfaction
  satisfactionMetrics: {
    averageRating?: number;
    npsScore?: number; // Net Promoter Score
    complaintRate: number;
    returnRate: number;

    // Feedback summary
    feedbackSummary: {
      totalFeedback: number;
      positive: number;
      neutral: number;
      negative: number;
      commonIssues: string[];
    };
  };
}

// =============================================================================
// INPUT/OUTPUT SCHEMAS
// =============================================================================

/**
 * Report generation request
 */
export interface GenerateReportRequest {
  reportType: "daily" | "monthly" | "revenue" | "inventory" | "customer";

  // Period specification
  periodStart: Date;
  periodEnd: Date;

  // Filters
  filters?: {
    storeIds?: string[];
    staffIds?: string[];
    productIds?: string[];
    customerSegments?: string[];
    includeReturns?: boolean;
  };

  // Output options
  outputFormat?: "json" | "csv" | "excel" | "pdf";
  includeCharts?: boolean;

  // Delivery options
  emailTo?: string[];
  scheduleRecurring?: {
    frequency: "daily" | "weekly" | "monthly";
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
  };
}

/**
 * KPI dashboard data
 */
export interface KPIDashboardData {
  // Period
  currentPeriod: {
    start: Date;
    end: Date;
  };

  // Key metrics
  metrics: {
    totalRevenue: {
      value: number;
      growth: number; // Percentage vs previous period
      trend: "up" | "down" | "stable";
    };

    totalOrders: {
      value: number;
      growth: number;
      trend: "up" | "down" | "stable";
    };

    averageOrderValue: {
      value: number;
      growth: number;
      trend: "up" | "down" | "stable";
    };

    inventoryTurnover: {
      value: number;
      target?: number;
      status: "good" | "warning" | "critical";
    };

    grossProfitMargin: {
      value: number; // Percentage
      target?: number;
      status: "good" | "warning" | "critical";
    };

    customerRetentionRate: {
      value: number; // Percentage
      target?: number;
      status: "good" | "warning" | "critical";
    };
  };

  // Quick insights
  insights: Array<{
    type: "achievement" | "concern" | "opportunity";
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    actionRequired?: boolean;
  }>;

  // Alerts
  alerts: Array<{
    type: "low_stock" | "high_returns" | "performance_drop" | "system";
    severity: "critical" | "warning" | "info";
    message: string;
    itemCount?: number;
    actionUrl?: string;
  }>;
}

// =============================================================================
// QUERY HELPERS
// =============================================================================

export const ReportQueries = {
  // Get daily reports for period
  getDailyReportsInRange: (startDate: Date, endDate: Date) => ({
    collection: "dailyReports",
    where: [
      ["reportTimestamp", ">=", startDate],
      ["reportTimestamp", "<=", endDate],
    ],
    orderBy: [["reportTimestamp", "desc"]],
  }),

  // Get monthly reports for year
  getMonthlyReportsForYear: (year: number) => ({
    collection: "monthlyReports",
    where: [["reportYear", "==", year]],
    orderBy: [["reportMonthNumber", "asc"]],
  }),

  // Get latest revenue reports
  getLatestRevenueReports: (limit: number = 10) => ({
    collection: "revenueReports",
    orderBy: [["createdAt", "desc"]],
    limit,
  }),

  // Get reports by type
  getReportsByType: (reportType: string) => ({
    collection: "revenueReports",
    where: [["reportType", "==", reportType]],
    orderBy: [["createdAt", "desc"]],
  }),

  // Get inventory reports
  getInventoryReports: (reportType?: string) => ({
    collection: "inventoryReports",
    where: reportType ? [["reportType", "==", reportType]] : [],
    orderBy: [["reportDate", "desc"]],
  }),
} as const;
