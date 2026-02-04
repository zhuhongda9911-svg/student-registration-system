import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, Users, Newspaper, Trophy, GraduationCap, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: activities } = trpc.activities.listAll.useQuery();
  const { data: registrationsData } = trpc.registrations.search.useQuery({ page: 1, pageSize: 1000 });
  const registrations = registrationsData?.items || [];
  const { data: news } = trpc.news.list.useQuery();
  const { data: competitions } = trpc.competitions.list.useQuery();
  const { data: courses } = trpc.courses.list.useQuery();

  const stats = [
    {
      title: "研学活动",
      value: activities?.length || 0,
      description: "正在进行的活动",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      path: "/admin/activities",
    },
    {
      title: "报名人数",
      value: registrations?.length || 0,
      description: "总报名人数",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
      path: "/admin/registrations",
    },
    {
      title: "升学资讯",
      value: news?.length || 0,
      description: "已发布的资讯",
      icon: Newspaper,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      path: "/admin/news",
    },
    {
      title: "竞赛资讯",
      value: competitions?.length || 0,
      description: "竞赛信息",
      icon: Trophy,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      path: "/admin/competitions",
    },
    {
      title: "名师课程",
      value: courses?.length || 0,
      description: "课程数量",
      icon: GraduationCap,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      path: "/admin/courses",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">管理后台概览</h2>
        <p className="text-muted-foreground mt-2">
          欢迎回来！这里是您的平台数据概览
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.title} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setLocation(stat.path)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>常用功能快捷入口</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button 
              onClick={() => setLocation("/admin/activities")}
              className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">管理研学活动</div>
                  <div className="text-sm text-muted-foreground">创建和编辑活动信息</div>
                </div>
              </div>
            </button>
            <button 
              onClick={() => setLocation("/admin/registrations")}
              className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">查看报名数据</div>
                  <div className="text-sm text-muted-foreground">管理和导出报名信息</div>
                </div>
              </div>
            </button>
            <button 
              onClick={() => setLocation("/admin/news")}
              className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Newspaper className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium">发布升学资讯</div>
                  <div className="text-sm text-muted-foreground">添加最新的升学政策和信息</div>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>系统提示</CardTitle>
            <CardDescription>重要通知和建议</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-900">定期更新内容</div>
                <div className="text-blue-700 mt-1">
                  建议每周至少发布2-3篇升学资讯，保持平台活跃度
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50">
              <Users className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-green-900">关注报名数据</div>
                <div className="text-green-700 mt-1">
                  及时查看和处理新的报名信息，提升用户体验
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
