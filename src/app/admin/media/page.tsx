import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/shell";
import { MediaSlot, type SlotState } from "@/components/admin/media-slot";
import {
  PAGE_SLOTS,
  VIDEO_SLOT_COUNT,
  categorySlotKey,
  getAllSlots,
  videoSlotKey,
} from "@/lib/media-slots";

export const dynamic = "force-dynamic";

/**
 * Medya yönetimi — kategori kapakları, sayfa görselleri ve dikey videolar.
 * Her yuva boşken sitede o bölüm hiç render edilmez (brief §7).
 */
export default async function MediaPage() {
  const session = await auth();

  const [slots, categories] = await Promise.all([
    getAllSlots(),
    prisma.category.findMany({
      orderBy: { order: "asc" },
      select: {
        slug: true,
        translations: { where: { locale: "tr" }, select: { name: true } },
      },
    }),
  ]);

  const state = (key: string): SlotState => {
    const s = slots.get(key);
    return { key, url: s?.url ?? null, kind: s?.kind ?? "image" };
  };

  const filledPages = PAGE_SLOTS.filter((s) => slots.has(s.key)).length;
  const filledCategories = categories.filter((c) => slots.has(categorySlotKey(c.slug))).length;
  const filledVideos = Array.from({ length: VIDEO_SLOT_COUNT }).filter((_, i) =>
    slots.has(videoSlotKey(i)),
  ).length;

  // Sayfa görsellerini sayfa adına göre grupla
  const byPage = new Map<string, typeof PAGE_SLOTS>();
  for (const slot of PAGE_SLOTS) {
    const list = byPage.get(slot.page) ?? [];
    list.push(slot);
    byPage.set(slot.page, list);
  }

  return (
    <AdminShell user={session?.user ?? {}}>
      <header className="mb-8">
        <h1 className="text-h2 font-bold">Medya</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Kategori kapakları, sayfa görselleri ve üretim videoları. Bir yuva boşken
          sitede o bölüm hiç görünmez — kırık görsel veya boş kutu kalmaz.
        </p>
        <dl className="mt-5 flex flex-wrap gap-6 text-sm">
          <div>
            <dt className="text-xs text-muted">Kategori kapağı</dt>
            <dd className="tabular mt-0.5 font-medium text-fg">
              {filledCategories} / {categories.length}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Sayfa görseli</dt>
            <dd className="tabular mt-0.5 font-medium text-fg">
              {filledPages} / {PAGE_SLOTS.length}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Video</dt>
            <dd className="tabular mt-0.5 font-medium text-fg">
              {filledVideos} / {VIDEO_SLOT_COUNT}
            </dd>
          </div>
        </dl>
      </header>

      {/* ------------------------------------------------------------ video */}
      <section className="mb-10">
        <h2 className="eyebrow mb-1">Üretim videoları (dikey 9:16)</h2>
        <p className="mb-5 max-w-2xl text-xs text-muted">
          Yalnızca ana sayfada, &quot;Markanıza özel üretim&quot; bannerı ile
          &quot;Ne Yapıyoruz&quot; bölümü arasında yatay kayan bir şerit olarak
          gösterilir. Sessiz ve döngülü oynar, ses açma düğmesi vardır. MP4 veya
          WebM, en fazla 60 MB. Telefonda çekilmiş dikey videolar için tasarlandı.
        </p>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: VIDEO_SLOT_COUNT }, (_, i) => (
            <MediaSlot
              key={videoSlotKey(i)}
              slot={state(videoSlotKey(i))}
              label={`Video ${i + 1}`}
              aspect="portrait"
              accept="video/mp4,video/webm,video/quicktime"
              compact
            />
          ))}
        </div>
      </section>

      {/* -------------------------------------------------- kategori kapakları */}
      <section className="mb-10">
        <h2 className="eyebrow mb-1">Kategori kapakları</h2>
        <p className="mb-5 max-w-2xl text-xs text-muted">
          Ana sayfadaki kategori ızgarasında görünür. Dikey kadraj (3:4) en iyi
          sonucu verir. Kapağı olmayan kategori sade bir zeminle gösterilir.
        </p>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {categories.map((c) => (
            <MediaSlot
              key={c.slug}
              slot={state(categorySlotKey(c.slug))}
              label={c.translations[0]?.name ?? c.slug}
              aspect="portrait"
              compact
            />
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- sayfa görselleri */}
      {[...byPage.entries()].map(([page, items]) => (
        <section key={page} className="mb-10">
          <h2 className="eyebrow mb-5">{page}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <MediaSlot
                key={item.key}
                slot={state(item.key)}
                label={item.label}
                hint={item.hint}
                aspect={item.aspect}
              />
            ))}
          </div>
        </section>
      ))}
    </AdminShell>
  );
}
