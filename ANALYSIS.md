# PARVOZ ACADEMY — Loyiha Chuqur Tahlili

> **Tahlil sanasi:** 2026-06-11  
> **Tahlilchi:** Claude Sonnet 4.6  
> **Loyiha joylashuvi:** `C:\Users\user\Downloads\parvozazademy`

---

## 1. Loyiha Maqsadi

**PARVOZ ACADEMY** — o'zbek ta'lim akademiyasi uchun qurilgan to'liq LMS (Learning Management System). Uch xil foydalanuvchi roli mavjud: **Admin**, **O'qituvchi**, **O'quvchi**. Tizim kurslarni, guruhlarni, to'lovlarni, dars jadvallari, uy vazifalarini, testlarni va davomat nazoratini boshqaradi. Interfeys ikki tilda — **O'zbek** va **Rus** tillarida ishlaydi.

---

## 2. Texnologik Stek

### Frontend (`client/`)
| Texnologiya | Versiya | Maqsad |
|-------------|---------|--------|
| React | 18.3.1 | UI framework |
| Vite | 5.x | Build tool, dev server (port 3000) |
| Redux Toolkit + RTK Query | latest | State management, API calls |
| Material-UI (MUI) | v5 | UI komponentlar |
| React Hook Form + Zod | latest | Forma validatsiyasi |
| i18next | latest | UZ/RU tarjima |
| Socket.IO Client | 4.8.1 | Real-time xabarlar |
| Recharts | 2.15.0 | Grafiklar (dashboard) |
| React Player | 2.16.0 | Video darslar |
| Framer Motion | latest | Animatsiyalar |
| dayjs | latest | Sana/vaqt formatlash |

### Backend (`server/`)
| Texnologiya | Versiya | Maqsad |
|-------------|---------|--------|
| Node.js | 20 LTS | Runtime (ESM modules) |
| Express | 4.21.2 | HTTP framework |
| MongoDB + Mongoose | 8.9.5 | Ma'lumotlar bazasi |
| JWT (jsonwebtoken) | 9.0.2 | Auth (access + refresh) |
| bcryptjs | latest | Parol xeshlash |
| Multer | 1.4.5 | Fayl yuklash |
| AWS S3 (T3 Storage) | latest | Fayl saqlash (Cloudflare R2) |
| Cloudinary | v2 | Legacy fayl saqlash |
| Socket.IO | 4.8.1 | Real-time |
| Nodemailer | 8.0.10 | Email yuborish |
| Helmet | 7.2.0 | HTTP xavfsizlik |
| express-validator | 7.2.1 | Input validatsiyasi |
| express-rate-limit | latest | Rate limiting |

### Deploy
| Xizmat | Maqsad |
|--------|--------|
| Railway | Hosting (backend + frontend) |
| MongoDB Atlas | Bulut ma'lumotlar bazasi |
| T3 Storage (R2) | Fayl saqlash (S3-compatible) |
| Nixpacks | Build pipeline (Node 20) |

---

## 3. Loyiha Tuzilmasi

