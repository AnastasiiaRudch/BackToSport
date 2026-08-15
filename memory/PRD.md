# PRD — ShoulderReady: Pro RTS Analytics

## Original Problem Statement
Клиническая AI-платформа оценки готовности плеча к возврату в контактный/высоконагруженный спорт после операции/травмы. 5-блочный протокол, LSI + взвешенный RTS Score, дашборд (gauge, радар, слабые звенья, AI-план), мед. дисклеймер.

## User Choices
- Auth: email/пароль + Google (Emergent-managed)
- AI: план реабилитации + AI-чат (GPT-5.4)
- Роли: атлет и тренер/физио
- Дизайн: тёмная спортивная (неон lime #ccff00), премиальная глубина/анимации
- Языки: RU / UK / EN / HE (RTL)
- Премиум: тариф Pro (демо-UI без оплат)

## Architecture
- Backend: FastAPI + Mongo. Auth (JWT + Google session, is_pro flag). Scoring engine (LSI, RTS, stable keys). AI roadmap + AI coach chat (emergentintegrations gpt-5.4, язык по выбору). chat_messages collection.
- Frontend: Expo SDK 54 + expo-router. i18n (4 языка, RTL). Tabs: Атлеты / Библиотека / Календарь / Профиль. Custom SVG Gauge/Radar/ProgressChart. Pro-гейтинг. reanimated анимации.

## Implemented (as of 2026-08-15)
- ✅ Auth (email+Google), роли, профили атлетов CRUD
- ✅ 5-блочный мастер, scoring engine, AI-план, дашборд (gauge/radar/weak links/roadmap/ER-IR)
- ✅ История, график динамики RTS, сравнение двух тестов
- ✅ PDF-отчёт для врача (expo-print/sharing), локализованный + RTL
- ✅ Мультиязычность RU/UK/EN/HE с RTL, AI на выбранном языке
- ✅ ПРЕМИУМ: тариф Pro (PUT /auth/pro), AI-чат «Спроси реабилитолога», Библиотека упражнений (8 шт), Календарь ретестов, Upgrade-экран
- ✅ Тесты: 41/41 backend + E2E премиум-флоу пройдены

## Backlog / Remaining
- P1: Реальная монетизация (RevenueCat) вместо демо-Pro
- P1: Напоминания push о ретесте (нужна сборка)
- P2: Дашборд тренера с рейтингом атлетов
- P2: Видео/анимации (Lottie) в библиотеке
- P2: Автоопределение языка устройства
- P2: Брендирование клиники в PDF

## Test Accounts
- demo_coach@example.com / Passw0rd!23 (trainer, is_pro=true)
