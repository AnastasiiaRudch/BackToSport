import { Assessment, Profile } from "@/src/api";

const ZONE_HEX: Record<string, string> = {
  green: "#0a8f4d",
  yellow: "#b58900",
  red: "#c62828",
};
const ZONE_RU: Record<string, string> = {
  green: "Зелёная зона — полный допуск",
  yellow: "Жёлтая зона — модифицированные нагрузки",
  red: "Красная зона — возврат в контакт запрещён",
};
const ZONE_ADVICE: Record<string, string> = {
  green: "Полный допуск к контакту и соревнованиям.",
  yellow: "Модифицированные тренировки, дриллы и спарринги с ограничениями.",
  red: "Возврат в контакт запрещён. Продолжайте изолированную реабилитацию.",
};

const COMPONENT_LABELS: [string, string][] = [
  ["psychology", "Психология (SIRSI) — вес 15%"],
  ["rom", "Мобильность (ROM) — вес 15%"],
  ["strength_lsi", "Сила (LSI) — вес 25%"],
  ["functional_lsi", "Функциональность (LSI) — вес 25%"],
  ["sport_specific", "Спорт-специфика — вес 20%"],
];

function barColor(v: number) {
  return v >= 90 ? "#0a8f4d" : v >= 75 ? "#b58900" : "#c62828";
}

