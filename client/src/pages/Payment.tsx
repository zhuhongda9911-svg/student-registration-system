import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function Payment() {
  const [, params] = useRoute("/payment/:registrationId");
  const registrationId = params?.registrationId ? parseInt(params.registrationId) : null;
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: registration, isLoading: registrationLoading } = trpc.registrations.getById.useQuery(
    { id: registrationId! },
    { enabled: !!registrationId }
  );

  const { data: activity, isLoading: activityLoading } = trpc.activities.getById.useQuery(
    { id: registration?.activityId! },
    { enabled: !!registration?.activityId }
  );

  const createPaymentIntent = trpc.payments.createIntent.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("正在跳转到支付页面...");
        // Open Stripe Checkout in new tab
        window.open(data.checkoutUrl, "_blank");
        setIsProcessing(false);
      }
    },
    onError: (error) => {
      toast.error(error.message || "支付创建失败");
      setIsProcessing(false);
    },
  });

  const handlePayment = () => {
    if (!registrationId) {
      toast.error("报名ID无效");
      return;
    }

    setIsProcessing(true);
    createPaymentIntent.mutate({ 
      registrationId,
      origin: window.location.origin,
    });
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
            <CardDescription>找不到相关报名信息</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (registration.paymentStatus === "paid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-center">已完成支付</CardTitle>
            <CardDescription className="text-center">该报名已支付完成</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => setLocation(`/receipt/${registrationId}`)}
            >
              查看回执
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">支付确认</CardTitle>
            <CardDescription>请确认以下信息并完成支付</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Activity Info */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">活动信息</h3>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="font-medium">活动名称：</span>
                  {activity.title}
                </p>
                {activity.description && (
                  <p className="text-sm">
                    <span className="font-medium">活动说明：</span>
                    {activity.description}
                  </p>
                )}
              </div>
            </div>

            {/* Student Info */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">学生信息</h3>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="font-medium">姓名：</span>
                  {registration.studentName}
                </p>
                <p className="text-sm">
                  <span className="font-medium">性别：</span>
                  {registration.studentGender}
                </p>
                <p className="text-sm">
                  <span className="font-medium">学校：</span>
                  {registration.studentSchool}
                </p>
                <p className="text-sm">
                  <span className="font-medium">年级班级：</span>
                  {registration.studentGrade} {registration.studentClass}
                </p>
              </div>
            </div>

            {/* Guardian Info */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">监护人信息</h3>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="font-medium">姓名：</span>
                  {registration.guardianName}
                </p>
                <p className="text-sm">
                  <span className="font-medium">电话：</span>
                  {registration.guardianPhone}
                </p>
              </div>
            </div>

            {/* Payment Amount */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xl font-semibold">支付金额</span>
                <span className="text-3xl font-bold text-primary">
                  ¥{registration.paymentAmount}
                </span>
              </div>

              <Button 
                className="w-full h-12 text-lg"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    处理中...
                  </>
                ) : (
                  "确认支付"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                点击"确认支付"后将跳转到支付页面
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
