import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { I18nManager } from "react-native";
import { storage } from "@/src/utils/storage";

export type Lang = "ru" | "uk" | "en" | "he";
export const LANG_KEY = "app_lang";
export const RTL_LANGS: Lang[] = ["he"];

export const LANG_META: { key: Lang; label: string; flag: string }[] = [
  { key: "ru", label: "Русский", flag: "🌐" },
  { key: "uk", label: "Українська", flag: "🇺🇦" },
  { key: "en", label: "English", flag: "🇬🇧" },
  { key: "he", label: "עברית", flag: "🇮🇱" },
];

export const SPORT_KEYS = ["wrestling", "rugby", "crossfit", "throwing", "mma", "weightlifting", "gymnastics", "other"];
export const SURGERY_KEYS = ["bankart", "latarjet", "cuff", "slap", "capsulo", "conservative", "other"];

type Dict = Record<string, any>;

const T: Record<Lang, Dict> = {
  ru: {
    common: { name: "Имя", email: "Email", password: "Пароль", or: "или", left: "Левая", right: "Правая", male: "Мужской", female: "Женский", years: "лет", weeks: "недель", retry: "Повторить" },
    role: { athlete: "Атлет", trainer: "Тренер / физио", athleteBadge: "Атлет", trainerBadge: "Тренер" },
    auth: { headline: "Оценка готовности плеча к возврату в спорт", login: "Вход", register: "Регистрация", namePh: "Ваше имя", fillAll: "Заполните все поля", loginBtn: "Войти", createAccount: "Создать аккаунт", google: "Продолжить с Google", roleLabel: "Роль" },
    tabs: { athletes: "Атлеты", history: "История", profile: "Профиль" },
    compare: { title: "Сравнение тестов", base: "Тест A (раньше)", comp: "Тест B (позже)", components: "Компоненты", metrics: "Метрики (LSI)", open: "Сравнить тесты", needTwo: "Нужно минимум 2 теста для сравнения.", rts: "Итоговый RTS", improved: "улучшение", declined: "снижение", same: "без изменений" },
    home: { hello: "Привет, {name}", title: "Мои атлеты", emptyTitle: "Пока нет атлетов", emptyText: "Добавьте профиль атлета, чтобы начать оценку готовности плеча.", tests: "тест(ов)", weeksAfter: "нед. после операции" },
    history: { title: "История тестов", emptyTitle: "Нет проведённых тестов", emptyText: "Добавьте атлета и запустите оценку RTS." },
    profile: { title: "Профиль", roleTitle: "Роль", language: "Язык", disclaimer: "Результаты носят информационно-скрининговый характер и не заменяют очную консультацию. Обязательно подтвердите готовность к возврату в спорт у лечащего спортивного врача или хирурга.", logout: "Выйти", version: "ShoulderReady · Pro RTS Analytics v1.0" },
    np: { title: "Новый атлет", name: "Имя атлета", namePh: "Иван Петров", age: "Возраст", agePh: "24", weight: "Вес. категория", weightPh: "напр. 74 кг", sex: "Пол", sport: "Вид спорта", surgery: "Тип операции / травмы", weeks: "Срок после операции (недель)", weeksPh: "напр. 16", dominant: "Доминантная рука", operated: "Оперированная рука", fill: "Заполните имя, возраст и срок после операции", save: "Сохранить атлета" },
    detail: { startBtn: "Начать оценку RTS", historyTitle: "История оценок", noTests: "Тестов ещё не было. Запустите первую оценку.", age: "Возраст", sex: "Пол", weightCat: "Вес. категория", dominant: "Доминантная рука", operatedShort: "Опер.", progressTitle: "Динамика RTS Score", progressSub: "Прогресс по датам ретестов" },
    wizard: { protocol: "Протокол RTS", weightInScore: "Вес в скоре: {w}", start: "Начать тестирование", calc: "Рассчитать RTS Score", next: "Далее", introTitle: "Научно обоснованный протокол", introText: "Тест состоит из 5 блоков и рассчитывает индекс готовности RTS (0–100%). Для парных тестов вводите показатели оперированной и здоровой руки — система автоматически считает индекс симметрии (LSI).", disclaimer: "Проводите тесты только при отсутствии боли. Результат — скрининг, а не медицинское заключение.", psychHelper: "Опросник SIRSI: оцените каждое утверждение от 0 до 100%.", romHelper: "Введите активную амплитуду движений (в градусах) для обеих рук.", strengthHelper: "Изометрическая сила (кг) для оперированной и здоровой руки.", funcHelper: "Функциональные и плиометрические показатели для обеих рук.", sportHelper: "Оцените спорт-специфические навыки от 0 до 100%.", apprTitle: "Apprehension / Relocation Test", apprHint: "Есть субъективный страх повторного вывиха при максимальном отведении и наружной ротации?", operated: "Оперированная", healthy: "Здоровая", overlay: "Расчёт индекса и AI-плана…" },
    block: { psych: "1 · Психология", rom: "2 · ROM & Apprehension", strength: "3 · Силовой профиль (LSI)", functional: "4 · Функц. и плиометрика", sport: "5 · Спорт-специфика" },
    sirsi: [
      "Насколько вы уверены в стабильности своего плеча при возврате в спорт?",
      "Насколько вы уверены, что плечо выдержит контакт/столкновение?",
      "Насколько вы расслаблены при мысли о возврате в свой спорт?",
      "Насколько вы уверены, что не будете щадить плечо во время игры?",
      "Насколько вы уверены, что сможете выступать на прежнем уровне?",
      "Насколько мала ваша тревога о повторном вывихе?",
      "Насколько вы уверены при выполнении резких движений рукой над головой?",
      "Насколько вы доверяете плечу в захватах/бросках/падениях?",
      "Насколько вы уверены, что не измените технику из-за страха?",
      "Насколько вы уверены в силе плеча по сравнению с до травмы?",
      "Насколько вы уверены, что справитесь с давлением соревнований?",
      "Насколько вы в целом психологически готовы вернуться в спорт?",
    ],
    metric: { flexion: "Сгибание", abduction: "Отведение", er_rom: "Наружная ротация", ir_rom: "Внутренняя ротация", ash_i: "ASH тест — позиция I", ash_y: "ASH тест — позиция Y", ash_t: "ASH тест — позиция T", er_str: "Динамометрия — наружная ротация", ir_str: "Динамометрия — внутренняя ротация", ckcuest: "CKCUEST (касаний за 15 сек)", ybt: "Y-Balance композит", mbt: "Бросок мяча 2-3 кг" },
    unit: { deg: "°", kg: "кг", touch: "кас.", cm: "см", m: "м" },
    sportm: { breakfall_l: "Амортизация падения (Укэми)", breakfall_h: "Способность безопасно падать/страховаться без боли и страха", static_pp_l: "Статическая тяга/толчок", static_pp_h: "Контроль усилия с сопротивлением партнёра в дриллах", sparring_l: "Контролируемый спарринг", sparring_h: "Спарринг с тренером без боли и защитных зажимов" },
    results: { balance: "Профиль баланса", components: "Компоненты скора", weakLinks: "Слабые звенья", noWeak: "Критических дефицитов не выявлено (LSI ≥ 90%).", roadmap: "План действий (2–4 недели)", retest: "Повторный тест:", disclaimer: "Отчёт носит скрининговый характер. Окончательное решение о возврате в спорт принимает лечащий спортивный врач или хирург на очной консультации.", share: "Отчёт для врача (PDF)", shareWeb: "Экспорт PDF доступен в мобильном приложении (Expo Go / сборка).", shareFail: "Не удалось сформировать отчёт. Попробуйте ещё раз.", shareUnavail: "Отправка недоступна на этом устройстве.", risk: "риск", ratio: "ER/IR Ratio (норма ~0.66-0.75)", ratioOp: "Опер.", ratioHe: "Здор." },
    zone: { green: "Зелёная зона", yellow: "Жёлтая зона", red: "Красная зона" },
    zoneAdvice: { green: "Полный допуск к контакту и соревнованиям.", yellow: "Модифицированные тренировки, дриллы и спарринги с ограничениями.", red: "Возврат в контакт запрещён. Продолжайте изолированную реабилитацию." },
    comp: { psychology: "Психология (SIRSI)", rom: "Мобильность (ROM)", strength_lsi: "Сила (LSI)", functional_lsi: "Функциональность (LSI)", sport_specific: "Спорт-специфика" },
    axis: { psychology: "Психология", mobility: "Мобильность", strength: "Сила", stability: "Стабильность", power: "Мощность" },
    weak: { flexion: "Сгибание", abduction: "Отведение", er_rom: "Наружная ротация", ir_rom: "Внутренняя ротация", ash_i: "ASH позиция I", ash_y: "ASH позиция Y", ash_t: "ASH позиция T", er_str: "Наружная ротация (сила)", ir_str: "Внутренняя ротация (сила)", ckcuest: "CKCUEST (стабильность)", ybt: "Y-Balance Test", mbt: "Бросок мяча (мощность)", apprehension: "Apprehension / страх повторного вывиха", low_sirsi: "Низкая психологическая уверенность (SIRSI)", breakfall: "Амортизация падения (Укэми)", static_pp: "Статическая тяга/толчок", sparring: "Контролируемый спарринг" },
    sport: { wrestling: "Борьба", rugby: "Регби", crossfit: "Кроссфит", throwing: "Метательные дисциплины", mma: "ММА / Единоборства", weightlifting: "Тяжёлая атлетика", gymnastics: "Гимнастика", other: "Другое" },
    surgery: { bankart: "Банкарт (Bankart)", latarjet: "Латарже (Latarjet)", cuff: "Шов вращательной манжеты", slap: "SLAP-репарация", capsulo: "Стабилизация (капсулопластика)", conservative: "Консервативно (без операции)", other: "Другое" },
  },

  uk: {
    common: { name: "Ім'я", email: "Email", password: "Пароль", or: "або", left: "Ліва", right: "Права", male: "Чоловіча", female: "Жіноча", years: "років", weeks: "тижнів", retry: "Повторити" },
    role: { athlete: "Атлет", trainer: "Тренер / фізіо", athleteBadge: "Атлет", trainerBadge: "Тренер" },
    auth: { headline: "Оцінка готовності плеча до повернення у спорт", login: "Вхід", register: "Реєстрація", namePh: "Ваше ім'я", fillAll: "Заповніть усі поля", loginBtn: "Увійти", createAccount: "Створити акаунт", google: "Продовжити з Google", roleLabel: "Роль" },
    tabs: { athletes: "Атлети", history: "Історія", profile: "Профіль" },
    compare: { title: "Порівняння тестів", base: "Тест A (раніше)", comp: "Тест B (пізніше)", components: "Компоненти", metrics: "Метрики (LSI)", open: "Порівняти тести", needTwo: "Потрібно щонайменше 2 тести для порівняння.", rts: "Підсумковий RTS", improved: "покращення", declined: "зниження", same: "без змін" },
    home: { hello: "Привіт, {name}", title: "Мої атлети", emptyTitle: "Ще немає атлетів", emptyText: "Додайте профіль атлета, щоб почати оцінку готовності плеча.", tests: "тест(ів)", weeksAfter: "тижн. після операції" },
    history: { title: "Історія тестів", emptyTitle: "Немає проведених тестів", emptyText: "Додайте атлета та запустіть оцінку RTS." },
    profile: { title: "Профіль", roleTitle: "Роль", language: "Мова", disclaimer: "Результати мають інформаційно-скринінговий характер і не замінюють очну консультацію. Обов'язково підтвердіть готовність до повернення у спорт у лікаря або хірурга.", logout: "Вийти", version: "ShoulderReady · Pro RTS Analytics v1.0" },
    np: { title: "Новий атлет", name: "Ім'я атлета", namePh: "Іван Петренко", age: "Вік", agePh: "24", weight: "Ваг. категорія", weightPh: "напр. 74 кг", sex: "Стать", sport: "Вид спорту", surgery: "Тип операції / травми", weeks: "Термін після операції (тижнів)", weeksPh: "напр. 16", dominant: "Домінантна рука", operated: "Оперована рука", fill: "Заповніть ім'я, вік і термін після операції", save: "Зберегти атлета" },
    detail: { startBtn: "Почати оцінку RTS", historyTitle: "Історія оцінок", noTests: "Тестів ще не було. Запустіть першу оцінку.", age: "Вік", sex: "Стать", weightCat: "Ваг. категорія", dominant: "Домінантна рука", operatedShort: "Опер.", progressTitle: "Динаміка RTS Score", progressSub: "Прогрес за датами ретестів" },
    wizard: { protocol: "Протокол RTS", weightInScore: "Вага в скорі: {w}", start: "Почати тестування", calc: "Розрахувати RTS Score", next: "Далі", introTitle: "Науково обґрунтований протокол", introText: "Тест складається з 5 блоків і розраховує індекс готовності RTS (0–100%). Для парних тестів вводьте показники оперованої та здорової руки — система автоматично рахує індекс симетрії (LSI).", disclaimer: "Проводьте тести лише за відсутності болю. Результат — скринінг, а не медичний висновок.", psychHelper: "Опитувальник SIRSI: оцініть кожне твердження від 0 до 100%.", romHelper: "Введіть активну амплітуду рухів (у градусах) для обох рук.", strengthHelper: "Ізометрична сила (кг) для оперованої та здорової руки.", funcHelper: "Функціональні та пліометричні показники для обох рук.", sportHelper: "Оцініть спорт-специфічні навички від 0 до 100%.", apprTitle: "Apprehension / Relocation Test", apprHint: "Чи є суб'єктивний страх повторного вивиху при максимальному відведенні та зовнішній ротації?", operated: "Оперована", healthy: "Здорова", overlay: "Розрахунок індексу та AI-плану…" },
    block: { psych: "1 · Психологія", rom: "2 · ROM & Apprehension", strength: "3 · Силовий профіль (LSI)", functional: "4 · Функц. та пліометрика", sport: "5 · Спорт-специфіка" },
    sirsi: [
      "Наскільки ви впевнені у стабільності свого плеча при поверненні у спорт?",
      "Наскільки ви впевнені, що плече витримає контакт/зіткнення?",
      "Наскільки ви розслаблені при думці про повернення у свій спорт?",
      "Наскільки ви впевнені, що не щадитимете плече під час гри?",
      "Наскільки ви впевнені, що зможете виступати на попередньому рівні?",
      "Наскільки мала ваша тривога про повторний вивих?",
      "Наскільки ви впевнені при різких рухах рукою над головою?",
      "Наскільки ви довіряєте плечу в захопленнях/кидках/падіннях?",
      "Наскільки ви впевнені, що не зміните техніку через страх?",
      "Наскільки ви впевнені в силі плеча порівняно з до травми?",
      "Наскільки ви впевнені, що впораєтеся з тиском змагань?",
      "Наскільки ви загалом психологічно готові повернутися у спорт?",
    ],
    metric: { flexion: "Згинання", abduction: "Відведення", er_rom: "Зовнішня ротація", ir_rom: "Внутрішня ротація", ash_i: "ASH тест — позиція I", ash_y: "ASH тест — позиція Y", ash_t: "ASH тест — позиція T", er_str: "Динамометрія — зовнішня ротація", ir_str: "Динамометрія — внутрішня ротація", ckcuest: "CKCUEST (торкань за 15 сек)", ybt: "Y-Balance композит", mbt: "Кидок м'яча 2-3 кг" },
    unit: { deg: "°", kg: "кг", touch: "тор.", cm: "см", m: "м" },
    sportm: { breakfall_l: "Амортизація падіння (Укемі)", breakfall_h: "Здатність безпечно падати/страхуватися без болю і страху", static_pp_l: "Статична тяга/поштовх", static_pp_h: "Контроль зусилля з опором партнера у дрилах", sparring_l: "Контрольований спаринг", sparring_h: "Спаринг з тренером без болю та захисних затисків" },
    results: { balance: "Профіль балансу", components: "Компоненти скору", weakLinks: "Слабкі ланки", noWeak: "Критичних дефіцитів не виявлено (LSI ≥ 90%).", roadmap: "План дій (2–4 тижні)", retest: "Повторний тест:", disclaimer: "Звіт має скринінговий характер. Остаточне рішення про повернення у спорт ухвалює лікар або хірург на очній консультації.", share: "Звіт для лікаря (PDF)", shareWeb: "Експорт PDF доступний у мобільному застосунку (Expo Go / збірка).", shareFail: "Не вдалося сформувати звіт. Спробуйте ще раз.", shareUnavail: "Надсилання недоступне на цьому пристрої.", risk: "ризик", ratio: "ER/IR Ratio (норма ~0.66-0.75)", ratioOp: "Опер.", ratioHe: "Здор." },
    zone: { green: "Зелена зона", yellow: "Жовта зона", red: "Червона зона" },
    zoneAdvice: { green: "Повний допуск до контакту та змагань.", yellow: "Модифіковані тренування, дрили та спаринги з обмеженнями.", red: "Повернення в контакт заборонено. Продовжуйте ізольовану реабілітацію." },
    comp: { psychology: "Психологія (SIRSI)", rom: "Мобільність (ROM)", strength_lsi: "Сила (LSI)", functional_lsi: "Функціональність (LSI)", sport_specific: "Спорт-специфіка" },
    axis: { psychology: "Психологія", mobility: "Мобільність", strength: "Сила", stability: "Стабільність", power: "Потужність" },
    weak: { flexion: "Згинання", abduction: "Відведення", er_rom: "Зовнішня ротація", ir_rom: "Внутрішня ротація", ash_i: "ASH позиція I", ash_y: "ASH позиція Y", ash_t: "ASH позиція T", er_str: "Зовнішня ротація (сила)", ir_str: "Внутрішня ротація (сила)", ckcuest: "CKCUEST (стабільність)", ybt: "Y-Balance Test", mbt: "Кидок м'яча (потужність)", apprehension: "Apprehension / страх повторного вивиху", low_sirsi: "Низька психологічна впевненість (SIRSI)", breakfall: "Амортизація падіння (Укемі)", static_pp: "Статична тяга/поштовх", sparring: "Контрольований спаринг" },
    sport: { wrestling: "Боротьба", rugby: "Регбі", crossfit: "Кросфіт", throwing: "Метальні дисципліни", mma: "ММА / Єдиноборства", weightlifting: "Важка атлетика", gymnastics: "Гімнастика", other: "Інше" },
    surgery: { bankart: "Банкарт (Bankart)", latarjet: "Латарже (Latarjet)", cuff: "Шов обертальної манжети", slap: "SLAP-репарація", capsulo: "Стабілізація (капсулопластика)", conservative: "Консервативно (без операції)", other: "Інше" },
  },

  en: {
    common: { name: "Name", email: "Email", password: "Password", or: "or", left: "Left", right: "Right", male: "Male", female: "Female", years: "yrs", weeks: "weeks", retry: "Retry" },
    role: { athlete: "Athlete", trainer: "Coach / physio", athleteBadge: "Athlete", trainerBadge: "Coach" },
    auth: { headline: "Shoulder return-to-sport readiness assessment", login: "Log in", register: "Sign up", namePh: "Your name", fillAll: "Please fill in all fields", loginBtn: "Log in", createAccount: "Create account", google: "Continue with Google", roleLabel: "Role" },
    tabs: { athletes: "Athletes", history: "History", profile: "Profile" },
    compare: { title: "Compare tests", base: "Test A (earlier)", comp: "Test B (later)", components: "Components", metrics: "Metrics (LSI)", open: "Compare tests", needTwo: "You need at least 2 tests to compare.", rts: "Overall RTS", improved: "improved", declined: "declined", same: "no change" },
    home: { hello: "Hi, {name}", title: "My athletes", emptyTitle: "No athletes yet", emptyText: "Add an athlete profile to start a shoulder readiness assessment.", tests: "test(s)", weeksAfter: "wks post-op" },
    history: { title: "Test history", emptyTitle: "No tests yet", emptyText: "Add an athlete and start an RTS assessment." },
    profile: { title: "Profile", roleTitle: "Role", language: "Language", disclaimer: "Results are for informational screening only and do not replace an in-person consultation. Always confirm return-to-sport clearance with your treating sports physician or surgeon.", logout: "Log out", version: "ShoulderReady · Pro RTS Analytics v1.0" },
    np: { title: "New athlete", name: "Athlete name", namePh: "John Smith", age: "Age", agePh: "24", weight: "Weight class", weightPh: "e.g. 74 kg", sex: "Sex", sport: "Sport", surgery: "Surgery / injury type", weeks: "Time since surgery (weeks)", weeksPh: "e.g. 16", dominant: "Dominant arm", operated: "Operated arm", fill: "Fill in name, age and time since surgery", save: "Save athlete" },
    detail: { startBtn: "Start RTS assessment", historyTitle: "Assessment history", noTests: "No tests yet. Run the first assessment.", age: "Age", sex: "Sex", weightCat: "Weight class", dominant: "Dominant arm", operatedShort: "Op.", progressTitle: "RTS Score trend", progressSub: "Progress across retest dates" },
    wizard: { protocol: "RTS Protocol", weightInScore: "Score weight: {w}", start: "Start testing", calc: "Calculate RTS Score", next: "Next", introTitle: "Evidence-based protocol", introText: "The test has 5 blocks and computes an RTS readiness index (0–100%). For paired tests, enter the operated and healthy arm values — the app auto-computes the Limb Symmetry Index (LSI).", disclaimer: "Only run tests when pain-free. The result is a screen, not a medical diagnosis.", psychHelper: "SIRSI questionnaire: rate each statement from 0 to 100%.", romHelper: "Enter active range of motion (in degrees) for both arms.", strengthHelper: "Isometric strength (kg) for the operated and healthy arm.", funcHelper: "Functional and plyometric metrics for both arms.", sportHelper: "Rate sport-specific skills from 0 to 100%.", apprTitle: "Apprehension / Relocation Test", apprHint: "Any subjective fear of re-dislocation at maximal abduction and external rotation?", operated: "Operated", healthy: "Healthy", overlay: "Computing index and AI plan…" },
    block: { psych: "1 · Psychology", rom: "2 · ROM & Apprehension", strength: "3 · Strength profile (LSI)", functional: "4 · Functional & plyometric", sport: "5 · Sport-specific" },
    sirsi: [
      "How confident are you in your shoulder's stability when returning to sport?",
      "How confident are you the shoulder will withstand contact/collision?",
      "How relaxed are you about the thought of returning to your sport?",
      "How confident are you that you won't protect the shoulder during play?",
      "How confident are you that you can perform at your previous level?",
      "How low is your anxiety about re-dislocation?",
      "How confident are you performing explosive overhead arm movements?",
      "How much do you trust the shoulder in grips/throws/falls?",
      "How confident are you that you won't change technique out of fear?",
      "How confident are you in shoulder strength compared to pre-injury?",
      "How confident are you that you can handle competition pressure?",
      "Overall, how psychologically ready are you to return to sport?",
    ],
    metric: { flexion: "Flexion", abduction: "Abduction", er_rom: "External rotation", ir_rom: "Internal rotation", ash_i: "ASH test — position I", ash_y: "ASH test — position Y", ash_t: "ASH test — position T", er_str: "Dynamometry — external rotation", ir_str: "Dynamometry — internal rotation", ckcuest: "CKCUEST (touches in 15 sec)", ybt: "Y-Balance composite", mbt: "Medicine ball throw 2-3 kg" },
    unit: { deg: "°", kg: "kg", touch: "tch", cm: "cm", m: "m" },
    sportm: { breakfall_l: "Breakfall / landing (Ukemi)", breakfall_h: "Ability to fall/break safely without pain or fear", static_pp_l: "Static push/pull", static_pp_h: "Force control against a partner's resistance in drills", sparring_l: "Controlled sparring", sparring_h: "Sparring with a coach without pain or guarding" },
    results: { balance: "Balance profile", components: "Score components", weakLinks: "Weak links", noWeak: "No critical deficits detected (LSI ≥ 90%).", roadmap: "Action plan (2–4 weeks)", retest: "Retest:", disclaimer: "This report is a screening tool. The final return-to-sport decision rests with your treating sports physician or surgeon at an in-person visit.", share: "Doctor report (PDF)", shareWeb: "PDF export is available in the mobile app (Expo Go / build).", shareFail: "Could not generate the report. Please try again.", shareUnavail: "Sharing is unavailable on this device.", risk: "risk", ratio: "ER/IR Ratio (normal ~0.66-0.75)", ratioOp: "Op.", ratioHe: "Healthy" },
    zone: { green: "Green zone", yellow: "Yellow zone", red: "Red zone" },
    zoneAdvice: { green: "Full clearance to contact and competition.", yellow: "Modified training, drills and sparring with restrictions.", red: "No return to contact. Continue isolated rehabilitation." },
    comp: { psychology: "Psychology (SIRSI)", rom: "Mobility (ROM)", strength_lsi: "Strength (LSI)", functional_lsi: "Functionality (LSI)", sport_specific: "Sport-specific" },
    axis: { psychology: "Psychology", mobility: "Mobility", strength: "Strength", stability: "Stability", power: "Power" },
    weak: { flexion: "Flexion", abduction: "Abduction", er_rom: "External rotation", ir_rom: "Internal rotation", ash_i: "ASH position I", ash_y: "ASH position Y", ash_t: "ASH position T", er_str: "External rotation (strength)", ir_str: "Internal rotation (strength)", ckcuest: "CKCUEST (stability)", ybt: "Y-Balance Test", mbt: "Ball throw (power)", apprehension: "Apprehension / fear of re-dislocation", low_sirsi: "Low psychological confidence (SIRSI)", breakfall: "Breakfall / landing (Ukemi)", static_pp: "Static push/pull", sparring: "Controlled sparring" },
    sport: { wrestling: "Wrestling", rugby: "Rugby", crossfit: "CrossFit", throwing: "Throwing sports", mma: "MMA / Combat", weightlifting: "Weightlifting", gymnastics: "Gymnastics", other: "Other" },
    surgery: { bankart: "Bankart repair", latarjet: "Latarjet", cuff: "Rotator cuff repair", slap: "SLAP repair", capsulo: "Stabilization (capsuloplasty)", conservative: "Conservative (non-op)", other: "Other" },
  },

  he: {
    common: { name: "שם", email: "אימייל", password: "סיסמה", or: "או", left: "שמאל", right: "ימין", male: "זכר", female: "נקבה", years: "שנים", weeks: "שבועות", retry: "נסה שוב" },
    role: { athlete: "ספורטאי", trainer: "מאמן / פיזיו", athleteBadge: "ספורטאי", trainerBadge: "מאמן" },
    auth: { headline: "הערכת מוכנות הכתף לחזרה לספורט", login: "התחברות", register: "הרשמה", namePh: "השם שלך", fillAll: "נא למלא את כל השדות", loginBtn: "התחבר", createAccount: "צור חשבון", google: "המשך עם Google", roleLabel: "תפקיד" },
    tabs: { athletes: "ספורטאים", history: "היסטוריה", profile: "פרופיל" },
    compare: { title: "השוואת בדיקות", base: "בדיקה A (מוקדם)", comp: "בדיקה B (מאוחר)", components: "רכיבים", metrics: "מדדים (LSI)", open: "השווה בדיקות", needTwo: "נדרשות לפחות 2 בדיקות להשוואה.", rts: "ציון RTS כולל", improved: "שיפור", declined: "ירידה", same: "ללא שינוי" },
    home: { hello: "שלום, {name}", title: "הספורטאים שלי", emptyTitle: "אין ספורטאים עדיין", emptyText: "הוסף פרופיל ספורטאי כדי להתחיל הערכת מוכנות כתף.", tests: "בדיקות", weeksAfter: "שבועות אחרי הניתוח" },
    history: { title: "היסטוריית בדיקות", emptyTitle: "אין בדיקות עדיין", emptyText: "הוסף ספורטאי והתחל הערכת RTS." },
    profile: { title: "פרופיל", roleTitle: "תפקיד", language: "שפה", disclaimer: "התוצאות הן לסינון מידע בלבד ואינן מחליפות ייעוץ פנים אל פנים. יש לאשר חזרה לספורט אצל רופא הספורט או המנתח המטפל.", logout: "התנתק", version: "ShoulderReady · Pro RTS Analytics v1.0" },
    np: { title: "ספורטאי חדש", name: "שם הספורטאי", namePh: "ישראל ישראלי", age: "גיל", agePh: "24", weight: "קטגוריית משקל", weightPh: "לדוגמה 74 ק\"ג", sex: "מין", sport: "ענף ספורט", surgery: "סוג ניתוח / פציעה", weeks: "זמן מאז הניתוח (שבועות)", weeksPh: "לדוגמה 16", dominant: "יד דומיננטית", operated: "היד המנותחת", fill: "מלא שם, גיל וזמן מאז הניתוח", save: "שמור ספורטאי" },
    detail: { startBtn: "התחל הערכת RTS", historyTitle: "היסטוריית הערכות", noTests: "אין בדיקות עדיין. הפעל את ההערכה הראשונה.", age: "גיל", sex: "מין", weightCat: "קטגוריית משקל", dominant: "יד דומיננטית", operatedShort: "מנותחת", progressTitle: "מגמת ציון RTS", progressSub: "התקדמות לפי תאריכי בדיקה חוזרת" },
    wizard: { protocol: "פרוטוקול RTS", weightInScore: "משקל בציון: {w}", start: "התחל בדיקה", calc: "חשב ציון RTS", next: "הבא", introTitle: "פרוטוקול מבוסס ראיות", introText: "הבדיקה כוללת 5 בלוקים ומחשבת מדד מוכנות RTS (0–100%). בבדיקות זוגיות הזן את ערכי היד המנותחת והבריאה — המערכת מחשבת אוטומטית את מדד הסימטריה (LSI).", disclaimer: "בצע בדיקות רק בהיעדר כאב. התוצאה היא סינון, לא אבחנה רפואית.", psychHelper: "שאלון SIRSI: דרג כל היגד מ-0 עד 100%.", romHelper: "הזן טווח תנועה פעיל (במעלות) עבור שתי הידיים.", strengthHelper: "כוח איזומטרי (ק\"ג) עבור היד המנותחת והבריאה.", funcHelper: "מדדים פונקציונליים ופליומטריים עבור שתי הידיים.", sportHelper: "דרג מיומנויות ספציפיות לספורט מ-0 עד 100%.", apprTitle: "Apprehension / Relocation Test", apprHint: "האם קיים פחד סובייקטיבי מפריקה חוזרת בהרחקה מקסימלית ורוטציה חיצונית?", operated: "מנותחת", healthy: "בריאה", overlay: "מחשב מדד ותוכנית AI…" },
    block: { psych: "1 · פסיכולוגיה", rom: "2 · ROM & Apprehension", strength: "3 · פרופיל כוח (LSI)", functional: "4 · פונקציונלי ופליומטרי", sport: "5 · ספציפי לספורט" },
    sirsi: [
      "עד כמה אתה בטוח ביציבות הכתף שלך בחזרה לספורט?",
      "עד כמה אתה בטוח שהכתף תעמוד במגע/התנגשות?",
      "עד כמה אתה רגוע מהמחשבה על חזרה לענף שלך?",
      "עד כמה אתה בטוח שלא תחוס על הכתף במהלך המשחק?",
      "עד כמה אתה בטוח שתוכל להופיע ברמה הקודמת?",
      "עד כמה נמוך החשש שלך מפריקה חוזרת?",
      "עד כמה אתה בטוח בתנועות יד נפיצות מעל הראש?",
      "עד כמה אתה סומך על הכתף באחיזות/זריקות/נפילות?",
      "עד כמה אתה בטוח שלא תשנה טכניקה מתוך פחד?",
      "עד כמה אתה בטוח בכוח הכתף לעומת לפני הפציעה?",
      "עד כמה אתה בטוח שתתמודד עם לחץ התחרות?",
      "באופן כללי, עד כמה אתה מוכן פסיכולוגית לחזור לספורט?",
    ],
    metric: { flexion: "כיפוף", abduction: "הרחקה", er_rom: "רוטציה חיצונית", ir_rom: "רוטציה פנימית", ash_i: "מבחן ASH — עמדה I", ash_y: "מבחן ASH — עמדה Y", ash_t: "מבחן ASH — עמדה T", er_str: "דינמומטריה — רוטציה חיצונית", ir_str: "דינמומטריה — רוטציה פנימית", ckcuest: "CKCUEST (נגיעות ב-15 שנ')", ybt: "מדד Y-Balance", mbt: "זריקת כדור 2-3 ק\"ג" },
    unit: { deg: "°", kg: "ק\"ג", touch: "נגיעות", cm: "ס\"מ", m: "מ'" },
    sportm: { breakfall_l: "בלימת נפילה (אוקמי)", breakfall_h: "יכולת ליפול/להתגלגל בבטחה ללא כאב ופחד", static_pp_l: "משיכה/דחיפה סטטית", static_pp_h: "שליטה במאמץ מול התנגדות שותף בתרגילים", sparring_l: "ספארינג מבוקר", sparring_h: "ספארינג עם מאמן ללא כאב ושמירה יתרה" },
    results: { balance: "פרופיל איזון", components: "רכיבי הציון", weakLinks: "חוליות חלשות", noWeak: "לא זוהו חוסרים קריטיים (LSI ≥ 90%).", roadmap: "תוכנית פעולה (2–4 שבועות)", retest: "בדיקה חוזרת:", disclaimer: "הדוח הוא כלי סינון. ההחלטה הסופית על חזרה לספורט היא של רופא הספורט או המנתח המטפל בבדיקה פנים אל פנים.", share: "דוח לרופא (PDF)", shareWeb: "ייצוא PDF זמין באפליקציה בנייד (Expo Go / build).", shareFail: "לא ניתן להפיק את הדוח. נסה שוב.", shareUnavail: "השיתוף אינו זמין במכשיר זה.", risk: "סיכון", ratio: "יחס ER/IR (תקין ~0.66-0.75)", ratioOp: "מנותחת", ratioHe: "בריאה" },
    zone: { green: "אזור ירוק", yellow: "אזור צהוב", red: "אזור אדום" },
    zoneAdvice: { green: "אישור מלא למגע ולתחרות.", yellow: "אימונים מותאמים, תרגילים וספארינג עם מגבלות.", red: "אין חזרה למגע. המשך שיקום מבודד." },
    comp: { psychology: "פסיכולוגיה (SIRSI)", rom: "ניידות (ROM)", strength_lsi: "כוח (LSI)", functional_lsi: "פונקציונליות (LSI)", sport_specific: "ספציפי לספורט" },
    axis: { psychology: "פסיכולוגיה", mobility: "ניידות", strength: "כוח", stability: "יציבות", power: "עוצמה" },
    weak: { flexion: "כיפוף", abduction: "הרחקה", er_rom: "רוטציה חיצונית", ir_rom: "רוטציה פנימית", ash_i: "ASH עמדה I", ash_y: "ASH עמדה Y", ash_t: "ASH עמדה T", er_str: "רוטציה חיצונית (כוח)", ir_str: "רוטציה פנימית (כוח)", ckcuest: "CKCUEST (יציבות)", ybt: "מבחן Y-Balance", mbt: "זריקת כדור (עוצמה)", apprehension: "Apprehension / פחד מפריקה חוזרת", low_sirsi: "ביטחון פסיכולוגי נמוך (SIRSI)", breakfall: "בלימת נפילה (אוקמי)", static_pp: "משיכה/דחיפה סטטית", sparring: "ספארינג מבוקר" },
    sport: { wrestling: "היאבקות", rugby: "רוגבי", crossfit: "קרוספיט", throwing: "ענפי זריקה", mma: "MMA / לחימה", weightlifting: "הרמת משקולות", gymnastics: "התעמלות", other: "אחר" },
    surgery: { bankart: "ניתוח Bankart", latarjet: "Latarjet", cuff: "תפירת מסובב הכתף", slap: "תיקון SLAP", capsulo: "ייצוב (קפסולופלסטיקה)", conservative: "שמרני (ללא ניתוח)", other: "אחר" },
  },
};

