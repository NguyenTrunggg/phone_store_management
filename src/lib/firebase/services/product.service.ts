import {
  collection,
  collectionGroup,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BaseService, ServiceResponse } from "./base.service";
import { COLLECTIONS, SUBCOLLECTIONS } from "@/constants";

// Import product model types
import {
  FirebaseProduct as Product,
  FirebaseProductVariant as ProductVariant,
  CreateProductInput,
  CreateProductVariantInput,
  UpdateProductInput,
  UpdateProductVariantInput,
  ProductSearchFilters,
  ProductWithVariants,
  VariantWithProductInfo,
} from "@/lib/firebase/models/product.model";

// Define additional interfaces for backward compatibility
interface VariantSearchFilters {
  productId?: string;
  searchTerm?: string;
  colorName?: string;
  storageCapacity?: string;
  status?: string[];
  isActive?: boolean;
  hasStock?: boolean;
  priceMin?: number;
  priceMax?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Local validateSKU function - completely independent
function validateSKU(sku: string): boolean {
  if (!sku || typeof sku !== "string") {
    return false;
  }

  // SKU validation rules:
  // - Must be 3-20 characters long
  // - Can contain letters, numbers, hyphens, and underscores
  // - Must start with a letter or number
  // - Must end with a letter or number
  const skuPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{1,18}[A-Za-z0-9]$/;

  return skuPattern.test(sku.trim());
}

// =============================================================================
// PRODUCT SERVICE (UC01: Product Identification Management)
// Manages iPhone models, variants, and their relationships
// =============================================================================

class ProductService extends BaseService {
  constructor() {
    super(COLLECTIONS.PRODUCTS);
  }

  // =============================================================================
  // PRODUCT MANAGEMENT
  // =============================================================================

  /**
   * Create new iPhone model (UC01)
   */
  async createProduct(
    input: CreateProductInput,
    userId?: string
  ): Promise<ServiceResponse<Product>> {
    try {
      console.log("=== Product Creation Debug ===");
      console.log("Input:", input);
      console.log("User ID:", userId);
      // Validate required fields
      if (!input.name?.trim()) {
        return {
          success: false,
          error: "Tên sản phẩm không được để trống",
          errorCode: "INVALID_PRODUCT_NAME",
        };
      }

      // Check for duplicate product name
      console.log("Checking for duplicate product name:", input.name.trim());
      const existingProduct = await this.findProductByName(input.name.trim());
      if (existingProduct.success && existingProduct.data) {
        console.error("Duplicate product name found:", input.name.trim());
        return {
          success: false,
          error: "Tên sản phẩm đã tồn tại",
          errorCode: "DUPLICATE_PRODUCT_NAME",
        };
      }

      // Generate slug if not provided
      const slug =
        input.slug ||
        input.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .trim();
      console.log("Generated slug:", slug);

      // Build product data, excluding undefined fields
      const productData: Partial<Product> = {
        name: input.name.trim(),
        slug,
        // Computed fields (will be updated by Cloud Functions)
        totalVariants: 0,
        activeVariants: 0,
        totalStock: 0,
        averagePrice: 0,
        isActive: true,
      };

      // Conditionally add fields to avoid undefined values
      if (input.description)
        productData.description = input.description.trim();
      productData.brand = input.brand?.trim() || "Apple";
      productData.category = input.category?.trim() || "Smartphones";
      productData.tags = input.tags || [];
      productData.attributes = input.attributes || {};
      productData.images = []; // Start with empty images array

      // Only add optional fields if they have values
      if (input.baseImageUrl?.trim()) {
        productData.baseImageUrl = input.baseImageUrl.trim();
      }

      if (input.displayOrder !== undefined) {
        productData.displayOrder = input.displayOrder;
      }

      if (input.internalNotes?.trim()) {
        productData.internalNotes = input.internalNotes.trim();
      }

      console.log("Final product data to be saved:", productData);
      const result = await this.create<Product>(
        productData as Omit<Product, "id">,
        userId
      );
      console.log("Product creation result:", result);
      return result;
    } catch (error) {
      console.error("Error in createProduct:", error);
      return this.handleError(error);
    }
  }

