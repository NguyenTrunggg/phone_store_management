import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Utility for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Format number with thousand separators
export function formatNumber(number: number): string {
  return new Intl.NumberFormat("vi-VN").format(number);
}

// Format date
export function formatDate(
  date: Date | string,
  dateFormat: string = "dd/MM/yyyy"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, dateFormat, { locale: vi });
}

// Format date with time
export function formatDateTime(date: Date | string): string {
  return formatDate(date, "dd/MM/yyyy HH:mm");
}

// Generate order number
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const timestamp = now.getTime().toString().slice(-6);

  return `HD${year}${month}${day}${timestamp}`;
}

// Generate return number
export function generateReturnNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const timestamp = now.getTime().toString().slice(-6);

  return `TH${year}${month}${day}${timestamp}`;
}

// Validate IMEI
export function validateIMEI(imei: string): boolean {
  // IMEI phải có đúng 15 chữ số
  if (!/^\d{15}$/.test(imei)) {
    return false;
  }

  // Luhn algorithm validation
  let sum = 0;
  let alternate = false;

  for (let i = imei.length - 1; i >= 0; i--) {
    let digit = parseInt(imei.charAt(i), 10);

    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit = (digit % 10) + 1;
      }
    }

    sum += digit;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

// Validate phone number
export function validatePhoneNumber(phone: string): boolean {
  // Loại bỏ khoảng trắng và ký tự đặc biệt
  const cleanPhone = phone.replace(/\D/g, "");

  // Kiểm tra độ dài và format Việt Nam
  return /^(0[3|5|7|8|9])[0-9]{8}$/.test(cleanPhone);
}

// Format phone number
export function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "");

  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
  }

  return phone;
}

// Validate email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate random string
export function generateRandomString(length: number = 8): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Deep clone object
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array)
    return obj.map((item) => deepClone(item)) as unknown as T;
  if (typeof obj === "object") {
    const clonedObj = {} as { [key: string]: any };
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj as T;
  }
  return obj;
}

// Calculate percentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Calculate discount amount
export function calculateDiscount(
  price: number,
  discountPercent: number
): number {
  return Math.round(price * (discountPercent / 100));
}

// Calculate final price after discount
export function calculateFinalPrice(
  price: number,
  discountPercent: number
): number {
  const discountAmount = calculateDiscount(price, discountPercent);
  return price - discountAmount;
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Check if object is empty
export function isEmpty(obj: any): boolean {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === "string") return obj.length === 0;
  if (typeof obj === "object") return Object.keys(obj).length === 0;
  return false;
}

// Sleep function for async operations
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

// Convert string to slug
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9 -]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

// Generate SKU
export function generateSKU(
  modelName: string,
  capacity: string,
  color: string
): string {
  const model = modelName
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 6);
  const cap = capacity.replace(/[^0-9]/g, "");
  const col = color
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 3);

  return `${model}-${cap}-${col}`;
}
