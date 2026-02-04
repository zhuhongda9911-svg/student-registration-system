import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminLayout from "./components/AdminLayout";
import Footer from "./components/Footer";
import PlatformHome from "./pages/PlatformHome";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Payment from "./pages/Payment";
import Receipt from "./pages/Receipt";
import Dashboard from "./pages/admin/Dashboard";
import Activities from "./pages/admin/Activities";
import Registrations from "./pages/admin/Registrations";
import NewsManagement from "./pages/admin/NewsManagement";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Competitions from "./pages/Competitions";
import Courses from "./pages/Courses";

function Router() {
  return (
    <Switch>
      <Route path={"/platform"} component={PlatformHome} />
      <Route path={"/"} component={Home} />
      <Route path={"/register/:activityId"} component={Register} />
      <Route path={"/payment/:registrationId"} component={Payment} />
      <Route path={"/receipt/:registrationId"} component={Receipt} />
      <Route path={"/news"} component={News} />
      <Route path={"/news/:id"} component={NewsDetail} />
      <Route path={"/competitions"} component={Competitions} />
      <Route path={"/courses"} component={Courses} />
      
      {/* Admin Routes */}
      <Route path={"/admin"}>
        <AdminLayout>
          <Dashboard />
        </AdminLayout>
      </Route>
      <Route path={"/admin/activities"}>
        <AdminLayout>
          <Activities />
        </AdminLayout>
      </Route>
      <Route path={"/admin/registrations"}>
        <AdminLayout>
          <Registrations />
        </AdminLayout>
      </Route>
      <Route path={"/admin/news"}>
        <AdminLayout>
          <NewsManagement />
        </AdminLayout>
      </Route>
      
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">
              <Router />
            </div>
            <Footer />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
