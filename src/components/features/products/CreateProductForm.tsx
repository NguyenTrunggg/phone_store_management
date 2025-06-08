"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  CreateProductVariantInput,
  FirebaseProduct as Product,
} from "@/lib/firebase/models/product.model";
import { productService } from "@/lib/firebase/services/product.service";
import { ProductBasicInfoStep } from "./CreateProductForm/ProductBasicInfoStep";
import { ProductImagesStep } from "./CreateProductForm/ProductImagesStep";
import { ProductVariantsStep } from "./CreateProductForm/ProductVariantsStep";

// Define the form data interface
export interface ProductFormData {
  name: string;
  brand: string;
  category: string;
  description: string;
  features: string[];
  variants: CreateProductVariantInput[];
  images: string[];
  isActive: boolean;
  tags: string[];
}

interface CreateProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: ProductFormData, productId?: string) => Promise<void>;
  submitting?: boolean;
  editProduct?: Product | null; // Optional product for edit mode
  mode?: "create" | "edit"; // Mode indicator
}

export const CreateProductForm = ({
  isOpen,
  onClose,
  onSubmit,
  submitting = false,
  editProduct = null,
  mode = "create",
}: CreateProductFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    brand: "Apple",
    category: "Điện thoại di động",
    description: "",
    features: [],
    variants: [],
    images: [],
    isActive: true,
    tags: [],
  });

  // Initialize form data when editProduct changes or mode changes
  useEffect(() => {
    const initializeFormData = async () => {
      if (mode === "edit" && editProduct) {
        setFormData({
          name: editProduct.name || "",
          brand: editProduct.brand || "Apple",
          category: editProduct.category || "Điện thoại di động",
          description: editProduct.description || "",
          features: [],
          variants: [], // Will be loaded separately
          images: editProduct.images?.map((img) => img.url) || [],
          isActive: editProduct.isActive ?? true,
          tags: editProduct.tags || [],
        });

        // Load existing variants for edit mode
        if (editProduct.id) {
          setLoadingVariants(true);
          try {
            const variantsResult = await productService.getVariantsByProductId(
              editProduct.id
            );
            if (variantsResult.success && variantsResult.data) {
              // Convert ProductVariant to CreateProductVariantInput format
              const existingVariants: CreateProductVariantInput[] =
                variantsResult.data.map((variant) => ({
                  productId: variant.productId,
                  sku: variant.sku,
                  colorName: variant.colorName,
                  storageCapacity: variant.storageCapacity,
                  retailPrice: variant.retailPrice,
                  imageUrl: variant.imageUrl ?? "",
                  attributes: variant.attributes,
                  lowStockThreshold: variant.lowStockThreshold,
                  reorderLevel: variant.reorderLevel,
                  launchDate: variant.launchDate?.toDate(),
                }));

              setFormData((prev) => ({
                ...prev,
                variants: existingVariants,
              }));
            }
          } catch (error) {
            console.error("Error loading variants:", error);
          } finally {
            setLoadingVariants(false);
          }
        }
      } else if (mode === "create") {
        // Reset to default values for create mode
        setFormData({
          name: "",
          brand: "Apple",
          category: "Điện thoại di động",
          description: "",
          features: [],
          variants: [],
          images: [],
          isActive: true,
          tags: [],
        });
      }
    };

    if (isOpen) {
      initializeFormData();
    }
  }, [mode, editProduct, isOpen]);

  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      name: "",
      brand: "Apple",
      category: "Điện thoại di động",
      description: "",
      features: [],
      variants: [],
      images: [],
      isActive: true,
      tags: [],
    });
  };

  const handleSubmit = async () => {
    if (mode === "edit" && editProduct) {
      await onSubmit(formData, editProduct.id);
    } else {
      await onSubmit(formData);
    }
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Thông tin cơ bản";
      case 2:
        return "Biến thể sản phẩm";
      case 3:
        return "Hình ảnh & Xác nhận";
      default:
        return "";
    }
  };

  const getDialogTitle = () => {
    if (mode === "edit" && editProduct) {
      return `Chỉnh sửa sản phẩm: ${editProduct.name}`;
    }
    return "Thêm sản phẩm mới";
  };

  const getSubmitButtonText = () => {
    if (submitting) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {mode === "edit" ? "Đang cập nhật..." : "Đang tạo..."}
        </>
      );
    }
    return mode === "edit" ? "Cập nhật sản phẩm" : "Tạo sản phẩm";
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProductBasicInfoStep data={formData} onChange={updateFormData} />
        );
      case 2:
        return (
          <ProductVariantsStep
            data={formData}
            onChange={updateFormData}
            editMode={mode === "edit"}
            loading={loadingVariants}
          />
        );
      case 3:
        return <ProductImagesStep data={formData} onChange={updateFormData} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            Bước {currentStep}/3: {getStepTitle()}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    step < currentStep ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="py-4">{renderCurrentStep()}</div>

        <DialogFooter className="flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={submitting}
              >
                Quay lại
              </Button>
            )}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Hủy
            </Button>
            {currentStep < 3 ? (
              <Button onClick={handleNext} disabled={submitting}>
                Tiếp theo
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {getSubmitButtonText()}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Export the renamed type for convenience
export type { ProductFormData as NewProductForm };