  /**
   * Update existing product
   */
  async updateProduct(
    productId: string,
    input: UpdateProductInput,
    userId?: string
  ): Promise<ServiceResponse<Product>> {
    try {
      // Check if product exists
      const productExists = await this.exists(productId);
      if (!productExists.success || !productExists.data) {
        return {
          success: false,
          error: "Không tìm thấy sản phẩm",
          errorCode: "PRODUCT_NOT_FOUND",
        };
      }

      // If updating name, check for duplicates
      if (input.name) {
        const existingProduct = await this.findProductByName(input.name.trim());
        if (
          existingProduct.success &&
          existingProduct.data &&
          existingProduct.data.id !== productId
        ) {
          return {
            success: false,
            error: "Tên sản phẩm đã tồn tại",
            errorCode: "DUPLICATE_PRODUCT_NAME",
          };
        }
      }

      const updateData: Partial<Product> = {
        ...input,
        updatedAt: Timestamp.now(),
        updatedBy: userId,
      };

      if (input.name) {
        updateData.name = input.name.trim();
      }

      return await this.update<Product>(productId, updateData, userId);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get product with all variants
   */
  async getProductWithVariants(
    productId: string
  ): Promise<ServiceResponse<ProductWithVariants>> {
    try {
      // Get product
      const productResult = await this.getById<Product>(productId);
      if (!productResult.success) {
        return productResult as ServiceResponse<ProductWithVariants>;
      }

      // Get variants
      const variantsResult = await this.getVariantsByProductId(productId);
      if (!variantsResult.success) {
        return {
          success: false,
          error: "Không thể lấy thông tin biến thể sản phẩm",
          errorCode: "VARIANTS_FETCH_FAILED",
        };
      }

      const variants = variantsResult.data || [];
      const totalStock = variants.reduce(
        (sum, variant) => sum + variant.stockQuantity,
        0
      );

      const productWithVariants: ProductWithVariants = {
        ...productResult.data!,
        variants,
        totalStock,
      };

      return {
        success: true,
        data: productWithVariants,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get simplified product-variant data for dropdowns
   * Uses collection group query - more efficient than multiple queries
   */
  async getProductsWithVariantsForDropdown(): Promise<
    ServiceResponse<
      Array<{
         id: string;
         name: string;
         variants: Array<{
           id: string;
           storageCapacity: string;
           colorName: string;
           sku: string;
           price: number;
         }>;
      }>
    >
  > {
    try {
      console.log("=== Getting products with variants for dropdown ===");

      const productsQuery = query(
        collection(db,  COLLECTIONS.PRODUCTS),
        where("isActive", "==", true)
      );

      const productsSnapshot = await getDocs(productsQuery);
      console.log("Found products:", productsSnapshot.size);

      // ✅ Debug: Log ra từng product
      productsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Product ${index + 1}:`, {
          id: doc.id,
          name: data.name,
          isActive: data.isActive,
          allFields: data,
        });
      });

      const products = await Promise.all(
        productsSnapshot.docs.map(async (productDoc) => {
          const productData = productDoc.data();

          console.log(
            `\n=== Processing product: ${productData.name} (${productDoc.id}) ===`
          );

          try {
            const variantsQuery = query(
              collection(db, "products", productDoc.id, "variants"),
              where("isActive", "==", true)
            );

            console.log(
              `Query path: products/${productDoc.id}/variants`
            );

            const variantsSnapshot = await getDocs(variantsQuery);
            console.log(
              `Found ${variantsSnapshot.size} variants for ${productData.name}`
            );

            // ✅ Debug: Log ra từng variant
            if (variantsSnapshot.size === 0) {
              console.log(`❌ No variants found for ${productData.name}`);

              // Check if variants collection exists at all
              const allVariantsQuery = collection(
                db,
                "products",
                productDoc.id,
                "variants"
              );
              const allVariantsSnapshot = await getDocs(allVariantsQuery);
              console.log(
                `Total variants (ignoring isActive): ${allVariantsSnapshot.size}`
              );

              allVariantsSnapshot.docs.forEach((variantDoc, index) => {
                const variantData = variantDoc.data();
                console.log(`  Variant ${index + 1}:`, {
                  id: variantDoc.id,
                  isActive: variantData.isActive,
                  sku: variantData.sku,
                  colorName: variantData.colorName,
                  storageCapacity: variantData.storageCapacity,
                  allFields: variantData,
                });
              });
            } else {
              variantsSnapshot.docs.forEach((variantDoc, index) => {
                const variantData = variantDoc.data();
                console.log(`  Active Variant ${index + 1}:`, {
                  id: variantDoc.id,
                  sku: variantData.sku,
                  colorName: variantData.colorName,
                  storageCapacity: variantData.storageCapacity,
                  retailPrice: variantData.retailPrice,
                  isActive: variantData.isActive,
                });
              });
            }

            const variants = variantsSnapshot.docs.map((variantDoc) => {
              const variantData = variantDoc.data();

              console.log(`Processing variant ${variantDoc.id}:`, {
                storageCapacity: variantData.storageCapacity,
                colorName: variantData.colorName,
                sku: variantData.sku,
                retailPrice: variantData.retailPrice,
              });

              return {
                id: variantDoc.id,
                storageCapacity: variantData.storageCapacity || "Unknown",
                colorName: variantData.colorName || "Unknown",
                sku: variantData.sku || "NO-SKU",
                price: variantData.retailPrice || 0,
              };
            });
            

            console.log(`Final variants for ${productData.name}:`, variants);

            return {
              id: productDoc.id,
              name: productData.name,
              variants,
            };
          } catch (variantError) {
            console.error(
              `❌ Error loading variants for ${productData.name}:`,
              variantError
            );
            return {
              id: productDoc.id,
              name: productData.name,
              variants: [],
            };
          }
        })
      );

      console.log("\n=== All products before filtering ===");
      products.forEach((product, index) => {
        console.log(
          `Product ${index + 1}: ${product.name} - ${
            product.variants.length
          } variants`
        );
      });

      // Filter out products with no variants
      const productsWithVariants = products.filter(
        (p) => p.variants.length > 0
      );

      console.log("\n=== Products after filtering (with variants only) ===");
      console.log(
        `Filtered: ${productsWithVariants.length}/${products.length} products`
      );
      productsWithVariants.forEach((product, index) => {
        console.log(
          `Product ${index + 1}: ${product.name} - ${
            product.variants.length
          } variants`
        );
      });

      return {
        success: true,
        data: productsWithVariants,
      };
    } catch (error) {
      console.error(
        "❌ Error getting products with variants for dropdown:",
        error
      );
      return this.handleError(error);
    }
  }

  /**
   * Search products with filters
   */
  async searchProducts(
    filters: ProductSearchFilters = {}
  ): Promise<ServiceResponse<Product[]>> {
    try {
      const constraints: any[] = [];

      // Base filter for active products
      if (filters.isActive !== undefined) {
        constraints.push(where("isActive", "==", filters.isActive));
      }

      // Brand filter
      if (filters.brand) {
        constraints.push(where("brand", "==", filters.brand));
      }

      // Category filter
      if (filters.category) {
        constraints.push(where("category", "==", filters.category));
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        constraints.push(where("tags", "array-contains-any", filters.tags));
      }

      // Sorting
      const sortBy = filters.sortBy || "name";
      const sortOrder = filters.sortOrder || "asc";
      constraints.push(orderBy(sortBy, sortOrder));

      const q = query(this.collectionRef, ...constraints);
      const snapshot = await getDocs(q);

      let products = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Product)
      );

      // Client-side filtering for search term (Firestore limitation)
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        products = products.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description?.toLowerCase().includes(searchTerm) ||
            product.tags?.some((tag) => tag.toLowerCase().includes(searchTerm))
        );
      }

      return {
        success: true,
        data: products,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Find product by name
   */
  private async findProductByName(
    name: string
  ): Promise<ServiceResponse<Product | null>> {
    try {
      const q = query(this.collectionRef, where("name", "==", name));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return {
          success: true,
          data: null,
        };
      }

      const doc = snapshot.docs[0];
      return {
        success: true,
        data: {
          id: doc.id,
          ...doc.data(),
        } as Product,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // =============================================================================
  // VARIANT MANAGEMENT
  // =============================================================================

  /**
   * Create product variant (UC01)
   */
  async createVariant(
    productId: string,
    input: CreateProductVariantInput,
    userId: string = "system"
  ): Promise<ServiceResponse<ProductVariant>> {
    try {
      console.log("=== Variant Creation Debug ===");
      console.log("Product ID:", productId);
      console.log("Input:", input);
      console.log("User ID (fixed):", userId);

      // Generate SKU if not provided
      const sku =
        input.sku || this.generateSKU(input.colorName, input.storageCapacity);

      console.log("Generated/Provided SKU:", sku);

      // Validate required fields
      if (!sku?.trim()) {
        console.error("SKU validation failed - empty SKU:", sku);
        return {
          success: false,
          error: "Mã SKU không được để trống",
          errorCode: "INVALID_SKU",
        };
      }

      // Use local validateSKU function - completely independent call
      console.log("Validating SKU format:", sku.trim());
      let isValidSKU: boolean;
      try {
        isValidSKU = validateSKU(sku.trim());
        console.log("SKU validation result:", isValidSKU);
      } catch (validationError) {
        console.error("SKU validation function error:", validationError);
        return {
          success: false,
          error: "Lỗi kiểm tra định dạng SKU",
          errorCode: "SKU_VALIDATION_ERROR",
        };
      }

      if (!isValidSKU) {
        console.error("SKU format validation failed:", sku);
        return {
          success: false,
          error: `Mã SKU không đúng định dạng: ${sku}`,
          errorCode: "INVALID_SKU_FORMAT",
        };
      }

      if (!input.colorName?.trim() || !input.storageCapacity?.trim()) {
        console.error("Color/Storage validation failed:", {
          colorName: input.colorName,
          storageCapacity: input.storageCapacity,
        });
        return {
          success: false,
          error: "Màu sắc và dung lượng không được để trống",
          errorCode: "INVALID_VARIANT_INFO",
        };
      }

      if (!input.retailPrice || input.retailPrice <= 0) {
        console.error("Price validation failed:", input.retailPrice);
        return {
          success: false,
          error: "Giá sản phẩm phải lớn hơn 0",
          errorCode: "INVALID_PRICE",
        };
      }

      // Check if product exists
      console.log("Checking if product exists:", productId);
      const productExists = await this.exists(productId);
      console.log("Product exists result:", productExists);

      if (!productExists.success || !productExists.data) {
        console.error("Product not found:", productId);
        return {
          success: false,
          error: "Không tìm thấy sản phẩm",
          errorCode: "PRODUCT_NOT_FOUND",
        };
      }

      // Check for duplicate SKU globally
      console.log("Checking for duplicate SKU:", sku.trim());
      const existingVariant = await this.findVariantBySKU(sku.trim());
      console.log("Existing variant check result:", existingVariant);

      if (existingVariant.success && existingVariant.data) {
        console.error("Duplicate SKU found:", sku);
        return {
          success: false,
          error: `Mã SKU đã tồn tại: ${sku}`,
          errorCode: "DUPLICATE_SKU",
        };
      }

      // Check for duplicate variant in same product
      console.log("Checking for duplicate variant in product:", productId);
      const duplicateVariant = await this.findVariantByProductAndAttributes(
        productId,
        input.colorName.trim(),
        input.storageCapacity.trim()
      );
      console.log("Duplicate variant check result:", duplicateVariant);

      if (duplicateVariant.success && duplicateVariant.data) {
        console.error("Duplicate variant found in product:", {
          productId,
          colorName: input.colorName,
          storageCapacity: input.storageCapacity,
        });
        return {
          success: false,
          error: "Biến thể sản phẩm đã tồn tại",
          errorCode: "DUPLICATE_VARIANT",
        };
      }

      // Build variant data, excluding undefined fields
      const variantData: Omit<ProductVariant, "id"> = {
        productId,
        sku: sku.trim().toUpperCase(),
        colorName: input.colorName.trim(),
        storageCapacity: input.storageCapacity.trim(),
        retailPrice: input.retailPrice,
        status: "active",
        isActive: true,
        isFeatured: false,
        attributes: input.attributes || {},

        // Inventory fields
        stockQuantity: 0,
        reservedQuantity: 0,
        soldQuantity: 0,
        totalQuantity: 0,

        // Thresholds
        lowStockThreshold: input.lowStockThreshold || 5,
        reorderLevel: input.reorderLevel || 10,

        // Tracking
        lastStockUpdate: Timestamp.now(),

        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId,
        updatedBy: userId,
      };

      // Only add optional fields if they have values
      if (input.costPrice !== undefined && input.costPrice >= 0) {
        variantData.costPrice = input.costPrice;
      }

      if (input.colorHex?.trim()) {
        variantData.colorHex = input.colorHex.trim();
      }

      if (input.originalPrice !== undefined && input.originalPrice > 0) {
        variantData.originalPrice = input.originalPrice;
      }

      if (input.imageUrl?.trim()) {
        variantData.imageUrl = input.imageUrl.trim();
      }

      if (input.appleModelNumber?.trim()) {
        variantData.appleModelNumber = input.appleModelNumber.trim();
      }

      if (input.applePartNumber?.trim()) {
        variantData.applePartNumber = input.applePartNumber.trim();
      }

      if (input.launchDate) {
        variantData.launchDate = Timestamp.fromDate(input.launchDate);
      }

      if (input.displayOrder !== undefined) {
        variantData.displayOrder = input.displayOrder;
      }

      console.log("Final variant data to be saved:", variantData);

      // Create in variants subcollection
      const variantsCollection = collection(
        db,
        COLLECTIONS.PRODUCTS,
        productId,
        SUBCOLLECTIONS.VARIANTS
      );

      console.log("Adding variant to collection:", variantsCollection.path);
      const docRef = await addDoc(variantsCollection, variantData);
      console.log("Variant document created with ID:", docRef.id);

      const newDoc = await getDoc(docRef);

      if (!newDoc.exists()) {
        console.error("Failed to retrieve created variant document");
        return {
          success: false,
          error: "Không thể tạo biến thể sản phẩm",
          errorCode: "VARIANT_CREATE_FAILED",
        };
      }

      const createdVariant = {
        id: newDoc.id,
        ...newDoc.data(),
      } as ProductVariant;

      console.log("Variant created successfully:", createdVariant);

      return {
        success: true,
        data: createdVariant,
      };
    } catch (error) {
      console.error("Error in createVariant:", error);
      return this.handleError(error);
    }
  }

  /**
   * Update variant
   */
  async updateVariant(
    productId: string,
    variantId: string,
    input: UpdateProductVariantInput,
    userId?: string
  ): Promise<ServiceResponse<ProductVariant>> {
    try {
      // Validate SKU if provided
      if (input.sku && !validateSKU(input.sku.trim())) {
        return {
          success: false,
          error: "Mã SKU không đúng định dạng",
          errorCode: "INVALID_SKU_FORMAT",
        };
      }

      // Validate price if provided
      if (input.retailPrice !== undefined && input.retailPrice <= 0) {
        return {
          success: false,
          error: "Giá sản phẩm phải lớn hơn 0",
          errorCode: "INVALID_PRICE",
        };
      }

      // Check if updating SKU, ensure no duplicates
      if (input.sku) {
        const existingVariant = await this.findVariantBySKU(input.sku.trim());
        if (
          existingVariant.success &&
          existingVariant.data &&
          existingVariant.data.id !== variantId
        ) {
          return {
            success: false,
            error: "Mã SKU đã tồn tại",
            errorCode: "DUPLICATE_SKU",
          };
        }
      }

      const variantRef = doc(
        db,
        COLLECTIONS.PRODUCTS,
        productId,
        SUBCOLLECTIONS.VARIANTS,
        variantId
      );

      const updateData: Partial<ProductVariant> = {
        ...input,
        updatedAt: Timestamp.now(),
        updatedBy: userId,
      };

      if (input.sku) {
        updateData.sku = input.sku.trim().toUpperCase();
      }

      await updateDoc(variantRef, updateData);

      const updatedDoc = await getDoc(variantRef);
      if (!updatedDoc.exists()) {
        return {
          success: false,
          error: "Không thể cập nhật biến thể sản phẩm",
          errorCode: "VARIANT_UPDATE_FAILED",
        };
      }

      return {
        success: true,
        data: {
          id: updatedDoc.id,
          ...updatedDoc.data(),
        } as ProductVariant,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get all variants for a product
   */
  async getVariantsByProductId(
    productId: string
  ): Promise<ServiceResponse<ProductVariant[]>> {
    try {
      const variantsCollection = collection(
        db,
        COLLECTIONS.PRODUCTS,
        productId,
        SUBCOLLECTIONS.VARIANTS
      );
      const q = query(variantsCollection, orderBy("sku", "asc"));
      const snapshot = await getDocs(q);

      const variants = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as ProductVariant)
      );

      return {
        success: true,
        data: variants,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get variant by ID
   */
  async getVariantById(
    productId: string,
    variantId: string
  ): Promise<ServiceResponse<ProductVariant>> {
    try {
      const variantRef = doc(
        db,
        COLLECTIONS.PRODUCTS,
        productId,
        SUBCOLLECTIONS.VARIANTS,
        variantId
      );
      const variantDoc = await getDoc(variantRef);

      if (!variantDoc.exists()) {
        return {
          success: false,
          error: "Không tìm thấy biến thể sản phẩm",
          errorCode: "VARIANT_NOT_FOUND",
        };
      }

      return {
        success: true,
        data: {
          id: variantDoc.id,
          ...variantDoc.data(),
        } as ProductVariant,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Search variants with filters
   */
  async searchVariants(
    filters: VariantSearchFilters = {}
  ): Promise<ServiceResponse<ProductVariant[]>> {
    try {
      let results: ProductVariant[] = [];

      if (filters.productId) {
        // Search within specific product
        const variantsResult = await this.getVariantsByProductId(
          filters.productId
        );
        if (variantsResult.success) {
          results = variantsResult.data || [];
        }
      } else {
        // Search across all products using collection group query
        const variantsCollectionGroup = collection(db, SUBCOLLECTIONS.VARIANTS);
        const q = query(variantsCollectionGroup, orderBy("sku", "asc"));
        const snapshot = await getDocs(q);

        results = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as ProductVariant)
        );
      }

      // Apply client-side filters
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        results = results.filter(
          (variant) =>
            variant.sku.toLowerCase().includes(searchTerm) ||
            variant.colorName.toLowerCase().includes(searchTerm) ||
            variant.storageCapacity.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.colorName) {
        results = results.filter(
          (variant) => variant.colorName === filters.colorName
        );
      }

      if (filters.storageCapacity) {
        results = results.filter(
          (variant) => variant.storageCapacity === filters.storageCapacity
        );
      }

      if (filters.status && filters.status.length > 0) {
        results = results.filter((variant) =>
          filters.status!.includes(variant.status)
        );
      }

      if (filters.isActive !== undefined) {
        results = results.filter(
          (variant) => variant.isActive === filters.isActive
        );
      }

      if (filters.hasStock) {
        results = results.filter((variant) => variant.stockQuantity > 0);
      }

      if (filters.priceMin !== undefined) {
        results = results.filter((variant) => {
          if (variant.originalPrice === undefined) {
            return false; // Skip variants without price
          }
          return variant.originalPrice >= filters.priceMin!;
        });
      }

      if (filters.priceMax !== undefined) {
        results = results.filter((variant) => {
          if (variant.originalPrice === undefined) {
            return false; // Skip variants without price
          }
          return variant.originalPrice <= filters.priceMax!;
        });
      }

      // Apply sorting
      if (filters.sortBy) {
        const sortField = filters.sortBy;
        const sortOrder = filters.sortOrder || "asc";

        results.sort((a, b) => {
          const aVal = a[sortField as keyof ProductVariant] ?? "";
          const bVal = b[sortField as keyof ProductVariant] ?? "";

          if (sortOrder === "asc") {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });
      }

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Find variant by SKU
   */
  async findVariantBySKU(
    sku: string
  ): Promise<ServiceResponse<ProductVariant | null>> {
    try {
      // Use collection group query to search across all variants
      const variantsCollectionGroup = collection(db, SUBCOLLECTIONS.VARIANTS);
      const q = query(
        variantsCollectionGroup,
        where("sku", "==", sku.toUpperCase())
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return {
          success: true,
          data: null,
        };
      }

      const doc = snapshot.docs[0];
      return {
        success: true,
        data: {
          id: doc.id,
          ...doc.data(),
        } as ProductVariant,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Find variant by product and attributes
   */
  private async findVariantByProductAndAttributes(
    productId: string,
    colorName: string,
    storageCapacity: string
  ): Promise<ServiceResponse<ProductVariant | null>> {
    try {
      const variantsCollection = collection(
        db,
        COLLECTIONS.PRODUCTS,
        productId,
        SUBCOLLECTIONS.VARIANTS
      );
      const q = query(
        variantsCollection,
        where("colorName", "==", colorName),
        where("storageCapacity", "==", storageCapacity)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return {
          success: true,
          data: null,
        };
      }

      const doc = snapshot.docs[0];
      return {
        success: true,
        data: {
          id: doc.id,
          ...doc.data(),
        } as ProductVariant,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete variant (soft delete)
   */
  async deleteVariant(
    productId: string,
    variantId: string,
    userId?: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Check if variant has inventory items
      // This should be implemented with inventory service
      // For now, just perform soft delete

      const variantRef = doc(
        db,
        COLLECTIONS.PRODUCTS,
        productId,
        SUBCOLLECTIONS.VARIANTS,
        variantId
      );

      await updateDoc(variantRef, {
        isActive: false,
        updatedAt: Timestamp.now(),
        updatedBy: userId,
      });

      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Generate SKU from color and storage
   */
  private generateSKU(colorName: string, storageCapacity: string): string {
    // Enhanced SKU generation
    const colorCode = colorName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 3);

    const storageCode = storageCapacity.replace(/[^0-9]/g, "");
    const timestamp = Date.now().toString().slice(-4);

    return `IP-${storageCode}-${colorCode}-${timestamp}`;
  }

  /**
   * Get available colors across all products
   */
  async getAvailableColors(): Promise<ServiceResponse<string[]>> {
    try {
      const variantsCollectionGroup = collection(db, SUBCOLLECTIONS.VARIANTS);
      const q = query(variantsCollectionGroup, where("isActive", "==", true));
      const snapshot = await getDocs(q);

      const colors = new Set<string>();
      snapshot.docs.forEach((doc) => {
        const variant = doc.data() as ProductVariant;
        colors.add(variant.colorName);
      });

      return {
        success: true,
        data: Array.from(colors).sort(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get available storage capacities
   */
  async getAvailableStorageCapacities(): Promise<ServiceResponse<string[]>> {
    try {
      const variantsCollectionGroup = collection(db, SUBCOLLECTIONS.VARIANTS);
      const q = query(variantsCollectionGroup, where("isActive", "==", true));
      const snapshot = await getDocs(q);

      const capacities = new Set<string>();
      snapshot.docs.forEach((doc) => {
        const variant = doc.data() as ProductVariant;
        capacities.add(variant.storageCapacity);
      });

      return {
        success: true,
        data: Array.from(capacities).sort(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update variant stock quantity (called by inventory service)
   */
  async updateVariantStock(
    productId: string,
    variantId: string,
    stockQuantity: number,
    reservedQuantity?: number
  ): Promise<ServiceResponse<void>> {
    try {
      const variantRef = doc(
        db,
        COLLECTIONS.PRODUCTS,
        productId,
        SUBCOLLECTIONS.VARIANTS,
        variantId
      );

      const updateData: any = {
        stockQuantity,
        lastStockUpdate: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      if (reservedQuantity !== undefined) {
        updateData.reservedQuantity = reservedQuantity;
      }

      await updateDoc(variantRef, updateData);

      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const productService = new ProductService();
