import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageLoader      from '../components/common/PageLoader/index.jsx';
import ProtectedRoute  from '../components/common/ProtectedRoute/index.jsx';
import MainLayout      from '../layouts/MainLayout/index.jsx';
import LMSLayout       from '../layouts/LMSLayout/index.jsx';

// lazy() called ONCE at module level — stable reference, no re-loading on re-render
const lazyPage = (importer) => {
  const Component = lazy(importer);
  return function LazyPage(props) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Component {...props} />
      </Suspense>
    );
  };
};

// Public pages
const Home         = lazyPage(() => import('../pages/public/Home/index.jsx'));
const Courses      = lazyPage(() => import('../pages/public/Courses/index.jsx'));
const CourseDetail   = lazyPage(() => import('../pages/public/CourseDetail/index.jsx'));
const PackageDetail  = lazyPage(() => import('../pages/public/PackageDetail/index.jsx'));
const OnlineTests  = lazyPage(() => import('../pages/public/OnlineTests/index.jsx'));
const Pricing      = lazyPage(() => import('../pages/public/Pricing/index.jsx'));
const Teachers     = lazyPage(() => import('../pages/public/Teachers/index.jsx'));
const Vacancies    = lazyPage(() => import('../pages/public/Vacancies/index.jsx'));
const About        = lazyPage(() => import('../pages/public/About/index.jsx'));
const Contacts     = lazyPage(() => import('../pages/public/Contacts/index.jsx'));
const Privacy      = lazyPage(() => import('../pages/public/Privacy/index.jsx'));
const Terms        = lazyPage(() => import('../pages/public/Terms/index.jsx'));
const EnrollPage   = lazyPage(() => import('../pages/public/Enroll/index.jsx'));

// Auth pages
const Login    = lazyPage(() => import('../pages/auth/Login/index.jsx'));
const Register = lazyPage(() => import('../pages/auth/Register/index.jsx'));

// Student pages
const StudentDashboard     = lazyPage(() => import('../pages/student/Dashboard/index.jsx'));
const StudentCourses       = lazyPage(() => import('../pages/student/Courses/index.jsx'));
const StudentHomework      = lazyPage(() => import('../pages/student/Homework/index.jsx'));
const StudentTests         = lazyPage(() => import('../pages/student/Tests/index.jsx'));
const StudentSchedule      = lazyPage(() => import('../pages/student/Schedule/index.jsx'));
const StudentNotifications = lazyPage(() => import('../pages/student/Notifications/index.jsx'));
const StudentPayments      = lazyPage(() => import('../pages/student/Payments/index.jsx'));
const StudentProfile       = lazyPage(() => import('../pages/student/Profile/index.jsx'));
const StudentVideoLessons  = lazyPage(() => import('../pages/student/VideoLessons/index.jsx'));
const StudentSettings      = lazyPage(() => import('../pages/student/Settings/index.jsx'));

// Teacher pages
const TeacherDashboard      = lazyPage(() => import('../pages/teacher/Dashboard/index.jsx'));
const TeacherSessions       = lazyPage(() => import('../pages/teacher/Sessions/index.jsx'));
const TeacherSessionDetail  = lazyPage(() => import('../pages/teacher/SessionDetail/index.jsx'));
const TeacherStudents       = lazyPage(() => import('../pages/teacher/Students/index.jsx'));
const TeacherPackages       = lazyPage(() => import('../pages/teacher/Packages/index.jsx'));
const TeacherPackageDetail  = lazyPage(() => import('../pages/teacher/PackageDetail/index.jsx'));
const TeacherCourses        = lazyPage(() => import('../pages/teacher/Courses/index.jsx'));
const TeacherHomework       = lazyPage(() => import('../pages/teacher/Homework/index.jsx'));
const TeacherTests          = lazyPage(() => import('../pages/teacher/Tests/index.jsx'));
const TeacherSchedule       = lazyPage(() => import('../pages/teacher/Schedule/index.jsx'));
const TeacherNotifications  = lazyPage(() => import('../pages/teacher/Notifications/index.jsx'));
const TeacherArchive        = lazyPage(() => import('../pages/teacher/Archive/index.jsx'));

// Admin pages
const AdminDashboard       = lazyPage(() => import('../pages/admin/Dashboard/index.jsx'));
const AdminStudents        = lazyPage(() => import('../pages/admin/Students/index.jsx'));
const AdminTeachers        = lazyPage(() => import('../pages/admin/Teachers/index.jsx'));
const AdminGroups          = lazyPage(() => import('../pages/admin/Groups/index.jsx'));
const AdminSchedule        = lazyPage(() => import('../pages/admin/Schedule/index.jsx'));
const AdminCourses         = lazyPage(() => import('../pages/admin/Courses/index.jsx'));
const AdminPayments        = lazyPage(() => import('../pages/admin/Payments/index.jsx'));
const AdminNotifications   = lazyPage(() => import('../pages/admin/Notifications/index.jsx'));
const AdminSettings        = lazyPage(() => import('../pages/admin/Settings/index.jsx'));
const AdminTariffs         = lazyPage(() => import('../pages/admin/Tariffs/index.jsx'));
const AdminPackages        = lazyPage(() => import('../pages/admin/Packages/index.jsx'));
const AdminReviews         = lazyPage(() => import('../pages/admin/Reviews/index.jsx'));
const AdminContent         = lazyPage(() => import('../pages/admin/Content/index.jsx'));
const AdminTests           = lazyPage(() => import('../pages/admin/Tests/index.jsx'));
const AdminVacancies       = lazyPage(() => import('../pages/admin/Vacancies/index.jsx'));
// AdminEnrollments merged into AdminPayments

// NotFound
const NotFound = lazyPage(() => import('../pages/public/NotFound/index.jsx'));

