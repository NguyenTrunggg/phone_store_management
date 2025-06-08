"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Smartphone,
  Package,
  Eye,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Import service
import { productService } from "@/lib/firebase/services/product.service";
import { useAuth } from "@/contexts/AuthContext";

// Import types from models
import {
  FirebaseProduct as Product,
  FirebaseProductVariant as ProductVariant,
  ProductWithVariants,
  ProductSearchFilters,
  CreateProductInput,
  CreateProductVariantInput,
  UpdateProductInput,
} from "@/lib/firebase/models/product.model";

// Import components
import {
  CreateProductForm,
  type ProductFormData as NewProductForm,
} from "@/components/features/products/CreateProductForm";

export default function ProductManagement() {
  // State management
  const { getSession, user, initializing } = useAuth();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [imeiRecords, setImeiRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [imeiLoading, setImeiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { toast } = useToast();

  // Load products on component mount
  useEffect(() => {
    loadProducts();
    loadVariants();
    loadIMEIRecords();
  }, []);

  // Load products from service
  const loadProducts = async (filters?: ProductSearchFilters) => {
    try {
      setLoading(true);
      const result = await productService.searchProducts(filters);

      if (result.success && result.data) {
        // Load variants for each product
        const productsWithVariants: ProductWithVariants[] = [];

        for (const product of result.data) {
          const productWithVariantsResult =
            await productService.getProductWithVariants(product.id);
          if (
            productWithVariantsResult.success &&
            productWithVariantsResult.data
          ) {
            productsWithVariants.push(productWithVariantsResult.data);
          }
        }

        setProducts(productsWithVariants);
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Không thể tải danh sách sản phẩm",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi tải dữ liệu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load all variants
  const loadVariants = async () => {
    try {
      setVariantsLoading(true);
      const result = await productService.searchVariants();

      if (result.success && result.data) {
        setVariants(result.data);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách biến thể",
        variant: "destructive",
      });
    } finally {
      setVariantsLoading(false);
    }
  };

  // Load IMEI records (mock for now)
  const loadIMEIRecords = async () => {
    try {
      setImeiLoading(true);
      // Mock data for now - replace with actual service call
      setImeiRecords([]);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách IMEI",
        variant: "destructive",
      });
    } finally {
      setImeiLoading(false);
    }
  };

  // Handle product creation and editing with unified handler
  const handleProductSubmit = async (
    formData: NewProductForm,
    productId?: string
  ) => {
    if (formMode === "edit" && productId) {
      await handleEditProduct(productId, formData);
    } else {
      await handleCreateProduct(formData);
    }
  };

  // Handle product creation
  const handleCreateProduct = async (formData: NewProductForm) => {
    try {
      setSubmitting(true);

      // Validate form data first
      if (!formData.name?.trim() || !formData.description?.trim()) {
        toast({
          title: "Lỗi",
          description: "Vui lòng điền đầy đủ thông tin cơ bản!",
          variant: "destructive",
        });
        return;
      }

      // Validate variants with more detailed checks
      if (!formData.variants || formData.variants.length === 0) {
        toast({
          title: "Lỗi",
          description: "Vui lòng tạo ít nhất một biến thể!",
          variant: "destructive",
        });
        return;
      }

      // Check each variant individually
      const invalidVariants = formData.variants.filter(
        (v) =>
          !v.storageCapacity?.trim() ||
          !v.colorName?.trim() ||
          !v.retailPrice ||
          v.retailPrice <= 0
      );

      if (invalidVariants.length > 0) {
        toast({
          title: "Lỗi",
          description: `${invalidVariants.length} biến thể không hợp lệ. Vui lòng kiểm tra lại thông tin!`,
          variant: "destructive",
        });
        return;
      }

      console.log("Creating product with form data:", formData);

      const currentUserId = getSession()?.user.uid;
      console.log("Current user ID:", currentUserId);

      // Create product first - only pass defined values
      const productInput: CreateProductInput = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        brand: formData.brand?.trim() || "Apple",
        category: formData.category?.trim() || "Điện thoại di động",
      };

      // Only add tags if they exist and are not empty
      if (formData.tags && formData.tags.length > 0) {
        productInput.tags = formData.tags.filter((tag) => tag.trim());
      }

      console.log("Creating product with input:", productInput);
      const productResult = await productService.createProduct(
        productInput,
        currentUserId
      );

      if (!productResult.success) {
        console.error("Product creation failed:", productResult);
        toast({
          title: "Lỗi",
          description: productResult.error || "Không thể tạo sản phẩm",
          variant: "destructive",
        });
        return;
      }

      const productId = productResult.data!.id;
      console.log("Product created successfully with ID:", productId);

      // Create variants with better error handling
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const [index, variantInput] of formData.variants.entries()) {
        console.log(
          `Creating variant ${index + 1}/${formData.variants.length}:`,
          variantInput
        );

        try {
          // Clean up variant input to avoid undefined values
          const cleanVariantInput: CreateProductVariantInput = {
            productId,
            colorName: variantInput.colorName.trim(),
            storageCapacity: variantInput.storageCapacity.trim(),
            retailPrice: variantInput.retailPrice,
          };

          // Only add optional fields if they have values
          if (variantInput.sku?.trim()) {
            cleanVariantInput.sku = variantInput.sku.trim();
          }

          console.log("Clean variant input:", cleanVariantInput);

          const variantResult = await productService.createVariant(
            productId,
            variantInput,
            currentUserId
          );

          if (!variantResult.success) {
            console.error(
              `Variant creation failed for variant ${index + 1}:`,
              variantResult
            );
            failCount++;
            errors.push(
              `${variantInput.colorName} ${variantInput.storageCapacity}: ${variantResult.error}`
            );
          } else {
            console.log(
              `Variant ${index + 1} created successfully:`,
              variantResult.data
            );
            successCount++;
          }
        } catch (variantError) {
          console.error(
            `Exception creating variant ${index + 1}:`,
            variantError
          );
          failCount++;
          errors.push(
            `${variantInput.colorName} ${variantInput.storageCapacity}: Lỗi không xác định`
          );
        }
      }

      // Show results
      if (successCount > 0) {
        toast({
          title: "Thành công",
          description: `Tạo sản phẩm thành công với ${successCount} biến thể${
            failCount > 0 ? ` (${failCount} biến thể thất bại)` : ""
          }!`,
        });

        await loadProducts();
        await loadVariants();
      } else {
        toast({
          title: "Lỗi",
          description: `Không thể tạo biến thể nào cho sản phẩm. Lỗi: ${errors
            .slice(0, 2)
            .join(", ")}${errors.length > 2 ? "..." : ""}`,
          variant: "destructive",
        });
      }

      // Show detailed errors if any
      if (errors.length > 0) {
        console.error("Variant creation errors:", errors);
      }
    } catch (error) {
      console.error("Product creation error:", error);
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi tạo sản phẩm",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setIsProductFormOpen(false);
    }
  };

  // Handle product editing
  const handleEditProduct = async (
    productId: string,
    formData: NewProductForm
  ) => {
    try {
      setSubmitting(true);

      // Validate form data
      if (!formData.name?.trim() || !formData.description?.trim()) {
        toast({
          title: "Lỗi",
          description: "Vui lòng điền đầy đủ thông tin cơ bản!",
          variant: "destructive",
        });
        return;
      }

      console.log("Updating product with form data:", formData);

      const currentUserId = getSession()?.user.uid;
      console.log("Current user ID:", currentUserId);

      // Prepare update data
      const updateInput: UpdateProductInput = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        brand: formData.brand?.trim(),
        category: formData.category?.trim(),
        isActive: formData.isActive,
      };

      // Only add tags if they exist and are not empty
      if (formData.tags && formData.tags.length > 0) {
        updateInput.tags = formData.tags.filter((tag) => tag.trim());
      }

      console.log("Updating product with input:", updateInput);
      const productResult = await productService.updateProduct(
        productId,
        updateInput,
        currentUserId
      );

      if (!productResult.success) {
        console.error("Product update failed:", productResult);
        toast({
          title: "Lỗi",
          description: productResult.error || "Không thể cập nhật sản phẩm",
          variant: "destructive",
        });
        return;
      }

      console.log("Product updated successfully");

      // Process variants in edit mode
      if (formData.variants && formData.variants.length > 0) {
        console.log("Processing variants for edit:", formData.variants);

        // Get existing variants to compare
        const existingVariantsResult =
          await productService.getVariantsByProductId(productId);
        const existingVariants = existingVariantsResult.success
          ? existingVariantsResult.data || []
          : [];

        console.log("Existing variants:", existingVariants);

        let variantSuccessCount = 0;
        let variantFailCount = 0;
        const variantErrors: string[] = [];

        for (const [index, variantData] of formData.variants.entries()) {
          console.log(
            `Processing variant ${index + 1}/${formData.variants.length}:`,
            variantData
          );

          try {
            // Validate variant data
            if (
              !variantData.colorName?.trim() ||
              !variantData.storageCapacity?.trim() ||
              !variantData.retailPrice ||
              variantData.retailPrice <= 0
            ) {
              console.error(
                `Variant ${index + 1} validation failed:`,
                variantData
              );
              variantFailCount++;
              variantErrors.push(
                `${variantData.colorName} ${variantData.storageCapacity}: Dữ liệu không hợp lệ`
              );
              continue;
            }

            // Check if this is an existing variant (has productId set) or a new one
            const isExistingVariant =
              variantData.productId && variantData.productId === productId;

            if (isExistingVariant) {
              // Find the existing variant by matching color and storage
              const existingVariant = existingVariants.find(
                (v) =>
                  v.colorName === variantData.colorName &&
                  v.storageCapacity === variantData.storageCapacity
              );

              if (existingVariant) {
                console.log(`Updating existing variant: ${existingVariant.id}`);

                // Prepare update data for existing variant
                const variantUpdateInput = {
                  retailPrice: variantData.retailPrice,
                  imageUrl: variantData.imageUrl,
                  attributes: variantData.attributes,
                  lowStockThreshold: variantData.lowStockThreshold,
                  reorderLevel: variantData.reorderLevel,
                };

                const updateResult = await productService.updateVariant(
                  productId,
                  existingVariant.id,
                  variantUpdateInput,
                  currentUserId
                );

                if (updateResult.success) {
                  console.log(`Variant ${index + 1} updated successfully`);
                  variantSuccessCount++;
                } else {
                  console.error(
                    `Variant ${index + 1} update failed:`,
                    updateResult
                  );
                  variantFailCount++;
                  variantErrors.push(
                    `${variantData.colorName} ${variantData.storageCapacity}: ${updateResult.error}`
                  );
                }
              } else {
                console.log(`Existing variant not found, creating new variant`);
                // Treat as new variant
                const createResult = await productService.createVariant(
                  productId,
                  {
                    ...variantData,
                    productId: productId,
                  },
                  currentUserId
                );

                if (createResult.success) {
                  console.log(`New variant ${index + 1} created successfully`);
                  variantSuccessCount++;
                } else {
                  console.error(
                    `New variant ${index + 1} creation failed:`,
                    createResult
                  );
                  variantFailCount++;
                  variantErrors.push(
                    `${variantData.colorName} ${variantData.storageCapacity}: ${createResult.error}`
                  );
                }
              }
            } else {
              // This is a new variant
              console.log(
                `Creating new variant: ${variantData.colorName} ${variantData.storageCapacity}`
              );

              const createResult = await productService.createVariant(
                productId,
                {
                  ...variantData,
                  productId: productId,
                },
                currentUserId
              );

              if (createResult.success) {
                console.log(`New variant ${index + 1} created successfully`);
                variantSuccessCount++;
              } else {
                console.error(
                  `New variant ${index + 1} creation failed:`,
                  createResult
                );
                variantFailCount++;
                variantErrors.push(
                  `${variantData.colorName} ${variantData.storageCapacity}: ${createResult.error}`
                );
              }
            }
          } catch (variantError) {
            console.error(
              `Exception processing variant ${index + 1}:`,
              variantError
            );
            variantFailCount++;
            variantErrors.push(
              `${variantData.colorName} ${variantData.storageCapacity}: Lỗi không xác định`
            );
          }
        }

        console.log("Variant processing completed:", {
          success: variantSuccessCount,
          failed: variantFailCount,
          errors: variantErrors,
        });

        // Show result message including variant updates
        if (variantSuccessCount > 0) {
          toast({
            title: "Thành công",
            description: `Cập nhật sản phẩm thành công${
              variantSuccessCount > 0
                ? ` với ${variantSuccessCount} biến thể`
                : ""
            }${
              variantFailCount > 0
                ? ` (${variantFailCount} biến thể thất bại)`
                : ""
            }!`,
          });
        } else if (variantFailCount > 0) {
          toast({
            title: "Cảnh báo",
            description: `Cập nhật sản phẩm thành công nhưng ${variantFailCount} biến thể thất bại. Lỗi: ${variantErrors
              .slice(0, 2)
              .join(", ")}${variantErrors.length > 2 ? "..." : ""}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Thành công",
            description: "Cập nhật sản phẩm thành công!",
          });
        }

        // Show detailed errors if any
        if (variantErrors.length > 0) {
          console.error("Variant processing errors:", variantErrors);
        }
      } else {
        toast({
          title: "Thành công",
          description: "Cập nhật sản phẩm thành công!",
        });
      }

      setIsProductFormOpen(false);
      setEditingProduct(null);
      setFormMode("create");
      await loadProducts();
    } catch (error) {
      console.error("Product update error:", error);
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi cập nhật sản phẩm",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open create dialog
  const openCreateDialog = () => {
    setFormMode("create");
    setEditingProduct(null);
    setIsProductFormOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (product: Product) => {
    setFormMode("edit");
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  // Close dialog handler
  const closeProductForm = () => {
    setIsProductFormOpen(false);
    setEditingProduct(null);
    setFormMode("create");
  };

  // Variant management handlers
  const handleCreateVariant = async (variantData: any) => {
    try {
      setSubmitting(true);
      // Implementation for creating variant
      toast({
        title: "Thành công",
        description: "Tạo biến thể thành công!",
      });
      await loadVariants();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo biến thể",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateVariant = async (variantId: string, variantData: any) => {
    try {
      setSubmitting(true);
      // Implementation for updating variant
      toast({
        title: "Thành công",
        description: "Cập nhật biến thể thành công!",
      });
      await loadVariants();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật biến thể",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    try {
      setSubmitting(true);
      // Implementation for deleting variant
      toast({
        title: "Thành công",
        description: "Xóa biến thể thành công!",
      });
      await loadVariants();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa biến thể",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // IMEI management handlers
  const handleCreateIMEI = async (imeiData: any) => {
    try {
      setSubmitting(true);
      // Implementation for creating IMEI
      toast({
        title: "Thành công",
        description: "Thêm IMEI thành công!",
      });
      await loadIMEIRecords();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm IMEI",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateIMEI = async (imeiId: string, imeiData: any) => {
    try {
      setSubmitting(true);
      // Implementation for updating IMEI
      toast({
        title: "Thành công",
        description: "Cập nhật IMEI thành công!",
      });
      await loadIMEIRecords();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật IMEI",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIMEI = async (imeiId: string) => {
    try {
      setSubmitting(true);
      // Implementation for deleting IMEI
      toast({
        title: "Thành công",
        description: "Xóa IMEI thành công!",
      });
      await loadIMEIRecords();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa IMEI",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Search products
  const handleSearch = async () => {
    const filters: ProductSearchFilters = {
      searchTerm: searchTerm.trim() || undefined,
      isActive: true,
      sortBy: "name",
      sortOrder: "asc",
    };
    await loadProducts(filters);
  };

  // Filter products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Delete product
  const handleDeleteProduct = async (
    productId: string,
    productName: string
  ) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${productName}?`)) {
      return;
    }

    try {
      const result = await productService.delete(productId);

      if (result.success) {
        toast({
          title: "Thành công",
          description: "Xóa sản phẩm thành công!",
        });
        await loadProducts();
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Không thể xóa sản phẩm",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi xóa sản phẩm",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h2>
          <p className="text-gray-600">
            Quản lý danh mục sản phẩm iPhone và các biến thể
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm sản phẩm mới
        </Button>
      </div>

      {/* Unified Product Form Dialog */}
      <CreateProductForm
        isOpen={isProductFormOpen}
        onClose={closeProductForm}
        onSubmit={handleProductSubmit}
        submitting={submitting}
        mode={formMode}
        editProduct={editingProduct}
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Danh sách sản phẩm</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
              {filteredProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {product.brand} • {product.category}
                        </p>
                        <p className="text-xs text-gray-400">
                          Tạo ngày:{" "}
                          {product.createdAt
                            ?.toDate?.()
                            ?.toLocaleDateString?.() || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        <Package className="w-3 h-3 mr-1" />
                        {product.totalStock} chiếc
                      </Badge>
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}
                      >
                        {product.isActive ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() =>
                          handleDeleteProduct(product.id, product.name)
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-600">
                      {product.description}
                    </p>
                  </div>

                  {/* Variants */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {product.variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="bg-gray-50 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">
                              {variant.storageCapacity} - {variant.colorName}
                            </p>
                            <p className="text-xs text-gray-500">
                              SKU: {variant.sku}
                            </p>
                          </div>
                          <Badge
                            variant={
                              (variant.stockQuantity || 0) > 0
                                ? "default"
                                : "secondary"
                            }
                          >
                            {variant.stockQuantity || 0}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {filteredProducts.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  Không tìm thấy sản phẩm nào
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
