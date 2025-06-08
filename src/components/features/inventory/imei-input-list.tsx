"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImeiInputListProps {
  imeiList: string[];
  onImeiChange: (index: number, value: string) => void;
  onAddImei: () => void;
  onRemoveImei: (index: number) => void;
  errors?: Record<number, string>;
  isLoading?: boolean;
}

const validateImei = (imei: string): boolean => {
  return imei.length === 15 && /^\d+$/.test(imei);
};

const checkDuplicateImei = (
  imeiList: string[],
  currentIndex: number
): boolean => {
  const currentImei = imeiList[currentIndex].trim();
  if (!currentImei) return false;

  return imeiList.some(
    (imei, index) => index !== currentIndex && imei.trim() === currentImei
  );
};

const getImeiErrorMessage = (
  imei: string,
  imeiList: string[],
  index: number,
  serverErrors: Record<number, string>
): string | null => {
  // Check server errors first
  if (serverErrors[index]) {
    return serverErrors[index];
  }

  // Check if IMEI is empty
  if (!imei.trim()) {
    return null;
  }

  // Check duplicate
  if (checkDuplicateImei(imeiList, index)) {
    return "IMEI này đã được nhập ở trên";
  }

  // Check format
  if (!validateImei(imei.trim())) {
    return "IMEI phải có đúng 15 chữ số";
  }

  return null;
};

export function ImeiInputList({
  imeiList,
  onImeiChange,
  onAddImei,
  onRemoveImei,
  errors = {},
  isLoading = false,
}: ImeiInputListProps) {
  const validImeiCount = imeiList.filter((imei) => {
    const trimmedImei = imei.trim();
    return trimmedImei && validateImei(trimmedImei);
  }).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Danh sách IMEI/Serial
          <Button
            variant="outline"
            size="sm"
            onClick={onAddImei}
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-1" />
            Thêm IMEI
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {imeiList.map((imei, index) => {
            const errorMessage = getImeiErrorMessage(
              imei,
              imeiList,
              index,
              errors
            );
            const hasError = !!errorMessage;

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <Label htmlFor={`imei-${index}`} className="sr-only">
                      IMEI {index + 1}
                    </Label>
                    <Input
                      id={`imei-${index}`}
                      placeholder={`Nhập IMEI ${index + 1} (15 số)...`}
                      value={imei}
                      onChange={(e) => onImeiChange(index, e.target.value)}
                      maxLength={15}
                      className={hasError ? "border-red-500" : ""}
                      disabled={isLoading}
                    />
                  </div>
                  {imeiList.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveImei(index)}
                      className="text-red-500 hover:text-red-700"
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {hasError && (
                  <Alert variant="destructive" className="py-2">
                
                    <AlertDescription className="text-xs">
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="text-blue-800 font-medium">
                IMEI hợp lệ: {validImeiCount}/{imeiList.length}
              </p>
              <ul className="text-blue-600 space-y-1">
                <li>• Mỗi IMEI phải có đúng 15 chữ số</li>
                <li>• IMEI không được trùng lặp</li>
                <li>• IMEI phải là duy nhất trong hệ thống</li>
                <li>• Tồn kho sẽ được cập nhật tự động</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
