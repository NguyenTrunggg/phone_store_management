"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext"; // ✅ Sử dụng AuthContext có sẵn

// Feature components
import { SupplierInfoForm } from "@/components/features/inventory/supplier-info-form";
import { ProductVariantSelector } from "@/components/features/inventory/product-variant-selector";
import { ImeiInputList } from "@/components/features/inventory/imei-input-list";
import { IntakeSummary } from "@/components/features/inventory/intake-summary";
import { IntakeHistory } from "@/components/features/inventory/intake-history";

// Services
import { inventoryService } from "@/lib/firebase/services/inventory.service";
import { productService } from "@/lib/firebase/services/product.service";

// Types
import type {
  StockIntakeInput,
  FirebasePurchaseOrder,
  FirebasePurchaseOrderItem,
} from "@/lib/firebase/models/inventory.model";

import type { FirebaseSupplier } from "@/lib/firebase/models/supplier.model";
import { is } from "date-fns/locale";

interface Product {
  id: string;
  name: string;
  variants: Array<{
    id: string;
    storageCapacity: string;
    colorName: string;
    sku: string;
    price: number;
  }>;
}

// Define an interface for Purchase Order with its items
interface FirebasePurchaseOrderWithItems extends FirebasePurchaseOrder {
  items?: FirebasePurchaseOrderItem[];
}

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

