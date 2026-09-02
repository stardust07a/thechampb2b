import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const settings = await getSettings();

  return (
    <AdminShell user={session?.user ?? {}}>
      <header className="mb-6">
        <h1 className="text-h2 font-bold">Ayarlar</h1>
        <p className="mt-1.5 text-sm text-muted">
          Buradaki değerler sitenin tamamında kullanılır. Boş bırakılan alanlar
          (aylık kapasite, ihracat ülkesi, sertifikalar) sitede &quot;Talep üzerine&quot;
          olarak görünür ya da hiç render edilmez.
        </p>
      </header>

      <SettingsForm settings={settings} />
    </AdminShell>
  );
}
