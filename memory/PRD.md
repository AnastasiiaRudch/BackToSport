# PRD — ShoulderReady: Pro RTS Analytics

## Original Problem Statement
Клиническая AI-платформа оценки готовности плеча к возврату в контактный/высоконагруженный спорт (борьба, регби, кроссфит, метательные) после операции/травмы. Пошаговый научно обоснованный протокол из 5 блоков, расчёт LSI и итогового RTS Score, интерактивный дашборд (круговой индикатор, радар, слабые звенья, AI-план), медицинский дисклеймер.

## User Choices
- Auth: email/пароль + Google (Emergent-managed)
- AI: авто-план реабилитации на GPT-5.4
- Инструкции: только текстовые
- Пользователи: атлет и тренер/физио (роли)
- Дизайн: тёмная спортивная тема, неон lime #ccff00

## Architecture
- **Backend**: FastAPI + MongoDB (motor). Unified session tokens in `user_sessions` (email/pw + Google). Scoring engine (LSI + weighted RTS). AI roadmap via emergentintegrations LlmChat (gpt-5.4).
- **Frontend**: Expo SDK 54 + expo-router. AuthContext, bottom tabs (Атлеты/История/Профиль), athlete detail, 5-block wizard, results dashboard. Custom SVG Gauge + Radar (react-native-svg). Fonts: Rajdhani + IBM Plex Sans. Keyboard via react-native-keyboard-controller.

## User Personas
- Атлет: ведёт свой один профиль, проходит оценки, видит план.
- Тренер/физио: управляет несколькими профилями атлетов, запускает и сравнивает оценки.

## Core Requirements (static)
- 5 блоков теста с корректными весами (15/15/25/25/20).
- LSI = оперированная/здоровая × 100; RTS Score 0-100 с зонами green/yellow/red.
- Дашборд: круговой gauge, 5-осевой радар, слабые звенья (LSI<90%), AI-план (3 упражнения + дата ретеста), дисклеймер.

## Implemented (2026-08-15)
- ✅ Auth: register/login/me/logout/role + Google session exchange
- ✅ Профили атлетов CRUD с последним RTS/зоной
- ✅ Мастер тестирования из 5 блоков (SIRSI слайдеры, ROM/сила/функц. степперы + LSI-подсказки, apprehension toggle, спорт-слайдеры)
- ✅ Scoring engine + AI-план (GPT-5.4, ai_generated=true), fallback-план
- ✅ Дашборд результатов: gauge, радар, компоненты, слабые звенья, roadmap, ER/IR ratio, дисклеймер
- ✅ История тестов, роли атлет/тренер
- ✅ 22/22 backend тестов + полный frontend E2E пройдены

## Backlog / Remaining
- P1: Графики прогресса RTS во времени по атлету
- P1: Экспорт/шаринг PDF-отчёта для врача
- P2: Текст+видео инструкции к тестам
- P2: Напоминания о дате ретеста
- P2: Сравнение двух оценок бок-о-бок

## Next Tasks
- По запросу пользователя: прогресс-графики, шаринг отчёта, инструкции к тестам.
