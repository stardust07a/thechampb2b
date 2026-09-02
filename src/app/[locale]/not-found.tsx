import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";

export default async function NotFound() {
  const t = await getTranslations("common");
  const tNav = await getTranslations("nav");

  return (
    <Section className="py-32">
      <Container className="text-center">
        <p className="tabular text-[clamp(4rem,14vw,9rem)] font-bold leading-none text-faint">
          404
        </p>
        <h1 className="chrome-text mt-6 text-h2">{t("notFoundTitle")}</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">{t("notFoundBody")}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild variant="solid" size="lg">
            <Link href="/">{t("goHome")}</Link>
          </Button>
          <Button asChild variant="primary" size="lg">
            <Link href="/products">{tNav("products")}</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
