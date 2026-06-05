# PARVOZ ACADEMY — Project Context

> This file is the single source of truth passed between sessions.
> Update it at the END of each session before closing.

---

## Completed Sessions

| Session | Deliverable | Status |
|---------|-------------|--------|
| S01 | Folder structure + Models + ERD + CONTEXT.md | ✅ Done |
| S02 | Auth (JWT/refresh/httpOnly) + RBAC + security | ✅ Done |
| S03–S06 | Backend stubs (routes + controllers + services) | ✅ Done |
| S07 | Frontend: Vite + MUI theme + i18n + Layout + Router guards | ✅ Done |
| S08 | Frontend: All public pages | ✅ Done |
| S09 | Frontend: Auth UI + Redux + RTK Query baseApi | ✅ Done |
| S10 | Frontend: Student cabinet (all pages) | ✅ Done |
| S11 | Frontend: Teacher cabinet (all pages) | ✅ Done |
| S12 | Frontend: Admin Part 1 — Dashboard, Students, Teachers, Groups | ✅ Done |
| S13 | Backend modules: full implementation (courses → settings) | ✅ Done |
| S14 | Frontend: Admin Part 2 — Schedule, Payments, Notifications, Settings + Courses | ✅ Done |
| S14b | UI/UX Senior Redesign — theme, transitions, auth pages, cards, PageHeader | ✅ Done |
| S15 | Deploy: Railway + MongoDB Atlas + Cloudinary + env | ⏳ Next |
| S16 | DNS Ahost + SSL + GitHub Actions + QA | ⬜ |

---

## Project Structure

