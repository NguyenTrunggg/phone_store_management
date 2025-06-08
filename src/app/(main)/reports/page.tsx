"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, DollarSign, Package, BarChart3, Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { reportsService } from "@/lib/firebase/services/reports.service"
import { FirebaseDailyReport } from "@/lib/firebase/models/reports.model"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, addDays, startOfMonth, addMonths } from "date-fns"
import { vi } from "date-fns/locale"

type ReportType = "daily" | "monthly" | "yearly";

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>("daily");
  
  // Daily Report State
  const [dailyReport, setDailyReport] = useState<FirebaseDailyReport | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Monthly Report State
  const [monthlyReport, setMonthlyReport] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (reportType === 'daily') {
          setMonthlyReport(null);
          const response = await reportsService.getOrGenerateDailyReport(selectedDate);
          if (response.success && response.data) {
            setDailyReport(response.data);
          } else {
            setError(response.error || "Không thể tải báo cáo ngày.");
            setDailyReport(null);
          }
        } else if (reportType === 'monthly') {
          setDailyReport(null);
          const year = selectedMonth.getFullYear();
          const month = selectedMonth.getMonth() + 1;
          const response = await reportsService.getMonthlyReport(year, month);
           if (response.success && response.data) {
            setMonthlyReport(response.data);
          } else {
            setError(response.error || `Không thể tải báo cáo tháng ${month}/${year}.`);
            setMonthlyReport(null);
          }
        }
        // Yearly report logic will be added here

      } catch (err: any) {
        console.error(err);
        setError("Đã xảy ra lỗi khi tạo báo cáo.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [selectedDate, selectedMonth, reportType]);

  const handleDailyDateChange = (date: Date | undefined) => {
      if(date) setSelectedDate(date);
  }

  const navigateDaily = (days: number) => {
    setSelectedDate(prevDate => addDays(prevDate, days));
  };
  
  const navigateMonthly = (monthsToAdd: number) => {
    setSelectedMonth(prevMonth => addMonths(prevMonth, monthsToAdd));
  };

  const renderDailyReport = () => {
     if (!dailyReport || dailyReport.salesMetrics.totalOrders === 0) {
        return (
            <div className="text-center text-gray-500 py-10">
                <p className="text-xl font-bold">Không có dữ liệu</p>
                <p>Không có đơn hàng nào trong ngày {format(selectedDate, "dd/MM/yyyy")}.</p>
            </div>
        )
    }
    const { salesMetrics, financialSummary, productPerformance, staffPerformance } = dailyReport;
    return (
        <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{salesMetrics.totalRevenue.toLocaleString("vi-VN")}₫</div>
                        <p className="text-xs text-muted-foreground">{salesMetrics.completedOrders} đơn hàng thành công</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lợi nhuận gộp</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{financialSummary.grossProfit.toLocaleString("vi-VN")}₫</div>
                        <p className="text-xs text-muted-foreground">Biên lợi nhuận {financialSummary.grossProfitMargin.toFixed(2)}%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sản phẩm đã bán</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{salesMetrics.totalQuantitySold} chiếc</div>
                        <p className="text-xs text-muted-foreground">trên tổng số {salesMetrics.totalOrders} đơn hàng</p>
                    </CardContent>
                </Card>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader><CardTitle>Top sản phẩm bán chạy</CardTitle></CardHeader>
                    <CardContent>
                         {productPerformance.topProducts.map((item, index) => (
                            <div key={item.productId} className="flex items-center justify-between p-2 border-b">
                                <p>#{index+1} {item.productName}</p>
                                <p className="font-bold">{item.revenue.toLocaleString("vi-VN")}₫</p>
                            </div>
                         ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Top nhân viên xuất sắc</CardTitle></CardHeader>
                    <CardContent>
                        {staffPerformance.staffMetrics.sort((a,b) => b.revenue-a.revenue).map((staff, index) => (
                             <div key={staff.staffId} className="flex items-center justify-between p-2 border-b">
                                <p>#{index+1} {staff.staffName}</p>
                                <p className="font-bold">{staff.revenue.toLocaleString("vi-VN")}₫</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
             </div>
        </div>
    );
  }
  
   const renderMonthlyReport = () => {
    if (!monthlyReport) {
      return (
        <div className="text-center text-gray-500 py-10">
          <p className="text-xl font-bold">Không có dữ liệu</p>
          <p>Không có báo cáo nào được ghi nhận cho tháng {format(selectedMonth, "MM/yyyy")}.</p>
        </div>
      );
    }
    return (
       <div className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng doanh thu tháng</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyReport.totalRevenue.toLocaleString("vi-VN")}₫</div>
                <p className="text-xs text-muted-foreground">{monthlyReport.totalOrders} đơn hàng thành công</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lợi nhuận gộp tháng</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyReport.grossProfit.toLocaleString("vi-VN")}₫</div>
                <p className="text-xs text-muted-foreground">trên {monthlyReport.totalDaysReported} ngày có dữ liệu</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sản phẩm bán trong tháng</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyReport.totalQuantitySold} chiếc</div>
                 <p className="text-xs text-muted-foreground">Top {monthlyReport.topProducts.length} sản phẩm bán chạy</p>
              </CardContent>
            </Card>
          </div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Top sản phẩm tháng</CardTitle></CardHeader>
                    <CardContent>
                         {monthlyReport.topProducts.map((item: any, index: number) => (
                            <div key={item.productId} className="flex items-center justify-between p-2 border-b">
                                <div>
                                    <p className="font-semibold">#{index+1} {item.productName}</p>
                                    <p className="text-sm text-gray-500">Đã bán: {item.quantitySold}</p>
                                </div>
                                <p className="font-bold">{item.revenue.toLocaleString("vi-VN")}₫</p>
                            </div>
                         ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Top nhân viên tháng</CardTitle></CardHeader>
                    <CardContent>
                        {monthlyReport.staffPerformance.map((staff: any, index: number) => (
                             <div key={staff.staffId} className="flex items-center justify-between p-2 border-b">
                                 <div>
                                    <p className="font-semibold">#{index+1} {staff.staffName}</p>
                                     <p className="text-sm text-gray-500">{staff.ordersProcessed} đơn hàng</p>
                                 </div>
                                <p className="font-bold">{staff.revenue.toLocaleString("vi-VN")}₫</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
             </div>
       </div>
    )
  }

  const renderContent = () => {
    if (loading) {
        return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
        );
    }
     if (error) {
        return (
            <div className="text-center text-red-600 py-10">
                <p className="text-xl font-bold">Lỗi!</p>
                <p>{error}</p>
            </div>
        );
    }
    switch (reportType) {
        case 'daily': return renderDailyReport();
        case 'monthly': return renderMonthlyReport();
        case 'yearly': return <div className="text-center py-10">Báo cáo năm sẽ được phát triển trong phiên bản sau.</div>;
        default: return null;
    }
  };

  const renderDateControls = () => {
      if (reportType === 'daily') {
          return (
             <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <Button variant="outline" size="icon" onClick={() => navigateDaily(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-[280px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(selectedDate, "PPP", { locale: vi })}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedDate} onSelect={handleDailyDateChange} initialFocus disabled={(date) => date > new Date() || date < new Date("2023-01-01")} />
                    </PopoverContent>
                </Popover>
                <Button variant="outline" size="icon" onClick={() => navigateDaily(1)} disabled={format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
          )
      }
      if (reportType === 'monthly') {
           return (
             <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <Button variant="outline" size="icon" onClick={() => navigateMonthly(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="w-[280px] text-center font-semibold text-lg">
                    {format(selectedMonth, "MMMM yyyy", { locale: vi })}
                </div>
                <Button variant="outline" size="icon" onClick={() => navigateMonthly(1)} disabled={selectedMonth.getMonth() === new Date().getMonth() && selectedMonth.getFullYear() === new Date().getFullYear()}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
           )
      }
      return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Báo cáo thống kê</h2>
          <p className="text-gray-600">Phân tích hiệu quả kinh doanh theo ngày, tháng, và năm.</p>
        </div>
        {renderDateControls()}
      </div>

      <Tabs value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
        <TabsList>
          <TabsTrigger value="daily">Theo ngày</TabsTrigger>
          <TabsTrigger value="monthly">Theo tháng</TabsTrigger>
          <TabsTrigger value="yearly" disabled>Theo năm</TabsTrigger>
        </TabsList>
      </Tabs>

      {renderContent()}
    </div>
  );
}
