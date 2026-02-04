import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Download, Trash2, Loader2, Eye, ChevronLeft, ChevronRight } from "lucide-react";

export default function Registrations() {
  const [searchName, setSearchName] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewingRegistration, setViewingRegistration] = useState<any>(null);

  const { data: activities } = trpc.activities.listAll.useQuery();
  
  const { data: registrationsData, isLoading, refetch } = trpc.registrations.search.useQuery({
    activityId: selectedActivity === "all" ? undefined : parseInt(selectedActivity),
    studentName: searchName || undefined,
    paymentStatus: selectedStatus === "all" ? undefined : selectedStatus,
    page: currentPage,
    pageSize: 20,
  });

  const deleteRegistrations = trpc.registrations.batchDelete.useMutation({
    onSuccess: () => {
      toast.success("删除成功");
      setSelectedIds([]);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "删除失败");
    },
  });

  const handleSearch = () => {
    setCurrentPage(1);
    refetch();
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      toast.error("请选择要删除的记录");
      return;
    }

    if (confirm(`确定要删除选中的 ${selectedIds.length} 条记录吗？`)) {
      deleteRegistrations.mutate({ ids: selectedIds });
    }
  };

  const handleExport = () => {
    if (!registrationsData?.items || registrationsData.items.length === 0) {
      toast.error("没有数据可导出");
      return;
    }

    // Simple CSV export
    const headers = ["报名编号", "学生姓名", "性别", "学校", "年级", "班级", "监护人", "联系电话", "支付状态", "报名时间"];
    const rows = registrationsData.items.map(r => [
      r.id,
      r.studentName,
      r.studentGender,
      r.studentSchool,
      r.studentGrade,
      r.studentClass,
      r.guardianName,
      r.guardianPhone,
      r.paymentStatus === "paid" ? "已支付" : r.paymentStatus === "pending" ? "待支付" : "已退款",
      new Date(r.createdAt).toLocaleString('zh-CN'),
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `报名数据_${new Date().toLocaleDateString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("数据导出成功");
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === registrationsData?.items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(registrationsData?.items.map(r => r.id) || []);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-green-500">已支付</Badge>;
      case "pending":
        return <Badge variant="secondary">待支付</Badge>;
      case "refunded":
        return <Badge variant="outline">已退款</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">报名管理</h1>
        <p className="text-muted-foreground mt-2">查看和管理学生报名数据</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">学生姓名</label>
              <Input
                placeholder="输入学生姓名"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">活动</label>
              <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                <SelectTrigger>
                  <SelectValue placeholder="选择活动" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部活动</SelectItem>
                  {activities?.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id.toString()}>
                      {activity.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">支付状态</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待支付</SelectItem>
                  <SelectItem value="paid">已支付</SelectItem>
                  <SelectItem value="refunded">已退款</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button onClick={handleSearch} className="w-full">
                <Search className="mr-2 h-4 w-4" />
                搜索
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedIds.length > 0 ? (
            <span>已选择 {selectedIds.length} 条记录</span>
          ) : (
            <span>共 {registrationsData?.total || 0} 条记录</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            导出数据
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={selectedIds.length === 0 || deleteRegistrations.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            删除选中
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === registrationsData?.items.length && registrationsData?.items.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>编号</TableHead>
                <TableHead>学生姓名</TableHead>
                <TableHead>学校</TableHead>
                <TableHead>年级班级</TableHead>
                <TableHead>监护人</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>支付状态</TableHead>
                <TableHead>报名时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!registrationsData?.items || registrationsData.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                registrationsData.items.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(registration.id)}
                        onCheckedChange={() => toggleSelect(registration.id)}
                      />
                    </TableCell>
                    <TableCell>{registration.id}</TableCell>
                    <TableCell className="font-medium">{registration.studentName}</TableCell>
                    <TableCell>{registration.studentSchool}</TableCell>
                    <TableCell>
                      {registration.studentGrade} {registration.studentClass}
                    </TableCell>
                    <TableCell>{registration.guardianName}</TableCell>
                    <TableCell>{registration.guardianPhone}</TableCell>
                    <TableCell>{getStatusBadge(registration.paymentStatus)}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(registration.createdAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingRegistration(registration)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {registrationsData && registrationsData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            第 {currentPage} / {registrationsData.totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(registrationsData.totalPages, p + 1))}
            disabled={currentPage === registrationsData.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={!!viewingRegistration} onOpenChange={() => setViewingRegistration(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>报名详情</DialogTitle>
            <DialogDescription>编号：{viewingRegistration?.id}</DialogDescription>
          </DialogHeader>

          {viewingRegistration && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold border-b pb-2">学生信息</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">姓名：</span>
                    <span className="font-medium">{viewingRegistration.studentName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">性别：</span>
                    <span className="font-medium">{viewingRegistration.studentGender}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">学校：</span>
                    <span className="font-medium">{viewingRegistration.studentSchool}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">年级班级：</span>
                    <span className="font-medium">
                      {viewingRegistration.studentGrade} {viewingRegistration.studentClass}
                    </span>
                  </div>
                  {viewingRegistration.studentIdCard && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">身份证号：</span>
                      <span className="font-medium">{viewingRegistration.studentIdCard}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold border-b pb-2">监护人信息</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">姓名：</span>
                    <span className="font-medium">{viewingRegistration.guardianName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">电话：</span>
                    <span className="font-medium">{viewingRegistration.guardianPhone}</span>
                  </div>
                </div>
              </div>

              {(viewingRegistration.emergencyContactName || viewingRegistration.emergencyContactPhone) && (
                <div className="space-y-2">
                  <h3 className="font-semibold border-b pb-2">紧急联系人</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {viewingRegistration.emergencyContactName && (
                      <div>
                        <span className="text-muted-foreground">姓名：</span>
                        <span className="font-medium">{viewingRegistration.emergencyContactName}</span>
                      </div>
                    )}
                    {viewingRegistration.emergencyContactPhone && (
                      <div>
                        <span className="text-muted-foreground">电话：</span>
                        <span className="font-medium">{viewingRegistration.emergencyContactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {viewingRegistration.remarks && (
                <div className="space-y-2">
                  <h3 className="font-semibold border-b pb-2">备注</h3>
                  <p className="text-sm bg-muted p-3 rounded">{viewingRegistration.remarks}</p>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-semibold border-b pb-2">支付信息</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">支付金额：</span>
                    <span className="font-bold text-primary">¥{viewingRegistration.paymentAmount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">支付状态：</span>
                    {getStatusBadge(viewingRegistration.paymentStatus)}
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">报名时间：</span>
                    <span className="font-medium">
                      {new Date(viewingRegistration.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  {viewingRegistration.ipAddress && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">IP地址：</span>
                      <span className="font-medium">{viewingRegistration.ipAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
