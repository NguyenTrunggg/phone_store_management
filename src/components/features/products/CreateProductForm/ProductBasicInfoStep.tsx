"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NewProductForm } from "../CreateProductForm";

interface ProductBasicInfoStepProps {
  data: NewProductForm;
  onChange: (updates: Partial<NewProductForm>) => void;
}

export const ProductBasicInfoStep = ({
  data,
  onChange,
}: ProductBasicInfoStepProps) => {
  const [newTag, setNewTag] = useState("");

  const addTag = () => {
    if (newTag.trim() && !data.tags.includes(newTag.trim())) {
      onChange({
        tags: [...data.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    const newTags = data.tags.filter((_, i) => i !== index);
    onChange({ tags: newTags });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Thông tin cơ bản</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Tên sản phẩm *</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="iPhone 15 Pro Max"
          />
        </div>
        <div>
          <Label htmlFor="brand">Thương hiệu</Label>
          <Select
            value={data.brand}
            onValueChange={(value) => onChange({ brand: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Apple">Apple</SelectItem>
              <SelectItem value="Samsung">Samsung</SelectItem>
              <SelectItem value="Xiaomi">Xiaomi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Danh mục</Label>
          <Select
            value={data.category}
            onValueChange={(value) => onChange({ category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Điện thoại di động">
                Điện thoại di động
              </SelectItem>
              <SelectItem value="Tablet">Tablet</SelectItem>
              <SelectItem value="Phụ kiện">Phụ kiện</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Mô tả sản phẩm *</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Mô tả chi tiết về sản phẩm..."
          rows={3}
        />
      </div>

      {/* Tags section */}
      <div className="space-y-3">
        <Label>Từ khóa sản phẩm</Label>
        <div className="flex flex-wrap gap-2">
          {data.tags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag}
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-500"
                onClick={() => removeTag(index)}
              />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Thêm từ khóa mới..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addTag()}
          />
          <Button variant="outline" onClick={addTag} disabled={!newTag.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={data.isActive}
          onCheckedChange={(checked) => onChange({ isActive: checked })}
        />
        <Label>Kích hoạt sản phẩm</Label>
      </div>
    </div>
  );
};
