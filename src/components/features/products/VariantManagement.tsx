"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Smartphone,
  Eye,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FirebaseProduct as Product,
  FirebaseProductVariant as ProductVariant,
  CreateProductVariantInput,
} from "@/lib/firebase/models/product.model";

interface VariantManagementProps {
  variants: ProductVariant[];
  products: Product[];
  loading: boolean;
  onCreateVariant: (variant: CreateProductVariantInput) => Promise<void>;
  onUpdateVariant: (
    variantId: string,
    variant: Partial<ProductVariant>
  ) => Promise<void>;
  onDeleteVariant: (variantId: string) => Promise<void>;
  onViewVariant: (variant: ProductVariant) => void;
  submitting?: boolean;
}

// iPhone storage options
const STORAGE_OPTIONS = ["128GB", "256GB", "512GB", "1TB"];

// iPhone color options
const COLOR_OPTIONS = [
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

export default function VariantManagement({
  variants,
  products,
  loading,
  onCreateVariant,
  onUpdateVariant,
  onDeleteVariant,
  onViewVariant,
  submitting = false,
}: VariantManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );

  const [newVariant, setNewVariant] = useState<
    Partial<CreateProductVariantInput>
  >({
    productId: "",
    storageCapacity: "",
    colorName: "",
    retailPrice: 0,
    costPrice: 0,
    sku: "",
  });

  const filteredVariants = variants.filter(
    (variant) =>
      variant.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.colorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.storageCapacity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateVariant = async () => {
    if (
      newVariant.productId &&
      newVariant.colorName &&
      newVariant.storageCapacity &&
      newVariant.retailPrice
    ) {
      await onCreateVariant(newVariant as CreateProductVariantInput);
      setIsCreateDialogOpen(false);
      setNewVariant({
        productId: "",
        storageCapacity: "",
        colorName: "",
        retailPrice: 0,
        costPrice: 0,
        sku: "",
      });
    }
  };

  const handleUpdateVariant = async () => {
    if (selectedVariant) {
      await onUpdateVariant(selectedVariant.id, selectedVariant);
      setIsEditDialogOpen(false);
      setSelectedVariant(null);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa biến thể này?")) {
      await onDeleteVariant(variantId);
    }
  };

  // Generate SKU automatically
  const generateSKU = () => {
    const selectedProduct = products.find((p) => p.id === newVariant.productId);
    if (selectedProduct && newVariant.storageCapacity && newVariant.colorName) {
      const nameCode = selectedProduct.name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase();
      const storageCode = newVariant.storageCapacity
        .replace("GB", "")
        .replace("TB", "T");
      const colorCode = newVariant.colorName
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase();
      const sku = `${nameCode}-${storageCode}-${colorCode}`;
      setNewVariant((prev) => ({ ...prev, sku }));
    }
  };

  const getProductName = (productId: string) => {
    return products.find((p) => p.id === productId)?.name || "N/A";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Quản lý biến thể</h3>
          <p className="text-gray-600">Quản lý các biến thể sản phẩm</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={submitting}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm biến thể
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Thêm biến thể mới</DialogTitle>
              <DialogDescription>
                Tạo biến thể mới cho sản phẩm
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="productId">Sản phẩm *</Label>
                <Select
                  value={newVariant.productId}
                  onValueChange={(value) =>
                    setNewVariant({ ...newVariant, productId: value, sku: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn sản phẩm" />
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
              <div>
                <Label htmlFor="storage">Dung lượng *</Label>
                <Select
                  value={newVariant.storageCapacity}
                  onValueChange={(value) =>
                    setNewVariant({ ...newVariant, storageCapacity: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn dung lượng" />
                  </SelectTrigger>
                  <SelectContent>
                    {STORAGE_OPTIONS.map((storage) => (
                      <SelectItem key={storage} value={storage}>
                        {storage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="color">Màu sắc *</Label>
                <Select
                  value={newVariant.colorName}
                  onValueChange={(value) =>
                    setNewVariant({ ...newVariant, colorName: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn màu sắc" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Giá bán (VNĐ) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={newVariant.retailPrice || ""}
                  onChange={(e) =>
                    setNewVariant({
                      ...newVariant,
                      retailPrice: Number(e.target.value),
                    })
                  }
                  placeholder="34990000"
                />
              </div>
              <div>
                <Label htmlFor="costPrice">Giá nhập (VNĐ) *</Label>
                <Input
                  id="costPrice"
                  type="number"
                  value={newVariant.costPrice}
                  onChange={(e) =>
                    setNewVariant({
                      ...newVariant,
                      costPrice: Number(e.target.value),
                    })
                  }
                  placeholder="31000000"
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <div className="flex gap-2">
                  <Input
                    id="sku"
                    value={newVariant.sku}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, sku: e.target.value })
                    }
                    placeholder="IP15PM-256-TN"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSKU}
                    disabled={
                      !newVariant.productId ||
                      !newVariant.storageCapacity ||
                      !newVariant.colorName
                    }
                  >
                    Tự động
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreateVariant}
                disabled={
                  submitting ||
                  !newVariant.productId ||
                  !newVariant.storageCapacity ||
                  !newVariant.colorName
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  "Tạo biến thể"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Danh sách biến thể</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm biến thể..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Đang tải...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVariants.map((variant) => (
                <div key={variant.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {getProductName(variant.productId)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {variant.storageCapacity} - {variant.colorName}
                        </p>
                        <p className="text-xs text-gray-400">
                          SKU: {variant.sku}
                        </p>
                        <p className="text-xs text-gray-400">
                          Giá: {variant.retailPrice.toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewVariant(variant)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedVariant(variant);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteVariant(variant.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredVariants.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  Không tìm thấy biến thể nào
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa biến thể</DialogTitle>
            <DialogDescription>Cập nhật thông tin biến thể</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Sản phẩm</Label>
              <Select
                value={selectedVariant?.productId}
                onValueChange={(value) =>
                  setSelectedVariant((prev) =>
                    prev
                      ? {
                          ...prev,
                          productId: value,
                          sku: "",
                        }
                      : null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn sản phẩm" />
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
            <div>
              <Label>Dung lượng</Label>
              <Select
                value={selectedVariant?.storageCapacity}
                onValueChange={(value) =>
                  setSelectedVariant((prev) =>
                    prev
                      ? {
                          ...prev,
                          storageCapacity: value,
                        }
                      : null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn dung lượng" />
                </SelectTrigger>
                <SelectContent>
                  {STORAGE_OPTIONS.map((storage) => (
                    <SelectItem key={storage} value={storage}>
                      {storage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Màu sắc</Label>
              <Select
                value={selectedVariant?.colorName}
                onValueChange={(value) =>
                  setSelectedVariant((prev) =>
                    prev
                      ? {
                          ...prev,
                          colorName: value,
                        }
                      : null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn màu sắc" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Giá bán (VNĐ)</Label>
              <Input
                type="number"
                value={selectedVariant?.retailPrice}
                onChange={(e) =>
                  setSelectedVariant((prev) =>
                    prev
                      ? {
                          ...prev,
                          retailPrice: Number(e.target.value),
                        }
                      : null
                  )
                }
              />
            </div>
            <div>
              <Label>Giá nhập (VNĐ)</Label>
              <Input
                type="number"
                value={selectedVariant?.costPrice}
                onChange={(e) =>
                  setSelectedVariant((prev) =>
                    prev
                      ? {
                          ...prev,
                          costPrice: Number(e.target.value),
                        }
                      : null
                  )
                }
              />
            </div>
            <div>
              <Label>SKU</Label>
              <Input
                value={selectedVariant?.sku}
                onChange={(e) =>
                  setSelectedVariant((prev) =>
                    prev
                      ? {
                          ...prev,
                          sku: e.target.value,
                        }
                      : null
                  )
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button onClick={handleUpdateVariant} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
