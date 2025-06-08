"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Smartphone,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  TrendingUp,
  RotateCcw,
  Users2,
} from "lucide-react";

export const DashboardSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navigationItems = [
    { href: "/dashboard", icon: BarChart3, label: "Dashboard" },
    { href: "/pos", icon: ShoppingCart, label: "Bán hàng (POS)" },
    { href: "/products", icon: Smartphone, label: "Quản lý sản phẩm" },
    { href: "/inventory", icon: Package, label: "Nhập kho" },
    { href: "/reports", icon: TrendingUp, label: "Báo cáo" },
    { href: "/customers", icon: Users, label: "Khách hàng" },
    { href: "/returns", icon: RotateCcw, label: "Trả hàng" },
    { href: "/users", icon: Users2, label: "Quản lý người dùng" },
  ];

  return (
    <nav className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
