"use client";

import React, { useState } from "react";
import {
  Calculator,
  CheckCircle2,
  Coins,
  Copy,
  Sparkles,
  TrendingUp
} from "lucide-react";

interface HubPreset {
  id: string;
  label: string;
  companies: string;
  currency: "NOK" | "SEK" | "EUR" | "GBP";
  fxToEur: number;
  defaultBase: number;
  defaultEquityEur: number;
  defaultBonusPct: number;
  pensionRuleSummary: string;
  expatSchemeName: string;
  standardTaxRate: number;
  expatTaxRate: number;
  calcEmployerPensionEur: (baseLocal: number, fxToEur: number) => number;
}

const HUB_PRESETS: Record<string, HubPreset> = {
  oslo_nok: {
    id: "oslo_nok",
    label: "Oslo, Norway (NOK)",
    companies: "FINN.no / Vend, VG / Schibsted, Cognite, Vipps",
    currency: "NOK",
    fxToEur: 0.085,
    defaultBase: 1120000,
    defaultEquityEur: 12000,
    defaultBonusPct: 10,
    pensionRuleSummary:
      "7% OTP Employer Pension (FINN/Schibsted tier) + 12% Feriepenger holiday pay accrual",
    expatSchemeName: "Norway 25% PAYE (Kildeskatt) Foreign Worker Scheme",
    standardTaxRate: 0.315,
    expatTaxRate: 0.25,
    calcEmployerPensionEur: (baseNok, fx) => Math.round(baseNok * 0.07 * fx)
  },
  stockholm_sek: {
    id: "stockholm_sek",
    label: "Stockholm, Sweden (SEK)",
    companies: "Spotify, Klarna, Blocket (Vend), Aftonbladet, Sana Labs",
    currency: "SEK",
    fxToEur: 0.088,
    defaultBase: 1060000,
    defaultEquityEur: 28000,
    defaultBonusPct: 8,
    pensionRuleSummary:
      "Swedish ITP1 Tjänstepension: 4.5% up to 600k SEK + 30% on all salary above 600k SEK!",
    expatSchemeName: "Sweden Expertskatt (25% of gross income tax-exempt)",
    standardTaxRate: 0.34,
    expatTaxRate: 0.255,
    calcEmployerPensionEur: (baseSek, fx) => {
      const cap = 600000;
      const below = Math.min(baseSek, cap) * 0.045;
      const above = Math.max(0, baseSek - cap) * 0.3;
      return Math.round((below + above) * fx);
    }
  },
  helsinki_eur: {
    id: "helsinki_eur",
    label: "Helsinki, Finland (EUR)",
    companies: "Wolt (DoorDash), Oura, Supercell, Tori.fi / Oikotie",
    currency: "EUR",
    fxToEur: 1.0,
    defaultBase: 105000,
    defaultEquityEur: 32000,
    defaultBonusPct: 5,
    pensionRuleSummary: "Finnish TyEL Employer Pension (~17.3% statutory employer contribution)",
    expatSchemeName: "Finland 32% Flat Key Employee Source Tax (Avainhenkilövero)",
    standardTaxRate: 0.365,
    expatTaxRate: 0.32,
    calcEmployerPensionEur: (baseEur) => Math.round(baseEur * 0.14)
  },
  revolut_london_eur: {
    id: "revolut_london_eur",
    label: "Revolut / London & EU Remote (EUR)",
    companies: "Revolut, Stripe, OpenAI / Anthropic EU",
    currency: "EUR",
    fxToEur: 1.0,
    defaultBase: 148000,
    defaultEquityEur: 45000,
    defaultBonusPct: 15,
    pensionRuleSummary: "5%–6% Employer Pension Match + High Equity/Performance Bonus Mix",
    expatSchemeName: "Standard UK / EU Progressive Tax Bracket",
    standardTaxRate: 0.38,
    expatTaxRate: 0.33,
    calcEmployerPensionEur: (baseEur) => Math.round(baseEur * 0.05)
  }
};

