"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Search, Plus, User as UserIcon, Shield, Settings, Trash2, Edit, Eye, Loader2 } from "lucide-react"
import {
  FirebaseUser,
  CreateUserInput,
  UpdateUserInput,
  SYSTEM_ROLES,
} from "@/lib/firebase/models/user.model"
import { userService } from "@/lib/firebase/services/user.service"
import { useDebounce } from "use-debounce"
import { toast } from "sonner"
import { UserRoleType } from "@/constants"
import { Timestamp } from "firebase/firestore"

// A mock user ID for audit purposes. In a real app, this would come from the user's session.
const MOCK_SESSION_USER_ID = "mock-admin-user-id"

/*
interface UserType {
  id: string
  username: string
  fullName: string
  email: string
  phone: string
  role: "admin" | "manager" | "cashier"
  isActive: boolean
  lastLogin: string
  createdAt: string
  permissions: string[]
}
*/

export default function UserManagement() {
  const [users, setUsers] = useState<FirebaseUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<FirebaseUser | null>(null)

  const [newUser, setNewUser] = useState<Partial<CreateUserInput>>({
    role: "sales_staff",
    displayName: "",
    email: "",
    password: "",
    phone: "",
    firstName: "",
    lastName: "",
  })

  const [editUser, setEditUser] = useState<Partial<UpdateUserInput>>({})
  const [confirmPassword, setConfirmPassword] = useState("")

  const fetchUsers = async () => {
    setIsLoading(true)
    const result = await userService.searchUsers({
      searchTerm: debouncedSearchTerm,
      sortBy: "displayName",
      sortOrder: "asc",
    })

    if (result.success && result.data) {
      // Filter out deleted users
      const activeUsers = result.data.data.filter((user) => !user.isDeleted)
      setUsers(activeUsers)
    } else {
      toast.error("Lỗi", {
        description: result.error || "Không thể tải danh sách người dùng.",
      })
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [debouncedSearchTerm])

  /*
  const users: UserType[] = [
    {
      id: "1",
      username: "admin",
      fullName: "Quản trị viên",
      email: "admin@iphonestore.com",
      phone: "0901234567",
      role: "admin",
      isActive: true,
      lastLogin: "2024-01-22 14:30",
      createdAt: "2024-01-01",
      permissions: ["all"],
    },
    {
      id: "2",
      username: "manager01",
      fullName: "Nguyễn Văn Manager",
      email: "manager@iphonestore.com",
      phone: "0912345678",
      role: "manager",
      isActive: true,
      lastLogin: "2024-01-22 09:15",
      createdAt: "2024-01-05",
      permissions: ["sales", "inventory", "reports", "customers"],
    },
    {
      id: "3",
      username: "cashier01",
      fullName: "Trần Thị Thu Thủy",
      email: "cashier1@iphonestore.com",
      phone: "0923456789",
      role: "cashier",
      isActive: true,
      lastLogin: "2024-01-22 16:45",
      createdAt: "2024-01-10",
      permissions: ["sales", "customers"],
    },
    {
      id: "4",
      username: "cashier02",
      fullName: "Lê Minh Hoàng",
      email: "cashier2@iphonestore.com",
      phone: "0934567890",
      role: "cashier",
      isActive: false,
      lastLogin: "2024-01-15 11:20",
      createdAt: "2024-01-12",
      permissions: ["sales"],
    },
  ]
  */

  const handleCreateUser = async () => {
    if (newUser.password !== confirmPassword) {
      toast.error("Lỗi", { description: "Mật khẩu không khớp." })
      return
    }
    if (!newUser.email || !newUser.password || !newUser.displayName) {
      toast.error("Lỗi", {
        description: "Vui lòng điền các trường bắt buộc.",
      })
      return
    }

    const result = await userService.createUser(
      newUser as CreateUserInput,
      MOCK_SESSION_USER_ID
    )

    if (result.success) {
      toast.success("Thành công", {
        description: "Người dùng đã được tạo thành công.",
      })
      setIsCreateDialogOpen(false)
      setNewUser({
        role: "sales_staff",
        displayName: "",
        email: "",
        password: "",
        phone: "",
        firstName: "",
        lastName: "",
      })
      setConfirmPassword("")
      fetchUsers() // Refresh the list
    } else {
      toast.error("Lỗi", {
        description: result.error || "Không thể tạo người dùng.",
      })
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    const result = await userService.updateUser(
      selectedUser.id,
      editUser,
      MOCK_SESSION_USER_ID
    )

    if (result.success) {
      toast.success("Thành công", {
        description: "Thông tin người dùng đã được cập nhật.",
      })
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      setEditUser({})
      fetchUsers() // Refresh the list
    } else {
      toast.error("Lỗi", {
        description: result.error || "Không thể cập nhật người dùng.",
      })
    }
  }

  const handleToggleUserStatus = async (user: FirebaseUser) => {
    const result = await userService.updateUser(
      user.id,
      { isActive: !user.isActive },
      MOCK_SESSION_USER_ID
    )

    if (result.success) {
      toast.success("Thành công", {
        description: `Người dùng đã được ${
          !user.isActive ? "kích hoạt" : "vô hiệu hóa"
        }.`,
      })
      fetchUsers() // Refresh the list
    } else {
      toast.error("Lỗi", {
        description: result.error || "Không thể thay đổi trạng thái người dùng.",
      })
    }
  }

  const handleDeleteUser = (user: FirebaseUser) => {
    toast.warning(`Bạn có chắc muốn xóa người dùng ${user.displayName}?`, {
      action: {
        label: "Xóa",
        onClick: async () => {
          const result = await userService.deleteUser(
            user.id,
            MOCK_SESSION_USER_ID
          )
          if (result.success) {
            toast.success("Thành công", {
              description: "Người dùng đã được xóa.",
            })
            fetchUsers()
          } else {
            toast.error("Lỗi", {
              description: result.error || "Không thể xóa người dùng.",
            })
          }
        },
      },
      duration: 5000,
    })
  }

  const getRoleBadge = (role: UserRoleType) => {
    const roleInfo = SYSTEM_ROLES[role]
    let icon = <UserIcon className="w-3 h-3 mr-1" />
    let className = "bg-green-100 text-green-800"

    if (role === "admin") {
      icon = <Shield className="w-3 h-3 mr-1" />
      className = "bg-red-100 text-red-800"
    } else if (role === "store_manager") {
      icon = <Settings className="w-3 h-3 mr-1" />
      className = "bg-blue-100 text-blue-800"
    }

    return (
      <Badge className={className}>
        {icon}
        {roleInfo?.name || role}
      </Badge>
    )
  }

  const formatTimestamp = (timestamp?: Timestamp) => {
    if (!timestamp) return "Chưa đăng nhập"
    return new Date(timestamp.seconds * 1000).toLocaleString("vi-VN")
  }

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      admin: users.filter((u) => u.role === "admin").length,
      store_manager: users.filter((u) => u.role === "store_manager").length,
      sales_staff: users.filter((u) => u.role === "sales_staff").length,
      warehouse_staff: users.filter((u) => u.role === "warehouse_staff").length,
    }
  }, [users])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Quản lý người dùng
          </h2>
          <p className="text-gray-600">
            Quản lý tài khoản và phân quyền hệ thống
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Thêm người dùng
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Thêm người dùng mới</DialogTitle>
              <DialogDescription>
                Tạo tài khoản mới cho nhân viên
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayName">Họ và tên</Label>
                  <Input
                    id="displayName"
                    value={newUser.displayName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, displayName: e.target.value })
                    }
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    placeholder="user@email.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Tên</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, firstName: e.target.value })
                    }
                    placeholder="An"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Họ</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, lastName: e.target.value })
                    }
                    placeholder="Nguyễn Văn"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone: e.target.value })
                  }
                  placeholder="09XXXXXXXX"
                />
              </div>
              <div>
                <Label htmlFor="role">Vai trò</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: UserRoleType) =>
                    setNewUser({ ...newUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SYSTEM_ROLES).map(([key, role]) => (
                      <SelectItem key={key} value={key}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleCreateUser}>Tạo tài khoản</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng người dùng
            </CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} đang hoạt động
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quản trị viên</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.admin}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quản lý</CardTitle>
            <Settings className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.store_manager}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhân viên</CardTitle>
            <UserIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.sales_staff + stats.warehouse_staff}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Danh sách người dùng</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {user.displayName}
                        </h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          Đăng nhập cuối: {formatTimestamp(user.lastLoginAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getRoleBadge(user.role)}
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Hoạt động" : "Tạm khóa"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={() => handleToggleUserStatus(user)}
                        id={`status-switch-${user.id}`}
                      />
                      <Label
                        htmlFor={`status-switch-${user.id}`}
                        className="text-sm text-gray-600"
                      >
                        {user.isActive ? "Hoạt động" : "Tạm khóa"}
                      </Label>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Xem
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setEditUser({
                            displayName: user.displayName,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            phone: user.phone,
                            role: user.role,
                          });
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Sửa
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Xóa
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho {selectedUser?.displayName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Họ và tên</Label>
                <Input
                  value={editUser.displayName}
                  onChange={(e) =>
                    setEditUser({ ...editUser, displayName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <Input
                  value={editUser.phone}
                  onChange={(e) =>
                    setEditUser({ ...editUser, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Vai trò</Label>
              <Select
                value={editUser.role}
                onValueChange={(value: UserRoleType) =>
                  setEditUser({ ...editUser, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SYSTEM_ROLES).map(([key, role]) => (
                    <SelectItem key={key} value={key}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleEditUser}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
