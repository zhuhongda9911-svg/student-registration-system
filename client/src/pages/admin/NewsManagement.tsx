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
import { Plus, Edit, Trash2, Loader2, Calendar, Eye } from "lucide-react";

const newsSchema = z.object({
  title: z.string().min(1, "请输入标题"),
  summary: z.string().optional(),
  content: z.string().min(1, "请输入内容"),
  category: z.string().min(1, "请输入分类"),
  coverImage: z.string().optional(),
  author: z.string().optional(),
  source: z.string().optional(),
  publishDate: z.string().min(1, "请选择发布日期"),
  isPublished: z.boolean().default(true),
});

type NewsFormValues = z.infer<typeof newsSchema>;

export default function NewsManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<number | null>(null);

  const { data: newsList, isLoading, refetch } = trpc.news.listAll.useQuery();
  
  const createNews = trpc.news.create.useMutation({
    onSuccess: () => {
      toast.success("资讯创建成功");
      setIsDialogOpen(false);
      form.reset();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "创建失败");
    },
  });

  const updateNews = trpc.news.update.useMutation({
    onSuccess: () => {
      toast.success("资讯更新成功");
      setIsDialogOpen(false);
      setEditingNews(null);
      form.reset();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "更新失败");
    },
  });

  const deleteNews = trpc.news.delete.useMutation({
    onSuccess: () => {
      toast.success("资讯删除成功");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "删除失败");
    },
  });

  const form = useForm({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: "",
      summary: "",
      content: "",
      category: "",
      coverImage: "",
      author: "",
      source: "",
      publishDate: new Date().toISOString().split('T')[0],
      isPublished: true,
    } as NewsFormValues,
  });

  const onSubmit = (values: NewsFormValues) => {
    if (editingNews) {
      updateNews.mutate({ id: editingNews, ...values });
    } else {
      createNews.mutate(values);
    }
  };

  const handleEdit = (news: any) => {
    setEditingNews(news.id);
    form.reset({
      title: news.title,
      summary: news.summary || "",
      content: news.content,
      category: news.category,
      coverImage: news.coverImage || "",
      author: news.author || "",
      source: news.source || "",
      publishDate: new Date(news.publishDate).toISOString().split('T')[0],
      isPublished: news.isPublished,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingNews(null);
    form.reset({
      title: "",
      summary: "",
      content: "",
      category: "",
      coverImage: "",
      author: "",
      source: "",
      publishDate: new Date().toISOString().split('T')[0],
      isPublished: true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这条资讯吗？")) {
      deleteNews.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">升学资讯管理</h2>
          <p className="text-muted-foreground">管理升学政策、招生信息、考试动态等资讯</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          新建资讯
        </Button>
      </div>

      {!newsList || newsList.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>暂无资讯</CardTitle>
            <CardDescription>点击"新建资讯"按钮创建第一条资讯</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {newsList.map((news) => (
            <Card key={news.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={news.isPublished ? "default" : "secondary"}>
                        {news.isPublished ? "已发布" : "草稿"}
                      </Badge>
                      <Badge variant="outline">{news.category}</Badge>
                    </div>
                    <CardTitle className="text-xl">{news.title}</CardTitle>
                    {news.summary && (
                      <CardDescription className="mt-2">{news.summary}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(news)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(news.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  {news.author && (
                    <span>作者：{news.author}</span>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(news.publishDate).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{news.viewCount} 次阅读</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNews ? "编辑资讯" : "新建资讯"}</DialogTitle>
            <DialogDescription>
              填写资讯的详细信息
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>标题 *</FormLabel>
                    <FormControl>
                      <Input placeholder="输入资讯标题" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>分类 *</FormLabel>
                    <FormControl>
                      <Input placeholder="例如：政策解读、招生信息、考试动态" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>摘要</FormLabel>
                    <FormControl>
                      <Textarea placeholder="简要描述资讯内容" rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>内容 *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="输入资讯正文" rows={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>作者</FormLabel>
                      <FormControl>
                        <Input placeholder="作者姓名" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>来源</FormLabel>
                      <FormControl>
                        <Input placeholder="信息来源" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="coverImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>封面图片</FormLabel>
                    <FormControl>
                      <Input placeholder="图片URL" {...field} />
                    </FormControl>
                    <FormDescription>
                      输入图片的完整URL地址
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="publishDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>发布日期 *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">发布状态</FormLabel>
                      <FormDescription>
                        关闭后资讯将不会在前台显示
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={createNews.isPending || updateNews.isPending}>
                  {(createNews.isPending || updateNews.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingNews ? "更新" : "创建"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
