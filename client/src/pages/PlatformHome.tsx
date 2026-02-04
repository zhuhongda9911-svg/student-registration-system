import { useLocation } from "wouter";
import { BookOpen, Trophy, Briefcase, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function PlatformHome() {
  const [, setLocation] = useLocation();
  
  // 获取活动数量
  const { data: activities } = trpc.activities.list.useQuery();
  const projectCount = activities?.length || 0;

  const sections = [
    {
      id: "news",
      title: "升学资讯",
      description: "最新的政策解读、招生信息、考试动态",
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      count: "3",
      action: () => setLocation("/news"),
    },
    {
      id: "competitions",
      title: "竞赛资讯",
      description: "白名单竞赛实时进度、成绩公布、报名信息",
      icon: Trophy,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      count: "47",
      action: () => setLocation("/competitions"),
    },
    {
      id: "projects",
      title: "研学项目",
      description: "正在招生的研学项目、往届活动回顾、照片下载",
      icon: Briefcase,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      count: projectCount.toString(),
      action: () => setLocation("/activities"),
    },
    {
      id: "courses",
      title: "名师提分",
      description: "在职老师课外辅导、课程计划、班级信息",
      icon: Users,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      count: "12",
      action: () => setLocation("/courses"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🎓 江苏升学规划导师平台
          </h1>
          <p className="text-xl text-blue-100">
            为高一至高三学生提供专业的升学规划、志愿填报、竞赛指导等全方位服务
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Section Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
                onClick={section.action}
              >
                <div className={`h-2 bg-gradient-to-r ${section.color}`}></div>
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${section.bgColor} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${section.textColor}`} />
                    </div>
                    <div className={`text-3xl font-bold ${section.textColor}`}>
                      {section.count}
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{section.title}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      section.action();
                    }}
                  >
                    进入板块 <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white mb-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold mb-2">有任何问题？</h3>
            <p className="text-blue-100">联系我们的专业团队获取个性化升学规划建议</p>
          </div>
          <Button
            onClick={() => window.location.href = "tel:13338919911"}
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3"
          >
            联系我们
          </Button>
        </div>

        {/* Features Section */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-12 border border-indigo-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">平台特色</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-3">📱</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">在线报名</h3>
              <p className="text-gray-600">
                一键报名研学项目、名师课程，随时随地完成报名流程
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-3">🔄</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">实时更新</h3>
              <p className="text-gray-600">
                竞赛进度、成绩公布、政策变化，第一时间推送给您
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-3">📚</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">资源丰富</h3>
              <p className="text-gray-600">
                往届活动回顾、照片下载、课程资料，应有尽有
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
