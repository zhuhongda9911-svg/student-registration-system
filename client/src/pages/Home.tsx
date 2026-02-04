import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, Users } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: activities, isLoading } = trpc.activities.list.useQuery();

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
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container py-6">
          <h1 className="text-3xl font-bold text-primary">研学活动报名系统</h1>
          <p className="text-muted-foreground mt-2">选择您感兴趣的活动进行报名</p>
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

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm mt-12">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>研学活动报名系统 © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