```
parvozazademy/
├── client/                         # React 18 + Vite 5 (port 3000)
│   ├── src/
│   │   ├── app/                    # store.js, router.jsx, providers.jsx  [S07]
│   │   ├── features/               # Feature slices + RTK Query APIs
│   │   │   ├── auth/               # authSlice.js, authApi.js, components/
│   │   │   ├── courses/
│   │   │   ├── groups/
│   │   │   ├── homework/
│   │   │   ├── tests/
│   │   │   ├── payments/
│   │   │   ├── notifications/
│   │   │   ├── attendance/
│   │   │   └── admin/
│   │   ├── layouts/
│   │   │   ├── MainLayout/         # Public pages layout (Topbar + Sidebar)
│   │   │   └── LMSLayout/          # Dashboard layout (role-aware sidebar)
│   │   ├── pages/
│   │   │   ├── public/             # Home, Courses, CourseDetail, OnlineTests,
│   │   │   │                       # Pricing, Teachers, Vacancies, About, Contacts
│   │   │   ├── auth/               # Login, Register
│   │   │   ├── student/            # Dashboard, Courses, VideoLessons, Homework,
│   │   │   │                       # Tests, Schedule, Notifications, Payments,
│   │   │   │                       # Progress, Profile, Settings
│   │   │   ├── teacher/            # Dashboard, Students, Courses, Lessons,
│   │   │   │                       # Homework, Tests, Schedule, Notifications
│   │   │   └── admin/              # Dashboard, Students, Teachers, Groups,
│   │   │                           # Schedule, Courses, Payments, Notifications, Settings
│   │   ├── components/
│   │   │   ├── common/             # PageLoader, ErrorBoundary, ProtectedRoute,
│   │   │   │                       # Table, Modal, Form, Stats
│   │   │   └── ui/                 # Reusable MUI-based primitives
│   │   ├── hooks/                  # useAuth, useSocket, useTheme, useDebounce
│   │   ├── locales/
│   │   │   ├── uz/translation.json # O'zbek ✅
│   │   │   └── ru/translation.json # Русский ✅
│   │   ├── theme/                  # createTheme, palette, component overrides  [S07]
│   │   ├── utils/                  # api.js (RTK baseQuery), format.utils.js
│   │   ├── main.jsx                # Entry point (providers wired S07)
│   │   └── index.css               # Inter font import only ✅
│   ├── index.html                  ✅
│   ├── vite.config.js              ✅ (alias @/ → src/, proxy /api → :5000)
│   ├── package.json                ✅
│   ├── .env.development            ✅
│   └── .env.production             ✅
│
└── server/                         # Node 20 LTS + Express 4 + ESM
    ├── src/
    │   ├── config/
    │   │   ├── db.js               ✅ mongoose.connect
    │   │   ├── cloudinary.js       ✅ v2 config
    │   │   └── socket.js           ✅ Socket.IO init + getIO()
    │   ├── middleware/
    │   │   ├── auth.middleware.js   ⏳ S02 — JWT Bearer verify
    │   │   ├── rbac.middleware.js   ⏳ S02 — authorize(...roles)
    │   │   ├── error.middleware.js  ✅ global error handler skeleton
    │   │   └── validate.middleware.js ✅ express-validator wrapper
    │   ├── models/                  ✅ ALL 17 MODELS COMPLETE
    │   │   ├── index.js             ✅ barrel export
    │   │   ├── User.model.js
    │   │   ├── RefreshToken.model.js
    │   │   ├── Course.model.js
    │   │   ├── Module.model.js
    │   │   ├── Lesson.model.js
    │   │   ├── Group.model.js
    │   │   ├── GroupMember.model.js
    │   │   ├── Homework.model.js
    │   │   ├── HomeworkSubmission.model.js
    │   │   ├── Test.model.js
    │   │   ├── TestQuestion.model.js
    │   │   ├── TestResult.model.js
    │   │   ├── Attendance.model.js
    │   │   ├── Payment.model.js
    │   │   ├── Notification.model.js
    │   │   ├── Vacancy.model.js
    │   │   └── Settings.model.js
    │   ├── modules/                 # routes + controller + service per module
    │   │   ├── auth/                ✅ register/login/logout/refresh
    │   │   ├── users/               ✅ me, getAll, setActive
    │   │   ├── courses/             ✅ CRUD + publish
    │   │   ├── modules/             ✅ CRUD (ordered within course)
    │   │   ├── lessons/             ✅ CRUD (ordered within module)
    │   │   ├── groups/              ✅ CRUD + member add/remove
    │   │   ├── attendance/          ✅ mark, byGroup, byStudent, stats
    │   │   ├── homework/            ✅ CRUD + submit + grade
    │   │   ├── tests/               ✅ CRUD + questions + auto-grade
    │   │   ├── payments/            ✅ list + create + confirm + summary
    │   │   ├── notifications/       ✅ list + send (broadcast) + markRead
    │   │   ├── vacancies/           ✅ CRUD + apply + application status
    │   │   └── settings/            ✅ get (public) + update (admin)
    │   ├── utils/
    │   │   ├── jwt.utils.js         ✅ sign/verify access + refresh
    │   │   ├── email.utils.js       ✅ nodemailer sendEmail()
    │   │   └── response.utils.js    ✅ success/paginated/created/AppError
    │   └── app.js                   ✅ Express skeleton (routes wired S02+)
    ├── server.js                    ✅ bootstrap (connectDB → createServer → listen)
    ├── package.json                 ✅ "type":"module", all deps pinned
    └── .env.example                 ✅
```

---

## Entity Relationship Diagram (ASCII)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    PARVOZ ACADEMY — ERD (Mongoose / MongoDB)               ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────┐
│         USER            │
│─────────────────────────│
│ _id          ObjectId PK│
│ name         String     │
│ email        String  UK │◄──────────────────────────────────────────┐
│ password     String     │                                           │
│ role         enum       │                                           │
│   admin│teacher│student │                                           │
│ avatar       {url,pubId}│                                           │
│ isActive     Boolean    │                                           │
│ phone        String     │                                           │
│ dateOfBirth  Date       │                                           │
│ telegram     String     │                                           │
│ studentId    String UK  │◄─────────────────────────┐               │
│ subject      String     │                          │               │
│ experience   Number     │                          │               │
│ bio          String     │                          │               │
│ achievements [String]   │                          │               │
│ lastLogin    Date       │                          │               │
└────────────┬────────────┘                          │               │
             │                                       │               │
    ┌────────┼────────────────┐                      │               │
    │ teacher│                │ student              │               │
    ▼        ▼                ▼                      │               │
