import { useState, ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LayoutDashboard, Calendar, Users, LogOut, Newspaper, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { data: adminSession, isLoading: adminLoading } = trpc.admin.me.useQuery();
  const logout = trpc.admin.logout.useMutation({
    onSuccess: () => {
      toast.success("已退出登录");
      window.location.href = "/admin/login";
    },
  });

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  useEffect(() => {
    if (!adminLoading && !adminSession) {
      window.location.href = '/admin/login';
    }
  }, [adminLoading, adminSession]);

  if (!adminSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const menuItems = [
    { path: "/admin", icon: LayoutDashboard, label: "概览" },
    { path: "/admin/activities", icon: Calendar, label: "活动管理" },
    { path: "/admin/registrations", icon: Users, label: "报名管理" },
    { path: "/admin/news", icon: Newspaper, label: "升学资讯" },
    { path: "/admin/admins", icon: Shield, label: "管理员管理" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">研学活动管理后台</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {adminSession?.name || adminSession?.username}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              退出
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-3 lg:col-span-2">
            <Card>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path;
                    return (
                      <Button
                        key={item.path}
                        variant={isActive ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setLocation(item.path)}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="col-span-12 md:col-span-9 lg:col-span-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