```
parvozazademy/
├── client/                         # React Vite frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── router.jsx          # React Router v6 (lazy loading)
│   │   │   ├── store.js            # Redux store + RTK Query baseApi
│   │   │   └── providers.jsx       # Redux + Router + i18n wrappers
│   │   ├── features/               # Redux slices + RTK Query endpoints
│   │   │   ├── auth/               # authSlice + authApi
│   │   │   ├── courses/            # Kurslar
│   │   │   ├── groups/             # Guruhlar
│   │   │   ├── homework/           # Uy vazifalari
│   │   │   ├── tests/              # Testlar
│   │   │   ├── payments/           # To'lovlar
│   │   │   ├── notifications/      # Xabarlar
│   │   │   ├── attendance/         # Davomat
│   │   │   ├── sessions/           # Dars sessiyalari
│   │   │   ├── tariffs/            # Tarif rejalari
│   │   │   ├── packages/           # Individual paketlar
│   │   │   ├── enrollment/         # Qabul arizalari
│   │   │   ├── reviews/            # Sharhlar
│   │   │   └── users/              # Foydalanuvchilar
│   │   ├── pages/
│   │   │   ├── public/             # Ommaviy sahifalar (13 ta)
│   │   │   ├── auth/               # Login, Register
│   │   │   ├── student/            # O'quvchi paneli (10 sahifa)
│   │   │   ├── teacher/            # O'qituvchi paneli (12 sahifa)
│   │   │   └── admin/              # Admin paneli (13 sahifa)
│   │   ├── layouts/
│   │   │   ├── MainLayout/         # Ommaviy sahifalar (Topbar, Footer)
│   │   │   └── LMSLayout/          # Dashboard (rol-ga asosli sidebar)
│   │   ├── components/
│   │   │   ├── common/             # ProtectedRoute, PageLoader, PageHeader
│   │   │   ├── payment/            # PaymentModal
│   │   │   └── ui/                 # MUI-ga asosli qayta ishlatiladigan komponentlar
│   │   ├── hooks/                  # useAuth, useSocket, useTheme
│   │   ├── locales/                # uz/translation.json, ru/translation.json
│   │   ├── theme/                  # MUI rang va stil konfiguratsiyasi
│   │   ├── utils/                  # api.js (RTK baseQuery), format.utils.js
│   │   └── context/                # SnackbarContext
│   ├── .env.development            # VITE_API_URL=http://localhost:5000/api/v1
│   ├── .env.production             # VITE_API_URL=/api/v1 (nisbiy)
│   └── vite.config.js              # Port 3000, proxy → localhost:5000
│
├── server/                         # Node 20 + Express backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js               # MongoDB ulanishi
│   │   │   ├── storage.js          # S3Client (T3 Storage)
│   │   │   ├── cloudinary.js       # Cloudinary v2 (legacy)
│   │   │   └── socket.js           # Socket.IO init + getIO()
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # authenticate + optionalAuthenticate
│   │   │   ├── rbac.middleware.js   # authorize(...roles)
│   │   │   ├── error.middleware.js  # Global xato handler
│   │   │   ├── validate.middleware.js # express-validator wrapper
│   │   │   └── upload.middleware.js # Multer + uploadToS3
│   │   ├── models/                 # 24 ta Mongoose model
│   │   ├── modules/                # 22 ta route moduli
│   │   └── utils/
│   │       ├── jwt.utils.js        # signAccess, signRefresh, verify*
│   │       ├── email.utils.js      # sendEmail (nodemailer)
│   │       └── response.utils.js   # success, paginated, AppError
│   └── server.js                   # Bootstrap: DB → Server → Listen
│
├── nixpacks.toml                   # Build: Node 20, npm ci, client build
├── railway.toml                    # Deploy: start command, health check
└── CONTEXT.md                      # Loyiha holati, ERD, texnik qarorlar
```

---

## 4. Frontend Sahifalar va Yo'llar

### Ommaviy sahifalar (MainLayout)
| Yo'l | Sahifa | Tavsif |
|------|--------|--------|
| `/` | Home | Asosiy landing sahifa |
| `/courses` | Courses | Kurs katalogi (filter bilan) |
| `/courses/:id` | CourseDetail | Kurs tafsilotlari + yozilish modal |
| `/packages/:id` | PackageDetail | Individual paket tafsilotlari |
| `/tests` | OnlineTests | Joylashtirishga oid testlar |
| `/pricing` | Pricing | Tarif rejalari |
| `/teachers` | Teachers | O'qituvchi profillari |
| `/vacancies` | Vacancies | Vakansiyalar + ariza formasi |
| `/about` | About | Akademiya haqida |
| `/contacts` | Contacts | Murojaat ma'lumotlari |
| `/privacy` | Privacy | Maxfiylik siyosati |
| `/terms` | Terms | Foydalanish shartlari |
| `/enroll` | EnrollPage | Qabul arizasi formasi |

### Auth sahifalari
| Yo'l | Sahifa |
|------|--------|
| `/login` | Login |
| `/register` | Register |

