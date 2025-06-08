"use client";

import { Button } from "@/components/ui/button";
import { ImageIcon, Upload } from "lucide-react";
import type { NewProductForm } from "../CreateProductForm";

interface ProductImagesStepProps {
  data: NewProductForm;
  onChange: (updates: Partial<NewProductForm>) => void;
}

export const ProductImagesStep = ({
  data,
  onChange,
}: ProductImagesStepProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Hình ảnh sản phẩm</h3>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 mb-4">
          Kéo thả hình ảnh vào đây hoặc click để chọn
        </p>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Chọn hình ảnh
        </Button>
      </div>

      <p className="text-sm text-gray-500">
        Hỗ trợ: JPG, PNG, WebP. Kích thước tối đa: 5MB. Khuyến nghị: 800x800px
      </p>

      <div className="space-y-4">
        <h4 className="font-medium">Tóm tắt sản phẩm</h4>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Tên sản phẩm:</span>
              <p className="font-medium">{data.name || "Chưa nhập"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Thương hiệu:</span>
              <p className="font-medium">{data.brand}</p>
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500">Mô tả:</span>
            <p className="text-sm">{data.description || "Chưa nhập"}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Số biến thể:</span>
            <p className="font-medium">{data.variants.length} biến thể</p>
          </div>
          {/* Update price range display */}
          <div>
            <span className="text-sm text-gray-500">Giá từ:</span>
            <p className="font-medium text-blue-600">
              {Math.min(
                ...data.variants.map((v) => v.retailPrice || 0)
              ).toLocaleString("vi-VN")}
              ₫ -{" "}
              {Math.max(
                ...data.variants.map((v) => v.retailPrice || 0)
              ).toLocaleString("vi-VN")}
              ₫
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