const crumb = (label) => ({ crumb: label });

const router = createBrowserRouter([
  // ─── Public ────────────────────────────────────────────────────────────────
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true,           element: <Home /> },
      { path: 'courses',        element: <Courses />,       handle: crumb('nav.courses') },
      { path: 'courses/:id',   element: <CourseDetail /> },
      { path: 'packages/:id',  element: <PackageDetail /> },
      { path: 'tests',         element: <OnlineTests />, handle: crumb('nav.onlineTests') },
      { path: 'pricing',       element: <Pricing />,    handle: crumb('nav.pricing') },
      { path: 'teachers',      element: <Teachers />,   handle: crumb('nav.teachers') },
      { path: 'vacancies',     element: <Vacancies />,  handle: crumb('nav.vacancies') },
      { path: 'about',         element: <About />,      handle: crumb('nav.about') },
      { path: 'contacts',      element: <Contacts />,   handle: crumb('nav.contacts') },
      { path: 'privacy',       element: <Privacy /> },
      { path: 'terms',         element: <Terms /> },
      { path: 'enroll',        element: <EnrollPage /> },
    ],
  },

  // ─── Auth ──────────────────────────────────────────────────────────────────
  { path: '/login',    element: <Login /> },
  { path: '/register', element: <Register /> },

  // ─── Student ───────────────────────────────────────────────────────────────
  {
    path: '/student',
    element: <ProtectedRoute role="student"><LMSLayout /></ProtectedRoute>,
    children: [
      { index: true,           element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard',     element: <StudentDashboard />,     handle: crumb('student.dashboard') },
      { path: 'courses',        element: <StudentCourses />,       handle: crumb('student.myCourses') },
      { path: 'video-lessons', element: <StudentVideoLessons />,  handle: crumb('student.videoLessons') },
      { path: 'homework',      element: <StudentHomework />,       handle: crumb('student.homework') },
      { path: 'schedule',      element: <StudentSchedule />,       handle: crumb('student.schedule') },
      { path: 'notifications', element: <StudentNotifications />,  handle: crumb('student.notifications') },
      { path: 'payments',      element: <StudentPayments />,       handle: crumb('student.payments') },
      { path: 'profile',       element: <StudentProfile />,        handle: crumb('student.profile') },
      { path: 'settings',      element: <StudentSettings />,       handle: crumb('student.settings') },
    ],
  },

  // ─── Teacher ───────────────────────────────────────────────────────────────
  {
    path: '/teacher',
    element: <ProtectedRoute role="teacher"><LMSLayout /></ProtectedRoute>,
    children: [
      { index: true,              element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard',        element: <TeacherDashboard />,      handle: crumb('teacher.dashboard') },
      { path: 'sessions',         element: <TeacherSessions />,       handle: crumb('teacher.sessions') },
      { path: 'sessions/:id',     element: <TeacherSessionDetail />,  handle: crumb('teacher.session') },
      { path: 'students',         element: <TeacherStudents />,       handle: crumb('teacher.students') },
      { path: 'packages',         element: <TeacherPackages />,       handle: crumb('teacher.packages') },
      { path: 'packages/:id',     element: <TeacherPackageDetail />,  handle: crumb('teacher.packages') },
      { path: 'courses',          element: <TeacherCourses />,        handle: crumb('teacher.courses') },
      { path: 'homework',         element: <TeacherHomework />,       handle: crumb('teacher.homework') },
      { path: 'tests',            element: <TeacherTests />,          handle: crumb('teacher.tests') },
      { path: 'schedule',         element: <TeacherSchedule />,       handle: crumb('teacher.schedule') },
      { path: 'notifications',    element: <TeacherNotifications />,  handle: crumb('teacher.notifications') },
      { path: 'archive',          element: <TeacherArchive />,        handle: crumb('teacher.archive') },
    ],
  },

  // ─── Admin ─────────────────────────────────────────────────────────────────
  {
    path: '/admin',
    element: <ProtectedRoute role="admin"><LMSLayout /></ProtectedRoute>,
    children: [
      { index: true,           element: <AdminDashboard />,        handle: crumb('admin.dashboard') },
      { path: 'students',      element: <AdminStudents />,         handle: crumb('admin.students') },
      { path: 'teachers',      element: <AdminTeachers />,         handle: crumb('admin.teachers') },
      { path: 'groups',        element: <AdminGroups />,           handle: crumb('admin.groups') },
      { path: 'schedule',      element: <AdminSchedule />,         handle: crumb('admin.schedule') },
      { path: 'courses',       element: <AdminCourses />,          handle: crumb('admin.courses') },
      { path: 'tariffs',       element: <AdminTariffs />,          handle: crumb('admin.tariffs') },
      { path: 'packages',      element: <AdminPackages />,         handle: crumb('admin.packages') },
      { path: 'payments',      element: <AdminPayments />,         handle: crumb('admin.payments') },
      { path: 'enrollments',   element: <Navigate to="/admin/payments" replace /> },
      { path: 'notifications', element: <AdminNotifications />,    handle: crumb('admin.notifications') },
      { path: 'reviews',       element: <AdminReviews />,          handle: crumb('admin.reviews') },
      { path: 'vacancies',     element: <AdminVacancies />,        handle: crumb('admin.vacancies') },
      { path: 'content',       element: <AdminContent />,          handle: crumb('admin.content') },
      { path: 'tests',         element: <AdminTests />,            handle: crumb('admin.tests') },
      { path: 'settings',      element: <AdminSettings />,         handle: crumb('admin.settings') },
    ],
  },

  // ─── 404 ───────────────────────────────────────────────────────────────────
  { path: '*', element: <NotFound /> },
]);

export default router;
