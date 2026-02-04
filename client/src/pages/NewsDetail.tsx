import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, ArrowLeft, Calendar, Eye, User, Link as LinkIcon } from "lucide-react";

export default function NewsDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const newsId = parseInt(params.id || "0");

  const { data: news, isLoading } = trpc.news.getById.useQuery({ id: newsId });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">资讯不存在</h2>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/news")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回列表
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container py-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/news")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </Button>

        <Card className="max-w-4xl mx-auto">
          {news.coverImage && (
            <div className="w-full h-96 overflow-hidden rounded-t-lg">
              <img 
                src={news.coverImage} 
                alt={news.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded">
                {news.category}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900">{news.title}</h1>
            
            {news.summary && (
              <p className="text-lg text-gray-600">{news.summary}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 pt-4 border-t">
              {news.author && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{news.author}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(news.publishDate).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{news.viewCount} 次阅读</span>
              </div>
              {news.source && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  <span>来源：{news.source}</span>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="prose prose-lg max-w-none">
            <div 
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: news.content.replace(/\n/g, '<br />') }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
