import {
  collection,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
  getDoc,
  setDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  BaseService,
  ServiceResponse,
} from "./base.service";
import {
  FirebaseSalesOrder,
  FirebaseSalesOrderItem,
} from "@/lib/firebase/models/pos.model";
import { FirebaseDailyReport } from "@/lib/firebase/models/reports.model";
import { COLLECTIONS, SUBCOLLECTIONS } from "@/constants";
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
  getHours,
  startOfHour,
} from "date-fns";

// A helper to create an empty daily report structure
const createEmptyDailyReport = (
  reportDateStr: string,
  reportTimestamp: Timestamp
): FirebaseDailyReport => {
  return {
    id: reportDateStr,
    reportDate: reportDateStr,
    reportTimestamp: reportTimestamp,
    generatedAt: Timestamp.now(),
    generatedBy: "system", // Or pass userId
    isFinalized: false,
    salesMetrics: {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
      totalQuantitySold: 0,
      averageOrderValue: 0,
      paymentMethods: {},
      hourlyBreakdown: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        orders: 0,
        revenue: 0,
      })),
    },
    productPerformance: {
      totalProductsSold: 0,
      uniqueProductsSold: 0,
      topProducts: [],
      categoryBreakdown: {},
      topVariants: [],
    },
    staffPerformance: {
      activeStaff: 0,
      staffMetrics: [],
      topSalesPerson: { staffId: "", staffName: "", revenue: 0 },
    },
    customerMetrics: {
      totalCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0,
      vipCustomers: 0,
      customerSegments: {},
    },
    inventoryMetrics: {
      itemsSold: 0,
      stockMovements: 0,
      lowStockAlerts: 0,
      outOfStockItems: 0,
      topMovingItems: [],
    },
    returnMetrics: {
      totalReturns: 0,
      returnValue: 0,
      returnRate: 0,
      exchangeCount: 0,
      refundAmount: 0,
      returnReasons: {},
    },
    financialSummary: {
      grossRevenue: 0,
      discountAmount: 0,
      taxAmount: 0,
      netRevenue: 0,
      totalCost: 0,
      grossProfit: 0,
      grossProfitMargin: 0,
    },
    comparativeMetrics: {
      previousDay: { revenueGrowth: 0, orderGrowth: 0, customerGrowth: 0 },
      previousWeek: {
        revenueGrowth: 0,
        orderGrowth: 0,
        averageOrderValueGrowth: 0,
      },
      monthToDate: { totalRevenue: 0, totalOrders: 0, targetProgress: 0 },
    },
    operationalMetrics: {
      averageItemsPerOrder: 0,
      ordersPerStaff: 0,
      revenuePerStaff: 0,
      peakHours: [],
    },
    qualityMetrics: {
      customerComplaints: 0,
      warrantyIssues: 0,
      productDefects: 0,
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: "system",
    updatedBy: "system",
  };
};

export class ReportsService extends BaseService {
  constructor() {
    super(COLLECTIONS.REPORTS);
  }

  /**
   * Gets a daily report for a specific date. If the report doesn't exist,
   * it generates a new one, saves it, and returns it.
   * This is the primary method to be called from the frontend.
   * @param reportDate The date for which to get or generate the report.
   * @param userId The ID of the user triggering the action.
   */
  async getOrGenerateDailyReport(
    reportDate: Date,
    userId: string = "system"
  ): Promise<ServiceResponse<FirebaseDailyReport>> {
    const reportDateStr = format(reportDate, "yyyy-MM-dd");
    const reportRef = doc(db, this.collectionName, reportDateStr);

    try {
      // First, try to fetch the existing report.
      const reportDoc = await getDoc(reportRef);
      if (reportDoc.exists()) {
        console.log(`Fetched daily report for ${reportDateStr} from cache.`);
        return {
          success: true,
          data: { id: reportDoc.id, ...reportDoc.data() } as FirebaseDailyReport,
        };
      }

      console.log(`Report for ${reportDateStr} not found. Generating new report...`);
      // If it doesn't exist, proceed with generation.
      const dailyReport = createEmptyDailyReport(
        reportDateStr,
        Timestamp.fromDate(reportDate)
      );
      dailyReport.generatedBy = userId;
      dailyReport.createdBy = userId;
      dailyReport.updatedBy = userId;

      const start = startOfDay(reportDate);
      const end = endOfDay(reportDate);

      // 1. Fetch all sales orders for the given day
      const ordersRef = collection(db, COLLECTIONS.SALES_ORDERS);
      const q = query(
        ordersRef,
        where("orderDate", ">=", Timestamp.fromDate(start)),
        where("orderDate", "<=", Timestamp.fromDate(end))
      );
      const orderSnapshots = await getDocs(q);
      const orders = orderSnapshots.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as FirebaseSalesOrder)
      );