export default function InventoryIntakePage() {
  // ✅ Sử dụng AuthContext
  const { user } = useAuth();

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [intakeHistory, setIntakeHistory] = useState<IntakeHistoryItem[]>([]);

  // Form states
  const [supplierName, setSupplierName] = useState("Apple Việt Nam");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [unitCost, setUnitCost] = useState(31000000);

  const [imeiList, setImeiList] = useState<string[]>([""]);
  const [imeiErrors, setImeiErrors] = useState<Record<number, string>>({});

  // Load initial data
  useEffect(() => {
    loadProducts();
    loadIntakeHistory();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoadingProducts(true);

      // ✅ Sử dụng method mới cho dropdown
      const result = await productService.getProductsWithVariantsForDropdown();
      console.log("Loading products for dropdown:", result);

      if (result.success && result.data) {
        setProducts(result.data);
        console.log("Loaded products:", result.data);
      } else {
        console.error("Failed to load products:", result.error);
        toast.error(result.error || "Không thể tải danh sách sản phẩm");
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadIntakeHistory = async () => {
    try {
      setIsLoadingHistory(true);
      // 1. Fetch basic info for recent purchase orders
      const recentOrdersResult = await inventoryService.getRecentPurchaseOrders(
        20
      );

      if (recentOrdersResult.success && recentOrdersResult.data) {
        const basicOrders = recentOrdersResult.data;

        // 2. For each basic order, fetch its full details including items
        const detailedIntakeItemsPromises = basicOrders.map(
          async (basicOrder: FirebasePurchaseOrder) => {
            const detailedOrderResult = await inventoryService.getPurchaseOrderWithItems(
              basicOrder.id
            );

            let productsData: IntakeHistoryItem["products"] = [];
            let orderDataForDisplay = basicOrder; // Use basic order data as fallback

            if (detailedOrderResult.success && detailedOrderResult.data) {
              // Assuming detailedOrderResult.data is { order: FirebasePurchaseOrder, items: FirebasePurchaseOrderItem[] }
              const fullOrderData = detailedOrderResult.data.order; // Full order data
              const items = detailedOrderResult.data.items;         // Items array
              
              orderDataForDisplay = fullOrderData; // Use more complete order data if available

              if (items && Array.isArray(items)) {
                productsData = items.map((item: FirebasePurchaseOrderItem) => {
                  const fullProductName =
                    `${item.productName || "Sản phẩm không tên"} ${
                      item.storageCapacity || ""
                    } ${item.colorName || ""} (${
                      item.variantSku || "N/A"
                    })`.trim();
                  return {
                    productName: fullProductName,
                    quantity: item.quantityReceived || 0,
                    totalCost: item.totalCost || 0,
                  };
                });
              }
            } else {
              console.warn(
                `Could not fetch details for order ${basicOrder.orderNumber}: ${detailedOrderResult.error}`
              );
              // productsData will remain empty, basicOrder info will be used
            }

            return {
              id: orderDataForDisplay.id,
              orderNumber: orderDataForDisplay.orderNumber,
              orderDate: orderDataForDisplay.orderDate.toDate().toISOString(),
              supplierName: orderDataForDisplay.supplierName,
              receivedByName: orderDataForDisplay.receivedByName || "Nhân viên kho",
              totalItemsReceived: orderDataForDisplay.totalItemsReceived,
              status: orderDataForDisplay.status,
              totalAmount: orderDataForDisplay.totalAmount,
              products: productsData,
            };
          }
        );

        const transformedData = await Promise.all(detailedIntakeItemsPromises);
        setIntakeHistory(transformedData);
        console.log(
          "Loaded intake history with detailed products:",
          transformedData
        );
      } else {
        toast.error(
          recentOrdersResult.error || "Không thể tải lịch sử nhập kho"
        );
      }
    } catch (error) {
      console.error("Error loading intake history:", error);
      toast.error("Không thể tải lịch sử nhập kho");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // IMEI validation
  const validateImeiList = useCallback(async (imeis: string[]) => {
    const errors: Record<number, string> = {};
    const validImeis = imeis.filter((imei) => imei.trim());

    if (validImeis.length === 0) return errors;

    try {
      const result = await inventoryService.validateImeiList(validImeis);

      if (result.success && result.data) {
        const { invalid, existing } = result.data;

        // Mark invalid IMEIs
        validImeis.forEach((imei, index) => {
          const originalIndex = imeis.indexOf(imei);
          if (invalid.includes(imei)) {
            errors[originalIndex] = "IMEI không hợp lệ (phải có 15 chữ số)";
          }
        });

        // Mark existing IMEIs
        existing.forEach(({ imei, status, canReimport }) => {
          const originalIndex = imeis.indexOf(imei);
          if (originalIndex !== -1) {
            if (!canReimport) {
              errors[
                originalIndex
              ] = `IMEI đã tồn tại với trạng thái: ${status}`;
            } else {
              errors[originalIndex] = `IMEI đã được trả lại. Có thể nhập lại.`;
            }
          }
        });
      }
    } catch (error) {
      console.error("Error validating IMEIs:", error);
      toast.error("Lỗi khi kiểm tra IMEI");
    }

    setImeiErrors(errors);
    return errors;
  }, []);

  // Debounced IMEI validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateImeiList(imeiList);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [imeiList, validateImeiList]);

  // Event handlers
  const handleImeiChange = (index: number, value: string) => {
    const newList = [...imeiList];
    newList[index] = value;
    setImeiList(newList);
  };

  const handleAddImei = () => {
    setImeiList([...imeiList, ""]);
  };

  const handleRemoveImei = (index: number) => {
    if (imeiList.length > 1) {
      const newList = imeiList.filter((_, i) => i !== index);
      setImeiList(newList);

      // Clean up errors for removed index
      const newErrors = { ...imeiErrors };
      delete newErrors[index];

      // Re-index remaining errors
      const reindexedErrors: Record<number, string> = {};
      Object.entries(newErrors).forEach(([key, value]) => {
        const oldIndex = parseInt(key);
        if (oldIndex > index) {
          reindexedErrors[oldIndex - 1] = value;
        } else if (oldIndex < index) {
          reindexedErrors[oldIndex] = value;
        }
      });

      setImeiErrors(reindexedErrors);
    }
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedVariantId("");

    // Auto-set default price if variant is selected
    const product = products.find((p) => p.id === productId);
    if (product && product.variants.length > 0) {
      // Could set a default variant or wait for user selection
      console.log("Product selected:", product);
    }
  };

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);

    // Auto-set price based on variant
    const product = products.find((p) => p.id === selectedProductId);
    const variant = product?.variants.find((v) => v.id === variantId);

    if (variant) {
      // Set unit cost to 70% of retail price as default
      const defaultCost = Math.round(variant.price * 0.7);
      setUnitCost(defaultCost);
      console.log("Variant selected:", variant, "Default cost:", defaultCost);
    }
  };

  // Validation
  const validImeis = imeiList.filter(
    (imei, index) =>
      imei.trim() &&
      imei.length === 15 &&
      /^\d+$/.test(imei) &&
      !imeiErrors[index]
  );

  const isFormValid =
    selectedProductId &&
    selectedVariantId &&
    unitCost > 0 &&
    validImeis.length > 0 &&
    Object.keys(imeiErrors).every((key) => !imeiErrors[parseInt(key)]);

  const totalValue = validImeis.length * unitCost;

  // Get selected product/variant names for display
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedVariant = selectedProduct?.variants.find(
    (v) => v.id === selectedVariantId
  );
  const selectedProductName = selectedProduct?.name;
  const selectedVariantName = selectedVariant
    ? `${selectedVariant.storageCapacity} - ${selectedVariant.colorName}`
    : undefined;

  // Submit handlers
  const handleConfirmIntake = async () => {
    console.log(isFormValid, user);
    console.log("Confirming intake with data:", {
      supplierName,
      orderDate,
      expectedDeliveryDate,
      notes,
      selectedProductId,
      selectedVariantId,
      unitCost,
      imeiList: validImeis,
    });

    console.log("isFormValid", isFormValid);
    if (!isFormValid) {
      toast.error("Vui lòng kiểm tra lại thông tin nhập kho");
      return;
    }

    if (!user) {
      toast.error("Phiên đăng nhập đã hết hạn");
      return;
    }
    console.log("isFormValid", isFormValid);
    setIsLoading(true);
    try {
      // Create minimal supplier info
      const supplierInfo: FirebaseSupplier = {
        id: "", // Will be generated
        name: supplierName,
        code: supplierName.replace(/\s+/g, "_").toUpperCase(),
        primaryContact: {
          name: supplierName,
          phone: "",
          email: "",
          isMainContact: true,
        },
        addresses: [],
        businessInfo: {
          taxId: "",
          businessType: "manufacturer",
        },
        status: "active",
        isPreferred: false,
        isApproved: true,
        requiresApproval: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: user.uid, // ✅ Sử dụng user.uid từ AuthContext
        updatedBy: user.uid,
        // Add other required fields with defaults
        financialInfo: {
          paymentTerms: "Net 30",
          creditLimit: undefined,
          currency: "VND",
          preferredPaymentMethod: "bank_transfer",
          bankAccountInfo: undefined,
        },
        performance: {
          totalOrders: 0,
          totalPurchaseValue: 0,
          averageOrderValue: 0,
          onTimeDeliveryRate: 0,
          qualityRating: 5,
          responsiveness: 5,
          lastOrderDate: undefined,
          firstOrderDate: undefined,
        },
        productCategories: [],
        shippingInfo: {
          defaultShippingMethod: "Standard",
          averageLeadTimeDays: 7,
          minimumOrderQuantity: undefined,
          minimumOrderValue: undefined,
          shippingTerms: "other",
          canDropShip: false,
        },
        qualityInfo: {
          certifications: [],
          qualityPolicies: undefined,
          returnPolicy: undefined,
          warrantyTerms: undefined,
        },
        relationship: {
          partnershipLevel: "preferred",
          contractStartDate: undefined,
          contractEndDate: undefined,
          exclusiveProducts: undefined,
          volumeDiscounts: undefined,
          negotiatedRates: undefined,
        },
        communicationPreferences: {
          preferredContactMethod: "email",
          orderNotifications: true,
          invoiceNotifications: true,
          promotionNotifications: false,
          language: "vi",
          timezone: "Asia/Ho_Chi_Minh",
        },
      };

      const intakeData: StockIntakeInput = {
        supplierName: "", // Will be created or found
        items: [
          {
            productId: selectedProductId,
            variantId: selectedVariantId,
            imeis: validImeis,
            unitCost: unitCost,
            condition: "new",
            location: "Main Store",
            notes: notes,
          },
        ],
        notes: notes,
        supplier: supplierInfo,
        expectedDeliveryDate: expectedDeliveryDate
          ? new Date(expectedDeliveryDate)
          : undefined,
      };

      console.log("Creating intake with data:", intakeData);

      const result = await inventoryService.createPurchaseOrderWithIntake(
        intakeData,
        user.uid // ✅ Sử dụng user.uid từ AuthContext
      );

      if (result.success) {
        toast.success(`✅ Đã tạo phiếu nhập với ${validImeis.length} IMEI`, {
          description: `Mã phiếu: ${result.data?.purchaseOrder.orderNumber}`,
        });

        // Reset form
        setSelectedProductId("");
        setSelectedVariantId("");
        setImeiList([""]);
        setNotes("");
        setUnitCost(31000000);
        setImeiErrors({});

        // Reload history
        await loadIntakeHistory();
      } else {
        toast.error("❌ " + (result.error || "Không thể tạo phiếu nhập kho"));
      }
    } catch (error: any) {
      console.error("Error creating intake:", error);
      toast.error("❌ Có lỗi xảy ra: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = () => {
    // Implementation for saving draft
    const draftData = {
      supplierName,
      orderDate,
      expectedDeliveryDate,
      notes,
      selectedProductId,
      selectedVariantId,
      unitCost,
      imeiList: imeiList.filter((imei) => imei.trim()),
    };

    // Save to localStorage for now
    localStorage.setItem("inventory_draft", JSON.stringify(draftData));
    toast.success("📝 Đã lưu nháp");
  };

  // Load draft on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("inventory_draft");
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        setSupplierName(draftData.supplierName || "Apple Việt Nam");
        setOrderDate(
          draftData.orderDate || new Date().toISOString().split("T")[0]
        );
        setExpectedDeliveryDate(draftData.expectedDeliveryDate || "");
        setNotes(draftData.notes || "");
        setSelectedProductId(draftData.selectedProductId || "");
        setSelectedVariantId(draftData.selectedVariantId || "");
        setUnitCost(draftData.unitCost || 31000000);
        setImeiList(draftData.imeiList?.length > 0 ? draftData.imeiList : [""]);

        toast.info("📄 Đã khôi phục nháp đã lưu");
      } catch (error) {
        console.error("Error loading draft:", error);
      }
    }
  }, []);

  // History event handlers
  const handleViewDetails = async (id: string) => {
    try {
      const result = await inventoryService.getPurchaseOrderWithItems(id);
      if (result.success && result.data) {
        console.log("Order details:", result.data);
        // You could open a modal or navigate to details page
        toast.info(`📋 Chi tiết phiếu ${result.data.order.orderNumber}`);
      }
    } catch (error) {
      console.error("Error loading order details:", error);
      toast.error("Không thể tải chi tiết phiếu nhập");
    }
  };

  const handleEdit = (id: string) => {
    console.log("Edit intake:", id);
    toast.info("🔧 Tính năng chỉnh sửa đang phát triển");
  };

  const handleDelete = async (id: string) => {
    const confirmed = confirm("Bạn có chắc chắn muốn xóa phiếu nhập này?");
    if (confirmed) {
      console.log("Delete intake:", id);
      toast.info("🗑️ Tính năng xóa đang phát triển");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nhập kho</h2>
          <p className="text-gray-600">
            Quản lý nhập kho sản phẩm iPhone theo IMEI
          </p>
        </div>
        <Button
          onClick={() => {
            // Clear form and localStorage
            localStorage.removeItem("inventory_draft");
            setSelectedProductId("");
            setSelectedVariantId("");
            setImeiList([""]);
            setNotes("");
            setUnitCost(31000000);
            setImeiErrors({});
            toast.info("📝 Đã tạo phiếu nhập mới");
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo phiếu nhập mới
        </Button>
      </div>

      <Tabs defaultValue="new-intake" className="w-full">
        <TabsList>
          <TabsTrigger value="new-intake">Phiếu nhập mới</TabsTrigger>
          <TabsTrigger value="history">Lịch sử nhập kho</TabsTrigger>
        </TabsList>

        <TabsContent value="new-intake" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form nhập kho */}
            <div className="lg:col-span-2 space-y-4">
              <SupplierInfoForm
                supplierName={supplierName}
                orderDate={orderDate}
                expectedDeliveryDate={expectedDeliveryDate}
                notes={notes}
                onSupplierNameChange={setSupplierName}
                onOrderDateChange={setOrderDate}
                onExpectedDeliveryDateChange={setExpectedDeliveryDate}
                onNotesChange={setNotes}
                isLoading={isLoading}
              />

              <ProductVariantSelector
                products={products}
                selectedProductId={selectedProductId}
                selectedVariantId={selectedVariantId}
                unitCost={unitCost}
                onProductChange={handleProductChange}
                onVariantChange={handleVariantChange}
                onUnitCostChange={setUnitCost}
                isLoading={isLoading || isLoadingProducts}
              />

              <ImeiInputList
                imeiList={imeiList}
                onImeiChange={handleImeiChange}
                onAddImei={handleAddImei}
                onRemoveImei={handleRemoveImei}
                errors={imeiErrors}
                isLoading={isLoading}
              />
            </div>

            {/* Tóm tắt phiếu nhập */}
            <div>
              <IntakeSummary
                totalItems={validImeis.length}
                unitCost={unitCost}
                totalValue={totalValue}
                selectedProductName={selectedProductName}
                selectedVariantName={selectedVariantName}
                isValid={!!isFormValid}
                onConfirm={handleConfirmIntake}
                onSaveDraft={handleSaveDraft}
                isLoading={isLoading}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <IntakeHistory
            intakes={intakeHistory}
            isLoading={isLoadingHistory}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
