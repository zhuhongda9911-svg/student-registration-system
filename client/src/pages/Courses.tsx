import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Users, Home as HomeIcon } from "lucide-react";

export default function Courses() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const { data: courses, isLoading } = trpc.courses.list.useQuery({
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
            <h1 className="text-2xl font-bold text-gray-900">名师提分</h1>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
              <HomeIcon className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">名师课程</h2>
          <p className="text-gray-600">在职教师课外辅导、提分课程</p>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input placeholder="搜索课程或教师..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>

        {!courses || courses.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>暂无课程信息</CardTitle>
              <CardDescription>目前没有发布的课程</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation(`/courses/${course.id}`)}>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default">{course.subject}</Badge>
                    <Badge variant="outline">{course.courseType}</Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  <CardDescription>{course.teacherName} · {course.grade}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  {course.description && <p className="text-sm text-gray-600 line-clamp-3 mb-4">{course.description}</p>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>{course.currentStudents}/{course.maxStudents || "不限"}</span>
                    </div>
                    <div className="text-lg font-bold text-primary">¥{course.price}</div>
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
