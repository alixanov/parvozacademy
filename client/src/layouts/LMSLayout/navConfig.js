import DashboardIcon          from '@mui/icons-material/Dashboard';
import SchoolIcon              from '@mui/icons-material/School';
import PlayCircleIcon          from '@mui/icons-material/PlayCircle';
import AssignmentIcon          from '@mui/icons-material/Assignment';
import QuizIcon                from '@mui/icons-material/Quiz';
import CalendarMonthIcon       from '@mui/icons-material/CalendarMonth';
import NotificationsIcon       from '@mui/icons-material/Notifications';
import PaymentIcon             from '@mui/icons-material/Payment';
import BarChartIcon            from '@mui/icons-material/BarChart';
import PersonIcon              from '@mui/icons-material/Person';
import SettingsIcon            from '@mui/icons-material/Settings';
import PeopleIcon              from '@mui/icons-material/People';
import MenuBookIcon            from '@mui/icons-material/MenuBook';
import SupervisorAccountIcon   from '@mui/icons-material/SupervisorAccount';
import GroupsIcon              from '@mui/icons-material/Groups';
import PaymentsIcon            from '@mui/icons-material/Payments';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ReviewsIcon             from '@mui/icons-material/Reviews';
import ArticleIcon             from '@mui/icons-material/Article';
import LocalOfferIcon          from '@mui/icons-material/LocalOffer';
import OndemandVideoIcon       from '@mui/icons-material/OndemandVideo';
import InventoryIcon           from '@mui/icons-material/Inventory';
import ArchiveIcon             from '@mui/icons-material/Archive';
import WorkIcon               from '@mui/icons-material/Work';

export const studentNav = [
  { key: 'student.dashboard',     path: '/student/dashboard',     Icon: DashboardIcon },
  { key: 'student.myCourses',     path: '/student/courses',       Icon: SchoolIcon,         section: 'nav.section.learn' },
  { key: 'student.homework',      path: '/student/homework',      Icon: AssignmentIcon },
  { key: 'student.schedule',      path: '/student/schedule',      Icon: CalendarMonthIcon,  section: 'nav.section.activity' },
  { key: 'student.notifications', path: '/student/notifications', Icon: NotificationsIcon },
  { key: 'student.payments',      path: '/student/payments',      Icon: PaymentIcon },
  { key: 'student.profile',       path: '/student/profile',       Icon: PersonIcon,         section: 'nav.section.account' },
  { key: 'student.settings',      path: '/student/settings',      Icon: SettingsIcon },
];

export const teacherNav = [
  { key: 'teacher.dashboard',     path: '/teacher/dashboard',      Icon: DashboardIcon },
  { key: 'teacher.sessions',      path: '/teacher/sessions',       Icon: OndemandVideoIcon,  section: 'nav.section.teach' },
  { key: 'teacher.students',      path: '/teacher/students',       Icon: PeopleIcon },
  { key: 'teacher.schedule',      path: '/teacher/schedule',       Icon: CalendarMonthIcon },
  { key: 'teacher.homework',      path: '/teacher/homework',       Icon: AssignmentIcon,     section: 'nav.section.learn' },
  { key: 'teacher.notifications', path: '/teacher/notifications',  Icon: NotificationsIcon },
  { key: 'teacher.packages',      path: '/teacher/packages',       Icon: InventoryIcon,      section: 'nav.section.packages' },
  { key: 'teacher.archive',       path: '/teacher/archive',        Icon: ArchiveIcon },
];

export const adminNav = [
  { key: 'admin.dashboard',      path: '/admin',                  Icon: DashboardIcon },
  { key: 'admin.students',       path: '/admin/students',         Icon: SchoolIcon,          section: 'nav.section.management' },
  { key: 'admin.teachers',       path: '/admin/teachers',         Icon: SupervisorAccountIcon },
  { key: 'admin.courses',        path: '/admin/courses',          Icon: MenuBookIcon },
  { key: 'admin.groups',         path: '/admin/groups',           Icon: GroupsIcon },
  { key: 'admin.schedule',       path: '/admin/schedule',         Icon: CalendarMonthIcon },
  { key: 'admin.tariffs',        path: '/admin/tariffs',          Icon: LocalOfferIcon },
  { key: 'admin.packages',       path: '/admin/packages',         Icon: InventoryIcon },
  { key: 'admin.tests',          path: '/admin/tests',            Icon: QuizIcon },
  { key: 'admin.payments',       path: '/admin/payments',         Icon: PaymentsIcon,        section: 'nav.section.finance' },
  { key: 'admin.notifications',  path: '/admin/notifications',    Icon: NotificationsActiveIcon },
  { key: 'admin.reviews',        path: '/admin/reviews',          Icon: ReviewsIcon },
  { key: 'admin.vacancies',      path: '/admin/vacancies',        Icon: WorkIcon },
  { key: 'admin.content',        path: '/admin/content',          Icon: ArticleIcon },
  { key: 'admin.settings',       path: '/admin/settings',         Icon: SettingsIcon },
];
