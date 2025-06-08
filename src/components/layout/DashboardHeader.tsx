"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { Smartphone, CheckCircle, User, LogOut } from "lucide-react";

export const DashboardHeader = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Failed to log out", error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Trung Apple
            </h1>
            <p className="text-sm text-gray-500">
              Hệ thống quản lý bán hàng iPhone
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-green-600 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Hoạt động
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                {user ? user.displayName : "Account"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