      // If there are no orders, we still save an empty report to cache this fact.
      if (orders.length === 0) {
        await setDoc(reportRef, dailyReport);
        return { success: true, data: dailyReport };
      }

      // 2. Fetch all order items for these orders
      let allItems: FirebaseSalesOrderItem[] = [];
      for (const order of orders) {
        const itemsRef = collection(
          db,
          COLLECTIONS.SALES_ORDERS,
          order.id,
          SUBCOLLECTIONS.ORDER_ITEMS
        );
        const itemsSnapshot = await getDocs(itemsRef);
        itemsSnapshot.forEach((doc) => {
          allItems.push({ id: doc.id, ...doc.data() } as FirebaseSalesOrderItem);
        });
      }

      // 3. Process data and populate the report object (Full logic is preserved)
      const completedOrders = orders.filter((o) => o.status === "completed");

      // === Sales Metrics ===
      const sm = dailyReport.salesMetrics;
      sm.totalOrders = orders.length;
      sm.completedOrders = completedOrders.length;
      sm.cancelledOrders = orders.filter(
        (o) => o.status === "cancelled"
      ).length;
      sm.pendingOrders = orders.filter((o) =>
        o.status.startsWith("pending")
      ).length;
      sm.totalRevenue = completedOrders.reduce(
        (sum, o) => sum + o.totalAmount,
        0
      );
      sm.totalQuantitySold = completedOrders.reduce(
        (sum, o) => sum + o.totalQuantity,
        0
      );
      sm.averageOrderValue =
        sm.completedOrders > 0 ? sm.totalRevenue / sm.completedOrders : 0;

      orders.forEach((order) => {
        // Payment methods
        const pm = order.paymentMethod;
        if (!sm.paymentMethods[pm]) {
          sm.paymentMethods[pm] = {
            orderCount: 0,
            totalAmount: 0,
            percentage: 0,
          };
        }
        sm.paymentMethods[pm].orderCount++;
        if (order.status === "completed") {
          sm.paymentMethods[pm].totalAmount += order.totalAmount;
        }

        // Hourly breakdown
        const hour = getHours(order.orderDate.toDate());
        sm.hourlyBreakdown[hour].orders++;
        if (order.status === "completed") {
          sm.hourlyBreakdown[hour].revenue += order.totalAmount;
        }
      });
      // Calculate payment method percentages
      if (sm.totalRevenue > 0) {
        Object.keys(sm.paymentMethods).forEach((key) => {
          sm.paymentMethods[key].percentage =
            (sm.paymentMethods[key].totalAmount / sm.totalRevenue) * 100;
        });
      }

      // === Financial Summary ===
      const fs = dailyReport.financialSummary;
      fs.grossRevenue = completedOrders.reduce(
        (sum, o) => sum + o.subtotalAmount,
        0
      );
      fs.discountAmount = completedOrders.reduce(
        (sum, o) => sum + o.discountAmount,
        0
      );
      fs.taxAmount = completedOrders.reduce((sum, o) => sum + o.taxAmount, 0);
      fs.netRevenue = completedOrders.reduce(
        (sum, o) => sum + o.totalAmount,
        0
      );
      fs.totalCost = allItems
        .filter((item) =>
          completedOrders.some((o) => o.id === item.salesOrderId)
        )
        .reduce((sum, item) => sum + item.unitCost, 0);
      fs.grossProfit = fs.grossRevenue - fs.totalCost;
      fs.grossProfitMargin =
        fs.grossRevenue > 0 ? (fs.grossProfit / fs.grossRevenue) * 100 : 0;

