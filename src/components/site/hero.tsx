import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { HeroExperience, type HeroStage } from "./hero-experience";

const STAGE_KEYS = ["source", "develop", "produce", "brand", "deliver"] as const;

/** Sunucuda çevirileri hazırlar; kaydırma etkileşimi client bileşeninde kalır. */
export async function Hero({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const stages: HeroStage[] = STAGE_KEYS.map((key) => ({
    label: t(`heroStages.${key}.label`),
    body: t(`heroStages.${key}.body`),
  }));

  return (
    <HeroExperience
      eyebrow={t("heroEyebrow")}
      titleLine1={t("heroTitleLine1")}
      titleLine2={t("heroTitleLine2")}
      subtitle={t("heroSubtitle")}
      exploreLabel={t("exploreCatalog")}
      quoteLabel={t("requestQuote")}
      skipLabel={t("heroSkip")}
      progressLabel={t("heroProgress")}
      videoLabel={t("heroVideoLabel")}
      stages={stages}
    />
  );
}
