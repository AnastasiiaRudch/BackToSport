import { Assessment, Profile } from "@/src/api";

const ZONE_HEX: Record<string, string> = {
  green: "#0a8f4d",
  yellow: "#b58900",
  red: "#c62828",
};

type I18n = {
  t: (path: string, params?: Record<string, string | number>) => string;
  lang: string;
  isRTL: boolean;
};

function barColor(v: number) {
  return v >= 90 ? "#0a8f4d" : v >= 75 ? "#b58900" : "#c62828";
}

function esc(s: string) {
  return String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtDate(iso: string, lang: string) {
  try {
    const locale = { ru: "ru-RU", uk: "uk-UA", en: "en-GB", he: "he-IL" }[lang] || "ru-RU";
    return new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

const COMPONENT_KEYS = ["psychology", "rom", "strength_lsi", "functional_lsi", "sport_specific"];

export function generateReportHtml(a: Assessment, p: Profile | null | undefined, i18n: I18n): string {
  const { t, lang, isRTL } = i18n;
  const zoneHex = ZONE_HEX[a.zone] || "#333";
  const dir = isRTL ? "rtl" : "ltr";
  const align = isRTL ? "right" : "left";

  const disp = (prefix: string, val: string) => {
    const r = t(`${prefix}.${val}`);
    return r === `${prefix}.${val}` ? val : r;
  };

  const row = (label: string, value: string) => `<tr><td>${esc(label)}</td><td>${esc(value)}</td></tr>`;

  const profileRows = p
    ? [
        row(t("detail.age"), `${p.age} ${t("common.years")}`),
        row(t("detail.sex"), p.sex === "male" ? t("common.male") : t("common.female")),
        row(t("np.sport"), disp("sport", p.sport)),
        ...(p.weight_category ? [row(t("detail.weightCat"), p.weight_category)] : []),
        row(t("np.surgery"), disp("surgery", p.surgery_type)),
        row(t("np.weeks"), `${p.time_since_surgery_weeks}`),
        row(t("detail.dominant"), p.dominant_arm === "left" ? t("common.left") : t("common.right")),
        row(t("np.operated"), p.operated_arm === "left" ? t("common.left") : t("common.right")),
      ].join("")
    : row(t("np.sport"), disp("sport", a.sport));

  const compRows = COMPONENT_KEYS.map((key) => {
    const v = Math.round(a.components[key] ?? 0);
    return `
      <div class="comp">
        <div class="comp-head"><span>${esc(t(`comp.${key}`))}</span><b>${v}%</b></div>
        <div class="track"><div class="fill" style="width:${Math.max(2, Math.min(100, v))}%;background:${barColor(v)}"></div></div>
      </div>`;
  }).join("");

  const radarRows = a.radar
    .map((r) => `<div class="chip"><b>${Math.round(r.value)}</b><span>${esc(r.key ? t(`axis.${r.key}`) : r.axis)}</span></div>`)
    .join("");

  const weak =
    a.weak_links.length === 0
      ? `<p class="ok">${esc(t("results.noWeak"))}</p>`
      : `<ul class="weak">${a.weak_links
          .map((w) => {
            const nm = w.key ? t(`weak.${w.key}`) : w.name;
            return `<li><span>${esc(nm)}</span>${
              w.deficit != null ? `<b>−${Math.round(w.deficit)}%</b>` : `<b class="risk">${esc(t("results.risk"))}</b>`
            }</li>`;
          })
          .join("")}</ul>`;

  const exercises = a.roadmap.exercises
    .map(
      (ex, i) => `
      <div class="ex">
        <div class="ex-num">${i + 1}</div>
        <div>
          <div class="ex-title">${esc(ex.title)}</div>
          <div class="ex-desc">${esc(ex.description)}</div>
          ${ex.target ? `<div class="ex-target">${esc(ex.target)}</div>` : ""}
        </div>
      </div>`,
    )
    .join("");

  const ratio =
    a.er_ir_ratio?.operated != null
      ? `<p class="ratio">${esc(t("results.ratio"))}: ${t("results.ratioOp")} ${a.er_ir_ratio.operated} · ${t("results.ratioHe")} ${a.er_ir_ratio.healthy ?? "—"}</p>`
      : "";

  return `<!DOCTYPE html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color:#1a1f2b; margin:0; padding:32px; direction:${dir}; text-align:${align}; }
    .brand { display:flex; align-items:center; gap:10px; border-bottom:3px solid #99cc00; padding-bottom:14px; }
    .logo { width:34px;height:34px;border-radius:8px;background:#99cc00;display:flex;align-items:center;justify-content:center;font-weight:800;color:#000; }
    .brand h1 { font-size:18px; margin:0; letter-spacing:0.5px; }
    .brand p { margin:0; font-size:11px; color:#6b7280; }
    h2 { font-size:15px; margin:26px 0 10px; color:#111; border-${isRTL ? "right" : "left"}:4px solid #99cc00; padding-${isRTL ? "right" : "left"}:8px; }
    .meta { font-size:11px; color:#6b7280; margin-top:4px; }
    .score-box { display:flex; align-items:center; gap:20px; margin-top:18px; padding:18px; border:1px solid #e5e7eb; border-radius:12px; }
    .score-num { font-size:56px; font-weight:800; line-height:1; }
    .zone-badge { display:inline-block; padding:5px 12px; border-radius:999px; color:#fff; font-size:12px; font-weight:700; }
    .advice { font-size:13px; color:#374151; margin-top:6px; }
    table { width:100%; border-collapse:collapse; font-size:12.5px; }
    td { padding:7px 4px; border-bottom:1px solid #eef0f3; }
    td:first-child { color:#6b7280; width:45%; }
    td:last-child { font-weight:600; text-align:${isRTL ? "left" : "right"}; }
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
        <p>${esc(a.profile_name)} · ${fmtDate(a.created_at, lang)}</p>
      </div>
    </div>

    <h2>${esc(t("tabs.profile"))}</h2>
    <table>${profileRows}</table>

    <h2>RTS Score</h2>
    <div class="score-box">
      <div class="score-num" style="color:${zoneHex}">${Math.round(a.rts_score)}<span style="font-size:20px;color:#9ca3af">/100</span></div>
      <div>
        <span class="zone-badge" style="background:${zoneHex}">${esc(t(`zone.${a.zone}`))}</span>
        <div class="advice">${esc(t(`zoneAdvice.${a.zone}`))}</div>
      </div>
    </div>

    <h2>${esc(t("results.components"))}</h2>
    ${compRows}
    ${ratio}

    <h2>${esc(t("results.balance"))}</h2>
    <div class="chips">${radarRows}</div>

    <h2>${esc(t("results.weakLinks"))}</h2>
    ${weak}

    <h2>${esc(t("results.roadmap"))}${a.roadmap.ai_generated ? " · AI" : ""}</h2>
    <p style="font-size:12.5px;color:#374151;margin-top:0">${esc(a.roadmap.summary)}</p>
    ${exercises}
    <div class="retest">📅 ${esc(t("results.retest"))} <span style="color:${zoneHex}">${esc(a.roadmap.retest_date)}</span></div>

    <div class="disclaimer">⚠️ ${esc(t("results.disclaimer"))}</div>

    <div class="footer">ShoulderReady · Pro RTS Analytics</div>
  </body></html>`;
}
