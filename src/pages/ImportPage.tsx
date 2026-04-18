import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMasterData } from "@/lib/hooks";
import { toast } from "sonner";
import { Loader2, Trash2, FileUp, AlertTriangle } from "lucide-react";

export default function ImportPage() {
  const [text, setText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const { addMasterItem, clearMasterData, bulkAddMasterItems } = useMasterData("admin");

  const parseOCR = (text: string) => {
    const lines = text.split("\n");
    const items: any[] = [];
    
    const mapCategory = (cat: string) => {
      const c = cat.toLowerCase();
      if (c.includes("arsitektur")) return "ARSITEKTUR";
      if (c.includes("struktur") || c.includes("sipil") || c.includes("beton") || c.includes("pondasi") || c.includes("galian")) return "Struktur";
      if (c.includes("site work") || c.includes("lapangan") || c.includes("persiapan")) return "Lapangan / Sitework";
      if (c.includes("mekanikal") || c.includes("elektrikal") || c.includes("listrik")) return "Mekanikal Elektrikal";
      if (c.includes("plumbing") || c.includes("perpipaan")) return "Plumbing";
      if (c.includes("site development")) return "Site Development";
      return "ARSITEKTUR";
    };

    // User requested order: [KODE] NAMA_ITEM UNIT KATEGORI HARGA
    // We work backwards from the price.
    const categoriesList = [
      "ARSITEKTUR", "Arsitektur", "Struktur", "Lapangan / Sitework", "Sitework", "Lapangan", 
      "Mekanikal Elektrikal", "Mekanikal", "Elektrikal", "Plumbing", "Perpipaan", 
      "Site Development", "Development", "Sipil", "Beton", "Pondasi", "Galian", "Persiapan"
    ].sort((a, b) => b.length - a.length);

    const unitsList = [
      "Unit", "unit", "m", "Set", "Titik", "ACP", "M2", "m2", "M3", "m3", "Buah", "buah", "ls", "Ls", "Lot", "Kg", "kg", "M", "m'", "titik", "Pemasangan", "Ton", "Ha", "Box", "Kabel"
    ].sort((a, b) => b.length - a.length);

    for (let line of lines) {
      line = line.trim();
      if (!line || line.toLowerCase().startsWith("no name") || line.toLowerCase().startsWith("noname")) continue;

      // 1. Extract Price (at the end)
      const priceMatch = line.match(/(?:Rp\.?\s*)?([\d\.,]+)$/i);
      if (!priceMatch) continue;

      const priceStr = priceMatch[1].trim();
      let normalizedPrice = priceStr.replace(/\./g, "").replace(",", ".");
      const price = parseFloat(normalizedPrice);
      if (isNaN(price)) continue;

      let remaining = line.substring(0, priceMatch.index || 0).trim();

      // 2. Extract Category (now before price)
      let rawCategory = "ARSITEKTUR";
      for (const cat of categoriesList) {
        if (remaining.toLowerCase().endsWith(cat.toLowerCase())) {
          rawCategory = cat;
          remaining = remaining.substring(0, remaining.length - cat.length).trim();
          break;
        }
      }
      const foundCategory = mapCategory(rawCategory);

      // 3. Extract Unit (before category)
      let foundUnit = "ls";
      for (const u of unitsList) {
        if (remaining.toLowerCase().endsWith(u.toLowerCase())) {
          foundUnit = u;
          remaining = remaining.substring(0, remaining.length - u.length).trim();
          break;
        }
      }

      // 4. Extract Code (at the start)
      const codeMatch = remaining.match(/^([A-Z][\.\d\w]*)\s+/i);
      let code = "";
      let name = remaining;
      if (codeMatch) {
        code = codeMatch[1].trim();
        name = remaining.substring(codeMatch[0].length).trim();
      }

      if (!name) name = "Item Tanpa Nama";

      items.push({
        code: code.toUpperCase(),
        category: foundCategory,
        name,
        unit: foundUnit,
        price,
        status: "visible",
        soldCount: 0,
        revenue: 0,
        createdAt: new Date().toISOString()
      });
    }
    return items;
  };

  const handleImport = async () => {
    const items = parseOCR(text);
    if (items.length === 0) {
      toast.error("Format tidak dikenali. Pastikan ada Kode (opsional), Nama, Unit, dan Harga di setiap baris.");
      return;
    }

    const shouldClear = confirm(`Ditemukan ${items.length} item. Apakah Anda ingin MENGHAPUS semua data master di Cloud terlebih dahulu sebelum mengimpor? (Disarankan untuk mencegah duplikasi)`);
    
    setIsImporting(true);
    setTotal(items.length);
    setProgress(0);

    try {
      if (shouldClear) {
        await clearMasterData();
      }
      
      await bulkAddMasterItems(items);
      
      setText("");
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Gagal mengimpor beberapa item.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Bulk Import Master Data</h1>
          <p className="text-neutral-500 uppercase text-xs font-bold">Impor data AHSP secara massal dari teks OCR.</p>
        </div>
        <Button 
          variant="destructive" 
          className="rounded-xl font-black uppercase tracking-tight border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          onClick={clearMasterData}
        >
          <Trash2 className="w-4 h-4 mr-2" /> Hapus Semua Data Cloud
        </Button>
      </div>

      <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl overflow-hidden">
        <CardHeader className="bg-neutral-50 border-b-2 border-black">
          <CardTitle className="uppercase font-black text-xl flex items-center">
            <FileUp className="w-6 h-6 mr-2" /> Paste OCR Text
          </CardTitle>
          <CardDescription className="text-neutral-600 font-medium">
            Format yang didukung: <code className="bg-neutral-200 px-1 rounded">[KODE] NAMA_ITEM UNIT KATEGORI HARGA</code>. Harga harus berada di akhir baris.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Textarea 
            placeholder="Contoh: A.1.1.a Pekerjaan Galian Tanah m3 Struktur 75000" 
            className="min-h-[400px] font-mono text-xs border-2 border-black rounded-xl focus:ring-0"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          
          <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              Pastikan data lama sudah dihapus jika Anda ingin mengganti seluruh database. Gunakan tombol <strong>Hapus Semua Data Cloud</strong> di atas sebelum melakukan impor baru.
            </p>
          </div>

          <Button 
            onClick={handleImport} 
            disabled={isImporting || !text.trim()}
            className="w-full bg-black hover:bg-neutral-800 text-white font-black uppercase tracking-widest h-14 rounded-xl shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] disabled:opacity-50 transition-all active:translate-y-1 active:shadow-none"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Mengimpor ({progress}/{total})
              </>
            ) : (
              "Mulai Impor Sekarang"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
