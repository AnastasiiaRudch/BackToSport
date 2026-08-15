export type Lang = "ru" | "uk" | "en" | "he";

export type Exercise = {
  key: string;
  category: "rotator" | "scapular" | "mobility" | "stability" | "power";
  image: string;
  sets: string;
  targetKey: string; // maps to i18n weak.* / axis.*
  content: Record<Lang, { title: string; howto: string }>;
};

const IMG = {
  band: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&q=80",
  scap: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
  plank: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&q=80",
  mob: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
  ball: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
  dumbbell: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&q=80",
};

export const EXERCISES: Exercise[] = [
  {
    key: "iso_er", category: "rotator", image: IMG.band, sets: "3 × 5×5с", targetKey: "er_str",
    content: {
      ru: { title: "Изометрическая наружная ротация", howto: "Локоть прижат к корпусу, тяните ленту наружу и удерживайте 5 сек, 5 повторов." },
      uk: { title: "Ізометрична зовнішня ротація", howto: "Лікоть притиснутий, тягніть стрічку назовні й утримуйте 5 сек, 5 повторів." },
      en: { title: "Isometric external rotation", howto: "Elbow tucked, pull the band outward and hold 5s, 5 reps." },
      he: { title: "רוטציה חיצונית איזומטרית", howto: "מרפק צמוד, משוך את הגומייה החוצה והחזק 5 שניות, 5 חזרות." },
    },
  },
  {
    key: "iso_ir", category: "rotator", image: IMG.band, sets: "3 × 5×5с", targetKey: "ir_str",
    content: {
      ru: { title: "Изометрическая внутренняя ротация", howto: "Локоть у корпуса, тяните ленту внутрь и удерживайте 5 сек, 5 повторов." },
      uk: { title: "Ізометрична внутрішня ротація", howto: "Лікоть біля корпусу, тягніть стрічку всередину й утримуйте 5 сек, 5 повторів." },
      en: { title: "Isometric internal rotation", howto: "Elbow at side, pull the band inward and hold 5s, 5 reps." },
      he: { title: "רוטציה פנימית איזומטרית", howto: "מרפק לצד הגוף, משוך פנימה והחזק 5 שניות, 5 חזרות." },
    },
  },
  {
    key: "scap_yt", category: "scapular", image: IMG.scap, sets: "3 × 12", targetKey: "stability",
    content: {
      ru: { title: "Лопаточные Y-T-W", howto: "Лёжа на животе, поднимайте руки в форме Y, T и W, сводя лопатки, по 12 раз." },
      uk: { title: "Лопаткові Y-T-W", howto: "Лежачи на животі, піднімайте руки у формі Y, T і W, зводячи лопатки, по 12 разів." },
      en: { title: "Scapular Y-T-W", howto: "Prone, raise arms in Y, T and W shapes squeezing the scapulae, 12 each." },
      he: { title: "שכמה Y-T-W", howto: "בשכיבה על הבטן, הרם ידיים בצורת Y, T ו-W תוך כיווץ השכמות, 12 כל אחד." },
    },
  },
  {
    key: "ckc_taps", category: "stability", image: IMG.plank, sets: "3 × 20с", targetKey: "ckcuest",
    content: {
      ru: { title: "Касания плеч в планке (CKCUEST)", howto: "В планке поочерёдно касайтесь противоположного плеча, держа таз стабильным, 20 сек." },
      uk: { title: "Торкання плечей у планці (CKCUEST)", howto: "У планці по черзі торкайтесь протилежного плеча, тримаючи таз стабільним, 20 сек." },
      en: { title: "Plank shoulder taps (CKCUEST)", howto: "In a plank, tap the opposite shoulder while keeping hips still, 20s." },
      he: { title: "נגיעות כתף בפלאנק (CKCUEST)", howto: "בפלאנק, גע בכתף הנגדית תוך שמירה על אגן יציב, 20 שניות." },
    },
  },
  {
    key: "wall_slide", category: "mobility", image: IMG.mob, sets: "3 × 10", targetKey: "flexion",
    content: {
      ru: { title: "Скольжения по стене", howto: "Прижмите предплечья к стене и скользите вверх без боли, сохраняя контакт, 10 раз." },
      uk: { title: "Ковзання по стіні", howto: "Притисніть передпліччя до стіни і ковзайте вгору без болю, зберігаючи контакт, 10 разів." },
      en: { title: "Wall slides", howto: "Forearms on the wall, slide up pain-free keeping contact, 10 reps." },
      he: { title: "החלקות על הקיר", howto: "אמות על הקיר, החלק כלפי מעלה ללא כאב תוך שמירת מגע, 10 חזרות." },
    },
  },
  {
    key: "sleeper", category: "mobility", image: IMG.mob, sets: "3 × 30с", targetKey: "ir_rom",
    content: {
      ru: { title: "Sleeper stretch", howto: "Лёжа на боку, мягко доводите предплечье к полу для внутренней ротации, удержание 30 сек." },
      uk: { title: "Sleeper stretch", howto: "Лежачи на боці, м'яко доводьте передпліччя до підлоги для внутрішньої ротації, 30 сек." },
      en: { title: "Sleeper stretch", howto: "Side-lying, gently press the forearm down for internal rotation, hold 30s." },
      he: { title: "Sleeper stretch", howto: "בשכיבה על הצד, לחץ בעדינות את האמה מטה לרוטציה פנימית, החזק 30 שניות." },
    },
  },
  {
    key: "rhythmic", category: "stability", image: IMG.dumbbell, sets: "3 × 30с", targetKey: "stability",
    content: {
      ru: { title: "Ритмическая стабилизация I/Y/T", howto: "Удерживая руку в позициях I, Y, T, реагируйте на лёгкие толчки партнёра, 30 сек." },
      uk: { title: "Ритмічна стабілізація I/Y/T", howto: "Тримаючи руку в позиціях I, Y, T, реагуйте на легкі поштовхи партнера, 30 сек." },
      en: { title: "Rhythmic stabilization I/Y/T", howto: "Hold the arm in I, Y, T and resist a partner's light perturbations, 30s." },
      he: { title: "ייצוב קצבי I/Y/T", howto: "החזק את היד בתנוחות I, Y, T והתנגד לדחיפות קלות של שותף, 30 שניות." },
    },
  },
  {
    key: "med_ball", category: "power", image: IMG.ball, sets: "4 × 8", targetKey: "power",
    content: {
      ru: { title: "Бросок мяча от груди", howto: "Резко выталкивайте набивной мяч 2-3 кг от груди партнёру, контролируя плечо, 8 раз." },
      uk: { title: "Кидок м'яча від грудей", howto: "Різко виштовхуйте набивний м'яч 2-3 кг від грудей партнеру, контролюючи плече, 8 разів." },
      en: { title: "Med ball chest pass", howto: "Explosively push a 2-3 kg med ball from the chest to a partner, control the shoulder, 8 reps." },
      he: { title: "מסירת כדור מהחזה", howto: "דחוף בעוצמה כדור כוח 2-3 ק\"ג מהחזה לשותף תוך שליטה בכתף, 8 חזרות." },
    },
  },
];

export const LIB_CATEGORIES = ["all", "rotator", "scapular", "mobility", "stability", "power"] as const;
