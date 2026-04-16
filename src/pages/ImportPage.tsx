import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ImportPage() {
  const [text, setText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);

  const parseOCR = (text: string) => {
    const lines = text.split("\n");
    const items: any[] = [];
    
    const targetCategories = [
      "ARSITEKTUR", "Struktur", "Lapangan / Sitework", "Mekanikal Elektrikal", "Plumbing", "Site Development"
    ];

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

    const categories = [
      "Mekanikal Elektrikal", "Perpipaan / Plumbing", "M2 Arsitektur", 
      "Site Development", "Lapangan / Site work", "M3 Struktur", 
      "Struktur", "Arsitektur", "Sipil", "Pondasi", "Beton", "Galian", "Persiapan",
      "M Arsitektur", "Kg Struktur", "Unit Arsitektur", "Unit Persiapan", "Buis", "Testing", "Tutup", "Box", "Kabel", "Ton", "Perkerasan", "Beton", "Kering", "Basah", "Biaya", "Pekerjaan", "Septictank", "Mic", "TB", "Material", "Pengecatan", "M3 Struktur", "M Struktur", "Ha Persiapan", "Tunggul Persiapan", "Batang Persiapan", "Penyapuan", "Gulma", "Buah Persiapan", "untuk Site Development"
    ].sort((a, b) => b.length - a.length);

    const units = [
      "Unit", "unit", "m", "Set", "Titik", "ACP", "M2", "Buah", "buah", "Gulma", "Penyapuan", "untuk", "Saluran", "Buis", "Testing", "Tutup", "Box", "M", "m'", "Kg", "kg", "titik", "Pemasangan", "Obstruction", "Kabel", "Ton", "Perkerasan", "Beton", "Kering", "Basah", "Biaya", "Pekerjaan", "Septictank", "Mic", "TB", "Material", "Pengecatan", "M3", "M'", "Ha", "Tunggul", "dan", "tebang", "kayu", "Ulang", "patok", "Pekerjaam", "Exhaust", "Instalasi", "Pencabut", "Pemangkasan", "Pembersihan", "Penyiraman", "Pemotongan", "Pembongkaran", "Pembuatan", "Pabrikasi", "Pelaburan", "Pengikisan/Pengerokan", "Pengerokan", "Pelituran", "Jasa", "Pengecoran", "Penyambungan", "Urukan", "Timbunan", "Pemadatan", "Striping)"
    ].sort((a, b) => b.length - a.length);

    for (let line of lines) {
      line = line.trim();
      if (!line || line.toLowerCase().startsWith("no name") || line.toLowerCase().startsWith("noname")) continue;

      const priceMatch = line.match(/Rp\.\s+([\d\.,]+)$/);
      if (!priceMatch) continue;

      const priceStr = priceMatch[1].trim();
      const price = parseFloat(priceStr.replace(/\./g, "").replace(",", "."));

      let rest = line.substring(0, priceMatch.index).trim();

      let rawCategory = "Lain-lain";
      for (const cat of categories) {
        if (rest.endsWith(cat)) {
          rawCategory = cat;
          rest = rest.substring(0, rest.length - cat.length).trim();
          break;
        }
      }

      const foundCategory = mapCategory(rawCategory);

      let foundUnit = "ls";
      for (const u of units) {
        if (rest.endsWith(u)) {
          foundUnit = u;
          rest = rest.substring(0, rest.length - u.length).trim();
          break;
        }
      }

      const codeMatch = rest.match(/^([A-Z]\.[\d\.]+[a-z]?|[A-Z]\d+)\s+/);
      let code = "";
      let name = rest;
      if (codeMatch) {
        code = codeMatch[1].trim();
        name = rest.substring(codeMatch[0].length).trim();
      }

      items.push({
        code,
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
      toast.error("No valid items found to import");
      return;
    }

    setIsImporting(true);
    setTotal(items.length);
    setProgress(0);

    try {
      for (let i = 0; i < items.length; i++) {
        await addDoc(collection(db, "master_data"), items[i]);
        setProgress(i + 1);
      }
      toast.success(`Successfully imported ${items.length} items`);
      setText("");
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import some items");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Master Data from OCR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            placeholder="Paste OCR text here..." 
            className="min-h-[400px] font-mono text-xs"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleImport} 
              disabled={isImporting || !text.trim()}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing ({progress}/{total})
                </>
              ) : (
                "Import Items"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