function esc(s: string) {
  return String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function generateReportHtml(a: Assessment, p?: Profile | null): string {
  const zoneHex = ZONE_HEX[a.zone] || "#333";

  const profileRows = p
    ? `
      <tr><td>Возраст</td><td>${p.age} лет</td></tr>
      <tr><td>Пол</td><td>${p.sex === "male" ? "Мужской" : "Женский"}</td></tr>
      <tr><td>Вид спорта</td><td>${esc(p.sport)}</td></tr>
      ${p.weight_category ? `<tr><td>Весовая категория</td><td>${esc(p.weight_category)}</td></tr>` : ""}
      <tr><td>Операция / травма</td><td>${esc(p.surgery_type)}</td></tr>
      <tr><td>Срок после операции</td><td>${p.time_since_surgery_weeks} недель</td></tr>
      <tr><td>Доминантная рука</td><td>${p.dominant_arm === "left" ? "Левая" : "Правая"}</td></tr>
      <tr><td>Оперированная рука</td><td>${p.operated_arm === "left" ? "Левая" : "Правая"}</td></tr>
    `
    : `<tr><td>Вид спорта</td><td>${esc(a.sport)}</td></tr>`;

  const compRows = COMPONENT_LABELS.map(([key, label]) => {
    const v = Math.round(a.components[key] ?? 0);
    return `
      <div class="comp">
        <div class="comp-head"><span>${label}</span><b>${v}%</b></div>
        <div class="track"><div class="fill" style="width:${Math.max(2, Math.min(100, v))}%;background:${barColor(v)}"></div></div>
      </div>`;
  }).join("");

  const radarRows = a.radar
    .map(
      (r) =>
        `<div class="chip"><b>${Math.round(r.value)}</b><span>${esc(r.axis)}</span></div>`,
    )
    .join("");

  const weak =
    a.weak_links.length === 0
      ? `<p class="ok">Критических дефицитов не выявлено (LSI ≥ 90%).</p>`
      : `<ul class="weak">${a.weak_links
          .map(
            (w) =>
              `<li><span>${esc(w.name)}</span>${
                w.deficit != null ? `<b>−${Math.round(w.deficit)}%</b>` : `<b class="risk">риск</b>`
              }</li>`,
          )
          .join("")}</ul>`;

  const exercises = a.roadmap.exercises
    .map(
      (ex, i) => `
      <div class="ex">
        <div class="ex-num">${i + 1}</div>
        <div>
          <div class="ex-title">${esc(ex.title)}</div>
          <div class="ex-desc">${esc(ex.description)}</div>
          ${ex.target ? `<div class="ex-target">Цель: ${esc(ex.target)}</div>` : ""}
        </div>
      </div>`,
    )
    .join("");

  const ratio =
    a.er_ir_ratio?.operated != null
      ? `<p class="ratio">ER/IR Ratio (норма ~0.66–0.75): оперированная ${a.er_ir_ratio.operated} · здоровая ${a.er_ir_ratio.healthy ?? "—"}</p>`
      : "";

  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color:#1a1f2b; margin:0; padding:32px; }
    .brand { display:flex; align-items:center; gap:10px; border-bottom:3px solid #99cc00; padding-bottom:14px; }
    .logo { width:34px;height:34px;border-radius:8px;background:#99cc00;display:flex;align-items:center;justify-content:center;font-weight:800;color:#000; }
    .brand h1 { font-size:18px; margin:0; letter-spacing:0.5px; }
    .brand p { margin:0; font-size:11px; color:#6b7280; }
    h2 { font-size:15px; margin:26px 0 10px; color:#111; border-left:4px solid #99cc00; padding-left:8px; }
    .meta { font-size:11px; color:#6b7280; margin-top:4px; }
    .score-box { display:flex; align-items:center; gap:20px; margin-top:18px; padding:18px; border:1px solid #e5e7eb; border-radius:12px; }
    .score-num { font-size:56px; font-weight:800; line-height:1; }
    .zone-badge { display:inline-block; padding:5px 12px; border-radius:999px; color:#fff; font-size:12px; font-weight:700; }
    .advice { font-size:13px; color:#374151; margin-top:6px; }
    table { width:100%; border-collapse:collapse; font-size:12.5px; }
    td { padding:7px 4px; border-bottom:1px solid #eef0f3; }
    td:first-child { color:#6b7280; width:45%; }
    td:last-child { font-weight:600; text-align:right; }
    .comp { margin-bottom:11px; }
    .comp-head { display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:4px; }
    .track { height:8px; background:#eef0f3; border-radius:4px; overflow:hidden; }
    .fill { height:8px; border-radius:4px; }
    .ratio { font-size:11.5px; color:#6b7280; margin-top:8px; }
    .chips { display:flex; flex-wrap:wrap; gap:8px; }
    .chip { border:1px solid #e5e7eb; border-radius:10px; padding:8px 12px; text-align:center; min-width:78px; }
    .chip b { display:block; font-size:18px; color:#5a7d00; }
    .chip span { font-size:10px; color:#6b7280; }
    ul.weak { list-style:none; padding:0; margin:0; }
    ul.weak li { display:flex; justify-content:space-between; padding:8px 12px; border:1px solid #f0d0d0; background:#fdf3f3; border-radius:8px; margin-bottom:6px; font-size:12.5px; }
    ul.weak b { color:#c62828; }
    ul.weak b.risk { color:#c62828; }
    .ok { color:#0a8f4d; font-size:13px; font-weight:600; }
    .ex { display:flex; gap:12px; padding:12px; border:1px solid #e5e7eb; border-radius:10px; margin-bottom:8px; }
    .ex-num { width:26px;height:26px;border-radius:50%;background:#99cc00;color:#000;font-weight:800;display:flex;align-items:center;justify-content:center;flex:0 0 26px; }
    .ex-title { font-weight:700; font-size:13.5px; }
    .ex-desc { font-size:12.5px; color:#374151; margin-top:2px; }
    .ex-target { font-size:11.5px; color:#5a7d00; margin-top:3px; font-weight:600; }
    .retest { margin-top:10px; font-size:13px; font-weight:600; }
    .disclaimer { margin-top:26px; padding:14px; background:#fff8e1; border:1px solid #f0e0a0; border-radius:10px; font-size:11.5px; color:#5c5228; }
    .footer { margin-top:20px; text-align:center; font-size:10px; color:#9ca3af; }
  </style></head><body>
    <div class="brand">
      <div class="logo">SR</div>
      <div>
        <h1>SHOULDERREADY · Pro RTS Analytics</h1>
        <p>Отчёт об оценке готовности плеча к возврату в спорт</p>
      </div>
    </div>

    <h2>Пациент / Атлет</h2>
    <div class="meta">${esc(a.profile_name)} · дата теста: ${fmtDate(a.created_at)}</div>
    <table>${profileRows}</table>

    <h2>Итоговый индекс готовности (RTS Score)</h2>
    <div class="score-box">
      <div class="score-num" style="color:${zoneHex}">${Math.round(a.rts_score)}<span style="font-size:20px;color:#9ca3af">/100</span></div>
      <div>
        <span class="zone-badge" style="background:${zoneHex}">${ZONE_RU[a.zone] || ""}</span>
        <div class="advice">${ZONE_ADVICE[a.zone] || ""}</div>
      </div>
    </div>

    <h2>Компоненты скора</h2>
    ${compRows}
    ${ratio}

    <h2>Профиль баланса (5 осей)</h2>
    <div class="chips">${radarRows}</div>

    <h2>Слабые звенья (LSI &lt; 90%)</h2>
    ${weak}

    <h2>План действий (2–4 недели)${a.roadmap.ai_generated ? " · AI" : ""}</h2>
    <p style="font-size:12.5px;color:#374151;margin-top:0">${esc(a.roadmap.summary)}</p>
    ${exercises}
    <div class="retest">📅 Повторный тест: <span style="color:${zoneHex}">${esc(a.roadmap.retest_date)}</span></div>

    <div class="disclaimer">
      ⚠️ Отчёт носит информационно-скрининговый характер и не заменяет очную консультацию.
      Окончательное решение о возврате в спорт принимает лечащий спортивный врач или хирург
      на основании клинического осмотра.
    </div>

    <div class="footer">Сформировано в ShoulderReady · Pro RTS Analytics</div>
  </body></html>`;
}
