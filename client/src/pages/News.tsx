import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Calendar, Eye, Briefcase, Home as HomeIcon } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function News() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  
  const { user } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.reload();
  };

  const { data: newsList, isLoading } = trpc.news.list.useQuery({
    category,
    search: search || undefined,
  });

  const { data: categories } = trpc.news.getCategories.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
              <Briefcase className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">江苏综评·锐鲲升学</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
              <HomeIcon className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">欢迎，{user.name}</span>
              {user.role === "admin" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/admin")}
                >
                  后台管理
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                退出
              </Button>
            </div>
          ) : (
            <Button onClick={() => (window.location.href = getLoginUrl())}>
              登录
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">升学资讯</h2>
          <p className="text-gray-600">最新的政策解读、招生信息、考试动态</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="搜索资讯标题或内容..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={category} onValueChange={(value) => setCategory(value === "all" ? undefined : value)}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* News List */}
        {!newsList || newsList.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>暂无资讯</CardTitle>
              <CardDescription>目前没有发布的升学资讯，请稍后再来查看</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsList.map((news) => (
              <Card 
                key={news.id} 
                className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/news/${news.id}`)}
              >
                {news.coverImage && (
                  <div className="w-full h-48 overflow-hidden rounded-t-lg">
                    <img 
                      src={news.coverImage} 
                      alt={news.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {news.category}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-2">{news.title}</CardTitle>
                  {news.summary && (
                    <CardDescription className="line-clamp-3">{news.summary}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(news.publishDate).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{news.viewCount}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
