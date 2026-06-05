import HomeIcon        from '@mui/icons-material/Home';
import SchoolIcon       from '@mui/icons-material/School';
import QuizIcon         from '@mui/icons-material/Quiz';
import LocalOfferIcon   from '@mui/icons-material/LocalOffer';
import PeopleAltIcon    from '@mui/icons-material/PeopleAlt';
import WorkIcon         from '@mui/icons-material/Work';
import InfoIcon         from '@mui/icons-material/Info';
import ContactsIcon     from '@mui/icons-material/Contacts';
import LockOpenIcon     from '@mui/icons-material/LockOpen';

/*
  section — i18n key shown as a group label ABOVE this nav item.
            Hidden (collapsed to thin divider) when sidebar is collapsed.
*/
export const publicNav = [
  { key: 'nav.home',        path: '/',          Icon: HomeIcon },
  { key: 'nav.courses',     path: '/courses',   Icon: SchoolIcon,     section: 'nav.section.learn' },
  { key: 'nav.onlineTests', path: '/tests',     Icon: QuizIcon },
  { key: 'nav.pricing',     path: '/pricing',   Icon: LocalOfferIcon },
  { key: 'nav.teachers',    path: '/teachers',  Icon: PeopleAltIcon },
  { key: 'nav.vacancies',   path: '/vacancies', Icon: WorkIcon,       section: 'nav.section.company' },
  { key: 'nav.about',       path: '/about',     Icon: InfoIcon },
  { key: 'nav.contacts',    path: '/contacts',  Icon: ContactsIcon },
  { key: 'nav.cabinet',     path: '/login',     Icon: LockOpenIcon,   section: 'nav.section.account' },
];
