import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WORK_ITEMS_MASTER } from "@/constants";
import { WorkItemMaster, UserTier } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Trash2, Download, Share2, Instagram, Phone, Mail, Building2, Save, FileText, ChevronRight, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface RabItem extends WorkItemMaster {
  volume: number;
  total: number;
  code?: string;
  notes?: string;
}

const RabPage = ({ user }: { user: any }) => {
  const navigate = useNavigate();
  const [rabItems, setRabItems] = useState<RabItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  
  // Project Info State
  const [projectInfo, setProjectInfo] = useState({
    clientName: user?.displayName || "",
    projectName: "Proyek Konstruksi & Interior TBJ",
    address: "Lokasi Proyek",
    date: new Date().toLocaleDateString('id-ID'),
    contact: user?.whatsapp || "",
  });

  // Access Control
  useEffect(() => {
    const allowedTiers: UserTier[] = ["deal", "admin"];
    if (!user || !allowedTiers.includes(user.tier)) {
      navigate("/");
    }
  }, [user, navigate]);

  const filteredMaster = useMemo(() => {
    if (!searchQuery) return [];
    return WORK_ITEMS_MASTER.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 8);
  }, [searchQuery]);

  const addItemToRab = (master: WorkItemMaster) => {
    const newItem: RabItem = {
      ...master,
      volume: 1,
      total: master.price,
      code: master.id,
      notes: ""
    };
    setRabItems([...rabItems, newItem]);
    setSearchQuery("");
    setIsAddingItem(false);
  };

  const updateItem = (index: number, updates: Partial<RabItem>) => {
    const newItems = [...rabItems];
    const updatedItem = { ...newItems[index], ...updates };
    updatedItem.total = updatedItem.volume * updatedItem.price;
    newItems[index] = updatedItem;
    setRabItems(newItems);
  };

  const removeItem = (index: number) => {
    setRabItems(rabItems.filter((_, i) => i !== index));
  };

  const grandTotal = rabItems.reduce((sum, item) => sum + item.total, 0);

  const exportToPDF = () => {
    const doc = new jsPDF() as any;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text("TBJ CONTRACTOR HUB", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Digital Ecosystem: AI-Powered Construction & Design", 14, 26);
    doc.text("Instagram: @tbj.bisnis | WA: +62 821-9420-1650", 14, 31);
    
    doc.setDrawColor(0, 0, 0);
    doc.line(14, 35, 196, 35);

    // Project Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("RENCANA ANGGARAN BIAYA (RAB)", 14, 45);
    
    doc.setFontSize(10);
    doc.text(`Proyek: ${projectInfo.projectName}`, 14, 55);
    doc.text(`Klien: ${projectInfo.clientName}`, 14, 60);
    doc.text(`Alamat: ${projectInfo.address}`, 14, 65);
    doc.text(`Tanggal: ${projectInfo.date}`, 14, 70);

    // Table
    const tableData = rabItems.map((item, index) => [
      index + 1,
      item.code || item.id,
      item.category,
      item.name,
      item.volume,
      item.unit,
      `Rp ${item.price.toLocaleString('id-ID')}`,
      `Rp ${item.total.toLocaleString('id-ID')}`
    ]);

    doc.autoTable({
      startY: 80,
      head: [['No', 'Kode', 'Kategori', 'Pekerjaan', 'Vol', 'Sat', 'Harga', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      foot: [['', '', '', '', '', '', 'GRAND TOTAL', `Rp ${grandTotal.toLocaleString('id-ID')}`]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(9);
    doc.text("Catatan:", 14, finalY + 10);
    doc.text("1. Harga sudah termasuk jasa dan material standard TBJ.", 14, finalY + 15);
    doc.text("2. Penawaran ini berlaku selama 14 hari kalender.", 14, finalY + 20);
    
    doc.text("Hormat Kami,", 150, finalY + 35);
    doc.text("TBJ Estimator Team", 150, finalY + 55);

    doc.save(`RAB_TBJ_${projectInfo.clientName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-8 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-black text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-none rounded-md uppercase text-[10px] font-bold">Professional Tier</Badge>
            <Badge className="bg-green-500 text-white border-none rounded-md uppercase text-[10px] font-bold">Verified Estimator</Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Rencana Anggaran Biaya</h1>
          <p className="text-white/60 uppercase-soft text-xs tracking-widest">TBJ Digital Ecosystem • Project Analysis Tool</p>
        </div>
        <div className="flex gap-3 relative z-10">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-black rounded-xl gap-2 h-12 px-6" onClick={exportToPDF}>
            <Download className="w-4 h-4" /> Export PDF
          </Button>
          <Button className="bg-white text-black hover:bg-neutral-200 rounded-xl gap-2 h-12 px-6">
            <Save className="w-4 h-4" /> Simpan Draft
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Project Info Card */}
        <Card className="border-2 border-black rounded-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,0.05)]">
          <CardHeader>
            <CardTitle className="uppercase tracking-tighter font-black flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Data Proyek
            </CardTitle>
            <CardDescription className="uppercase-soft text-[10px]">Informasi Dasar Penawaran</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-neutral-400">Nama Klien</Label>
              <Input value={projectInfo.clientName} onChange={e => setProjectInfo({...projectInfo, clientName: e.target.value})} className="rounded-xl border-black/10" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-neutral-400">Nama Proyek</Label>
              <Input value={projectInfo.projectName} onChange={e => setProjectInfo({...projectInfo, projectName: e.target.value})} className="rounded-xl border-black/10" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-neutral-400">Alamat / Lokasi</Label>
              <Input value={projectInfo.address} onChange={e => setProjectInfo({...projectInfo, address: e.target.value})} className="rounded-xl border-black/10" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase">
                <Instagram className="w-4 h-4" /> @tbj.bisnis
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase">
                <Phone className="w-4 h-4" /> +62 821..
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main RAB Table */}
        <Card className="lg:col-span-2 border-2 border-black rounded-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b-2 border-black/5 pb-6">
            <div>
              <CardTitle className="uppercase tracking-tighter font-black flex items-center gap-2">
                <Calculator className="w-5 h-5" /> Rincian Pekerjaan
              </CardTitle>
              <CardDescription className="uppercase-soft text-[10px]">Master Data & Custom Analysis</CardDescription>
            </div>
            <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
              <DialogTrigger render={<Button className="rounded-xl gap-2 bg-black text-white hover:bg-neutral-800" />}>
                <Plus className="w-4 h-4" /> Tambah Item
              </DialogTrigger>
              <DialogContent className="max-w-2xl rounded-3xl border-2 border-black">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Cari Master Data</DialogTitle>
                </DialogHeader>
                <div className="py-6 space-y-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-neutral-400" />
                    <Input 
                      placeholder="Cari pekerjaan (misal: galian, cat, marmer)..." 
                      className="pl-12 h-12 rounded-2xl border-2 border-black/10 focus:border-black transition-all"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredMaster.map(item => (
                      <div 
                        key={item.id} 
                        className="p-4 border-2 border-black/5 hover:border-black rounded-2xl cursor-pointer transition-all group flex justify-between items-center"
                        onClick={() => addItemToRab(item)}
                      >
                        <div>
                          <p className="font-bold text-sm uppercase tracking-tight group-hover:text-black">{item.name}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-[9px] uppercase font-bold rounded-md">{item.category}</Badge>
                            <span className="text-[10px] text-neutral-400 font-bold uppercase">{item.unit}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm">Rp {item.price.toLocaleString('id-ID')}</p>
                          <p className="text-[9px] text-neutral-400 uppercase font-bold">Harga Satuan</p>
                        </div>
                      </div>
                    ))}
                    {searchQuery && filteredMaster.length === 0 && (
                      <div className="text-center py-12 text-neutral-400 uppercase-soft">Pekerjaan tidak ditemukan</div>
                    )}
                    {!searchQuery && (
                      <div className="text-center py-12 text-neutral-400 uppercase-soft">Ketik untuk mencari di {WORK_ITEMS_MASTER.length} master data</div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-neutral-50">
                  <TableRow className="border-b-2 border-black/5">
                    <TableHead className="w-[80px] text-[10px] font-black uppercase">Kode</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Uraian Pekerjaan</TableHead>
                    <TableHead className="w-[100px] text-center text-[10px] font-black uppercase">Volume</TableHead>
                    <TableHead className="w-[80px] text-center text-[10px] font-black uppercase">Satuan</TableHead>
                    <TableHead className="w-[150px] text-right text-[10px] font-black uppercase">Harga</TableHead>
                    <TableHead className="w-[150px] text-right text-[10px] font-black uppercase">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rabItems.map((item, index) => (
                    <TableRow key={index} className="group hover:bg-neutral-50 transition-colors">
                      <TableCell className="font-mono text-[10px] text-neutral-400">{item.code}</TableCell>
                      <TableCell>
                        <Input 
                          value={item.name} 
                          onChange={e => updateItem(index, { name: e.target.value })}
                          className="h-8 border-none bg-transparent focus-visible:ring-0 p-0 font-bold text-sm uppercase tracking-tight"
                        />
                        <p className="text-[9px] text-neutral-400 uppercase font-bold">{item.category}</p>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.volume} 
                          onChange={e => updateItem(index, { volume: Number(e.target.value) })}
                          className="h-8 text-center border-black/10 rounded-md font-bold"
                        />
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs uppercase text-neutral-500">{item.unit}</TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.price} 
                          onChange={e => updateItem(index, { price: Number(e.target.value) })}
                          className="h-8 text-right border-black/10 rounded-md font-mono text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-right font-black text-sm tracking-tighter">
                        Rp {item.total.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-300 hover:text-red-500" onClick={() => removeItem(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rabItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64 text-center">
                        <div className="flex flex-col items-center gap-2 text-neutral-300">
                          <FileText className="w-12 h-12" />
                          <p className="uppercase-soft text-xs">Belum ada item pekerjaan</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Summary Footer */}
            <div className="p-8 bg-neutral-900 text-white flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex gap-8">
                <div>
                  <p className="text-[9px] uppercase font-bold text-white/40">Total Item</p>
                  <p className="text-2xl font-black">{rabItems.length}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-white/40">PPN (0%)</p>
                  <p className="text-2xl font-black">Rp 0</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Grand Total Estimasi</p>
                <p className="text-5xl font-black tracking-tighter text-yellow-400">Rp {grandTotal.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Branding */}
      <div className="flex flex-col md:flex-row justify-between items-center py-12 border-t-2 border-black/5 gap-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white font-black text-xl">TBJ</div>
          <div>
            <p className="font-black uppercase tracking-tighter">TBJ Contractor Hub</p>
            <p className="text-[10px] uppercase-soft text-neutral-400">Build with Intelligence • Design with Soul</p>
          </div>
        </div>
        <div className="flex gap-6">
          <a href="#" className="flex items-center gap-2 text-xs font-bold uppercase hover:text-neutral-500 transition-colors">
            <Instagram className="w-4 h-4" /> @tbj.bisnis
          </a>
          <a href="#" className="flex items-center gap-2 text-xs font-bold uppercase hover:text-neutral-500 transition-colors">
            <Share2 className="w-4 h-4" /> Share Project
          </a>
          <a href="#" className="flex items-center gap-2 text-xs font-bold uppercase hover:text-neutral-500 transition-colors">
            <Phone className="w-4 h-4" /> WhatsApp Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default RabPage;
