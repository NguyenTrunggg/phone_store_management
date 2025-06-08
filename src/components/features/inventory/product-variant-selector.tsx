"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductVariant {
  id: string;
  storageCapacity: string;
  colorName: string;
  sku: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  variants: ProductVariant[];
}

interface ProductVariantSelectorProps {
  products: Product[];
  selectedProductId: string;
  selectedVariantId: string;
  unitCost: number;
  onProductChange: (productId: string) => void;
  onVariantChange: (variantId: string) => void;
  onUnitCostChange: (cost: number) => void;
  isLoading?: boolean;
}

export function ProductVariantSelector({
  products,
  selectedProductId,
  selectedVariantId,
  unitCost,
  onProductChange,
  onVariantChange,
  onUnitCostChange,
  isLoading = false,
}: ProductVariantSelectorProps) {
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleProductChange = (productId: string) => {
    onProductChange(productId);
    onVariantChange(""); // Reset variant when product changes
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chọn sản phẩm và biến thể</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="product-select">Model sản phẩm</Label>
            <Select
              value={selectedProductId}
              onValueChange={handleProductChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn model..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variant-select">Biến thể</Label>
            <Select
              value={selectedVariantId}
              onValueChange={onVariantChange}
              disabled={!selectedProductId || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn biến thể..." />
              </SelectTrigger>
              <SelectContent>
                {selectedProduct?.variants.map((variant) => (
                  <SelectItem key={variant.id} value={variant.id}>
                    {variant.storageCapacity} - {variant.colorName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit-cost">Giá nhập (VNĐ)</Label>
          <Input
            id="unit-cost"
            type="number"
            placeholder="31000000"
            value={unitCost || ""}
            onChange={(e) => onUnitCostChange(Number(e.target.value))}
            disabled={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
