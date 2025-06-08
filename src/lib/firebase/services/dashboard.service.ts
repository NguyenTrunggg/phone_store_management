import {
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BaseService, ServiceResponse } from "./base.service";
import { posService } from "./pos.service";
import { FirebaseSalesOrder, FirebaseSalesOrderItem } from "../models/pos.model";
import { COLLECTIONS, SUBCOLLECTIONS } from "@/constants";

// Data structures for the dashboard
export interface TodayStats {
  revenue: number;
  orders: number;
  avgOrderValue: number;
  customers: number;
  revenueChange: number; // Percentage change from yesterday
  ordersChange: number; // Percentage change
  avgOrderValueChange: number; // Percentage change
  customersChange: number; // Percentage change
}

export interface InventoryAlert {
  model: string;
  variant: string;
  stock: number;
  status: "low" | "out";
}

export interface TopProduct {
  name: string;
  sold: number;
  revenue: number;
}

export interface MonthlyRevenue {
  current: number;
  target: number;
  progress: number;
}

export interface DashboardData {
  todayStats: TodayStats;
  inventoryAlerts: InventoryAlert[];
  topProducts: TopProduct[];
  monthlyRevenue: MonthlyRevenue;
}

export class DashboardService extends BaseService {
  constructor() {
    super("dashboard"); // Not a real collection, just for base class
  }

  private async getStatsForDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<{ revenue: number; orders: number; customers: Set<string> }> {
    const ordersRef = collection(db, COLLECTIONS.SALES_ORDERS);
    const q = query(
      ordersRef,
      where("orderDate", ">=", Timestamp.fromDate(startDate)),
      where("orderDate", "<=", Timestamp.fromDate(endDate))
    );
    const snapshot = await getDocs(q);

    let revenue = 0;
    const customerIds = new Set<string>();

    snapshot.docs.forEach((doc) => {
      const order = doc.data() as FirebaseSalesOrder;
      revenue += order.totalAmount;
      if (order.customerId) {
        customerIds.add(order.customerId);
      } else if (order.customerInfo?.phone) {
        // Fallback to phone if customerId is not present
        customerIds.add(order.customerInfo.phone);
      }
    });

    return {
      revenue,
      orders: snapshot.size,
      customers: customerIds,
    };
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }

  async getDashboardStats(
    lowStockThreshold: number = 5,
    monthlyTarget: number = 2500000000
  ): Promise<ServiceResponse<DashboardData>> {
    try {
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
      );
      const endOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59
      );

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const startOfYesterday = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
        0,
        0,
        0
      );
      const endOfYesterday = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
        23,
        59,
        59
      );

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      // --- 1. Today's & Yesterday's Stats ---
      const [todayStatsData, yesterdayStatsData] = await Promise.all([
        this.getStatsForDateRange(startOfToday, endOfToday),
        this.getStatsForDateRange(startOfYesterday, endOfYesterday),
      ]);

      const todayAvgOrderValue =
        todayStatsData.orders > 0
          ? todayStatsData.revenue / todayStatsData.orders
          : 0;
      const yesterdayAvgOrderValue =
        yesterdayStatsData.orders > 0
          ? yesterdayStatsData.revenue / yesterdayStatsData.orders
          : 0;

      const todayStats: TodayStats = {
        revenue: todayStatsData.revenue,
        orders: todayStatsData.orders,
        avgOrderValue: todayAvgOrderValue,
        customers: todayStatsData.customers.size,
        revenueChange: this.calculatePercentageChange(
          todayStatsData.revenue,
          yesterdayStatsData.revenue
        ),
        ordersChange: this.calculatePercentageChange(
          todayStatsData.orders,
          yesterdayStatsData.orders
        ),
        avgOrderValueChange: this.calculatePercentageChange(
          todayAvgOrderValue,
          yesterdayAvgOrderValue
        ),
        customersChange: this.calculatePercentageChange(
          todayStatsData.customers.size,
          yesterdayStatsData.customers.size
        ),
      };

      // --- 2. Inventory Alerts ---
      const availableProductsResponse =
        await posService.getAvailableProductsForSale();
      if (!availableProductsResponse.success || !availableProductsResponse.data) {
        throw new Error("Could not fetch available products for inventory alerts.");
      }

      const inventoryAlerts: InventoryAlert[] = [];
      availableProductsResponse.data.forEach((product) => {
        product.variants.forEach((variant) => {
          if (variant.totalStock <= lowStockThreshold) {
            inventoryAlerts.push({
              model: product.productName,
              variant: `${variant.storageCapacity} ${variant.colorName}`,
              stock: variant.totalStock,
              status: variant.totalStock === 0 ? "out" : "low",
            });
          }
        });
      });

      // --- 3. Top Selling Products Today ---
      // Using collectionGroup query on order items
      const itemsRef = collectionGroup(db, SUBCOLLECTIONS.ORDER_ITEMS);
      const itemsQuery = query(
        itemsRef,
        where("createdAt", ">=", Timestamp.fromDate(startOfToday)),
        where("createdAt", "<=", Timestamp.fromDate(endOfToday))
      );
      const itemsSnapshot = await getDocs(itemsQuery);

      const productSales = new Map<
        string,
        { name: string; sold: number; revenue: number }
      >();

      itemsSnapshot.docs.forEach((doc) => {
        const item = doc.data() as FirebaseSalesOrderItem;

        // Defensive check: Ensure the item and its key fields are valid
        if (!item || !item.variantId || !item.productName) {
          console.warn("Skipping malformed order item from Firestore:", doc.id);
          return; // Skip this document
        }

        const key = item.variantId;
        const name = `${item.productName} ${item.storageCapacity || ""}`;

        if (!productSales.has(key)) {
          productSales.set(key, { name: name, sold: 0, revenue: 0 });
        }

        const product = productSales.get(key)!;

        // Use default value 0 if quantity or finalPrice are missing/falsy
        product.sold += item.quantity || 0;
        product.revenue += item.finalPrice || 0;
      });

      const topProducts: TopProduct[] = Array.from(productSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5); // Get top 5

      // --- 4. Monthly Revenue ---
      const monthlyStats = await this.getStatsForDateRange(
        startOfMonth,
        endOfMonth
      );
      const monthlyRevenue: MonthlyRevenue = {
        current: monthlyStats.revenue,
        target: monthlyTarget,
        progress:
          monthlyTarget > 0 ? (monthlyStats.revenue / monthlyTarget) * 100 : 0,
      };

      // --- Combine all data ---
      const dashboardData: DashboardData = {
        todayStats,
        inventoryAlerts,
        topProducts,
        monthlyRevenue,
      };

      return { success: true, data: dashboardData };
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const dashboardService = new DashboardService(); 