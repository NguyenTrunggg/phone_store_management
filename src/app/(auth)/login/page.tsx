"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Smartphone,
  Shield,
  Zap,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  // Client-side mounting guard
  const [isMounted, setIsMounted] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth and routing - only access after mounting
  const { login, user, initializing } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get return URL only on client side
  const getReturnUrl = () => {
    if (!isMounted) return "/dashboard";
    return searchParams.get("returnUrl") || "/dashboard";
  };

  // Redirect if already authenticated - only after mounting
  useEffect(() => {
    if (isMounted && !initializing && user) {
      router.replace(getReturnUrl());
    }
  }, [user, initializing, router, isMounted]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Định dạng email không hợp lệ";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await login({ email: email.trim(), password });

      // Successful login - redirect will happen via useEffect
      console.log("Login successful, redirecting...");
    } catch (error: any) {
      console.error("Login error:", error);

      // Set appropriate error message
      let errorMessage = "Đăng nhập thất bại. Vui lòng thử lại.";

      if (error.message.includes("user-not-found")) {
        errorMessage = "Không tìm thấy tài khoản với email này.";
      } else if (error.message.includes("wrong-password")) {
        errorMessage = "Mật khẩu không chính xác.";
      } else if (error.message.includes("too-many-requests")) {
        errorMessage = "Quá nhiều lần thử. Vui lòng đợi một lúc.";
      } else if (error.message.includes("network-request-failed")) {
        errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra internet.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes and clear errors
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  // Show loading while not mounted or initializing
  if (!isMounted || initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600 dark:text-gray-300">Đang tải...</span>
        </div>
      </div>
    );
  }

  // Don't render if user is already authenticated
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600 dark:text-gray-300">
            Đang chuyển hướng...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent dark:from-blue-900/20"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 dark:bg-blue-700/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/30 dark:bg-indigo-700/20 rounded-full blur-3xl"></div>

      <div className="min-h-screen flex max-w-7xl mx-auto">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-2/5 relative flex-col justify-center px-8 xl:px-12">
          <div className="relative z-10 max-w-lg">
            {/* Logo */}
            <div className="flex items-center mb-10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Trung Apple
              </h1>
            </div>

            {/* Main Heading */}
            <div className="mb-10">
              <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                  Quản lý
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  hiện đại
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                Hệ thống quản lý cửa hàng điện thoại thông minh, đơn giản và
                hiệu quả.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-5">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Bảo mật cao
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Dữ liệu được mã hóa và bảo vệ tối đa
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Hiệu suất cao
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Xử lý nhanh chóng, giao diện mượt mà
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-3/5 flex items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-lg lg:max-w-md xl:max-w-lg">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Phone Store Pro
              </h1>
            </div>

            {/* Welcome Text */}
            <div className="text-center lg:text-left mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Chào mừng trở lại
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Đăng nhập để tiếp tục quản lý cửa hàng của bạn
              </p>
            </div>

            {/* Login Form Card */}
            <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 border-white/20 dark:border-gray-700/30 shadow-2xl shadow-blue-500/10">
              <CardContent className="p-8">
                {/* General Error Alert */}
                {errors.general && (
                  <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <AlertDescription className="text-red-700 dark:text-red-300">
                      {errors.general}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Email
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        className={clsx(
                          "pl-12 h-12 rounded-xl border-2 transition-all duration-200 bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm",
                          "focus:border-blue-500 focus:ring-0 focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:shadow-lg focus:shadow-blue-500/20",
                          "placeholder:text-gray-400 text-gray-900 dark:text-white",
                          errors.email
                            ? "border-red-500 bg-red-50/80 dark:bg-red-900/20"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        )}
                        placeholder="your@email.com"
                        autoComplete="email"
                        disabled={isSubmitting}
                        required
                        suppressHydrationWarning
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center mt-2">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Mật khẩu
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={handlePasswordChange}
                        className={clsx(
                          "pl-12 pr-12 h-12 rounded-xl border-2 transition-all duration-200 bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm",
                          "focus:border-blue-500 focus:ring-0 focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:shadow-lg focus:shadow-blue-500/20",
                          "placeholder:text-gray-400 text-gray-900 dark:text-white",
                          errors.password
                            ? "border-red-500 bg-red-50/80 dark:bg-red-900/20"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        )}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        disabled={isSubmitting}
                        required
                        suppressHydrationWarning
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                        disabled={isSubmitting}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center mt-2">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rememberMe"
                        checked={rememberMe}
                        onCheckedChange={(checked) =>
                          setRememberMe(checked === true)
                        }
                        disabled={isSubmitting}
                      />
                      <Label
                        htmlFor="rememberMe"
                        className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer"
                      >
                        Ghi nhớ đăng nhập
                      </Label>
                    </div>
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                      tabIndex={isSubmitting ? -1 : 0}
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 disabled:opacity-70"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang đăng nhập...
                      </>
                    ) : (
                      "Đăng nhập"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                © 2025 Trung Apple. Tất cả quyền được bảo lưu.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
