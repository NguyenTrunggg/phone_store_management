"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SupplierInfoFormProps {
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  notes: string;
  onSupplierNameChange: (value: string) => void;
  onOrderDateChange: (value: string) => void;
  onExpectedDeliveryDateChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  isLoading: boolean;
}

export function SupplierInfoForm({
  supplierName,
  orderDate,
  expectedDeliveryDate,
  notes,
  onSupplierNameChange,
  onOrderDateChange,
  onExpectedDeliveryDateChange,
  onNotesChange,
  isLoading,
}: SupplierInfoFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin nhà cung cấp</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="supplier-name">Nhà cung cấp</Label>
            <Input
              id="supplier-name"
              value={supplierName}
              onChange={(e) => onSupplierNameChange(e.target.value)}
              disabled={isLoading}
              placeholder="Apple Việt Nam"
            />
          </div>
          <div>
            <Label htmlFor="order-date">Ngày đặt hàng</Label>
            <Input
              id="order-date"
              type="date"
              value={orderDate}
              onChange={(e) => onOrderDateChange(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="expected-delivery">Ngày giao dự kiến (tùy chọn)</Label>
          <Input
            id="expected-delivery"
            type="date"
            value={expectedDeliveryDate}
            onChange={(e) => onExpectedDeliveryDateChange(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="notes">Ghi chú</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            disabled={isLoading}
            placeholder="Nhập ghi chú về đơn hàng..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}