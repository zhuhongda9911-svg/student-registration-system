import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, Users, Briefcase, Home as HomeIcon } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: activities, isLoading } = trpc.activities.list.useQuery();
  const { user } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.reload();
  };

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
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/platform")}>
              <Briefcase className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">江苏综评·锐鲤升学</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/platform")}>
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
        {!activities || activities.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>暂无活动</CardTitle>
              <CardDescription>目前没有开放报名的活动，请稍后再来查看</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <Card key={activity.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{activity.title}</CardTitle>
                  {activity.description && (
                    <CardDescription className="line-clamp-3">{activity.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">活动费用</span>
                      <span className="text-2xl font-bold text-primary">¥{activity.price}</span>
                    </div>
                    
                    {activity.contactPerson && (
                      <div className="flex items-center text-sm">
                        <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">联系人：</span>
                        <span className="ml-1">{activity.contactPerson}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">发布时间：</span>
                      <span className="ml-1">
                        {new Date(activity.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => setLocation(`/register/${activity.id}`)}
                  >
                    立即报名
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>


    </div>
  );
}
