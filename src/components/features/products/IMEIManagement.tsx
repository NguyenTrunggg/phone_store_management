"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, Smartphone, Package, Eye, Download, Upload, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface IMEIRecord {
  id: string
  imei: string
  productId: string
  productName: string
  variantId: string
  variantInfo: string
  sku: string
  status: "available" | "sold" | "reserved" | "defective" | "returned"
  purchaseDate?: string
  saleDate?: string
  customerId?: string
  customerName?: string
  orderId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface IMEIManagementProps {
  imeiRecords: IMEIRecord[]
  products: Array<{
    id: string
    name: string
    variants: Array<{
      id: string
      info: string
      sku: string
    }>
  }>
  loading: boolean
  onCreateIMEI: (imei: any) => Promise<void>
  onUpdateIMEI: (imeiId: string, imei: any) => Promise<void>
  onDeleteIMEI: (imeiId: string) => Promise<void>
  onBulkImport: (imeiList: string[]) => Promise<void>
  onExport: () => Promise<void>
  onViewIMEI: (imei: IMEIRecord) => void
  submitting?: boolean
}

export default function IMEIManagement({
  imeiRecords,
  products,
  loading,
  onCreateIMEI,
  onUpdateIMEI,
  onDeleteIMEI,
  onBulkImport,
  onExport,
  onViewIMEI,
  submitting = false
}: IMEIManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterProduct, setFilterProduct] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedIMEI, setSelectedIMEI] = useState<IMEIRecord | null>(null)
  const [activeTab, setActiveTab] = useState("list")

  const [newIMEI, setNewIMEI] = useState({
    imei: "",
    productId: "",
    variantId: "",
    notes: "",
  })

  const [bulkIMEIs, setBulkIMEIs] = useState("")

  const matchesProduct = (record: IMEIRecord) =>
    !filterProduct || filterProduct === "all" || record.productId === filterProduct
  const matchesStatus = (record: IMEIRecord) =>
    !filterStatus || filterStatus === "all" || record.status === filterStatus

  const filteredIMEIs = imeiRecords.filter((record) => {
    const matchesSearch =
      record.imei.includes(searchTerm) ||
      record.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.orderId?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch && matchesProduct(record) && matchesStatus(record)
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Có sẵn
          </Badge>
        )
      case "sold":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Đã bán
          </Badge>
        )
      case "reserved":
        return <Badge variant="secondary">Đặt trước</Badge>
      case "defective":
        return <Badge variant="destructive">Lỗi</Badge>
      case "returned":
        return (
          <Badge variant="outline" className="text-orange-600">
            Trả lại
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const validateIMEI = (imei: string) => {
    return imei.length === 15 && /^\d+$/.test(imei)
  }

  const handleCreateIMEI = () => {
    if (!newIMEI.imei || !newIMEI.productId || !newIMEI.variantId) {
      alert("Vui lòng điền đầy đủ thông tin!")
      return
    }

    if (!validateIMEI(newIMEI.imei)) {
      alert("IMEI phải có đúng 15 chữ số!")
      return
    }

    // Check duplicate IMEI
    if (imeiRecords.some((record) => record.imei === newIMEI.imei)) {
      alert("IMEI này đã tồn tại trong hệ thống!")
      return
    }

    onCreateIMEI(newIMEI)
    setIsCreateDialogOpen(false)
    setNewIMEI({
      imei: "",
      productId: "",
      variantId: "",
      notes: "",
    })
  }

  const handleBulkImport = () => {
    const imeiList = bulkIMEIs
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    const validIMEIs = imeiList.filter((imei) => validateIMEI(imei))
    const duplicateIMEIs = validIMEIs.filter((imei) => imeiRecords.some((record) => record.imei === imei))

    if (duplicateIMEIs.length > 0) {
      alert(`Các IMEI sau đã tồn tại: ${duplicateIMEIs.join(", ")}`)
      return
    }

    if (validIMEIs.length === 0) {
      alert("Không có IMEI hợp lệ nào!")
      return
    }

    onBulkImport(validIMEIs)
    setIsBulkImportDialogOpen(false)
    setBulkIMEIs("")
  }

  const handleEditIMEI = () => {
    if (!selectedIMEI) return

    onUpdateIMEI(selectedIMEI.id, selectedIMEI)
    setIsEditDialogOpen(false)
    setSelectedIMEI(null)
  }

  const handleDeleteIMEI = (imeiId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa IMEI này?")) {
      onDeleteIMEI(imeiId)
    }
  }

  const handleExportIMEIs = () => {
    onExport()
  }

  const getSelectedVariants = () => {
    if (!newIMEI.productId) return []
    const product = products.find((p) => p.id === newIMEI.productId)
    return product?.variants || []
  }

  const getIMEIStats = () => {
    const total = imeiRecords.length
    const available = imeiRecords.filter((r) => r.status === "available").length
    const sold = imeiRecords.filter((r) => r.status === "sold").length
    const reserved = imeiRecords.filter((r) => r.status === "reserved").length
    const defective = imeiRecords.filter((r) => r.status === "defective").length
    const returned = imeiRecords.filter((r) => r.status === "returned").length

    return { total, available, sold, reserved, defective, returned }
  }

  const stats = getIMEIStats()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Quản lý IMEI/Serial</h3>
          <p className="text-gray-600">Theo dõi từng đơn vị sản phẩm qua mã IMEI/Serial</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onExport} disabled={submitting}>
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
          <Dialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Nhập hàng loạt
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nhập IMEI hàng loạt</DialogTitle>
                <DialogDescription>Nhập danh sách IMEI, mỗi IMEI trên một dòng</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="bulkIMEIs">Danh sách IMEI</Label>
                  <Textarea
                    id="bulkIMEIs"
                    value={bulkIMEIs}
                    onChange={(e) => setBulkIMEIs(e.target.value)}
                    placeholder="359123456789012&#10;359123456789013&#10;359123456789014"
                    rows={10}
                  />
                  <p className="text-sm text-gray-500 mt-2">Mỗi IMEI phải có đúng 15 chữ số và trên một dòng riêng</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkImportDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleBulkImport}>Nhập IMEI</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Thêm IMEI
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Thêm IMEI mới</DialogTitle>
                <DialogDescription>Thêm IMEI cho sản phẩm trong kho</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="imei">IMEI/Serial *</Label>
                  <Input
                    id="imei"
                    value={newIMEI.imei}
                    onChange={(e) => setNewIMEI({ ...newIMEI, imei: e.target.value })}
                    placeholder="359123456789012"
                    maxLength={15}
                  />
                  {newIMEI.imei && !validateIMEI(newIMEI.imei) && (
                    <p className="text-sm text-red-500 mt-1">IMEI phải có đúng 15 chữ số</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="productId">Sản phẩm *</Label>
                  <Select
                    value={newIMEI.productId}
                    onValueChange={(value) => setNewIMEI({ ...newIMEI, productId: value, variantId: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn sản phẩm" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="variantId">Biến thể *</Label>
                  <Select
                    value={newIMEI.variantId}
                    onValueChange={(value) => setNewIMEI({ ...newIMEI, variantId: value })}
                    disabled={!newIMEI.productId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn biến thể" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSelectedVariants().map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.info} ({variant.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    value={newIMEI.notes}
                    onChange={(e) => setNewIMEI({ ...newIMEI, notes: e.target.value })}
                    placeholder="Ghi chú thêm về IMEI này..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleCreateIMEI}>Thêm IMEI</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng IMEI</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Có sẵn</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã bán</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sold}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đặt trước</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lỗi</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.defective}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trả lại</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.returned}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Danh sách IMEI</TabsTrigger>
          <TabsTrigger value="tracking">Theo dõi vòng đời</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm theo IMEI, sản phẩm, khách hàng, đơn hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterProduct} onValueChange={setFilterProduct}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Lọc theo sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả sản phẩm</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Lọc theo trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="available">Có sẵn</SelectItem>
                    <SelectItem value="sold">Đã bán</SelectItem>
                    <SelectItem value="reserved">Đặt trước</SelectItem>
                    <SelectItem value="defective">Lỗi</SelectItem>
                    <SelectItem value="returned">Trả lại</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="ml-2">Đang tải...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IMEI</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Đơn hàng</TableHead>
                      <TableHead>Ngày bán</TableHead>
                      <TableHead>Ghi chú</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIMEIs.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-sm">{record.imei}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.productName}</p>
                            <p className="text-sm text-gray-500">{record.variantInfo}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{record.sku}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>
                          {record.customerName ? (
                            <div>
                              <p className="font-medium">{record.customerName}</p>
                              <p className="text-sm text-gray-500">{record.customerId}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.orderId ? (
                            <span className="font-mono text-sm">{record.orderId}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.saleDate ? (
                            <span className="text-sm">{record.saleDate}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.notes ? (
                            <span className="text-sm" title={record.notes}>
                              {record.notes.length > 20 ? `${record.notes.substring(0, 20)}...` : record.notes}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedIMEI(record)
                                console.log("Viewing IMEI details:", record)
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedIMEI(record)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                  <DialogTitle>Chỉnh sửa IMEI</DialogTitle>
                                  <DialogDescription>Cập nhật thông tin IMEI {selectedIMEI?.imei}</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div>
                                    <Label>IMEI</Label>
                                    <Input defaultValue={selectedIMEI?.imei} disabled className="bg-gray-50" />
                                  </div>
                                  <div>
                                    <Label>Trạng thái</Label>
                                    <Select defaultValue={selectedIMEI?.status}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="available">Có sẵn</SelectItem>
                                        <SelectItem value="sold">Đã bán</SelectItem>
                                        <SelectItem value="reserved">Đặt trước</SelectItem>
                                        <SelectItem value="defective">Lỗi</SelectItem>
                                        <SelectItem value="returned">Trả lại</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Ghi chú</Label>
                                    <Textarea defaultValue={selectedIMEI?.notes} />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                    Hủy
                                  </Button>
                                  <Button onClick={handleEditIMEI}>Lưu thay đổi</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteIMEI(record.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle>Theo dõi vòng đời IMEI</CardTitle>
              <p className="text-sm text-gray-600">Nhập IMEI để xem lịch sử chi tiết từ lúc nhập kho đến khi bán</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input placeholder="Nhập IMEI để tra cứu..." className="flex-1" />
                  <Button>Tra cứu</Button>
                </div>
                <div className="text-center py-8 text-gray-500">
                  <Smartphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nhập IMEI để xem lịch sử chi tiết</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
   