"use client";

import React, { useState, useEffect, Suspense } from "react";
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

function LoginForm() {
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth and routing
  const { login, user, initializing } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const getReturnUrl = () => {
    return searchParams.get("returnUrl") || "/dashboard";
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (!initializing && user) {
      router.replace(getReturnUrl());
    }
  }, [user, initializing, router]);

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
    setErrors({});
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      // Redirect handled by useEffect
    } catch (error: any) {
      let errorMessage = "Đăng nhập thất bại. Vui lòng thử lại.";
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/invalid-credential':
            errorMessage = "Email hoặc mật khẩu không chính xác.";
            break;
          case 'auth/too-many-requests':
            errorMessage = "Quá nhiều lần thử. Vui lòng đợi một lúc.";
            break;
          case 'auth/network-request-failed':
            errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra internet.";
            break;
          default:
            errorMessage = error.message;
        }
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


  if (initializing || user) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">Đang tải hoặc chuyển hướng...</p>
        </div>
      );
  }


  return (
    <Card className="w-full border-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-2xl shadow-blue-500/10 dark:shadow-blue-900/20">
      <CardContent className="p-8 sm:p-10 lg:p-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Đăng nhập
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Chào mừng trở lại!
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-6">
            {/* General Error Alert */}
            {errors.general && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="font-semibold text-gray-700 dark:text-gray-200"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  className={clsx(
                    "pl-10 h-12",
                    errors.email && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="font-semibold text-gray-700 dark:text-gray-200"
              >
                Mật khẩu
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  className={clsx(
                    "pl-10 h-12",
                    errors.password &&
                      "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-900/40 transition-all duration-300 ease-in-out transform hover:scale-105"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : null}
              {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
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
             <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
             }>
                <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
