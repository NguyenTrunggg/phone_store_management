"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, Calendar, User, Package } from "lucide-react";
import { IntakeDetailsDialog } from "./intake-details-dialog";

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

interface IntakeHistoryProps {
  intakes: IntakeHistoryItem[];
  isLoading: boolean;
  onViewDetails: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function IntakeHistory({
  intakes,
  isLoading,
  onViewDetails: handleViewDetailsProp,
  onEdit,
  onDelete,
}: IntakeHistoryProps) {
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedIntake, setSelectedIntake] = useState<IntakeHistoryItem | null>(null);

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

  const handleViewDetails = (id: string) => {
    const intakeToShow = intakes.find(intake => intake.id === id);
    if (intakeToShow) {
      setSelectedIntake(intakeToShow);
      setIsDetailsDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử nhập kho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Đang tải...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (intakes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử nhập kho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Chưa có phiếu nhập kho nào</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử nhập kho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {intakes.map((intake) => (
              <div
                key={intake.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{intake.orderNumber}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(intake.orderDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {intake.receivedByName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {intake.totalItemsReceived} IMEI
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(intake.status)}
                  </div>
                </div>

                {/* Display Product List */}
                {intake.products && intake.products.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Sản phẩm đã nhập:</h4>
                    <ul className="space-y-1 text-sm">
                      {intake.products.map((product: { productName: string; quantity: number; totalCost: number }, index: number) => (
                        <li key={index} className="flex justify-between">
                          <span>
                            {product.productName} (SL: {product.quantity})
                          </span>
                          <span>{formatCurrency(product.totalCost)}</span>
                        </li>
                      ))} 
                    </ul>
                  </div>
                )}

                <div className="flex justify-between items-center mt-3">
                  <div>
                    <p className="text-sm text-gray-600">Nhà cung cấp:</p>
                    <p className="font-medium">{intake.supplierName}</p>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      {formatCurrency(intake.totalAmount)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(intake.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Xem
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(intake.id)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(intake.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <IntakeDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        intakeItem={selectedIntake}
      />
    </>
  );
}