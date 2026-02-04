import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Printer } from "lucide-react";

export default function Receipt() {
  const [, params] = useRoute("/receipt/:registrationId");
  const registrationId = params?.registrationId ? parseInt(params.registrationId) : null;

  const { data: registration, isLoading: registrationLoading } = trpc.registrations.getById.useQuery(
    { id: registrationId! },
    { enabled: !!registrationId }
  );

  const { data: activity, isLoading: activityLoading } = trpc.activities.getById.useQuery(
    { id: registration?.activityId! },
    { enabled: !!registration?.activityId }
  );

  const handlePrint = () => {
    window.print();
  };

  if (registrationLoading || activityLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!registration || !activity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>信息不存在</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Print Button - Hidden when printing */}
        <div className="mb-6 print:hidden">
          <Button onClick={handlePrint} className="w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" />
            打印回执
          </Button>
        </div>

        {/* Receipt Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center border-b bg-primary/5">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl">报名成功</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              报名编号：{registration.id}
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Activity Information */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold border-b pb-2">活动信息</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">活动名称</span>
                  <span className="font-medium text-right">{activity.title}</span>
                </div>
                {activity.description && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">活动说明</span>
                    <span className="font-medium text-right max-w-md">{activity.description}</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">活动费用</span>
                  <span className="font-bold text-primary text-lg">¥{registration.paymentAmount}</span>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold border-b pb-2">学生信息</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">姓名</span>
                  <span className="font-medium">{registration.studentName}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">性别</span>
                  <span className="font-medium">{registration.studentGender}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">学校</span>
                  <span className="font-medium">{registration.studentSchool}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">年级班级</span>
                  <span className="font-medium">{registration.studentGrade} {registration.studentClass}</span>
                </div>
                {registration.studentIdCard && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">身份证号</span>
                    <span className="font-medium">{registration.studentIdCard}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Guardian Information */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold border-b pb-2">监护人信息</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">姓名</span>
                  <span className="font-medium">{registration.guardianName}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">联系电话</span>
                  <span className="font-medium">{registration.guardianPhone}</span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            {(registration.emergencyContactName || registration.emergencyContactPhone) && (
              <div className="space-y-3">
                <h3 className="text-xl font-semibold border-b pb-2">紧急联系人</h3>
                <div className="space-y-2">
                  {registration.emergencyContactName && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">姓名</span>
                      <span className="font-medium">{registration.emergencyContactName}</span>
                    </div>
                  )}
                  {registration.emergencyContactPhone && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">联系电话</span>
                      <span className="font-medium">{registration.emergencyContactPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Contact Information */}
            {(activity.contactPerson || activity.contactPhone || activity.contactWechat) && (
              <div className="space-y-3">
                <h3 className="text-xl font-semibold border-b pb-2">活动联系方式</h3>
                <div className="space-y-2">
                  {activity.contactPerson && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">联系人</span>
                      <span className="font-medium">{activity.contactPerson}</span>
                    </div>
                  )}
                  {activity.contactPhone && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">联系电话</span>
                      <span className="font-medium">{activity.contactPhone}</span>
                    </div>
                  )}
                  {activity.contactWechat && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">微信</span>
                      <span className="font-medium">{activity.contactWechat}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Itinerary */}
            {activity.itinerary && (
              <div className="space-y-3">
                <h3 className="text-xl font-semibold border-b pb-2">行程介绍</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{activity.itinerary}</p>
                </div>
              </div>
            )}

            {/* Remarks */}
            {registration.remarks && (
              <div className="space-y-3">
                <h3 className="text-xl font-semibold border-b pb-2">备注</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="whitespace-pre-wrap text-sm">{registration.remarks}</p>
                </div>
              </div>
            )}

            {/* Payment Status */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-700 font-semibold">
                {registration.paymentStatus === "paid" ? "✓ 已支付" : "待支付"}
              </p>
              <p className="text-sm text-green-600 mt-1">
                报名时间：{new Date(registration.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note - Hidden when printing */}
        <div className="mt-6 text-center text-sm text-muted-foreground print:hidden">
          <p>请妥善保存此回执，如有疑问请联系活动负责人</p>
        </div>
      </div>
    </div>
  );
}