┌────────────────┐   ┌────────────────────┐   ┌─────┴──────────┐   │
│   REFRESH_     │   │      COURSE        │   │  GROUP_MEMBER  │   │
│   TOKEN        │   │────────────────────│   │────────────────│   │
│────────────────│   │ _id      ObjectId  │   │ _id  ObjectId  │   │
│ _id  ObjectId  │   │ title    {uz,ru}   │   │ group  ──────────►┐│
│ token  String  │   │ desc     {uz,ru}   │   │ student ─────────►││
│ user ─────────►│   │ subject  enum      │   │ joinedAt Date  │  ││
│ expiresAt Date │   │ level    enum      │   │ status  enum   │  ││
│ [TTL index]    │   │ price    {amt,curr}│   └────────────────┘  ││
└────────────────┘   │ duration Number   │                        ││
                     │ thumbnail {…}     │   ┌────────────────────┘│
                     │ teacher ─────────►│   │                     │
                     │ isPublished Bool  │   │  ┌──────────────────┘
                     │ isActive   Bool   │   │  │
                     │ totalStudents Num │   │  │
                     │ rating  {avg,cnt} │   ▼  ▼
                     │ tags    [String]  │  ┌──────────────────────┐
                     └────────┬─────────┘  │        GROUP         │
                              │1           │──────────────────────│
                              │            │ _id      ObjectId    │
                              ▼            │ name     String      │
                     ┌────────────────┐   │ course ─────────────►│
                     │    MODULE      │   │ teacher ────────────►│
                     │────────────────│   │ room     String      │
                     │ _id  ObjectId  │   │ schedule [{          │
                     │ course ───────►│   │   dayOfWeek Number   │
                     │ title  {uz,ru} │   │   startTime String   │
                     │ desc   {uz,ru} │   │   endTime  String    │
                     │ order  Number  │   │ }]                   │
                     │ isPublished    │   │ startDate  Date      │
                     └────────┬───────┘   │ endDate    Date      │
                              │1          │ maxStudents Number   │
                              │           │ price {amt,curr}     │
                              ▼           │ type   enum          │
                     ┌────────────────┐   │ isActive Boolean     │
                     │    LESSON      │   └──────────┬───────────┘
                     │────────────────│              │
                     │ _id  ObjectId  │              │1
                     │ module ───────►│              │
                     │ course ───────►│      ┌───────┼──────────────────────┐
                     │ title  {uz,ru} │      │       │                      │
                     │ desc   {uz,ru} │      ▼       ▼                      ▼
                     │ video  {…}     │  ┌──────────────┐  ┌─────────────────────┐
                     │ materials [{…}]│  │  ATTENDANCE  │  │      PAYMENT        │
                     │ order  Number  │  │──────────────│  │─────────────────────│
                     │ isPublished    │  │ _id ObjectId │  │ _id   ObjectId      │
                     │ isFree Boolean │  │ group ──────►│  │ student ───────────►│
                     └───────┬────────┘  │ lesson ─────►│  │ group ─────────────►│
                             │           │ date   Date  │  │ amount Number       │
              ┌──────────────┤           │ markedBy ───►│  │ currency String     │
              │              │           │ records [{   │  │ month  YYYY-MM      │
              ▼              ▼           │  student ───►│  │ status enum         │
    ┌──────────────┐  ┌──────────────┐  │  status enum │  │ paymentMethod enum  │
    │   HOMEWORK   │  │     TEST     │  │  note String │  │ paidAmount Number   │
    │──────────────│  │──────────────│  │ }]           │  │ confirmedBy ───────►│
    │ _id ObjectId │  │ _id ObjectId │  └──────────────┘  │ paidAt Date         │
    │ lesson ─────►│  │ course ─────►│                    │ dueDate Date        │
    │ group ──────►│  │ group ──────►│                    │ [UK: student+       │
    │ teacher ────►│  │ teacher ────►│                    │  group+month]       │
    │ title String │  │ title String │                    └─────────────────────┘
    │ description  │  │ duration Num │
    │ dueDate Date │  │ maxScore Num │
    │ maxScore Num │  │ passingScore │
    │ attachments  │  │ type enum    │
    │  [{…}]       │  │ isPublished  │
    └──────┬───────┘  │ startTime    │
           │1         │ endTime      │
           │          │ shuffleQ     │
           ▼          └──────┬───────┘
    ┌──────────────┐         │1
    │  HOMEWORK_   │         │
    │  SUBMISSION  │    ┌────┴─────────────┐
    │──────────────│    │                  │
    │ _id ObjectId │    ▼                  ▼
    │ homework ───►│  ┌──────────────┐  ┌──────────────┐
    │ student ────►│  │ TEST_QUESTION│  │  TEST_RESULT │
    │ group ──────►│  │──────────────│  │──────────────│
    │ files  [{…}] │  │ _id ObjectId │  │ _id ObjectId │
    │ comment Str  │  │ test ───────►│  │ test ───────►│
    │ score  Num   │  │ question Str │  │ student ────►│
    │ feedback Str │  │ type  enum   │  │ group ──────►│
    │ status enum  │  │ options [{   │  │ answers [{   │
    │ submittedAt  │  │  text Bool   │  │  question ──►│
    │ gradedAt     │  │  isCorrect   │  │  selected[]  │
    │ gradedBy ───►│  │ }]           │  │  isCorrect   │
    │ [UK: hw+std] │  │ score  Num   │  │  score Num   │
    └──────────────┘  │ order  Num   │  │ }]           │
                      │ image  {…}   │  │ score  Num   │
                      └──────────────┘  │ percentage   │
                                        │ isPassed Bool│
                                        │ startedAt    │
                                        │ submittedAt  │
                                        │ timeSpent    │
                                        │ [UK:test+std]│
                                        └──────────────┘

  ┌──────────────────────────────────────────────────────────┐
  │ STANDALONE COLLECTIONS                                    │
  ├──────────────────────┬────────────────────────────────────┤
  │   NOTIFICATION       │         VACANCY                    │
  │──────────────────────│────────────────────────────────────│
  │ _id  ObjectId        │ _id    ObjectId                    │
  │ recipient ──────────►│ title  String                      │
  │ sender ─────────────►│ description String                 │
  │ title  String        │ subject String                     │
  │ message String       │ requirements [String]              │
  │ type   enum          │ salary {min,max,curr}              │
  │ category enum        │ type   enum                        │
  │ isRead Boolean       │ isActive Boolean                   │
  │ readAt Date          │ applications [{                    │
  │ link   String        │   name, email, phone               │
  │ metadata Mixed       │   resumeUrl, coverLetter           │
  │                      │   status enum                      │
  │                      │   appliedAt Date                   │
  │                      │ }]                                 │
  ├──────────────────────┴────────────────────────────────────┤
  │   SETTINGS (singleton — _singleton:"global")              │
  │─────────────────────────────────────────────────────────── │
  │ academyName │ logo │ phones │ email │ address              │
  │ telegram │ instagram │ youtube │ website                   │
  │ monthlyFee │ currency │ paymentDueDay                     │
  │ workingHours { weekdays{open,close}, saturday{open,close} }│
  │ updatedBy ──────────────────────────────────────────────► │
  │ Settings.getSettings() — static singleton helper           │
  └────────────────────────────────────────────────────────────┘

