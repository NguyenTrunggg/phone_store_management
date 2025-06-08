"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReturnRequest {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  product: string;
  variant: string;
  imei: string;
  originalPrice: number;
  returnReason: string;
  returnType: "exchange" | "refund";
  status: "pending" | "approved" | "rejected" | "completed";
  requestDate: string;
  processedDate?: string;
  processedBy?: string;
  refundAmount?: number;
}

export default function Returns() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(
    null
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);

  const [newReturn, setNewReturn] = useState({
    orderId: "",
    customerPhone: "",
    imei: "",
    returnReason: "",
    returnType: "refund" as "exchange" | "refund",
  });

  const returnRequests: ReturnRequest[] = [
    {
      id: "RET-2024-001",
      orderId: "ORD-2024-156",
      customerName: "Nguyễn Văn An",
      customerPhone: "0901234567",
      product: "iPhone 15 Pro Max",
      variant: "256GB Titan Tự Nhiên",
      imei: "359123456789012",
      originalPrice: 34990000,
      returnReason: "Lỗi màn hình xuất hiện vệt đen",
      returnType: "exchange",
      status: "pending",
      requestDate: "2024-01-22",
    },
    {
      id: "RET-2024-002",
      orderId: "ORD-2024-142",
      customerName: "Trần Thị Bình",
      customerPhone: "0912345678",
      product: "iPhone 15",
      variant: "128GB Hồng",
      imei: "359123456789023",
      originalPrice: 22990000,
      returnReason: "Không hài lòng với màu sắc",
      returnType: "refund",
      status: "approved",
      requestDate: "2024-01-20",
      processedDate: "2024-01-21",
      processedBy: "Admin",
      refundAmount: 22990000,
    },
    {
      id: "RET-2024-003",
      orderId: "ORD-2024-138",
      customerName: "Lê Minh Cường",
      customerPhone: "0923456789",
      product: "iPhone 15 Pro",
      variant: "256GB Titan Xanh",
      imei: "359123456789020",
      originalPrice: 32990000,
      returnReason: "Pin hao nhanh bất thường",
      returnType: "exchange",
      status: "completed",
      requestDate: "2024-01-18",
      processedDate: "2024-01-19",
      processedBy: "Admin",
    },
  ];

  const filteredReturns = returnRequests.filter(
    (returnReq) =>
      returnReq.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnReq.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnReq.imei.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Chờ xử lý
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Đã duyệt
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Từ chối
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Hoàn thành
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReturnTypeBadge = (type: string) => {
    return type === "exchange" ? (
      <Badge variant="outline" className="text-blue-600">
        Đổi hàng
      </Badge>
    ) : (
      <Badge variant="outline" className="text-green-600">
        Hoàn tiền
      </Badge>
    );
  };

  const handleCreateReturn = () => {
    // Logic tạo yêu cầu trả hàng mới
    console.log("Creating return request:", newReturn);
    setIsCreateDialogOpen(false);
    setNewReturn({
      orderId: "",
      customerPhone: "",
      imei: "",
      returnReason: "",
      returnType: "refund",
    });
  };

  const handleProcessReturn = (action: "approve" | "reject") => {
    // Logic xử lý yêu cầu trả hàng
    console.log(`${action} return request:`, selectedReturn?.id);
    setIsProcessDialogOpen(false);
    setSelectedReturn(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý trả hàng</h2>
          <p className="text-gray-600">
            Xử lý các yêu cầu đổi trả sản phẩm từ khách hàng
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tạo yêu cầu trả hàng
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tạo yêu cầu trả hàng mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin để tạo yêu cầu đổi trả sản phẩm
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="orderId" className="text-right">
                  Mã đơn hàng
                </Label>
                <Input
                  id="orderId"
                  value={newReturn.orderId}
                  onChange={(e) =>
                    setNewReturn({ ...newReturn, orderId: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="ORD-2024-XXX"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customerPhone" className="text-right">
                  SĐT khách hàng
                </Label>
                <Input
                  id="customerPhone"
                  value={newReturn.customerPhone}
                  onChange={(e) =>
                    setNewReturn({
                      ...newReturn,
                      customerPhone: e.target.value,
                    })
                  }
                  className="col-span-3"
                  placeholder="09XXXXXXXX"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imei" className="text-right">
                  IMEI
                </Label>
                <Input
                  id="imei"
                  value={newReturn.imei}
                  onChange={(e) =>
                    setNewReturn({ ...newReturn, imei: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="359123456789012"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="returnType" className="text-right">
                  Loại trả hàng
                </Label>
                <Select
                  value={newReturn.returnType}
                  onValueChange={(value: "exchange" | "refund") =>
                    setNewReturn({ ...newReturn, returnType: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refund">Hoàn tiền</SelectItem>
                    <SelectItem value="exchange">Đổi hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="returnReason" className="text-right">
                  Lý do
                </Label>
                <Textarea
                  id="returnReason"
                  value={newReturn.returnReason}
                  onChange={(e) =>
                    setNewReturn({ ...newReturn, returnReason: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Mô tả lý do trả hàng..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleCreateReturn}>Tạo yêu cầu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ xử lý</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {returnRequests.filter((r) => r.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">yêu cầu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {returnRequests.filter((r) => r.status === "approved").length}
            </div>
            <p className="text-xs text-muted-foreground">yêu cầu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {returnRequests.filter((r) => r.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground">yêu cầu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng hoàn tiền
            </CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {returnRequests
                .filter(
                  (r) => r.status === "completed" && r.returnType === "refund"
                )
                .reduce((sum, r) => sum + (r.refundAmount || 0), 0)
                .toLocaleString("vi-VN")}
              ₫
            </div>
            <p className="text-xs text-muted-foreground">trong tháng</p>
          </CardContent>
        </Card>
      </div>

      {/* Returns List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Danh sách yêu cầu trả hàng</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên, mã đơn, IMEI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReturns.map((returnReq) => (
              <div key={returnReq.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <RotateCcw className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{returnReq.id}</h3>
                      <p className="text-sm text-gray-500">
                        Đơn hàng: {returnReq.orderId} • {returnReq.customerName}{" "}
                        • {returnReq.customerPhone}
                      </p>
                      <p className="text-xs text-gray-400">
                        Yêu cầu ngày: {returnReq.requestDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getReturnTypeBadge(returnReq.returnType)}
                    {getStatusBadge(returnReq.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-3 mb-3">
                  <div>
                    <p className="text-sm text-gray-500">Sản phẩm</p>
                    <p className="font-medium">
                      {returnReq.product} {returnReq.variant}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      IMEI: {returnReq.imei}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Giá trị</p>
                    <p className="font-bold text-lg">
                      {returnReq.originalPrice.toLocaleString("vi-VN")}₫
                    </p>
                    {returnReq.refundAmount && (
                      <p className="text-sm text-green-600">
                        Hoàn: {returnReq.refundAmount.toLocaleString("vi-VN")}₫
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-500 mb-1">Lý do trả hàng:</p>
                  <p className="text-sm bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                    <AlertTriangle className="w-4 h-4 inline mr-2 text-yellow-600" />
                    {returnReq.returnReason}
                  </p>
                </div>

                {returnReq.processedDate && (
                  <div className="text-xs text-gray-500 mb-3">
                    Xử lý ngày {returnReq.processedDate} bởi{" "}
                    {returnReq.processedBy}
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    Chi tiết
                  </Button>
                  {returnReq.status === "pending" && (
                    <Dialog
                      open={isProcessDialogOpen}
                      onOpenChange={setIsProcessDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => setSelectedReturn(returnReq)}
                        >
                          Xử lý
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Xử lý yêu cầu trả hàng</DialogTitle>
                          <DialogDescription>
                            {selectedReturn?.id} -{" "}
                            {selectedReturn?.customerName}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="font-medium">
                              {selectedReturn?.product}{" "}
                              {selectedReturn?.variant}
                            </p>
                            <p className="text-sm text-gray-500">
                              IMEI: {selectedReturn?.imei}
                            </p>
                            <p className="text-sm text-gray-500">
                              Giá:{" "}
                              {selectedReturn?.originalPrice.toLocaleString(
                                "vi-VN"
                              )}
                              ₫
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Lý do trả hàng:
                            </p>
                            <p className="text-sm bg-yellow-50 p-2 rounded">
                              {selectedReturn?.returnReason}
                            </p>
                          </div>
                        </div>
                        <DialogFooter className="space-x-2">
                          <Button
                            variant="destructive"
                            onClick={() => handleProcessReturn("reject")}
                          >
                            Từ chối
                          </Button>
                          <Button
                            onClick={() => handleProcessReturn("approve")}
                          >
                            Duyệt yêu cầu
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
