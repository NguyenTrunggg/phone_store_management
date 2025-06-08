"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, RefreshCw, Loader2 } from "lucide-react";
import type { NewProductForm } from "../CreateProductForm";
import { CreateProductVariantInput } from "@/lib/firebase/models";

interface ProductVariantsStepProps {
  data: NewProductForm;
  onChange: (updates: Partial<NewProductForm>) => void;
  editMode?: boolean;
  loading?: boolean;
}

export const ProductVariantsStep = ({
  data,
  onChange,
  editMode = false,
  loading = false,
}: ProductVariantsStepProps) => {
  const [colors, setColors] = useState<string[]>([]);
  const [storageOptions, setStorageOptions] = useState<string[]>([]);
  const [newColor, setNewColor] = useState("");
  const [newStorage, setNewStorage] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);

  // Predefined options for quick selection
  const commonColors = [
    "Natural Titanium",
    "Blue Titanium",
    "White Titanium",
    "Black Titanium",
    "Pink",
    "Yellow",
    "Green",
    "Blue",
    "Purple",
    "Red",
    "White",
    "Black",
  ];

  const commonStorage = ["128GB", "256GB", "512GB", "1TB"];

  // Initialize colors and storage from existing variants when component mounts
  useEffect(() => {
    if (data.variants.length > 0) {
      const existingColors = [
        ...new Set(data.variants.map((v) => v.colorName).filter(Boolean)),
      ];
      const existingStorage = [
        ...new Set(data.variants.map((v) => v.storageCapacity).filter(Boolean)),
      ];

      if (existingColors.length > 0) {
        setColors(existingColors);
      }
      if (existingStorage.length > 0) {
        setStorageOptions(existingStorage);
      }

      // Set base price from first variant if available
      const firstVariant = data.variants[0];
      if (firstVariant && firstVariant.retailPrice > 0) {
        setBasePrice(firstVariant.retailPrice);
      }
    }
  }, [data.variants]);

  // Update SKUs when product name changes
  useEffect(() => {
    if (data.variants.length > 0 && data.name) {
      const updatedVariants = data.variants.map((variant) => ({
        ...variant,
        sku: generateSKU(variant.colorName, variant.storageCapacity),
      }));
      onChange({ variants: updatedVariants });
    }
  }, [data.name]);

  // Add color
  const addColor = (color: string) => {
    if (color.trim() && !colors.includes(color.trim())) {
      const newColors = [...colors, color.trim()];
      setColors(newColors);
      setNewColor("");

      // If we have storage options, regenerate variants
      if (storageOptions.length > 0) {
        regenerateVariantsFromSelection(newColors, storageOptions);
      }
    }
  };

  // Remove color
  const removeColor = (index: number) => {
    const newColors = colors.filter((_, i) => i !== index);
    setColors(newColors);

    // Regenerate variants without this color
    regenerateVariantsFromSelection(newColors, storageOptions);
  };

  // Add storage
  const addStorage = (storage: string) => {
    if (storage.trim() && !storageOptions.includes(storage.trim())) {
      const newStorageOptions = [...storageOptions, storage.trim()];
      setStorageOptions(newStorageOptions);
      setNewStorage("");

      // If we have colors, regenerate variants
      if (colors.length > 0) {
        regenerateVariantsFromSelection(colors, newStorageOptions);
      }
    }
  };

  // Remove storage
  const removeStorage = (index: number) => {
    const newStorageOptions = storageOptions.filter((_, i) => i !== index);
    setStorageOptions(newStorageOptions);

    // Regenerate variants without this storage option
    regenerateVariantsFromSelection(colors, newStorageOptions);
  };

  // Generate SKU for variant
  const generateSKU = (color: string, storage: string): string => {
    if (!data.name) return "";

    const nameCode = data.name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
    const storageCode = storage.replace("GB", "").replace("TB", "T");
    const colorCode = color
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
    return `${nameCode}-${storageCode}-${colorCode}`;
  };

  // Regenerate variants from current color and storage selections
  const regenerateVariantsFromSelection = (
    selectedColors: string[],
    selectedStorage: string[]
  ) => {
    if (selectedColors.length === 0 || selectedStorage.length === 0) {
      onChange({ variants: [] });
      return;
    }

    const variants: CreateProductVariantInput[] = [];

    for (const color of selectedColors) {
      for (const storage of selectedStorage) {
        // Check if variant already exists to preserve custom values and existing status
        const existingVariant = data.variants.find(
          (v) => v.colorName === color && v.storageCapacity === storage
        );

        if (existingVariant) {
          // Preserve existing variant data and maintain its existing status
          variants.push({
            ...existingVariant,
            sku: existingVariant.sku || generateSKU(color, storage),
            // Keep productId if it exists (indicates existing variant)
            productId: existingVariant.productId || "",
          });
        } else {
          // Create new variant (no productId means it's new)
          variants.push({
            productId: "", // Empty productId indicates new variant
            sku: generateSKU(color, storage),
            colorName: color,
            storageCapacity: storage,
            retailPrice: basePrice,
          });
        }
      }
    }

    onChange({ variants });
  };

  // Generate all variant combinations (triggered by button)
  const generateVariants = () => {
    regenerateVariantsFromSelection(colors, storageOptions);
  };

  // Update variant field
  const updateVariant = (
    index: number,
    field: keyof CreateProductVariantInput,
    value: any
  ) => {
    const newVariants = [...data.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    onChange({ variants: newVariants });
  };

  // Update all variant prices with base price
  const applyBasePriceToAll = () => {
    if (data.variants.length === 0) return;

    const updatedVariants = data.variants.map((variant) => ({
      ...variant,
      retailPrice: basePrice || variant.retailPrice,
    }));

    onChange({ variants: updatedVariants });
  };

  // Show loading state for edit mode
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {editMode ? "Chỉnh sửa biến thể sản phẩm" : "Tạo biến thể sản phẩm"}
          </h3>
        </div>

        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Đang tải biến thể hiện có...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {editMode ? "Chỉnh sửa biến thể sản phẩm" : "Tạo biến thể sản phẩm"}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateVariants}
            disabled={
              colors.length === 0 || storageOptions.length === 0 || !data.name
            }
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            {editMode ? "Đồng bộ" : "Tạo"} biến thể ({colors.length} ×{" "}
            {storageOptions.length} = {colors.length * storageOptions.length})
          </Button>
          {data.variants.length > 0 && basePrice > 0 && (
            <Button variant="outline" size="sm" onClick={applyBasePriceToAll}>
              Áp dụng giá cho tất cả
            </Button>
          )}
        </div>
      </div>

      {!data.name && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            Vui lòng nhập tên sản phẩm ở bước 1 để{" "}
            {editMode ? "chỉnh sửa" : "tạo"} biến thể
          </p>
        </div>
      )}

      {editMode && data.variants.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Chế độ chỉnh sửa:</strong> Đã tải {data.variants.length}{" "}
            biến thể hiện có. Bạn có thể thêm màu/dung lượng mới hoặc chỉnh sửa
            biến thể hiện tại.
          </p>
        </div>
      )}

      {/* Base Pricing */}
      <div className="space-y-3">
        <Label className="text-base font-medium">
          Giá cơ bản cho {editMode ? "biến thể mới" : "tất cả biến thể"}
        </Label>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label>Giá bán (VNĐ) *</Label>
            <Input
              type="number"
              value={basePrice || ""}
              onChange={(e) => {
                const price = Number(e.target.value) || 0;
                setBasePrice(price);

                // In edit mode, only update variants without prices
                if (data.variants.length > 0) {
                  const updatedVariants = data.variants.map((variant) => ({
                    ...variant,
                    retailPrice: editMode
                      ? variant.retailPrice > 0
                        ? variant.retailPrice
                        : price
                      : variant.retailPrice > 0
                      ? variant.retailPrice
                      : price,
                  }));
                  onChange({ variants: updatedVariants });
                }
              }}
              placeholder="34990000"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          {editMode
            ? "Giá này sẽ được áp dụng cho biến thể mới. Biến thể hiện có sẽ giữ nguyên giá."
            : "Giá này sẽ được áp dụng cho biến thể mới. Bạn có thể điều chỉnh từng biến thể riêng lẻ sau."}
        </p>
      </div>

      {/* Color Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">
          Màu sắc ({colors.length} đã chọn)
        </Label>

        {/* Common colors quick selection */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Chọn nhanh:</p>
          <div className="flex flex-wrap gap-2">
            {commonColors.map((color) => (
              <Button
                key={color}
                variant={colors.includes(color) ? "default" : "outline"}
                size="sm"
                onClick={() => addColor(color)}
                disabled={colors.includes(color)}
              >
                {color}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom color input */}
        <div className="flex gap-2">
          <Input
            placeholder="Nhập màu tùy chỉnh..."
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addColor(newColor)}
          />
          <Button
            variant="outline"
            onClick={() => addColor(newColor)}
            disabled={!newColor.trim() || colors.includes(newColor.trim())}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Selected colors */}
        {colors.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">Màu đã chọn:</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((color, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {color}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeColor(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Storage Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">
          Dung lượng bộ nhớ ({storageOptions.length} đã chọn)
        </Label>

        {/* Common storage quick selection */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Chọn nhanh:</p>
          <div className="flex flex-wrap gap-2">
            {commonStorage.map((storage) => (
              <Button
                key={storage}
                variant={
                  storageOptions.includes(storage) ? "default" : "outline"
                }
                size="sm"
                onClick={() => addStorage(storage)}
                disabled={storageOptions.includes(storage)}
              >
                {storage}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom storage input */}
        <div className="flex gap-2">
          <Input
            placeholder="Nhập dung lượng tùy chỉnh (VD: 2TB)..."
            value={newStorage}
            onChange={(e) => setNewStorage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addStorage(newStorage)}
          />
          <Button
            variant="outline"
            onClick={() => addStorage(newStorage)}
            disabled={
              !newStorage.trim() || storageOptions.includes(newStorage.trim())
            }
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Selected storage options */}
        {storageOptions.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">Dung lượng đã chọn:</p>
            <div className="flex flex-wrap gap-2">
              {storageOptions.map((storage, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {storage}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeStorage(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generated Variants */}
      {data.variants.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-base font-medium">
              {editMode ? "Biến thể sản phẩm" : "Biến thể được tạo"} (
              {data.variants.length})
            </h4>
            {basePrice > 0 && (
              <Button variant="outline" size="sm" onClick={applyBasePriceToAll}>
                Áp dụng giá {basePrice.toLocaleString("vi-VN")}₫ cho tất cả
              </Button>
            )}
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.variants.map((variant, index) => (
              <div key={index} className="border rounded-lg p-3 bg-gray-50">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-4">
                    <p className="font-medium text-sm">
                      {variant.storageCapacity} - {variant.colorName}
                    </p>
                    <p className="text-xs text-gray-500">SKU: {variant.sku}</p>
                    {editMode && (
                      <p className="text-xs text-blue-600">
                        {variant.productId
                          ? "Biến thể hiện có"
                          : "Biến thể mới"}
                      </p>
                    )}
                  </div>

                  <div className="col-span-4">
                    <Label className="text-xs">Giá bán (VNĐ) *</Label>
                    <Input
                      type="number"
                      value={variant.retailPrice || ""}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "retailPrice",
                          Number(e.target.value) || 0
                        )
                      }
                      className="h-8"
                      placeholder="34990000"
                    />
                    {(!variant.retailPrice || variant.retailPrice <= 0) && (
                      <p className="text-xs text-red-500 mt-1">
                        Giá bán là bắt buộc
                      </p>
                    )}
                  </div>

                  <div className="col-span-4">
                    <Label className="text-xs">SKU</Label>
                    <Input
                      value={variant.sku}
                      onChange={(e) =>
                        updateVariant(index, "sku", e.target.value)
                      }
                      className="h-8"
                      placeholder="IP15PM-256-TN"
                      disabled={editMode && !!variant.productId} // Disable SKU editing for existing variants
                    />
                    {editMode && variant.productId && (
                      <p className="text-xs text-gray-500 mt-1">
                        SKU của biến thể hiện có không thể thay đổi
                      </p>
                    )}
                  </div>
                </div>

                {variant.retailPrice > 0 && (
                  <div className="mt-2 text-xs text-green-600">
                    Giá: {variant.retailPrice.toLocaleString("vi-VN")}₫
                  </div>
                )}

              </div>
            ))}
          </div>

          {/* Validation Summary */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Tổng biến thể:</span>
                <span className="ml-2 font-medium">{data.variants.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Biến thể hợp lệ:</span>
                <span className="ml-2 font-medium text-green-600">
                  {
                    data.variants.filter(
                      (v) =>
                        v.colorName?.trim() &&
                        v.storageCapacity?.trim() &&
                        v.retailPrice > 0 &&
                        v.sku?.trim()
                    ).length
                  }
                </span>
              </div>
              {editMode && (
                <>
                  <div>
                    <span className="text-gray-500">Biến thể hiện có:</span>
                    <span className="ml-2 font-medium text-blue-600">
                      {data.variants.filter((v) => v.productId).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Biến thể mới:</span>
                    <span className="ml-2 font-medium text-orange-600">
                      {data.variants.filter((v) => !v.productId).length}
                    </span>
                  </div>
                </>
              )}
            </div>

            {data.variants.some(
              (v) => !v.retailPrice || v.retailPrice <= 0
            ) && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-700">
                  ⚠️ Một số biến thể chưa có giá bán. Vui lòng nhập giá cho tất
                  cả biến thể.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      {(colors.length > 0 || storageOptions.length > 0) && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Tóm tắt tạo biến thể</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Màu sắc:</span>
              <span className="ml-2 font-medium">{colors.length} màu</span>
            </div>
            <div>
              <span className="text-gray-500">Dung lượng:</span>
              <span className="ml-2 font-medium">
                {storageOptions.length} loại
              </span>
            </div>
            <div>
              <span className="text-gray-500">Tổng biến thể có thể tạo:</span>
              <span className="ml-2 font-medium text-blue-600">
                {colors.length} × {storageOptions.length} ={" "}
                {colors.length * storageOptions.length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Biến thể đã tạo:</span>
              <span className="ml-2 font-medium">{data.variants.length}</span>
            </div>
          </div>

          {colors.length > 0 &&
            storageOptions.length > 0 &&
            data.variants.length !== colors.length * storageOptions.length && (
              <div className="mt-3 p-2 bg-white rounded border border-blue-200">
                <p className="text-sm text-blue-700">
                  Nhấn "Tạo biến thể" để đồng bộ với{" "}
                  {colors.length * storageOptions.length} biến thể từ các lựa
                  chọn hiện tại.
                </p>
              </div>
            )}
        </div>
      )}

      {/* Empty state */}
      {colors.length === 0 &&
        storageOptions.length === 0 &&
        data.variants.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="font-medium">Bắt đầu tạo biến thể</p>
            <p className="text-sm mt-1">
              Chọn màu sắc và dung lượng bộ nhớ để tự động tạo các biến thể sản
              phẩm
            </p>
          </div>
        )}
    </div>
  );
};