LEGEND
  ──►   Foreign key (ObjectId ref)
  UK    Unique key / compound unique index
  TTL   MongoDB auto-delete index (RefreshToken.expiresAt)
  enum  Mongoose enum validator
```

---

## Model Index & Key Decisions

| Model | Key Indexes | Notes |
|-------|------------|-------|
| User | email UK, role, isActive, studentId sparse | bcrypt pre-save, password select:false |
| RefreshToken | token UK, user, expiresAt TTL | Auto-deleted by MongoDB TTL |
| Course | subject, teacher, isPublished+isActive | Multilingual {uz,ru} title/desc |
| Module | course+order | Ordered within course |
| Lesson | module+order, course+isPublished | isFree = preview without enrollment |
| Group | teacher, course, isActive | schedule[] as embedded subdocs |
| GroupMember | group+student UK, student | Pivot table; status tracks lifecycle |
| Homework | group+dueDate, teacher | Attachments via Cloudinary |
| HomeworkSubmission | homework+student UK | Files via Cloudinary |
| Test | course, group, type+isPublished | totalQuestions denormalized |
| TestQuestion | test+order | options[] embedded; select:false not needed |
| TestResult | test+student UK, group | Auto-graded on submit (S05) |
| Attendance | group+date UK | records[] embedded per day |
| Payment | student+group+month UK | paidAmount for partial tracking |
| Notification | recipient+createdAt | One doc per recipient; broadcast = bulk insert |
| Vacancy | isActive+subject | applications[] embedded |
| Settings | _singleton UK | `getSettings()` static ensures singleton |

---

## S15 — Deploy (Next)

### Backend: Railway
1. Create Railway project, add MongoDB Atlas plugin (or external Atlas)
2. Set all env vars from `.env.example`
3. Deploy: `railway up`

### Frontend: Vercel / Netlify
1. Connect GitHub repo
2. Set `VITE_API_URL=https://api.parvoz.uz/api/v1`
3. Set `VITE_SOCKET_URL=https://api.parvoz.uz`