export default function NordicOfferComparator() {
  // Offer A (e.g., FINN.no / Schibsted in Oslo or Spotify in Stockholm)
  const [hubA, setHubA] = useState<string>("oslo_nok");
  const [baseA, setBaseA] = useState<number>(HUB_PRESETS.oslo_nok.defaultBase);
  const [equityEurA, setEquityEurA] = useState<number>(
    HUB_PRESETS.oslo_nok.defaultEquityEur
  );
  const [bonusPctA, setBonusPctA] = useState<number>(
    HUB_PRESETS.oslo_nok.defaultBonusPct
  );
  const [useExpatTaxA, setUseExpatTaxA] = useState<boolean>(false);

  // Offer B (e.g., Stockholm Spotify/Klarna or Revolut Europe)
  const [hubB, setHubB] = useState<string>("stockholm_sek");
  const [baseB, setBaseB] = useState<number>(
    HUB_PRESETS.stockholm_sek.defaultBase
  );
  const [equityEurB, setEquityEurB] = useState<number>(
    HUB_PRESETS.stockholm_sek.defaultEquityEur
  );
  const [bonusPctB, setBonusPctB] = useState<number>(
    HUB_PRESETS.stockholm_sek.defaultBonusPct
  );
  const [useExpatTaxB, setUseExpatTaxB] = useState<boolean>(false);

  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  const handleSelectHubA = (id: string) => {
    const p = HUB_PRESETS[id];
    setHubA(id);
    setBaseA(p.defaultBase);
    setEquityEurA(p.defaultEquityEur);
    setBonusPctA(p.defaultBonusPct);
  };

  const handleSelectHubB = (id: string) => {
    const p = HUB_PRESETS[id];
    setHubB(id);
    setBaseB(p.defaultBase);
    setEquityEurB(p.defaultEquityEur);
    setBonusPctB(p.defaultBonusPct);
  };

  const computeOfferMetrics = (
    hubId: string,
    baseLocal: number,
    equityEur: number,
    bonusPct: number,
    useExpat: boolean
  ) => {
    const p = HUB_PRESETS[hubId] || HUB_PRESETS.oslo_nok;
    const baseEur = Math.round(baseLocal * p.fxToEur);
    const bonusEur = Math.round(baseEur * (bonusPct / 100));
    const pensionEur = p.calcEmployerPensionEur(baseLocal, p.fxToEur);
    const totalGrossCompEur = baseEur + bonusEur + equityEur + pensionEur;

    const effectiveTax = useExpat ? p.expatTaxRate : p.standardTaxRate;
    const netAnnualCashAndEquityEur = Math.round(
      (baseEur + bonusEur + equityEur) * (1 - effectiveTax)
    );
    const netMonthlyEur = Math.round(netAnnualCashAndEquityEur / 12);

    return {
      preset: p,
      baseEur,
      bonusEur,
      pensionEur,
      totalGrossCompEur,
      effectiveTaxPct: Math.round(effectiveTax * 100),
      netAnnualCashAndEquityEur,
      netMonthlyEur
    };
  };

  const metricsA = computeOfferMetrics(
    hubA,
    baseA,
    equityEurA,
    bonusPctA,
    useExpatTaxA
  );
  const metricsB = computeOfferMetrics(
    hubB,
    baseB,
    equityEurB,
    bonusPctB,
    useExpatTaxB
  );

  const negotiationScript = `Hi [Recruiter Name],\n\nThank you again for sharing the offer details—I really enjoyed meeting the engineering team and discussing the architecture challenges around ${
    hubA === "oslo_nok"
      ? "FINN.no / Vend & Schibsted's platform scale"
      : "distributed systems & reliability"
  }.\n\nI am currently comparing this alongside a competing L5/Senior offer in the region valued at €${Math.max(
    metricsA.totalGrossCompEur,
    metricsB.totalGrossCompEur
  ).toLocaleString()} total annual compensation (including employer pension / ITP1 & equity). Because your team is my top choice, if we can adjust the base salary toward ${Math.round(
    baseA * 1.08
  ).toLocaleString()} ${metricsA.preset.currency} (or bridge the gap via the sign-on / RSU grant), I am ready to sign immediately.\n\nBest regards,\n[Your Name]`;

  return (
    <div className="space-y-5">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
          <Calculator className="w-4 h-4" />
          <span>Nordic & European Total Compensation, Pension (OTP / ITP1) & Tax Comparator</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Comparing <strong className="text-white">NOK (Oslo)</strong> vs.{" "}
          <strong className="text-white">SEK (Stockholm)</strong> vs.{" "}
          <strong className="text-white">EUR (Helsinki / Revolut)</strong> requires factoring in hidden employer pensions (like Sweden&apos;s <strong className="text-emerald-300">30% ITP1</strong> above 600k SEK and Norway&apos;s <strong className="text-emerald-300">7% OTP + 12% Feriepenger</strong>) and Nordic Expat Tax reliefs.
        </p>
      </div>

      {/* Side-by-Side Offer Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[
          {
            slot: "Offer A",
            hub: hubA,
            onSelectHub: handleSelectHubA,
            base: baseA,
            setBase: setBaseA,
            equityEur: equityEurA,
            setEquityEur: setEquityEurA,
            bonusPct: bonusPctA,
            setBonusPct: setBonusPctA,
            useExpat: useExpatTaxA,
            setUseExpat: setUseExpatTaxA,
            m: metricsA
          },
          {
            slot: "Offer B",
            hub: hubB,
            onSelectHub: handleSelectHubB,
            base: baseB,
            setBase: setBaseB,
            equityEur: equityEurB,
            setEquityEur: setEquityEurB,
            bonusPct: bonusPctB,
            setBonusPct: setBonusPctB,
            useExpat: useExpatTaxB,
            setUseExpat: setUseExpatTaxB,
            m: metricsB
          }
        ].map((card) => (
          <div
            key={card.slot}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-xs font-bold text-indigo-300">
                {card.slot}
              </span>
              <select
                value={card.hub}
                onChange={(e) => card.onSelectHub(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
              >
                {Object.values(HUB_PRESETS).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] text-slate-400">
              <strong>Typical Employers:</strong> {card.m.preset.companies}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Annual Base ({card.m.preset.currency})
                </label>
                <input
                  type="number"
                  value={card.base}
                  onChange={(e) => card.setBase(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Annual RSU / Equity (€)
                </label>
                <input
                  type="number"
                  value={card.equityEur}
                  onChange={(e) => card.setEquityEur(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Target Bonus (%)
                </label>
                <input
                  type="number"
                  value={card.bonusPct}
                  onChange={(e) => card.setBonusPct(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>
            </div>

            <label className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={card.useExpat}
                onChange={(e) => card.setUseExpat(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span>
                Apply <strong>{card.m.preset.expatSchemeName}</strong> ({card.m.effectiveTaxPct}% eff. tax)
              </span>
            </label>

            {/* Normalized EUR Breakdown */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Normalized Base Salary (EUR):</span>
                <span className="font-mono text-white">
                  €{card.m.baseEur.toLocaleString()} / yr
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Employer Pension (OTP / ITP1 / TyEL):</span>
                <span className="font-mono text-emerald-300">
                  +€{card.m.pensionEur.toLocaleString()} / yr
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Annual Equity + Target Bonus:</span>
                <span className="font-mono text-indigo-300">
                  +€{(card.m.bonusEur + card.equityEur).toLocaleString()} / yr
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                <span>Total Package Value (EUR):</span>
                <span className="font-mono text-emerald-400">
                  €{card.m.totalGrossCompEur.toLocaleString()} / yr
                </span>
              </div>
              <div className="flex justify-between font-bold text-xs text-cyan-300">
                <span>Est. Net Monthly Take-Home (After Tax):</span>
                <span className="font-mono">
                  €{card.m.netMonthlyEur.toLocaleString()} / month
                </span>
              </div>
              <div className="text-[10px] text-slate-400 pt-1">
                {card.m.preset.pensionRuleSummary}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Comp Negotiation Script Generator */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-indigo-500/30 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Nordic & European Polite Counter-Offer Email Generator</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(negotiationScript);
              setCopiedScript(true);
              setTimeout(() => setCopiedScript(false), 2000);
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            {copiedScript ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Negotiation Email</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
          {negotiationScript}
        </pre>
      </div>
    </div>
  );
}
