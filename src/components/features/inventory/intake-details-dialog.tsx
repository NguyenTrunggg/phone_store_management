"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, User, Package, Tag, Layers, DollarSign, ShoppingCart } from "lucide-react";

// Mirroring IntakeHistoryItem structure from intake-history.tsx
interface IntakeHistoryItem {
  id: string;
  orderNumber: string;
  orderDate: string;
  supplierName: string;
  receivedByName: string;
  totalItemsReceived: number;
  status: string;
  totalAmount: number;
  products: Array<{
    productName: string;
    quantity: number;
    totalCost: number;
  }>;
}

interface IntakeDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  intakeItem: IntakeHistoryItem | null;
}

// Helper functions (can be moved to utils or passed as props if preferred)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const getStatusBadge = (status: string) => {
  const statusMap = {
    completed: { label: "Hoàn thành", variant: "default" as const },
    pending: { label: "Đang xử lý", variant: "secondary" as const },
    cancelled: { label: "Đã hủy", variant: "destructive" as const },
  };

  const statusInfo = statusMap[status as keyof typeof statusMap] || {
    label: status,
    variant: "secondary" as const,
  };

  return (
    <Badge variant={statusInfo.variant}>
      {statusInfo.label}
    </Badge>
  );
};

export function IntakeDetailsDialog({
  isOpen,
  onClose,
  intakeItem,
}: IntakeDetailsDialogProps) {
  if (!isOpen || !intakeItem) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết phiếu nhập: {intakeItem.orderNumber}</DialogTitle>
          <DialogDescription>
            Xem thông tin chi tiết của phiếu nhập kho.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 flex items-center mb-1"><Calendar className="w-4 h-4 mr-2 text-gray-400" />Ngày nhập</p>
              <p className="font-medium">{formatDate(intakeItem.orderDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 flex items-center mb-1"><User className="w-4 h-4 mr-2 text-gray-400" />Người nhận</p>
              <p className="font-medium">{intakeItem.receivedByName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 flex items-center mb-1"><ShoppingCart className="w-4 h-4 mr-2 text-gray-400" />Nhà cung cấp</p>
              <p className="font-medium">{intakeItem.supplierName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 flex items-center mb-1"><Tag className="w-4 h-4 mr-2 text-gray-400" />Trạng thái</p>
              {getStatusBadge(intakeItem.status)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 flex items-center mb-1"><Package className="w-4 h-4 mr-2 text-gray-400" />Tổng số IMEI</p>
              <p className="font-medium">{intakeItem.totalItemsReceived}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 flex items-center mb-1"><DollarSign className="w-4 h-4 mr-2 text-gray-400" />Tổng tiền</p>
              <p className="font-semibold text-lg text-green-600">{formatCurrency(intakeItem.totalAmount)}</p>
            </div>
          </div>

          <div className="mt-2">
            <h4 className="font-semibold text-md mb-2 flex items-center"><Layers className="w-5 h-5 mr-2 text-gray-700" />Sản phẩm đã nhập</h4>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Tên sản phẩm</TableHead>
                    <TableHead className="text-right font-semibold">Số lượng</TableHead>
                    <TableHead className="text-right font-semibold">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {intakeItem.products.length > 0 ? (
                    intakeItem.products.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell className="text-right">{product.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(product.totalCost)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-4">
                        Không có thông tin sản phẩm. (Danh sách sản phẩm trống)
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 