### Cloudinary
1. Create account, get `CLOUD_NAME`, `API_KEY`, `API_SECRET`
2. Set in Railway env vars

### Domain (Ahost.uz)
1. Add CNAME/A records for `api.parvoz.uz` → Railway URL
2. Add CNAME for `parvoz.uz` → Vercel URL
3. Enable SSL (Let's Encrypt auto via Railway + Vercel)

### GitHub Actions (CI)
```yaml
# .github/workflows/deploy.yml
# on push to main:
#   1. Run lint
#   2. Railway deploy
```

### Key API Endpoints Summary
| Module | Base URL | Auth |
|--------|----------|------|
| Auth | `/api/v1/auth` | Public |
| Users | `/api/v1/users` | Bearer |
| Courses | `/api/v1/courses` | Public (GET), Admin (write) |
| Modules | `/api/v1/modules` | Bearer |
| Lessons | `/api/v1/lessons` | Bearer |
| Groups | `/api/v1/groups` | Teacher/Admin |
| Attendance | `/api/v1/attendance` | Teacher/Admin |
| Homework | `/api/v1/homework` | All (role-gated) |
| Tests | `/api/v1/tests` | All (role-gated) |
| Payments | `/api/v1/payments` | Admin + Student /me |
| Notifications | `/api/v1/notifications` | All |
| Vacancies | `/api/v1/vacancies` | Public (GET), Admin (write) |
| Settings | `/api/v1/settings` | Public (GET), Admin (PUT) |

---

## Tech Decisions Made in S01

1. **ESM (`"type":"module"`)** on server — Node 20 LTS supports it natively; avoids dual-format complexity.
2. **`node --watch`** for dev — no nodemon dependency needed on Node 20.
3. **Multilingual fields `{uz, ru}`** embedded in document — avoids separate translation collection; simpler queries.
4. **Attendance as one doc per group+date** with embedded `records[]` — atomic mark-all operation; fewer round trips vs. one-per-student docs.
5. **Payment `month` field (YYYY-MM string)** — compound unique index `student+group+month` prevents duplicate monthly records.
6. **Settings singleton** with `_singleton:"global"` guard + `getSettings()` static — avoids accidental multiple documents.
7. **Notification: one doc per recipient** — broadcast creates bulk docs; simpler queries for unread counts; scales to 1000+ with proper index.
8. **TestResult `unique: test+student`** — prevents double submission; if retakes needed later, add `attempt` field to the key.
