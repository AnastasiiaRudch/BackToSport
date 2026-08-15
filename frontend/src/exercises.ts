export type Lang = "ru" | "uk" | "en" | "he";

export type Exercise = {
  key: string;
  category: "rotator" | "scapular" | "mobility" | "stability" | "power";
  icon: string; // Ionicons name
  sets: string;
  targetKey: string; // maps to i18n weak.* / axis.*
  content: Record<Lang, { title: string; howto: string }>;
};

export const CATEGORY_COLORS: Record<string, [string, string]> = {
  rotator: ["#123a3f", "#0F1115"],
  scapular: ["#2e3a10", "#0F1115"],
  mobility: ["#0f3a22", "#0F1115"],
  stability: ["#3a3410", "#0F1115"],
  power: ["#3a1520", "#0F1115"],
};

export const EXERCISES: Exercise[] = [
  {
    key: "iso_er", category: "rotator", icon: "repeat", sets: "3 × 5×5с", targetKey: "er_str",
    content: {
      ru: { title: "Изометрическая наружная ротация", howto: "Локоть прижат к корпусу, тяните ленту наружу и удерживайте 5 сек, 5 повторов." },
      uk: { title: "Ізометрична зовнішня ротація", howto: "Лікоть притиснутий, тягніть стрічку назовні й утримуйте 5 сек, 5 повторів." },
      en: { title: "Isometric external rotation", howto: "Elbow tucked, pull the band outward and hold 5s, 5 reps." },
      he: { title: "רוטציה חיצונית איזומטרית", howto: "מרפק צמוד, משוך את הגומייה החוצה והחזק 5 שניות, 5 חזרות." },
    },
  },
  {
    key: "iso_ir", category: "rotator", icon: "repeat", sets: "3 × 5×5с", targetKey: "ir_str",
    content: {
      ru: { title: "Изометрическая внутренняя ротация", howto: "Локоть у корпуса, тяните ленту внутрь и удерживайте 5 сек, 5 повторов." },
      uk: { title: "Ізометрична внутрішня ротація", howto: "Лікоть біля корпусу, тягніть стрічку всередину й утримуйте 5 сек, 5 повторів." },
      en: { title: "Isometric internal rotation", howto: "Elbow at side, pull the band inward and hold 5s, 5 reps." },
      he: { title: "רוטציה פנימית איזומטרית", howto: "מרפק לצד הגוף, משוך פנימה והחזק 5 שניות, 5 חזרות." },
    },
  },
  {
    key: "scap_yt", category: "scapular", icon: "body", sets: "3 × 12", targetKey: "stability",
    content: {
      ru: { title: "Лопаточные Y-T-W", howto: "Лёжа на животе, поднимайте руки в форме Y, T и W, сводя лопатки, по 12 раз." },
      uk: { title: "Лопаткові Y-T-W", howto: "Лежачи на животі, піднімайте руки у формі Y, T і W, зводячи лопатки, по 12 разів." },
      en: { title: "Scapular Y-T-W", howto: "Prone, raise arms in Y, T and W shapes squeezing the scapulae, 12 each." },
      he: { title: "שכמה Y-T-W", howto: "בשכיבה על הבטן, הרם ידיים בצורת Y, T ו-W תוך כיווץ השכמות, 12 כל אחד." },
    },
  },
  {
    key: "ckc_taps", category: "stability", icon: "grid", sets: "3 × 20с", targetKey: "ckcuest",
    content: {
      ru: { title: "Касания плеч в планке (CKCUEST)", howto: "В планке поочерёдно касайтесь противоположного плеча, держа таз стабильным, 20 сек." },
      uk: { title: "Торкання плечей у планці (CKCUEST)", howto: "У планці по черзі торкайтесь протилежного плеча, тримаючи таз стабільним, 20 сек." },
      en: { title: "Plank shoulder taps (CKCUEST)", howto: "In a plank, tap the opposite shoulder while keeping hips still, 20s." },
      he: { title: "נגיעות כתף בפלאנק (CKCUEST)", howto: "בפלאנק, גע בכתף הנגדית תוך שמירה על אגן יציב, 20 שניות." },
    },
  },
  {
    key: "wall_slide", category: "mobility", icon: "trending-up", sets: "3 × 10", targetKey: "flexion",
    content: {
      ru: { title: "Скольжения по стене", howto: "Прижмите предплечья к стене и скользите вверх без боли, сохраняя контакт, 10 раз." },
      uk: { title: "Ковзання по стіні", howto: "Притисніть передпліччя до стіни і ковзайте вгору без болю, зберігаючи контакт, 10 разів." },
      en: { title: "Wall slides", howto: "Forearms on the wall, slide up pain-free keeping contact, 10 reps." },
      he: { title: "החלקות על הקיר", howto: "אמות על הקיר, החלק כלפי מעלה ללא כאב תוך שמירת מגע, 10 חזרות." },
    },
  },
  {
    key: "sleeper", category: "mobility", icon: "bed", sets: "3 × 30с", targetKey: "ir_rom",
    content: {
      ru: { title: "Sleeper stretch", howto: "Лёжа на боку, мягко доводите предплечье к полу для внутренней ротации, удержание 30 сек." },
      uk: { title: "Sleeper stretch", howto: "Лежачи на боці, м'яко доводьте передпліччя до підлоги для внутрішньої ротації, 30 сек." },
      en: { title: "Sleeper stretch", howto: "Side-lying, gently press the forearm down for internal rotation, hold 30s." },
      he: { title: "Sleeper stretch", howto: "בשכיבה על הצד, לחץ בעדינות את האמה מטה לרוטציה פנימית, החזק 30 שניות." },
    },
  },
  {
    key: "rhythmic", category: "stability", icon: "pulse", sets: "3 × 30с", targetKey: "stability",
    content: {
      ru: { title: "Ритмическая стабилизация I/Y/T", howto: "Удерживая руку в позициях I, Y, T, реагируйте на лёгкие толчки партнёра, 30 сек." },
      uk: { title: "Ритмічна стабілізація I/Y/T", howto: "Тримаючи руку в позиціях I, Y, T, реагуйте на легкі поштовхи партнера, 30 сек." },
      en: { title: "Rhythmic stabilization I/Y/T", howto: "Hold the arm in I, Y, T and resist a partner's light perturbations, 30s." },
      he: { title: "ייצוב קצבי I/Y/T", howto: "החזק את היד בתנוחות I, Y, T והתנגד לדחיפות קלות של שותף, 30 שניות." },
    },
  },
  {
    key: "med_ball", category: "power", icon: "basketball", sets: "4 × 8", targetKey: "power",
    content: {
      ru: { title: "Бросок мяча от груди", howto: "Резко выталкивайте набивной мяч 2-3 кг от груди партнёру, контролируя плечо, 8 раз." },
      uk: { title: "Кидок м'яча від грудей", howto: "Різко виштовхуйте набивний м'яч 2-3 кг від грудей партнеру, контролюючи плече, 8 разів." },
      en: { title: "Med ball chest pass", howto: "Explosively push a 2-3 kg med ball from the chest to a partner, control the shoulder, 8 reps." },
      he: { title: "מסירת כדור מהחזה", howto: "דחוף בעוצמה כדור כוח 2-3 ק\"ג מהחזה לשותף תוך שליטה בכתף, 8 חזרות." },
    },
  },
];

export const LIB_CATEGORIES = ["all", "rotator", "scapular", "mobility", "stability", "power"] as const;