      // === Product Performance ===
      const pp = dailyReport.productPerformance;
      const soldItems = allItems.filter((item) =>
        completedOrders.some((o) => o.id === item.salesOrderId)
      );
      pp.totalProductsSold = soldItems.length;

      const productSales: {
        [productId: string]: {
          productId: string;
          productName: string;
          quantitySold: number;
          revenue: number;
          profit: number;
        };
      } = {};
      const variantSales: {
        [variantId: string]: {
          variantId: string;
          productName: string;
          colorName: string;
          storageCapacity: string;
          quantitySold: number;
          revenue: number;
        };
      } = {};

      soldItems.forEach((item) => {
        // Product aggregation
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            quantitySold: 0,
            revenue: 0,
            profit: 0,
          };
        }
        productSales[item.productId].quantitySold += item.quantity;
        productSales[item.productId].revenue += item.finalPrice;
        productSales[item.productId].profit += item.finalPrice - item.unitCost;

        // Variant aggregation
        if (!variantSales[item.variantId]) {
          variantSales[item.variantId] = {
            variantId: item.variantId,
            productName: item.productName,
            colorName: item.colorName,
            storageCapacity: item.storageCapacity,
            quantitySold: 0,
            revenue: 0,
          };
        }
        variantSales[item.variantId].quantitySold += item.quantity;
        variantSales[item.variantId].revenue += item.finalPrice;
      });

      pp.uniqueProductsSold = Object.keys(productSales).length;
      pp.topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10) // Top 10
        .map((p) => ({
          ...p,
          profitMargin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
        }));

      pp.topVariants = Object.values(variantSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // === Staff Performance ===
      const sp = dailyReport.staffPerformance;
      const staffMetrics: {
        [staffId: string]: {
          staffId: string;
          staffName: string;
          ordersProcessed: number;
          revenue: number;
          customers: Set<string>;
        };
      } = {};

      completedOrders.forEach((order) => {
        if (!staffMetrics[order.staffId]) {
          staffMetrics[order.staffId] = {
            staffId: order.staffId,
            staffName: order.staffName || "Unknown",
            ordersProcessed: 0,
            revenue: 0,
            customers: new Set(),
          };
        }
        const metric = staffMetrics[order.staffId];
        metric.ordersProcessed++;
        metric.revenue += order.totalAmount;
        if (order.customerId) {
          metric.customers.add(order.customerId);
        }
      });

      sp.activeStaff = Object.keys(staffMetrics).length;
      sp.staffMetrics = Object.values(staffMetrics).map((m) => ({
        staffId: m.staffId,
        staffName: m.staffName,
        ordersProcessed: m.ordersProcessed,
        revenue: m.revenue,
        customerCount: m.customers.size,
        averageOrderValue:
          m.ordersProcessed > 0 ? m.revenue / m.ordersProcessed : 0,
      }));

      if (sp.staffMetrics.length > 0) {
        const topSeller = Object.values(staffMetrics).sort(
          (a, b) => b.revenue - a.revenue
        )[0];
        sp.topSalesPerson = {
          staffId: topSeller.staffId,
          staffName: topSeller.staffName,
          revenue: topSeller.revenue,
        };
      }

      // === Customer Metrics ===
      const cm = dailyReport.customerMetrics;
      const customerIds = new Set<string>();
      completedOrders.forEach((o) => {
        if (o.customerId) customerIds.add(o.customerId);
      });
      cm.totalCustomers = customerIds.size;
      
      // === Save Report ===
      await setDoc(reportRef, dailyReport, { merge: true });

      return { success: true, data: dailyReport };
    } catch (error) {
       console.error(`Error getting or generating daily report for ${reportDateStr}:`, error);
      return this.handleError(error);
    }
  }

  /**
   * Generates and saves a daily sales report for a given date.
   * This operation can be resource-intensive and should be run in a trusted environment (e.g., backend, cloud function).
   * @param reportDate The date for which to generate the report.
   * @param userId The ID of the user triggering the generation.
   */
  async generateDailyReport(
    reportDate: Date,
    userId: string = "system"
  ): Promise<ServiceResponse<FirebaseDailyReport>> {
    try {
      const reportDateStr = format(reportDate, "yyyy-MM-dd");
      const reportTimestamp = Timestamp.fromDate(reportDate);
      const dailyReport = createEmptyDailyReport(reportDateStr, reportTimestamp);
      dailyReport.generatedBy = userId;
      dailyReport.createdBy = userId;
      dailyReport.updatedBy = userId;

      const start = startOfDay(reportDate);
      const end = endOfDay(reportDate);

      // 1. Fetch all sales orders for the given day
      const ordersRef = collection(db, COLLECTIONS.SALES_ORDERS);
      const q = query(
        ordersRef,
        where("orderDate", ">=", Timestamp.fromDate(start)),
        where("orderDate", "<=", Timestamp.fromDate(end))
      );
      const orderSnapshots = await getDocs(q);
      const orders = orderSnapshots.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as FirebaseSalesOrder)
      );

      if (orders.length === 0) {
        // No sales, save an empty report
        const emptyReportRef = doc(db, this.collectionName, reportDateStr);
        await setDoc(emptyReportRef, dailyReport);
        return { success: true, data: dailyReport };
      }

      // 2. Fetch all order items for these orders
      let allItems: FirebaseSalesOrderItem[] = [];
      for (const order of orders) {
        const itemsRef = collection(
          db,
          COLLECTIONS.SALES_ORDERS,
          order.id,
          SUBCOLLECTIONS.ORDER_ITEMS
        );
        const itemsSnapshot = await getDocs(itemsRef);
        itemsSnapshot.forEach((doc) => {
          allItems.push({ id: doc.id, ...doc.data() } as FirebaseSalesOrderItem);
        });
      }

      // 3. Process data and populate the report object
      const completedOrders = orders.filter((o) => o.status === "completed");

      // === Sales Metrics ===
      const sm = dailyReport.salesMetrics;
      sm.totalOrders = orders.length;
      sm.completedOrders = completedOrders.length;
      sm.cancelledOrders = orders.filter((o) => o.status === "cancelled").length;
      sm.pendingOrders = orders.filter((o) => o.status.startsWith("pending")).length;
      sm.totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      sm.totalQuantitySold = completedOrders.reduce((sum, o) => sum + o.totalQuantity, 0);
      sm.averageOrderValue = sm.completedOrders > 0 ? sm.totalRevenue / sm.completedOrders : 0;
      
      orders.forEach(order => {
          // Payment methods
          const pm = order.paymentMethod;
          if (!sm.paymentMethods[pm]) {
              sm.paymentMethods[pm] = { orderCount: 0, totalAmount: 0, percentage: 0 };
          }
          sm.paymentMethods[pm].orderCount++;
          if (order.status === 'completed') {
              sm.paymentMethods[pm].totalAmount += order.totalAmount;
          }

          // Hourly breakdown
          const hour = getHours(order.orderDate.toDate());
          sm.hourlyBreakdown[hour].orders++;
          if(order.status === 'completed') {
              sm.hourlyBreakdown[hour].revenue += order.totalAmount;
          }
      });
      // Calculate payment method percentages
      if (sm.totalRevenue > 0) {
        Object.keys(sm.paymentMethods).forEach(key => {
            sm.paymentMethods[key].percentage = (sm.paymentMethods[key].totalAmount / sm.totalRevenue) * 100;
        });
      }

      // === Financial Summary ===
      const fs = dailyReport.financialSummary;
      fs.grossRevenue = completedOrders.reduce((sum, o) => sum + o.subtotalAmount, 0);
      fs.discountAmount = completedOrders.reduce((sum, o) => sum + o.discountAmount, 0);
      fs.taxAmount = completedOrders.reduce((sum, o) => sum + o.taxAmount, 0);
      fs.netRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      fs.totalCost = allItems
        .filter(item => completedOrders.some(o => o.id === item.salesOrderId))
        .reduce((sum, item) => sum + item.unitCost, 0);
      fs.grossProfit = fs.grossRevenue - fs.totalCost;
      fs.grossProfitMargin = fs.grossRevenue > 0 ? (fs.grossProfit / fs.grossRevenue) * 100 : 0;

      // === Product Performance ===
      const pp = dailyReport.productPerformance;
      const soldItems = allItems.filter(item => completedOrders.some(o => o.id === item.salesOrderId));
      pp.totalProductsSold = soldItems.length;
      
      const productSales: { [productId: string]: { productId: string; productName: string; quantitySold: number; revenue: number; profit: number; } } = {};
      const variantSales: { [variantId: string]: { variantId: string; productName: string; colorName: string; storageCapacity: string; quantitySold: number; revenue: number; } } = {};

      soldItems.forEach(item => {
          // Product aggregation
          if(!productSales[item.productId]) {
              productSales[item.productId] = { productId: item.productId, productName: item.productName, quantitySold: 0, revenue: 0, profit: 0 };
          }
          productSales[item.productId].quantitySold += item.quantity;
          productSales[item.productId].revenue += item.finalPrice;
          productSales[item.productId].profit += (item.finalPrice - item.unitCost);

          // Variant aggregation
          if(!variantSales[item.variantId]) {
              variantSales[item.variantId] = { variantId: item.variantId, productName: item.productName, colorName: item.colorName, storageCapacity: item.storageCapacity, quantitySold: 0, revenue: 0 };
          }
          variantSales[item.variantId].quantitySold += item.quantity;
          variantSales[item.variantId].revenue += item.finalPrice;
      });

      pp.uniqueProductsSold = Object.keys(productSales).length;
      pp.topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10) // Top 10
        .map(p => ({ ...p, profitMargin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0, profit: p.profit }));
      
      pp.topVariants = Object.values(variantSales)
        .sort((a,b) => b.revenue - a.revenue)
        .slice(0, 10);

      // === Staff Performance ===
      const sp = dailyReport.staffPerformance;
      const staffMetrics: { [staffId: string]: { staffId: string; staffName: string; ordersProcessed: number; revenue: number; customers: Set<string>; } } = {};
      
      completedOrders.forEach(order => {
          if (!staffMetrics[order.staffId]) {
              staffMetrics[order.staffId] = { staffId: order.staffId, staffName: order.staffName || 'Unknown', ordersProcessed: 0, revenue: 0, customers: new Set() };
          }
          const metric = staffMetrics[order.staffId];
          metric.ordersProcessed++;
          metric.revenue += order.totalAmount;
          if (order.customerId) {
            metric.customers.add(order.customerId);
          }
      });

      sp.activeStaff = Object.keys(staffMetrics).length;
      sp.staffMetrics = Object.values(staffMetrics).map(m => ({ 
          staffId: m.staffId, 
          staffName: m.staffName, 
          ordersProcessed: m.ordersProcessed, 
          revenue: m.revenue, 
          customerCount: m.customers.size, 
          averageOrderValue: m.ordersProcessed > 0 ? m.revenue / m.ordersProcessed : 0
        }));

      if(sp.staffMetrics.length > 0) {
        const topSeller = Object.values(staffMetrics).sort((a,b) => b.revenue - a.revenue)[0]
        sp.topSalesPerson = {
          staffId: topSeller.staffId,
          staffName: topSeller.staffName,
          revenue: topSeller.revenue,
        };
      }
      
      // === Customer Metrics ===
      // This is a simplified version. For accurate new/returning, we need to check customer's history.
      const cm = dailyReport.customerMetrics;
      const customerIds = new Set<string>();
      completedOrders.forEach(o => {
        if(o.customerId) customerIds.add(o.customerId);
      });
      cm.totalCustomers = customerIds.size;
      // This requires fetching each customer doc, can be slow. A better approach is to use a summary field on the customer doc
      // or use a separate analytics service/cloud function. For now, this is omitted for performance reasons.
      // cm.newCustomers = ...
      // cm.returningCustomers = ...
      
      // === Save Report ===
      const reportRef = doc(db, this.collectionName, reportDateStr);
      await setDoc(reportRef, dailyReport, { merge: true });

      return { success: true, data: dailyReport };
    } catch (error) {
      console.error("Error generating daily report:", error);
      return this.handleError(error);
    }
  }

  /**
   * Generates a monthly report by aggregating daily reports for a given month and year.
   * @param year The year of the report.
   * @param month The month of the report (1-12).
   * @param userId The ID of the user triggering the generation.
   */
  async getMonthlyReport(
    year: number,
    month: number, // 1-12
    userId: string = "system"
  ): Promise<ServiceResponse<any>> { // Replace 'any' with FirebaseMonthlyReport later
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // 1. Fetch all daily reports within the month
      const dailyReportsRef = collection(db, this.collectionName);
      const q = query(
        dailyReportsRef,
        where("reportTimestamp", ">=", Timestamp.fromDate(startDate)),
        where("reportTimestamp", "<=", Timestamp.fromDate(endDate))
      );
      
      const snapshots = await getDocs(q);
      if (snapshots.empty) {
        return {
          success: false,
          error: `Không có dữ liệu báo cáo cho tháng ${month}/${year}.`,
          errorCode: "NO_DATA",
        };
      }

      const dailyReports = snapshots.docs.map(doc => doc.data() as FirebaseDailyReport);

      // 2. Aggregate the data
      // Note: This is a simplified aggregation. A full implementation would create a FirebaseMonthlyReport object.
      // For now, we'll return an aggregated summary.
      const monthlySummary = {
          reportMonth: `${year}-${month.toString().padStart(2, '0')}`,
          totalDaysReported: dailyReports.length,
          totalRevenue: 0,
          totalOrders: 0,
          totalQuantitySold: 0,
          grossProfit: 0,
          topProducts: new Map<string, {productName: string, quantitySold: number, revenue: number}>(),
          staffPerformance: new Map<string, {staffName: string, revenue: number, ordersProcessed: number}>()
      }

      for (const daily of dailyReports) {
          monthlySummary.totalRevenue += daily.salesMetrics.totalRevenue;
          monthlySummary.totalOrders += daily.salesMetrics.completedOrders;
          monthlySummary.totalQuantitySold += daily.salesMetrics.totalQuantitySold;
          monthlySummary.grossProfit += daily.financialSummary.grossProfit;
          
          // Aggregate product performance
          daily.productPerformance.topProducts.forEach(p => {
              const existing = monthlySummary.topProducts.get(p.productId);
              if(existing) {
                  existing.quantitySold += p.quantitySold;
                  existing.revenue += p.revenue;
              } else {
                  monthlySummary.topProducts.set(p.productId, { productName: p.productName, quantitySold: p.quantitySold, revenue: p.revenue });
              }
          });

          // Aggregate staff performance
           daily.staffPerformance.staffMetrics.forEach(s => {
              const existing = monthlySummary.staffPerformance.get(s.staffId);
              if(existing) {
                  existing.revenue += s.revenue;
                  existing.ordersProcessed += s.ordersProcessed;
              } else {
                  monthlySummary.staffPerformance.set(s.staffId, { staffName: s.staffName, revenue: s.revenue, ordersProcessed: s.ordersProcessed });
              }
          });
      }

      // Convert maps to arrays for the final output
      const finalReport = {
          ...monthlySummary,
          topProducts: Array.from(monthlySummary.topProducts.values()).sort((a,b) => b.revenue - a.revenue).slice(0, 10),
          staffPerformance: Array.from(monthlySummary.staffPerformance.values()).sort((a,b) => b.revenue - a.revenue)
      };

      return { success: true, data: finalReport };

    } catch (error) {
      console.error(`Error generating monthly report for ${month}/${year}:`, error);
      return this.handleError(error);
    }
  }
}

export const reportsService = new ReportsService(); 