### O'quvchi paneli (`/student/*`, ProtectedRoute)
| Yo'l | Sahifa | Tavsif |
|------|--------|--------|
| `/student/dashboard` | StudentDashboard | Guruhlar, progress, statistika |
| `/student/courses` | StudentCourses | Yozilgan kurslar |
| `/student/video-lessons` | StudentVideoLessons | Video darslar |
| `/student/homework` | StudentHomework | Uy vazifalari (ko'rish + topshirish) |
| `/student/tests` | StudentTests | Testlar (urinish + natijalar) |
| `/student/schedule` | StudentSchedule | Dars jadvali |
| `/student/notifications` | StudentNotifications | Xabarlar |
| `/student/payments` | StudentPayments | To'lovlar va hisob-fakturalar |
| `/student/profile` | StudentProfile | Profil tahrirlash |
| `/student/settings` | StudentSettings | Sozlamalar |

### O'qituvchi paneli (`/teacher/*`, ProtectedRoute)
| Yo'l | Sahifa | Tavsif |
|------|--------|--------|
| `/teacher/dashboard` | TeacherDashboard | Guruhlar, o'quvchilar, statistika |
| `/teacher/sessions` | TeacherSessions | Dars sessiyalari boshqaruvi |
| `/teacher/sessions/:id` | TeacherSessionDetail | Yagona sessiya (havola, materiallar) |
| `/teacher/students` | TeacherStudents | Barcha guruhlardagi o'quvchilar |
| `/teacher/packages` | TeacherPackages | Individual paketlar (CRUD) |
| `/teacher/packages/:id` | TeacherPackageDetail | Paket modullari + viktorina |
| `/teacher/courses` | TeacherCourses | Tayinlangan kurslar |
| `/teacher/homework` | TeacherHomework | Topshiriqlar (baholash, izoh) |
| `/teacher/tests` | TeacherTests | Test boshqaruvi + natijalar |
| `/teacher/schedule` | TeacherSchedule | Dars jadvali |
| `/teacher/notifications` | TeacherNotifications | Xabarlar + e'lon |
| `/teacher/archive` | TeacherArchive | Yakunlangan guruhlar |

### Admin paneli (`/admin/*`, ProtectedRoute)
| Yo'l | Sahifa | Tavsif |
|------|--------|--------|
| `/admin/` | AdminDashboard | Tizim statistikasi, KPI |
| `/admin/students` | AdminStudents | O'quvchilar CRUD + qidiruv |
| `/admin/teachers` | AdminTeachers | O'qituvchilar CRUD + profil |
| `/admin/groups` | AdminGroups | Guruhlar CRUD + a'zolar |
| `/admin/schedule` | AdminSchedule | Barcha sessiyalar jadvali |
| `/admin/courses` | AdminCourses | Kurslar CRUD + nashr |
| `/admin/tariffs` | AdminTariffs | Tarif rejalari CRUD |
| `/admin/packages` | AdminPackages | Paketlar CRUD |
| `/admin/payments` | AdminPayments | To'lovlar CRUD + tasdiqlash |
| `/admin/notifications` | AdminNotifications | E'lon + xabarlar |
| `/admin/reviews` | AdminReviews | Sharh tasdiqlash |
| `/admin/tests` | AdminTests | Test boshqaruvi |
| `/admin/settings` | AdminSettings | Akademiya sozlamalari |

> Barcha sahifalar **lazy loading** va `<Suspense>` + `PageLoader` orqali yuklanadi.

---

## 5. Backend API Endpointlari

**Base URL:** `/api/v1`

### Auth (`/api/v1/auth`)
| Metod | Endpoint | Auth | Tavsif |
|-------|----------|------|--------|
| POST | `/register` | Ommaviy | Yangi o'quvchi ro'yxatdan o'tkazish |
| POST | `/login` | Ommaviy | Telefon + parol bilan kirish |
| POST | `/logout` | Ommaviy | Refresh tokenni o'chirish |
| POST | `/refresh` | Ommaviy | Access tokenni yangilash |

### Foydalanuvchilar (`/api/v1/users`)
| Metod | Endpoint | Rol | Tavsif |
|-------|----------|-----|--------|
| GET | `/public` | Ommaviy | O'qituvchilar ro'yxati |
| GET | `/me` | Har qanday | Joriy foydalanuvchi profili |
| PATCH | `/me` | Har qanday | Profilni yangilash |
| GET | `/` | Admin | Barcha foydalanuvchilar (paginated) |
| POST | `/` | Admin | Yangi foydalanuvchi yaratish |
| PATCH | `/:id` | Admin | Foydalanuvchini yangilash |
| DELETE | `/:id` | Admin | O'chirish |
| PATCH | `/:id/active` | Admin | Faollashtirish/bloklash |

### Kurslar (`/api/v1/courses`)
| Metod | Endpoint | Rol | Tavsif |
|-------|----------|-----|--------|
| GET | `/` | Ixtiyoriy | Kurslar ro'yxati |
| GET | `/mine` | Admin/O'qituvchi | Mening kurslarim |
| GET | `/:id` | Bearer | Kurs tafsilotlari |
| POST | `/` | Admin | Kurs yaratish |
| PUT | `/:id` | Admin | Yangilash |
| DELETE | `/:id` | Admin | O'chirish |
| PATCH | `/:id/publish` | Admin | Nashr etish |
| PATCH | `/:id/activate` | Admin | Faollashtirish/o'chirish |

### Guruhlar (`/api/v1/groups`)
| Metod | Endpoint | Rol | Tavsif |
|-------|----------|-----|--------|
| GET | `/` | Admin/O'qituvchi | Barcha guruhlar |
| GET | `/my` | O'quvchi | Mening guruhlarim |
| GET | `/:id` | Admin/O'qituvchi | Guruh tafsilotlari |
| GET | `/:id/members` | Admin/O'qituvchi | Guruh a'zolari |
| POST | `/` | Admin | Guruh yaratish |
| PUT | `/:id` | Admin | Yangilash |
| PATCH | `/:id/activate` | Admin | Faollashtirish (startDate o'rnatiladi) |
| PATCH | `/:id/complete` | Admin | Yakunlash |
| POST | `/:id/members` | Admin | O'quvchi qo'shish |
| DELETE | `/:id/members/:studentId` | Admin | O'quvchini chiqarish |

### To'lovlar (`/api/v1/payments`)
| Metod | Endpoint | Rol | Tavsif |
|-------|----------|-----|--------|
| GET | `/` | Admin | Barcha to'lovlar |
| GET | `/summary` | Admin | To'lov statistikasi |
| GET | `/me` | O'quvchi | Mening hisob-fakturalarim |
| POST | `/` | Admin | To'lov yozuvi yaratish |
| POST | `/generate` | Admin | Oylik qarzlar generatsiyasi |
| PATCH | `/:id/confirm` | Admin | To'lovni tasdiqlash |
| PATCH | `/:id/upload-receipt` | O'quvchi | Kvitansiya yuklash |

### Fayl Yuklash (`/api/v1/uploads`)
| Endpoint | Ruxsat | Hajm | Turlar | Papka |
|----------|--------|------|--------|-------|
| `/image` | Bearer | 5 MB | JPEG, PNG, WebP, GIF | avatars |
| `/document` | Bearer | 20 MB | PDF, DOC, DOCX, rasmlar | documents |
| `/video` | Bearer | 500 MB | MP4, WebM, OGG | videos |
| `/receipt` | Ommaviy | 20 MB | Har qanday (audio/video-dan tashqari) | receipts |
| `/view?key=...` | Bearer | — | — | S3 proxy |

> Boshqa modullar (Modules, Lessons, Homework, Tests, Attendance, Notifications, Vacancies, Enrollment, Sessions, Tariffs, Packages, Reviews, Dashboard, Settings) ham to'liq CRUD endpointlariga ega.

---

## 6. Ma'lumotlar Bazasi Sxemasi (24 ta Model)

### Asosiy modellar

#### `User`
```
name, nameUz, nameRu
phone (primary key, +998XXXXXXXXX)
email (ixtiyoriy, unique sparse)
password (bcrypt, select:false)
passwordPlain (admin ko'rinishi uchun — XAVFSIZLIK MUAMMOSI)
role: 'admin' | 'teacher' | 'student'
avatar: { url, publicId }
isActive: Boolean
dateOfBirth, address, telegram
# O'quvchi maydonlari:
studentId (sertifikat ID)
# O'qituvchi maydonlari:
color, subject, experience, bio, achievements[], salary, rating
canCreatePackages: Boolean
lastLogin: Date
```

#### `Course`
```
title: { uz, ru }
description: { uz, ru }
subject: enum (math/uzbek/history/english/it/other)
level: enum (beginner/intermediate/advanced)
tariffs: [{ key, name, price, currency }]
price: { amount, currency }
duration: Number (oylar)
thumbnail: { url, publicId }
teacher: → User
isPublished, isActive
totalStudents (denormalized)
rating: { average, count }
tags[], color, iconKey
```

#### `Group`
```
name: String
course: → Course (ixtiyoriy)
teacher: → User
package: → Package (individual paket guruhlari uchun)
room, schedule: [{ dayOfWeek, startTime, endTime }]
startDate, endDate, activatedAt
maxStudents: 20
price: { amount, currency }
type: enum (offline/online/individual_offline/individual_online/individual_package)
status: 'inactive' → 'active' → 'completed'
isActive: Boolean (status mirrori)
```

#### `Payment`
```
student: → User
group: → Group
amount, currency
month: String (YYYY-MM format)
status: 'debt' | 'pending' | 'paid'
paymentMethod: cash/card/transfer/online
receiptUrl (S3 URL)
confirmedBy: → User (admin)
dueDate, paidAt
# Unique index: student + group + month
```

#### `Attendance`
```
group: → Group
date: Date
markedBy: → User
records: [{
  student: → User
  status: 'present' | 'absent' | 'late' | 'excused'
  note: String
}]
# Unique index: group + date
```

#### `Test` + `TestQuestion` + `TestResult`
```
Test:
  course, group, teacher
  title, description
  duration (daqiqalar)
  maxScore, passingScore
  type: lesson/module/placement/final
  isPublished, shuffleQuestions
  startTime, endTime

TestQuestion:
  test: → Test
  question: String
  type: multiple_choice | true_false | essay
  options: [{ text, isCorrect }]
  score, order
  image: { url, publicId }

TestResult:
  test, student, group
  answers: [{ question, selected[], isCorrect, score }]
  score, percentage, isPassed
  startedAt, submittedAt, timeSpent
  # Unique: test + student
```

#### `Settings` (Singleton)
```
_singleton: 'global' (unique)
academyName, logo
phones[], email, address
telegram, instagram, youtube, website
monthlyFee, currency, paymentDueDay
paymentCards: [{ bank, cardNumber, cardHolder }]
paymentInstruction: String
workingHours: { weekdays, saturday }
```

#### Boshqa modellar
- `Module` — Kurs modullari (tartibli)
- `Lesson` — Modul darslari (video + materiallar)
- `GroupMember` — Guruh a'zoligi
- `GroupSession` — Dars sessiyasi (mavzu, havola, materiallar)
- `Homework` + `HomeworkSubmission` — Uy vazifalari
- `Notification` — Xabarlar (broadcast uchun bulk insert)
- `Vacancy` + ariza embeddlangan
- `Review` — Sharhlar (tasdiqlash workflow)
- `EnrollmentApplication` — Qabul arizalari
- `TariffPlan` — Narx rejalari
- `Package` + `PackageAccess` — Individual paketlar
- `RefreshToken` — JWT refresh token (MongoDB TTL, 7 kun)

---

## 7. Autentifikatsiya Mexanizmi

### Strategiya: JWT (Access + Refresh) + httpOnly Cookie

```
Ro'yxatdan o'tish:
  ↓ name, phone, password
  ↓ Telefon normallashtirish (+998XXXXXXXXX)
  ↓ Noyoblik tekshiruvi → 409 agar mavjud bo'lsa
  ↓ bcrypt(password, 12 rounds)
  ↓ User yaratish
  ↓ Access token (15m) + Refresh token (7d) berish
  ↓ RefreshToken kolleksiyasiga saqlash (MongoDB TTL)
  → { user, accessToken, refreshToken }

Kirish:
  ↓ phone + password
  ↓ User.select('+password')
  ↓ bcryptjs.compare()
  ↓ lastLogin yangilash
  ↓ Tokenlar berish
  → { user, accessToken, refreshToken }

Token yangilash (RTK Query avtomatik):
  ↓ 401 javob kelganda
  ↓ POST /auth/refresh (refresh token cookie bilan)
  ↓ Yangi access token olish
  ↓ Asl so'rovni qayta yuborish
  ↓ Agar yangilash ham muvaffaqiyatsiz → /login ga yo'naltirish
```

### RBAC
```javascript
// Middleware zanjiri
authenticate → authorize('admin', 'teacher') → controller

// Token payload
{ id: ObjectId, role: 'admin'|'teacher'|'student', iat, exp }
```

---

## 8. Fayl Yuklash Jarayoni

```
1. Client → POST /api/v1/uploads/[type] (multipart/form-data)
2. Multer → buffer xotirada saqlash
3. MIME turi va hajm tekshiruvi
4. uploadToS3(buffer, filename, mimetype, folder)
5. Key: `${folder}/${uuid}${ext}`
6. PutObjectCommand → T3 Storage (Cloudflare R2)
7. → { url: "https://...", key: "folder/uuid.ext" }
8. Controller → URL ni model maydoniga saqlash
```

**Xavfsizlik masalasi:** Barcha fayllar `ACL: public-read` bilan yuklanadi. Kvitansiyalar va maxfiy hujjatlar uchun presigned URL ishlatish tavsiya etiladi.

---

## 9. Muhit O'zgaruvchilari

### Server (Railway env vars orqali)
```env
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=...
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRES=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@parvozacademy.uz
SMTP_PASS=...
T3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
T3_ACCESS_KEY_ID=...
T3_SECRET_ACCESS_KEY=...
T3_BUCKET=parvoz-academy
CLOUDINARY_CLOUD_NAME=...  # legacy
CLOUDINARY_API_KEY=...     # legacy
CLOUDINARY_API_SECRET=...  # legacy
NODE_ENV=production
PORT=5000
CLIENT_URL=https://parvoz.uz
```

### Client
```env
# .env.development
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000

# .env.production
VITE_API_URL=/api/v1
VITE_SOCKET_URL=   # bo'sh → nisbiy
```

---

## 10. Deploy Arxitekturasi (Railway)

```
GitHub Push
    ↓
Railway CI
    ↓
Nixpacks Build:
  ├── Node 20 o'rnatish
  ├── cd client && npm ci
  ├── cd server && npm ci
  └── cd client && npm run build → client/dist
    ↓
node server/server.js
  ├── MongoDB Atlas ulanish
  ├── T3 Storage ulanish
  ├── Socket.IO init
  ├── /api/v1/* → Express router
  ├── /health → { status: "ok" }
  └── /* → client/dist (SPA fallback)
```

**Health check:** `GET /health` → `{ status: "ok", ts: "ISO" }` (30s timeout)

---

## 11. Muhim Arxitektura Naqshlari

| Naqsh | Tavsif |
|-------|--------|
| **Telefon asosli auth** | Email ixtiyoriy, telefon (`+998XXXXXXXXX`) primary key |
| **Ko'p tilli sxema** | `{ uz: String, ru: String }` embedded obyektlar |
| **Denormalized sanagichlar** | `Course.totalStudents`, `Package.purchaseCount` qo'lda yangilanadi |
| **Guruh hayot sikli** | `inactive → active → completed` holat mashinasi |
| **Oylik to'lov indeksi** | Unique: `(student, group, month)` — ikki marta yozishni oldini oladi |
| **Singleton sozlamalar** | `_singleton: 'global'` + `Settings.getSettings()` statik metodi |
| **Socket.IO xonalar** | `user:{userId}` xonalar orqali foydalanuvchilarga bildirishnoma |
| **RTK Query teglari** | `['User', 'Course', 'Group', ...]` bilan nozik keshlash |
| **Rate limiting** | Global: 200 so'rov/15 daqiqa; Kvitansiyalar: 10/15 daqiqa |

---

## 12. Aniqlanadigan Muammolar va Tavsiyalar

### Muhim xavfsizlik muammolari
| # | Muammo | Xavf darajasi | Tavsiya |
|---|--------|---------------|---------|
| 1 | `User.passwordPlain` — oddiy matndagi parol saqlash | **Yuqori** | Bu maydonni o'chirish yoki shifrlash |
| 2 | S3 fayllar `ACL: public-read` — hamma kvitansiyalar ochiq | **O'rta** | Maxfiy fayllar uchun presigned URL ishlatish |
| 3 | Socket.IO handshake'da JWT tekshirilmaydi | **O'rta** | Socket.IO middleware'ga token verificatsiya qo'shish |

### Texnik qarzlar
| # | Muammo | Tavsiya |
|---|--------|---------|
| 4 | Cloudinary konfiguratsiyasi mavjud lekin ishlatilmaydi | `config/cloudinary.js` va tegishli kodlarni o'chirish |
| 5 | Test fayllari yo'q | Jest + Supertest (backend), Vitest (frontend) qo'shish |
| 6 | `seed.js` scripti yo'qolgan | Ishlab chiqish va demo ma'lumotlar uchun seed skript yaratish |
| 7 | README eskirgan (CRA shabloni) | Loyiha-spesifik README yozish |
| 8 | Tizimli logging yo'q | Winston yoki bunyan qo'shish |
| 9 | API versiyasi kod ichida qattiq (`/api/v1`) | `API_VERSION` env o'zgaruvchisiga o'tkazish |
| 10 | Xato handling nomuvofiqligi | Barcha endpointlarda `AppError` + global handler ishlatish |

---

## 13. Loyiha Holati Baholash

| Mezon | Ball | Izoh |
|-------|------|------|
| **Funksionallik** | 9/10 | Barcha asosiy LMS funksiyalari mavjud |
| **Arxitektura** | 8/10 | Yaxshi tashkil etilgan, modulli |
| **Xavfsizlik** | 6/10 | `passwordPlain` va public S3 muammolari bor |
| **Test qamrovi** | 2/10 | Testlar yo'q |
| **Hujjatlashtirish** | 5/10 | README eskirgan, lekin kod o'z-o'zini tushuntiradi |
| **Deploy** | 9/10 | Railway + Nixpacks to'g'ri sozlangan |
| **Ko'p tillilik** | 9/10 | UZ/RU to'liq qo'llanilyapti |
| **Real-time** | 8/10 | Socket.IO xabarnomalar ishlaydi, lekin auth zaif |
| **Umumiy** | **7.0/10** | Ishchi, yaxshi tuzilgan loyiha; xavfsizlik yaxshilanishi kerak |

---

## Xulosa

**PARVOZ ACADEMY LMS** — ishlab chiqarishga tayyor, yaxshi tashkil etilgan LMS tizimi:

- **24 MongoDB modeli** — kurslar, guruhlar, to'lovlar, uy vazifalari, testlar, davomat va boshqalarni qamrab oladi
- **22+ API moduli** — to'liq LMS funksionalligini ta'minlaydi
- **35+ frontend sahifa** — admin, o'qituvchi va o'quvchi rollari uchun
- **Railway deploy** — avtomatlashtirilgan build va health check bilan
- **Multi-rol RBAC** — telefon-asosli autentifikatsiya bilan
- **Real-time** — Socket.IO orqali bildirishnomalar
- **Ko'p tilli** — O'zbek + Rus tillari to'liq qo'llanilyapti

**Birinchi navbatda hal qilish kerak bo'lgan muammolar:**
1. `User.passwordPlain` maydonini o'chirish
2. S3 kvitansiyalarni presigned URL ga o'tkazish
3. Socket.IO handshake'ga JWT tekshiruvi qo'shish
4. Backend va frontend uchun test yozish
