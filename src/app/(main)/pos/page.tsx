"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, Plus, Trash2, CreditCard, Smartphone, ShoppingCart, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { posService, PosProduct, PosProductVariant } from "@/lib/firebase/services/pos.service"
import { customerService } from "@/lib/firebase/services/customer.service"
import { FirebaseCustomer } from "@/lib/firebase/models/customer.model"
import type { CreateSalesOrderInput, FirebasePosCustomerInfo } from "@/lib/firebase/models/pos.model"
import { debounce } from "@/lib/firebase/services/base.service"

interface CartItem {
  inventoryItemId: string;
  imei: string;
  productName: string;
  variantDescription: string;
  price: number;
  quantity: 1;
}

interface SelectableImei {
  inventoryItemId: string;
  imei: string;
  currentRetailPrice: number;
  productId: string;
  productName: string;
  variantId: string;
  variantSku: string;
  colorName: string;
  storageCapacity: string;
}

export default function POSInterface() {
  const { user } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("")
  const [availableProducts, setAvailableProducts] = useState<PosProduct[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  
  const [productToSelectVariant, setProductToSelectVariant] = useState<PosProduct | null>(null)
  const [variantToSelectImei, setVariantToSelectImei] = useState<PosProductVariant | null>(null)

  const [cart, setCart] = useState<CartItem[]>([])

  const [customerInfo, setCustomerInfo] = useState<FirebasePosCustomerInfo>({
    name: "",
    phone: "",
  })
  const [selectedCustomer, setSelectedCustomer] = useState<FirebaseCustomer | null>(null)
  const [searchedCustomers, setSearchedCustomers] = useState<FirebaseCustomer[]>([])
  const [isCustomerSearchLoading, setIsCustomerSearchLoading] = useState(false)
  
  const [customerNameError, setCustomerNameError] = useState("")
  const [customerPhoneError, setCustomerPhoneError] = useState("")

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash")
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [amountReceived, setAmountReceived] = useState("")

  useEffect(() => {
    loadAvailableProducts();
  }, []);

  const loadAvailableProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const result = await posService.getAvailableProductsForSale();
      console.log("POS service result:", result);
      if (result.success && result.data) {
        setAvailableProducts(result.data);
      } else {
        toast.error(result.error || "Không thể tải danh sách sản phẩm.");
      }
    } catch (error) {
      toast.error("Lỗi khi tải sản phẩm: " + (error as Error).message);
    } finally {
      setIsLoadingProducts(false);
    }
  };
  
  const filteredProducts = availableProducts.filter((product) =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductClick = (product: PosProduct) => {
    setProductToSelectVariant(product);
    setVariantToSelectImei(null);
  };

  const handleVariantClick = (variant: PosProductVariant) => {
    setVariantToSelectImei(variant);
  };

  const addToCart = (imeiDetail: SelectableImei) => {
    if (cart.some(item => item.imei === imeiDetail.imei)) {
      toast.warning(`IMEI ${imeiDetail.imei} đã có trong giỏ hàng.`);
      return;
    }

    const cartItem: CartItem = {
      inventoryItemId: imeiDetail.inventoryItemId,
      imei: imeiDetail.imei,
      productName: imeiDetail.productName,
      variantDescription: `${imeiDetail.storageCapacity} ${imeiDetail.colorName} (SKU: ${imeiDetail.variantSku})`,
      price: imeiDetail.currentRetailPrice,
      quantity: 1,
    };
    setCart([...cart, cartItem]);
    toast.success(`${imeiDetail.productName} (${imeiDetail.imei}) đã được thêm vào giỏ hàng.`);
  };

  const removeFromCart = (imei: string) => {
    setCart(cart.filter((item) => item.imei !== imei));
    toast.info("Đã xóa sản phẩm khỏi giỏ hàng.");
  };

  const getTotalAmount = useCallback(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const debouncedPhoneSearch = useMemo(
    () =>
      debounce(async (phone: string) => {
        if (phone.length < 3) {
          setSearchedCustomers([]);
          return;
        }
        setIsCustomerSearchLoading(true);
        const res = await customerService.searchCustomers({ searchTerm: phone, limit: 5, isActive: true });
        if (res.success && res.data) {
          const directMatch = res.data.data.find(c => c.phone === phone);
          if (directMatch) {
            handleCustomerSelect(directMatch);
            setSearchedCustomers([]);
          } else {
            setSearchedCustomers(res.data.data);
          }
        } else {
          setSearchedCustomers([]);
        }
        setIsCustomerSearchLoading(false);
      }, 300),
    []
  );

  useEffect(() => {
    if (customerInfo.phone && !selectedCustomer) {
      debouncedPhoneSearch(customerInfo.phone);
    } else {
      setSearchedCustomers([]);
    }
  }, [customerInfo.phone, selectedCustomer, debouncedPhoneSearch]);

  const handleCustomerSelect = (customer: FirebaseCustomer) => {
    setSelectedCustomer(customer);
    setCustomerInfo({ name: customer.name, phone: customer.phone ?? "" });
    setSearchedCustomers([]);
    toast.info(`Đã chọn khách hàng: ${customer.name}`);
  }

  const handleCustomerInfoChange = (field: keyof FirebasePosCustomerInfo, value: string) => {
    if (selectedCustomer) {
      setSelectedCustomer(null); 
      setCustomerInfo({ name: selectedCustomer.name, phone: value });
    } else {
      const newCustomerInfo = { ...customerInfo, [field]: value };
      setCustomerInfo(newCustomerInfo);
    }
  }

  const processPayment = async () => {
    console.log("processPayment: Starting payment process...");

    if (!user) {
      toast.error("Vui lòng đăng nhập để tiếp tục.");
      console.log("processPayment: User not logged in.");
      return;
    }
    if (cart.length === 0) {
      toast.error("Giỏ hàng trống.");
      console.log("processPayment: Cart is empty.");
      return;
    }
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error("Vui lòng nhập đầy đủ tên và số điện thoại khách hàng.");
      console.log("processPayment: Customer info missing.");
      return;
    }

    setIsProcessingPayment(true);
    const subTotal = getTotalAmount();
    const taxRate = 0.1;
    const taxAmount = subTotal * taxRate;
    const totalSaleAmount = subTotal + taxAmount;

    if (paymentMethod === "cash") {
      const received = Number.parseFloat(amountReceived);
      if (isNaN(received) || received < totalSaleAmount) {
        toast.error("Số tiền nhận không đủ hoặc không hợp lệ!");
        console.log("processPayment: Invalid amount received for cash payment.");
        setIsProcessingPayment(false);
        return;
      }
    }
    
    const saleInput: CreateSalesOrderInput = {
      customerInfo,
      customerId: selectedCustomer?.id,
      items: cart.map(ci => ({ inventoryItemId: ci.inventoryItemId, imei: ci.imei })),
      paymentMethod,
      taxRate,
      amountReceived: paymentMethod === "cash" ? Number.parseFloat(amountReceived) : undefined,
      notes: `Đơn hàng POS tạo bởi ${user.email}`,
      salesChannel: "pos",
    };
    console.log("processPayment: Sale input prepared:", saleInput);

    try {
      console.log("processPayment: Calling createSaleOrder service...");
      console.log("saleInput:", saleInput);
      console.log("user.uid:", user.uid);
      console.log("user.email:", user.email);
      const result = await posService.createSaleOrder(saleInput, user.uid,user.email);
      console.log("processPayment: createSaleOrder service result:", result);

      if (result.success && result.data && result.data.id) {
        console.log("processPayment: Order creation successful. Navigating...");
        toast.success(`Thanh toán thành công! Đơn hàng ${result.data.orderNumber} đã được tạo.`);
        setCart([]);
        setCustomerInfo({ name: "", phone: "" });
        setSelectedCustomer(null);
        setAmountReceived("");
        setIsCheckoutDialogOpen(false);
        
        router.push(`/pos/receipt/${result.data.id}`);

      } else {
        console.log("processPayment: Order creation failed or data missing.", result);
        toast.error(result.error || "Không thể tạo đơn hàng. Dữ liệu trả về không hợp lệ.");
      }
    } catch (error: any) {
      console.error("processPayment: Error during payment processing:", error);
      toast.error("Lỗi khi xử lý thanh toán: " + error.message);
    } finally {
      console.log("processPayment: Finishing payment process.");
      setIsProcessingPayment(false);
    }
  };
  
  const handleOpenCheckoutDialog = () => {
    let isValid = true;
    if (!customerInfo.name) {
      setCustomerNameError("Vui lòng nhập tên khách hàng.");
      isValid = false;
    } else {
      setCustomerNameError("");
    }

    if (!customerInfo.phone) {
      setCustomerPhoneError("Vui lòng nhập số điện thoại.");
      isValid = false;
    } else {
      setCustomerPhoneError("");
    }

    if (!isValid) {
      toast.error("Vui lòng nhập đầy đủ thông tin khách hàng để tiếp tục thanh toán.");
      return;
    }

    if (cart.length === 0) {
      toast.error("Giỏ hàng trống. Vui lòng thêm sản phẩm vào giỏ.");
      return;
    }
    setIsCheckoutDialogOpen(true);
  };

  const currentTotalAmount = getTotalAmount();
  const currentTaxAmount = currentTotalAmount * 0.1;
  const currentFinalAmount = currentTotalAmount + currentTaxAmount;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Giao diện bán hàng (POS)</h2>
        <p className="text-gray-600">Tạo đơn hàng và xử lý thanh toán với sản phẩm từ kho</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chọn sản phẩm</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingProducts ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="ml-2">Đang tải sản phẩm...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div key={product.productId} className="border rounded-lg p-4">
                    <h3 
                      className="font-semibold text-lg mb-3 cursor-pointer hover:text-blue-600"
                      onClick={() => handleProductClick(product)}
                    >
                      {product.productName}
                    </h3>
                    {productToSelectVariant?.productId === product.productId && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 border-l-2 border-blue-100">
                        {product.variants.map((variant) => (
                          <div
                            key={variant.variantId}
                            className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleVariantClick(variant)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">
                                  {variant.storageCapacity} - {variant.colorName}
                                </p>
                                <p className="text-sm text-gray-500">SKU: {variant.variantSku}</p>
                              </div>
                              <Badge variant={variant.totalStock > 0 ? "default" : "secondary"}>
                                Còn {variant.totalStock}
                              </Badge>
                            </div>
                             {variantToSelectImei?.variantId === variant.variantId && productToSelectVariant?.productId === product.productId && (
                              <div className="mt-3 pt-3 border-t">
                                <h4 className="text-sm font-semibold mb-2 text-blue-700">Chọn IMEI:</h4>
                                {variant.availableImeis.length > 0 ? (
                                  variant.availableImeis.map((imei) => (
                                    <div
                                      key={imei.imei}
                                      className="flex items-center justify-between p-2 mb-1 bg-white rounded-md border cursor-pointer hover:bg-blue-50"
                                      onClick={() => addToCart({
                                        inventoryItemId: imei.inventoryItemId,
                                        imei: imei.imei,
                                        currentRetailPrice: imei.currentRetailPrice,
                                        productId: product.productId,
                                        productName: product.productName,
                                        variantId: variant.variantId,
                                        variantSku: variant.variantSku,
                                        colorName: variant.colorName,
                                        storageCapacity: variant.storageCapacity,
                                      })}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <Smartphone className="w-4 h-4 text-gray-500" />
                                        <span className="font-mono text-xs">{imei.imei}</span>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs font-semibold text-blue-600">{imei.currentRetailPrice.toLocaleString("vi-VN")}₫</p>
                                        <Button size="sm" variant="outline" className="mt-1 h-6 px-2 py-1 text-xs">
                                          <Plus className="w-3 h-3 mr-1" />
                                          Thêm
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-gray-500">Không có IMEI nào cho biến thể này.</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                 <p className="text-gray-500 text-center py-10">Không tìm thấy sản phẩm nào.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm">Thông tin khách hàng</CardTitle>
              <CardDescription>Nhập SĐT để tìm hoặc tạo khách hàng mới.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 relative">
                <Label htmlFor="customer-phone">Số điện thoại</Label>
                <Input
                  id="customer-phone"
                  placeholder="Nhập SĐT để tìm..."
                  value={customerInfo.phone}
                  onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                  className={customerPhoneError ? "border-red-500" : ""}
                  autoComplete="off"
                />
                {isCustomerSearchLoading && <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin" />}
                {searchedCustomers.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1">
                    <ul>
                      {searchedCustomers.map(c => (
                        <li key={c.id} onClick={() => handleCustomerSelect(c)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          <p className="font-semibold">{c.name}</p>
                          <p className="text-sm text-gray-500">{c.phone}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {customerPhoneError && <p className="text-sm text-red-500">{customerPhoneError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-name">Tên khách hàng</Label>
                <Input
                  id="customer-name"
                  placeholder="Nguyễn Văn A"
                  value={customerInfo.name || ''}
                  onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                  className={customerNameError ? "border-red-500" : ""}
                />
                {customerNameError && <p className="text-sm text-red-500">{customerNameError}</p>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Giỏ hàng ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Chưa có sản phẩm nào</p>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.imei} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.productName}</h4>
                          <p className="text-xs text-gray-500">{item.variantDescription}</p>
                          <p className="text-xs text-gray-400 font-mono">IMEI: {item.imei}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.imei)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Số lượng: {item.quantity}</span>
                        <span className="font-bold text-blue-600">{item.price.toLocaleString("vi-VN")}₫</span>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Tạm tính:</span>
                      <span>{currentTotalAmount.toLocaleString("vi-VN")}₫</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thuế VAT (10%):</span>
                      <span>{currentTaxAmount.toLocaleString("vi-VN")}₫</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Tổng cộng:</span>
                      <span className="text-blue-600">{currentFinalAmount.toLocaleString("vi-VN")}₫</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleOpenCheckoutDialog}
                    disabled={cart.length === 0 || isProcessingPayment}
                  >
                    {isProcessingPayment ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                    {isProcessingPayment ? "Đang xử lý..." : "Thanh toán"}
                  </Button>

                  <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Xác nhận thanh toán</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">Sản phẩm ({cart.length})</h4>
                          {cart.map((item) => (
                            <div key={item.imei} className="flex justify-between text-sm">
                              <span>
                                {item.productName} - {item.variantDescription.split('(SKU')[0].trim()} (IMEI: {item.imei})
                              </span>
                              <span>{item.price.toLocaleString("vi-VN")}₫</span>
                            </div>
                          ))}
                        </div>

                        <Separator />

                        <div className="space-y-2">
                           <div className="flex justify-between">
                            <span>Tạm tính:</span>
                            <span>{currentTotalAmount.toLocaleString("vi-VN")}₫</span>
                          </div>
                          <div className="flex justify-between">
                            <span>VAT (10%):</span>
                            <span>{currentTaxAmount.toLocaleString("vi-VN")}₫</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>Tổng cộng:</span>
                            <span className="text-blue-600">{currentFinalAmount.toLocaleString("vi-VN")}₫</span>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="paymentMethod">Phương thức thanh toán</Label>
                            <Select
                              value={paymentMethod}
                              onValueChange={(value: "cash" | "card" | "transfer") => setPaymentMethod(value)}
                            >
                              <SelectTrigger id="paymentMethod">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">Tiền mặt</SelectItem>
                                <SelectItem value="card">Thẻ ngân hàng</SelectItem>
                                <SelectItem value="transfer">Chuyển khoản</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {paymentMethod === "cash" && (
                            <div>
                              <Label htmlFor="amountReceived">Số tiền nhận</Label>
                              <Input
                                id="amountReceived"
                                type="number"
                                placeholder="Nhập số tiền khách đưa"
                                value={amountReceived}
                                onChange={(e) => setAmountReceived(e.target.value)}
                              />
                              {amountReceived && Number.parseFloat(amountReceived) >= currentFinalAmount && (
                                <p className="text-sm text-green-600 mt-1">
                                  Số tiền cần trả lại:{" "}
                                  {(Number.parseFloat(amountReceived) - currentFinalAmount).toLocaleString("vi-VN")}
                                  ₫
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCheckoutDialogOpen(false)} disabled={isProcessingPayment}>
                          Hủy
                        </Button>
                        <Button 
                          onClick={processPayment} 
                          disabled={isProcessingPayment || !customerInfo.name || !customerInfo.phone}
                        >
                           {isProcessingPayment ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                           {isProcessingPayment ? "Đang xử lý..." : "Xác nhận thanh toán"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
