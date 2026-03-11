import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Learn from "./pages/Learn";

// Member pages
import MemberLayout from "./pages/member/MemberLayout";
import MemberProfile from "./pages/member/MemberProfile";
import MemberCourses from "./pages/member/MemberCourses";
import MemberOrders from "./pages/member/MemberOrders";
import MemberRecommend from "./pages/member/MemberRecommend";

// Payment
import PaymentResult from "./pages/PaymentResult";

// Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseContent from "./pages/admin/AdminCourseContent";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminSettings from "./pages/admin/AdminSettings";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:slug" component={CourseDetail} />

      {/* Learning */}
      <Route path="/learn/:slug" component={Learn} />

      {/* Payment */}
      <Route path="/payment/result" component={PaymentResult} />

      {/* Member */}
      <Route path="/member">
        <MemberLayout><MemberProfile /></MemberLayout>
      </Route>
      <Route path="/member/courses">
        <MemberLayout><MemberCourses /></MemberLayout>
      </Route>
      <Route path="/member/orders">
        <MemberLayout><MemberOrders /></MemberLayout>
      </Route>
      <Route path="/member/recommend">
        <MemberLayout><MemberRecommend /></MemberLayout>
      </Route>

      {/* Admin */}
      <Route path="/admin">
        <AdminLayout><AdminDashboard /></AdminLayout>
      </Route>
      <Route path="/admin/courses">
        <AdminLayout><AdminCourses /></AdminLayout>
      </Route>
      <Route path="/admin/courses/:courseId/content">
        {(params) => <AdminLayout><AdminCourseContent /></AdminLayout>}
      </Route>
      <Route path="/admin/orders">
        <AdminLayout><AdminOrders /></AdminLayout>
      </Route>
      <Route path="/admin/users">
        <AdminLayout><AdminUsers /></AdminLayout>
      </Route>
      <Route path="/admin/coupons">
        <AdminLayout><AdminCoupons /></AdminLayout>
      </Route>
      <Route path="/admin/settings">
        <AdminLayout><AdminSettings /></AdminLayout>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
