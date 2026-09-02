import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/shell";
import { ImportWizard } from "@/components/admin/import-wizard";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const session = await auth();

  return (
    <AdminShell user={session?.user ?? {}}>
      <header className="mb-6">
        <h1 className="text-h2 font-bold">Excel yükle</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Fiyat ve üretim bilgisini toplu olarak Excel dosyasından yükleyin. Dosya önce
          önizlenir, kaç kaydın etkileneceği ve hangi satırların hatalı olduğu gösterilir;
          onay verdikten sonra tek seferde uygulanır.
        </p>
      </header>

      <ImportWizard />
    </AdminShell>
  );
}
