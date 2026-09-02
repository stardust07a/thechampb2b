import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** Locale'i otomatik koruyan Link / router yardımcıları. */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
