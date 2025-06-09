"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Phone, Mail, MapPin, DollarSign, ShoppingBag, User, Trash2, Loader2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { customerService } from "@/lib/firebase/services/customer.service"
import { posService } from "@/lib/firebase/services/pos.service"
import { FirebaseCustomer, CreateCustomerInput, UpdateCustomerInput } from "@/lib/firebase/models/customer.model"
import { FirebaseSalesOrder } from "@/lib/firebase/models/pos.model"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { useRouter } from "next/navigation"

export default function CustomerManagement() {
  const { user } = useAuth() // Get current user
  const [customers, setCustomers] = useState<FirebaseCustomer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<FirebaseCustomer | null>(null)
  const [purchaseHistory, setPurchaseHistory] = useState<FirebaseSalesOrder[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [newCustomer, setNewCustomer] = useState<CreateCustomerInput>({
    name: "",
    phone: "",
    email: "",
  
    notes: "",
  })
  const [editCustomer, setEditCustomer] = useState<UpdateCustomerInput>({})

  const router = useRouter()

  const fetchCustomers = useCallback(async (search = "", loadMore = false) => {
    if (!loadMore) {
        setIsLoading(true)
        setCustomers([])
        setLastDoc(undefined)
        setHasMore(true)
    } else if (isLoading || !hasMore) {
        return
    }

    setIsLoading(true)
    const res = await customerService.searchCustomers({ 
        searchTerm: search, 
        limit: 10, 
        startAfter: loadMore ? lastDoc : undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
        isActive: true,
    })

    if (res.success && res.data) {
        setCustomers(prev => loadMore ? [...prev, ...res.data!.data] : res.data!.data)
        setLastDoc(res.data.lastDoc)
        setHasMore(res.data.hasMore)
    } else {
        toast.error("Lỗi tải danh sách khách hàng", { description: res.error })
    }
    setIsLoading(false)
  }, [lastDoc, hasMore, isLoading])

  useEffect(() => {
    fetchCustomers(searchTerm)
  }, [searchTerm]) // Refetch when searchTerm changes, debouncing would be a good improvement

  const handleCreateCustomer = async () => {
    if (!user) {
        toast.error("Bạn phải đăng nhập để thực hiện chức năng này.");
        return;
    }
    if (!newCustomer.name || !newCustomer.phone) {
        toast.warning("Vui lòng nhập tên và số điện thoại khách hàng.");
        return;
    }
    setIsSubmitting(true);
    const res = await customerService.createCustomer(newCustomer, user.uid);
    if (res.success && res.data) {
        toast.success(`Đã thêm khách hàng ${res.data.name} thành công!`);
        setCustomers(prev => [res.data!, ...prev]);
        setIsCreateDialogOpen(false);
        setNewCustomer({ name: "", phone: "", email: "", notes: "" });
    } else {
        toast.error("Thêm khách hàng thất bại", { description: res.error });
    }
    setIsSubmitting(false);
  }

  const handleUpdateCustomer = async () => {
    if (!user || !selectedCustomer) {
        toast.error("Không có thông tin khách hàng hoặc người dùng.");
        return;
    }
    setIsSubmitting(true);
    const res = await customerService.updateCustomer(selectedCustomer.id, editCustomer, user.uid);
    if (res.success && res.data) {
        toast.success(`Cập nhật khách hàng ${res.data.name} thành công!`);
        setCustomers(prev => prev.map(c => c.id === res.data!.id ? res.data! : c));
        setIsEditDialogOpen(false);
        setEditCustomer({});
    } else {
        toast.error("Cập nhật thất bại", { description: res.error });
    }
    setIsSubmitting(false);
  }
  
  const handleDeleteCustomer = async (customer: FirebaseCustomer) => {
    if (!user) {
        toast.error("Bạn phải đăng nhập để thực hiện chức năng này.");
        return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa khách hàng ${customer.name}? Thao tác này sẽ ẩn khách hàng khỏi các danh sách.`)) {
        return;
    }

    setIsSubmitting(true);
    const res = await customerService.deleteCustomer(customer.id, user.uid);
    if (res.success) {
        toast.success(`Đã xóa khách hàng ${customer.name}.`);
        setCustomers(prev => prev.filter(c => c.id !== customer.id));
    } else {
        toast.error("Xóa thất bại", { description: res.error });
    }
    setIsSubmitting(false);
  }

  const openEditDialog = (customer: FirebaseCustomer) => {
    setSelectedCustomer(customer);
    setEditCustomer({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        notes: customer.notes,
        // Assuming the first address is the one to edit
        // A more complex UI would be needed for multiple addresses
    });
    setIsEditDialogOpen(true);
  }
  
  const handleViewHistory = async (customer: FirebaseCustomer) => {
    setSelectedCustomer(customer);
    setIsHistoryDialogOpen(true);
    setIsHistoryLoading(true);
    const res = await posService.getSalesOrdersByCustomerId(customer.id);
    if (res.success && res.data) {
        setPurchaseHistory(res.data);
    } else {
        toast.error("Lỗi tải lịch sử mua hàng", { description: res.error });
        setPurchaseHistory([]);
    }
    setIsHistoryLoading(false);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "vip":
        return <Badge className="bg-purple-100 text-purple-800">VIP</Badge>
      case "platinum":
        return <Badge className="bg-blue-100 text-blue-800">Platinum</Badge>
      case "regular":
        return <Badge variant="secondary">Thường xuyên</Badge>
      case "new":
        return <Badge className="bg-green-100 text-green-800">Mới</Badge>
      default:
        return <Badge variant="outline">Khách hàng</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý khách hàng</h2>
          <p className="text-gray-600">Theo dõi thông tin và lịch sử mua hàng của khách hàng</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Thêm khách hàng
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Thêm khách hàng mới</DialogTitle>
              <DialogDescription>Tạo thông tin khách hàng trong hệ thống</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Họ và tên</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="09XXXXXXXX"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="address">Địa chỉ (Đường)</Label>
                <Textarea
                  id="address"
                  value={newCustomer.address?.street}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: { ...newCustomer.address!, street: e.target.value } })}
                  placeholder="123 Nguyễn Huệ"
                />
              </div>
              <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  placeholder="Ghi chú thêm về khách hàng..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreateCustomer} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Tạo khách hàng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Danh sách khách hàng</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading && customers.length === 0 ? (
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : customers.length > 0 ? (
              customers.map((customer) => (
              <div key={customer.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {customer.phone && <span className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {customer.phone}
                        </span>}
                        {customer.email && <span className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {customer.email}
                        </span>}
                      </div>
                      {/* {customer.addresses && customer.addresses.length > 0 && <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {customer.addresses[0].street}, {customer.addresses[0].district}, {customer.addresses[0].city}
                      </div>} */}
                    </div>
                  </div>
                  <div className="text-right">{getStatusBadge(customer.customerTier)}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 rounded-lg p-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Tổng chi tiêu</p>
                    <p className="font-bold text-lg text-blue-600">{customer.totalSpent.toLocaleString("vi-VN")}₫</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Số đơn hàng</p>
                    <p className="font-bold text-lg">{customer.totalOrders}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Mua gần nhất</p>
                    <p className="font-bold text-lg">{customer.lastPurchaseDate ? customer.lastPurchaseDate.toDate().toLocaleDateString('vi-VN') : 'Chưa có'}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-3">
                   <Button variant="outline" size="sm" onClick={() => handleViewHistory(customer)}>
                        Xem lịch sử
                   </Button>
                  
                  <Dialog open={isEditDialogOpen && selectedCustomer?.id === customer.id} onOpenChange={(open) => !open && setIsEditDialogOpen(false)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(customer)}>
                        Chỉnh sửa
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Chỉnh sửa khách hàng</DialogTitle>
                        <DialogDescription>Cập nhật thông tin cho {selectedCustomer?.name}</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label>Họ và tên</Label>
                          <Input value={editCustomer.name} onChange={(e) => setEditCustomer({...editCustomer, name: e.target.value})} />
                        </div>
                        <div>
                          <Label>Số điện thoại</Label>
                          <Input value={editCustomer.phone} onChange={(e) => setEditCustomer({...editCustomer, phone: e.target.value})} />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input value={editCustomer.email} onChange={(e) => setEditCustomer({...editCustomer, email: e.target.value})} />
                        </div>
                        <div>
                          <Label>Ghi chú</Label>
                          <Textarea value={editCustomer.notes} onChange={(e) => setEditCustomer({...editCustomer, notes: e.target.value})} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                          Hủy
                        </Button>
                        <Button onClick={handleUpdateCustomer} disabled={isSubmitting}>
                          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Lưu thay đổi
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    size="sm"
                    onClick={() => {
                      toast.info("Chức năng tạo đơn hàng sẽ chuyển bạn đến trang POS.");
                    }}
                  >
                    Tạo đơn hàng
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteCustomer(customer)}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Xóa
                  </Button>
                </div>
              </div>
              ))
            ) : (
                <div className="text-center p-8 text-gray-500">
                    <p>Không tìm thấy khách hàng nào.</p>
                    <p className="text-sm">Hãy thử thay đổi từ khóa tìm kiếm hoặc thêm khách hàng mới.</p>
                </div>
            )}
            {hasMore && !isLoading && (
                <div className="text-center mt-4">
                    <Button onClick={() => fetchCustomers(searchTerm, true)} disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Tải thêm"}
                    </Button>
                </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
                <DialogTitle>Lịch sử mua hàng - {selectedCustomer?.name}</DialogTitle>
                <DialogDescription>Chi tiết các đơn hàng đã mua</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[400px] overflow-y-auto p-2">
                {isHistoryLoading ? (
                    <div className="flex justify-center items-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : purchaseHistory.length > 0 ? (
                    purchaseHistory.map(order => (
                        <div key={order.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-blue-600">{order.orderNumber}</span>
                                <span className="text-sm text-gray-500">
                                    {order.orderDate.toDate().toLocaleDateString('vi-VN', {
                                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-sm">{order.totalItems} sản phẩm</p>
                                <p className="font-bold text-lg">{order.totalAmount.toLocaleString('vi-VN')}₫</p>
                            </div>
                            <Button size="sm" variant="link" className="p-0 h-auto mt-1" onClick={() => router.push(`/pos/receipt/${order.id}`)}>
                                Xem chi tiết hóa đơn
                            </Button>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-8 text-gray-500">
                        <p>Khách hàng này chưa có lịch sử mua hàng.</p>
                    </div>
                )}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
