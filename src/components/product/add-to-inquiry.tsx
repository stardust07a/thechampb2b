"use client";

import { Check, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useInquiry, type InquiryItem } from "@/components/site/inquiry-store";

/** `+ Add to inquiry` — kart ve detay sayfasında aynı bileşen (brief §8.1). */
export function AddToInquiry({
  item,
  quantity,
  className,
  size = "md",
  variant = "primary",
}: {
  item: Omit<InquiryItem, "quantity">;
  quantity?: number;
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}) {
  const t = useTranslations("product");
  const { add, has } = useInquiry();
  const added = has(item.productId, item.color ?? null, item.sizeRun ?? null);

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      onClick={() => {
        add({ ...item, quantity });
        toast.success(t("addedToInquiry"), { description: item.productName });
      }}
    >
      {added ? <Check aria-hidden /> : <Plus aria-hidden />}
      {added ? t("addedToInquiry") : t("addToInquiry")}
    </Button>
  );
}
