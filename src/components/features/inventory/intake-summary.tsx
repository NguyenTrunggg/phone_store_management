"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, DollarSign, Check, Save } from "lucide-react";

interface IntakeSummaryProps {
  totalItems: number;
  unitCost: number;
  totalValue: number;
  selectedProductName?: string;
  selectedVariantName?: string;
  isValid: boolean;
  onConfirm: () => void;
  onSaveDraft: () => void;
  isLoading: boolean;
}

export function IntakeSummary({
  totalItems,
  unitCost,
  totalValue,
  selectedProductName,
  selectedVariantName,
  isValid,
  onConfirm,
  onSaveDraft,
  isLoading,
}: IntakeSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Tóm tắt phiếu nhập
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedProductName && (
          <div>
            <p className="text-sm font-medium text-gray-700">Sản phẩm</p>
            <p className="text-lg font-semibold">{selectedProductName}</p>
            {selectedVariantName && (
              <p className="text-sm text-gray-600">{selectedVariantName}</p>
            )}
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Số lượng IMEI:</span>
            <span className="font-medium">{totalItems}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Giá nhập/máy:</span>
            <span className="font-medium">{formatCurrency(unitCost)}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Tổng giá trị:</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(totalValue)}
            </span>
          </div>
        </div>

        <div className="space-y-2 pt-4">
          <Button
            onClick={onConfirm}
            disabled={!isValid || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              "Đang xử lý..."
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Xác nhận nhập kho
              </>
            )}
          </Button>

          <Button
            onClick={onSaveDraft}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            Lưu nháp
          </Button>
        </div>

        {!isValid && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            <p className="font-medium">Vui lòng kiểm tra:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              {!selectedProductName && <li>Chọn sản phẩm</li>}
              {!selectedVariantName && <li>Chọn biến thể</li>}
              {totalItems === 0 && <li>Nhập ít nhất 1 IMEI hợp lệ</li>}
              {unitCost <= 0 && <li>Nhập giá nhập hợp lệ</li>}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}