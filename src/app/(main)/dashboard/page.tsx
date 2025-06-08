"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle, Users, Smartphone } from "lucide-react"
import { dashboardService, DashboardData } from "@/lib/firebase/services/dashboard.service"
import { Skeleton } from "@/components/ui/skeleton"

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  formatAsCurrency = false,
}: {
  title: string
  value: number
  change: number
  icon: React.ElementType
  formatAsCurrency?: boolean
}) {
  const isPositive = change >= 0
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatAsCurrency ? `${value.toLocaleString("vi-VN")}₫` : value}</div>
        <p className="text-xs text-muted-foreground">
          <span className={isPositive ? "text-green-600" : "text-red-600"}>
            {isPositive ? "+" : ""}
            {change.toFixed(1)}%
          </span>{" "}
          so với hôm qua
        </p>
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Alerts Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg">
                <div className="flex items-center space-x-3 w-full">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Products Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 w-full">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                </div>
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Progress Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full rounded-full" />
          <div className="flex justify-between mt-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const response = await dashboardService.getDashboardStats()
      if (response.success && response.data) {
        setData(response.data)
      } else {
        setError(response.error || "Failed to fetch dashboard data.")
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error || "Could not load dashboard data."}</p>
      </div>
    )
  }

  const { todayStats, inventoryAlerts, topProducts, monthlyRevenue } = data

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Tổng quan hoạt động kinh doanh hôm nay</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Doanh thu hôm nay"
          value={todayStats.revenue}
          change={todayStats.revenueChange}
          icon={DollarSign}
          formatAsCurrency
        />
        <StatCard title="Đơn hàng" value={todayStats.orders} change={todayStats.ordersChange} icon={ShoppingCart} />
        <StatCard
          title="Giá trị đơn hàng TB"
          value={todayStats.avgOrderValue}
          change={todayStats.avgOrderValueChange}
          icon={TrendingUp}
          formatAsCurrency
        />
        <StatCard title="Khách hàng" value={todayStats.customers} change={todayStats.customersChange} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              Cảnh báo tồn kho
            </CardTitle>
            <CardDescription>Các sản phẩm sắp hết hoặc đã hết hàng (ngưỡng: 5)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inventoryAlerts.length > 0 ? (
              inventoryAlerts.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-sm">{item.model}</p>
                      <p className="text-xs text-gray-500">{item.variant}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={item.status === "out" ? "destructive" : "secondary"}>
                      {item.stock === 0 ? "Hết hàng" : `Còn ${item.stock}`}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Không có cảnh báo tồn kho.</p>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Sản phẩm bán chạy</CardTitle>
            <CardDescription>Top sản phẩm có doanh thu cao nhất hôm nay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">Đã bán: {product.sold} chiếc</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{product.revenue.toLocaleString("vi-VN")}₫</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Chưa có sản phẩm nào được bán hôm nay.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Tiến độ doanh thu tháng này</CardTitle>
          <CardDescription>
            Mục tiêu: {monthlyRevenue.target.toLocaleString("vi-VN")}₫ | Hiện tại:{" "}
            {monthlyRevenue.current.toLocaleString("vi-VN")}₫
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={monthlyRevenue.progress} className="w-full" />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>{monthlyRevenue.progress.toFixed(1)}% hoàn thành</span>
            <span>Còn {(monthlyRevenue.target - monthlyRevenue.current).toLocaleString("vi-VN")}₫</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
