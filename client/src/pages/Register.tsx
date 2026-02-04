import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  studentName: z.string().min(1, "请输入学生姓名"),
  studentGender: z.enum(["男", "女"], { message: "请选择性别" }),
  studentSchool: z.string().min(1, "请输入学校名称"),
  studentGrade: z.string().min(1, "请选择年级"),
  studentClass: z.string().min(1, "请选择班级"),
  studentIdCard: z.string().optional(),
  guardianName: z.string().min(1, "请输入监护人姓名"),
  guardianPhone: z.string().min(11, "请输入有效的手机号码").max(11, "请输入有效的手机号码"),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const grades = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "初一", "初二", "初三", "高一", "高二", "高三"];
const classes = ["1班", "2班", "3班", "4班", "5班", "6班", "7班", "8班", "9班", "10班", "11班", "12班", "13班", "14班", "15班", "16班", "17班", "18班", "19班", "20班"];

export default function Register() {
  const [, params] = useRoute("/register/:activityId");
  const activityId = params?.activityId ? parseInt(params.activityId) : null;
  const [, setLocation] = useLocation();
  
  const { data: activity, isLoading: activityLoading } = trpc.activities.getById.useQuery(
    { id: activityId! },
    { enabled: !!activityId }
  );

  const createRegistration = trpc.registrations.create.useMutation({
    onSuccess: (data) => {
      toast.success("报名信息提交成功");
      // Redirect to payment page
      setLocation(`/payment/${data.registrationId}`);
    },
    onError: (error) => {
      toast.error(error.message || "提交失败，请重试");
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentName: "",
      studentGender: undefined,
      studentSchool: "",
      studentGrade: "",
      studentClass: "",
      studentIdCard: "",
      guardianName: "",
      guardianPhone: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      remarks: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!activityId) {
      toast.error("活动ID无效");
      return;
    }

    createRegistration.mutate({
      activityId,
      ...values,
    });
  };

  if (activityLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>活动不存在</CardTitle>
            <CardDescription>您访问的活动不存在或已关闭</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Activity Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{activity.title}</CardTitle>
            {activity.description && (
              <CardDescription className="text-base">{activity.description}</CardDescription>
            )}
            <div className="pt-4 border-t mt-4">
              <p className="text-2xl font-bold text-primary">
                活动费用: ¥{activity.price}
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>报名信息</CardTitle>
            <CardDescription>请如实填写以下信息，带*为必填项</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Student Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">学生信息</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="studentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>学生姓名 *</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入学生姓名" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="studentGender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>性别 *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="请选择性别" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="男">男</SelectItem>
                              <SelectItem value="女">女</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="studentSchool"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>学校 *</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：淮阴中学" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="studentGrade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>年级 *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="请选择年级" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {grades.map((grade) => (
                                <SelectItem key={grade} value={grade}>
                                  {grade}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="studentClass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>班级 *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="请选择班级" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {classes.map((cls) => (
                                <SelectItem key={cls} value={cls}>
                                  {cls}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="studentIdCard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>身份证号</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入18位身份证号（选填）" maxLength={18} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Guardian Information Section */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-foreground">监护人信息</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guardianName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>监护人姓名 *</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入监护人姓名" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guardianPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>监护人电话 *</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入手机号码" maxLength={11} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Emergency Contact Section */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-foreground">紧急联系人</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>紧急联系人姓名</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入紧急联系人姓名（选填）" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>紧急联系人电话</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入手机号码（选填）" maxLength={11} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Remarks Section */}
                <div className="space-y-4 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>备注</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="如有其他需要说明的信息，请在此填写（选填）" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg"
                  disabled={createRegistration.isPending}
                >
                  {createRegistration.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    "提交报名信息"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