function lookup(lang: Lang, path: string): any {
  const parts = path.split(".");
  let cur: any = T[lang];
  for (const p of parts) {
    if (cur == null) break;
    cur = cur[p];
  }
  if (cur == null && lang !== "ru") return lookup("ru", path);
  return cur;
}

type Ctx = {
  lang: Lang;
  isRTL: boolean;
  setLang: (l: Lang) => Promise<void>;
  t: (path: string, params?: Record<string, string | number>) => string;
  tArr: (path: string) => string[];
  ready: boolean;
};

const I18nContext = createContext<Ctx>({} as Ctx);
export const useI18n = () => useContext(I18nContext);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<Lang>(LANG_KEY, "ru");
      const l = (saved && ["ru", "uk", "en", "he"].includes(saved) ? saved : "ru") as Lang;
      setLangState(l);
      setReady(true);
    })();
  }, []);

  const setLang = useCallback(async (l: Lang) => {
    await storage.setItem(LANG_KEY, l);
    setLangState(l);
    const wantRTL = RTL_LANGS.includes(l);
    if (I18nManager.isRTL !== wantRTL) {
      try {
        I18nManager.allowRTL(wantRTL);
        I18nManager.forceRTL(wantRTL);
      } catch {}
    }
  }, []);

  const t = useCallback(
    (path: string, params?: Record<string, string | number>) => {
      let val = lookup(lang, path);
      if (typeof val !== "string") return path;
      if (params) {
        Object.keys(params).forEach((k) => {
          val = val.replace(new RegExp(`\\{${k}\\}`, "g"), String(params[k]));
        });
      }
      return val;
    },
    [lang],
  );

  const tArr = useCallback((path: string) => {
    const val = lookup(lang, path);
    return Array.isArray(val) ? val : [];
  }, [lang]);

  const isRTL = RTL_LANGS.includes(lang);

  return (
    <I18nContext.Provider value={{ lang, isRTL, setLang, t, tArr, ready }}>
      {children}
    </I18nContext.Provider>
  );
}
