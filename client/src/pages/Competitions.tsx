import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Calendar, Eye, Trophy, Home as HomeIcon } from "lucide-react";

export default function Competitions() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();

  const { data: competitions, isLoading } = trpc.competitions.list.useQuery({
    level,
    status,
    search: search || undefined,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">竞赛资讯</h1>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/platform")}>
              <HomeIcon className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">竞赛信息</h2>
          <p className="text-gray-600">白名单竞赛、报名信息、成绩公布</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input placeholder="搜索竞赛名称..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={level} onValueChange={(value) => setLevel(value === "all" ? undefined : value)}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="选择级别" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部级别</SelectItem>
              <SelectItem value="国家级">国家级</SelectItem>
              <SelectItem value="省级">省级</SelectItem>
              <SelectItem value="市级">市级</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(value) => setStatus(value === "all" ? undefined : value)}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="选择状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="即将开始">即将开始</SelectItem>
              <SelectItem value="报名中">报名中</SelectItem>
              <SelectItem value="进行中">进行中</SelectItem>
              <SelectItem value="已结束">已结束</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!competitions || competitions.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>暂无竞赛信息</CardTitle>
              <CardDescription>目前没有发布的竞赛信息</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.map((comp) => (
              <Card key={comp.id} className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation(`/competitions/${comp.id}`)}>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {comp.isWhitelisted && <Badge variant="default">白名单</Badge>}
                    {comp.level && <Badge variant="outline">{comp.level}</Badge>}
                    <Badge variant={comp.status === "报名中" ? "default" : "secondary"}>{comp.status}</Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{comp.name}</CardTitle>
                  {comp.organizer && <CardDescription>{comp.organizer}</CardDescription>}
                </CardHeader>
                <CardContent className="flex-1">
                  {comp.description && <p className="text-sm text-gray-600 line-clamp-3 mb-4">{comp.description}</p>}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{comp.viewCount}</span>
                    </div>
                    {comp.competitionDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(comp.competitionDate).toLocaleDateString('zh-CN')}</span>
                      </div>
                    )}
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
