"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { posService } from '@/lib/firebase/services/pos.service';
import { FirebaseSalesOrder, FirebaseSalesOrderItem } from '@/lib/firebase/models/pos.model';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Printer, ArrowLeft, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, formatCurrency } from '@/lib/firebase/services/base.service'; // Assuming these are available and correctly exported

interface OrderDetails {
  order: FirebaseSalesOrder;
  items: FirebaseSalesOrderItem[];
}

export default function ReceiptPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      const fetchOrderDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await posService.getSalesOrderByIdWithItems(orderId);
          if (result.success && result.data) {
            setOrderDetails(result.data);
          } else {
            setError(result.error || 'Không thể tải chi tiết đơn hàng.');
            toast.error(result.error || 'Không thể tải chi tiết đơn hàng.');
          }
        } catch (e: any) {
          setError('Lỗi khi tải chi tiết đơn hàng: ' + e.message);
          toast.error('Lỗi khi tải chi tiết đơn hàng: ' + e.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrderDetails();
    }
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="ml-3 text-lg">Đang tải hóa đơn...</p>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center">
        <p className="text-xl text-red-500 mb-4">{error || 'Không tìm thấy thông tin hóa đơn.'}</p>
        <Button onClick={() => router.push('/pos')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại POS
        </Button>
      </div>
    );
  }

  const { order, items } = orderDetails;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 bg-white">
      <Card className="shadow-lg">
        <CardHeader className="bg-gray-50 p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">Hóa Đơn Bán Hàng</CardTitle>
              <p className="text-sm text-gray-500">Mã đơn hàng: {order.orderNumber}</p>
            </div>

            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Thông tin khách hàng:</h3>
              <p>Tên: {order.customerInfo?.name || 'Khách lẻ'}</p>
              <p>Điện thoại: {order.customerInfo?.phone || 'N/A'}</p>
            </div>
            <div className="text-right">
              <h3 className="font-semibold text-gray-700 mb-1">Ngày tạo hóa đơn:</h3>
              <p>{formatDate(order.orderDate)}</p>
              <h3 className="font-semibold text-gray-700 mt-2 mb-1">Nhân viên:</h3>
              <p>{order.staffName || order.staffId}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-gray-700 mb-3 text-lg">Chi tiết sản phẩm:</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-800">{item.productName}</p>
                    <p className="text-xs text-gray-500">
                      {item.storageCapacity} - {item.colorName} (IMEI: {item.imei})
                    </p>
                  </div>
                  <p className="font-semibold text-gray-800">{formatCurrency(item.finalPrice)}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tạm tính:</span>
              <span className="font-medium text-gray-800">{formatCurrency(order.subtotalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Thuế VAT ({order.taxRate * 100}%):</span>
              <span className="font-medium text-gray-800">{formatCurrency(order.taxAmount)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Giảm giá:</span>
                <span className="font-medium text-red-600">-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            {order.shippingAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Phí vận chuyển:</span>
                <span className="font-medium text-gray-800">{formatCurrency(order.shippingAmount)}</span>
              </div>
            )}
            <Separator className="my-2"/>
            <div className="flex justify-between text-lg font-bold text-blue-600">
              <span>Tổng cộng:</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
          
          <Separator />

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Thông tin thanh toán:</h3>
            <p className="text-sm">Phương thức: {order.paymentMethod === 'cash' ? 'Tiền mặt' : order.paymentMethod === 'card' ? 'Thẻ ngân hàng' : 'Chuyển khoản'}</p>
            {order.paymentMethod === 'cash' && (
              <>
                <p className="text-sm">Tiền khách đưa: {formatCurrency(order.amountReceived || 0)}</p>
                <p className="text-sm">Tiền trả lại: {formatCurrency(order.changeGiven || 0)}</p>
              </>
            )}
          </div>
          <p className="text-xs text-center text-gray-500 pt-4">Cảm ơn quý khách đã mua hàng!</p>
        </CardContent>
        <CardFooter className="p-6 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <Button variant="outline" onClick={() => router.push('/pos')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tạo đơn mới
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            In hóa đơn
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 