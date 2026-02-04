import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Edit, Loader2 } from "lucide-react";

const activitySchema = z.object({
  title: z.string().min(1, "请输入活动标题"),
  description: z.string().optional(),
  price: z.string().min(1, "请输入活动价格"),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactWechat: z.string().optional(),
  itinerary: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

export default function Activities() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<number | null>(null);

  const { data: activities, isLoading, refetch } = trpc.activities.listAll.useQuery();
  const utils = trpc.useUtils();

  const createActivity = trpc.activities.create.useMutation({
    onSuccess: () => {
      toast.success("活动创建成功");
      setIsDialogOpen(false);
      form.reset();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "创建失败");
    },
  });

  const updateActivity = trpc.activities.update.useMutation({
    onSuccess: () => {
      toast.success("活动更新成功");
      setIsDialogOpen(false);
      setEditingActivity(null);
      form.reset();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "更新失败");
    },
  });

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      contactPerson: "",
      contactPhone: "",
      contactWechat: "",
      itinerary: "",
      isActive: true,
    },
  });

  const onSubmit = (values: ActivityFormValues) => {
    if (editingActivity) {
      updateActivity.mutate({ id: editingActivity, ...values });
    } else {
      createActivity.mutate(values);
    }
  };

  const handleEdit = (activity: any) => {
    setEditingActivity(activity.id);
    form.reset({
      title: activity.title,
      description: activity.description || "",
      price: activity.price,
      contactPerson: activity.contactPerson || "",
      contactPhone: activity.contactPhone || "",
      contactWechat: activity.contactWechat || "",
      itinerary: activity.itinerary || "",
      isActive: activity.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingActivity(null);
    form.reset({
      title: "",
      description: "",
      price: "",
      contactPerson: "",
      contactPhone: "",
      contactWechat: "",
      itinerary: "",
      isActive: true,
    });
    setIsDialogOpen(true);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">活动管理</h1>
          <p className="text-muted-foreground mt-2">创建和管理研学活动</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          创建活动
        </Button>
      </div>

      {!activities || activities.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>暂无活动</CardTitle>
            <CardDescription>点击"创建活动"按钮开始创建您的第一个活动</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activities.map((activity) => (
            <Card key={activity.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{activity.title}</CardTitle>
                    {activity.description && (
                      <CardDescription className="line-clamp-2 mt-2">
                        {activity.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={activity.isActive ? "default" : "secondary"}>
                    {activity.isActive ? "进行中" : "已关闭"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">活动费用</span>
                  <span className="font-bold text-primary text-lg">¥{activity.price}</span>
                </div>
                
                {activity.contactPerson && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">联系人</span>
                    <span>{activity.contactPerson}</span>
                  </div>
                )}
                
                {activity.contactPhone && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">联系电话</span>
                    <span>{activity.contactPhone}</span>
                  </div>
                )}
                
                {activity.contactWechat && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">微信</span>
                    <span>{activity.contactWechat}</span>
                  </div>
                )}
                
                <div className="pt-3 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleEdit(activity)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    编辑活动
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingActivity ? "编辑活动" : "创建活动"}</DialogTitle>
            <DialogDescription>
              {editingActivity ? "修改活动信息" : "填写活动信息并创建新活动"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>活动标题 *</FormLabel>
                    <FormControl>
                      <Input placeholder="例如：东大筑韵 南航逐梦 南京一日研学" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>活动说明</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="活动简介和说明"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>活动费用 *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="例如：980.00"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>单位：元</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">联系方式</h3>
                
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>联系人</FormLabel>
                      <FormControl>
                        <Input placeholder="活动负责人姓名" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>联系电话</FormLabel>
                      <FormControl>
                        <Input placeholder="联系电话" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactWechat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>微信号</FormLabel>
                      <FormControl>
                        <Input placeholder="微信号" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="itinerary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>行程介绍</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="详细的行程安排和介绍"
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">开放报名</FormLabel>
                      <FormDescription>
                        关闭后用户将无法报名此活动
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingActivity(null);
                    form.reset();
                  }}
                >
                  取消
                </Button>
                <Button 
                  type="submit"
                  disabled={createActivity.isPending || updateActivity.isPending}
                >
                  {(createActivity.isPending || updateActivity.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    editingActivity ? "保存修改" : "创建活动"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
