import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMasterData, useAuth } from "@/lib/hooks";
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
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { TBJ_LOGO } from "@/constants";

interface RabItem extends WorkItemMaster {
  volume: number;
  total: number;
  code?: string;
  notes?: string;
}

const RabPage = ({ user }: { user: any }) => {
  const navigate = useNavigate();
  const { masterData } = useMasterData(user?.role);
  const [rabItems, setRabItems] = useState<RabItem[]>([]);
  const [categories, setCategories] = useState<string[]>([
    "ARSITEKTUR", 
    "Struktur", 
    "Lapangan / Sitework", 
    "Mekanikal Elektrikal", 
    "Plumbing", 
    "Site Development"
  ]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
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
    // Admin and PM can always access
    if (user?.role === 'admin' || user?.role === 'pm') return;
    
    // Tier 2 and Tier 3 clients can view
    if (user?.tier === 'survey' || user?.tier === 'deal') return;

    // Otherwise redirect
    if (!user) navigate("/");
  }, [user, navigate]);

  const canEdit = user?.role === 'admin' || user?.role === 'pm';

  const shareToWhatsApp = () => {
    const message = `Halo, berikut adalah draf RAB Proyek ${projectInfo.projectName} dari TBJ Constech. Total Estimasi: Rp ${grandTotal.toLocaleString('id-ID')}. Silakan cek detailnya di platform kami.`;
    window.open(`https://wa.me/${projectInfo.contact}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredMaster = useMemo(() => {
    if (!searchQuery) return [];
    const dataToUse = masterData && masterData.length > 0 ? masterData : [];
    return dataToUse.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 15);
  }, [searchQuery, masterData]);

  const addItemToRab = (master: WorkItemMaster) => {
    const newItem: RabItem = {
      ...master,
      volume: 1,
      total: master.price,
      code: master.code || master.id,
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

  const groupedItems = useMemo(() => {
    const groups: Record<string, RabItem[]> = {};
    categories.forEach(cat => groups[cat] = []);
    
    rabItems.forEach(item => {
      const cat = item.category || "Lain-lain";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    
    return groups;
  }, [rabItems, categories]);

  const grandTotal = rabItems.reduce((sum, item) => sum + item.total, 0);

  const exportToPDF = () => {
    const doc = new jsPDF() as any;
    
    // Header with Logo
    doc.addImage(TBJ_LOGO, 'PNG', 14, 10, 15, 15);
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text("TBJ CONTRACTOR HUB", 35, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Digital Ecosystem: AI-Powered Construction & Design", 14, 26);
    doc.text("Instagram: @tukang.bangunan.jakarta | WA: +62 821-9420-1650", 14, 31);
    
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
      item.code || "N/A",
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
    <div className="max-w-7xl mx-auto space-y-8 py-12 px-6 bg-white min-h-screen">
      {/* Sleek Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 pb-12 border-b border-neutral-100">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl overflow-hidden">
              <img src={TBJ_LOGO} alt="TBJ Logo" className="w-full h-full object-contain" />
            </div>
            <div className="h-8 w-[1px] bg-neutral-200" />
            <Badge variant="outline" className="border-neutral-200 text-neutral-400 uppercase-soft text-[9px] h-6">Master RAB Engine v2.0</Badge>
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none text-neutral-900">Rencana Anggaran Biaya</h1>
            <p className="text-neutral-400 uppercase-soft text-[10px] tracking-[0.2em] font-bold">Build with Intelligence • Design with Soul</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="border-neutral-200 text-neutral-600 hover:bg-neutral-50 rounded-full gap-2 h-12 px-8 uppercase-soft text-[10px] font-black" onClick={exportToPDF}>
            <Download className="w-4 h-4" /> Export PDF
          </Button>
          <Button variant="outline" className="border-green-200 text-green-600 hover:bg-green-50 rounded-full gap-2 h-12 px-8 uppercase-soft text-[10px] font-black" onClick={shareToWhatsApp}>
            <Phone className="w-4 h-4" /> Share WA
          </Button>
          {canEdit && (
            <Button className="bg-black text-white hover:bg-neutral-800 rounded-full gap-2 h-12 px-8 uppercase-soft text-[10px] font-black shadow-xl shadow-black/10">
              <Save className="w-4 h-4" /> Save Master
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-12">
        {/* Project Info - Thinner Design */}
        <div className="lg:col-span-1 space-y-8">
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 border-b border-neutral-100 pb-2">Project Dossier</h3>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <Label className="text-[9px] uppercase font-black text-neutral-300">Client Name</Label>
                <Input 
                  disabled={!canEdit}
                  value={projectInfo.clientName} 
                  onChange={e => setProjectInfo({...projectInfo, clientName: e.target.value})} 
                  className="rounded-none border-0 border-b border-neutral-100 focus-visible:ring-0 focus-visible:border-black px-0 h-8 text-sm font-bold uppercase" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] uppercase font-black text-neutral-300">Project Title</Label>
                <Input 
                  disabled={!canEdit}
                  value={projectInfo.projectName} 
                  onChange={e => setProjectInfo({...projectInfo, projectName: e.target.value})} 
                  className="rounded-none border-0 border-b border-neutral-100 focus-visible:ring-0 focus-visible:border-black px-0 h-8 text-sm font-bold uppercase" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] uppercase font-black text-neutral-300">Site Location</Label>
                <Input 
                  disabled={!canEdit}
                  value={projectInfo.address} 
                  onChange={e => setProjectInfo({...projectInfo, address: e.target.value})} 
                  className="rounded-none border-0 border-b border-neutral-100 focus-visible:ring-0 focus-visible:border-black px-0 h-8 text-sm font-bold uppercase" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] uppercase font-black text-neutral-300">WA Contact</Label>
                <Input 
                  disabled={!canEdit}
                  value={projectInfo.contact} 
                  onChange={e => setProjectInfo({...projectInfo, contact: e.target.value})} 
                  className="rounded-none border-0 border-b border-neutral-100 focus-visible:ring-0 focus-visible:border-black px-0 h-8 text-sm font-bold uppercase" 
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-neutral-50 rounded-2xl space-y-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Financial Summary</p>
            <div className="space-y-1">
              <p className="text-3xl font-black tracking-tighter">Rp {grandTotal.toLocaleString('id-ID')}</p>
              <p className="text-[10px] font-bold text-neutral-400 uppercase">Total Estimated Budget</p>
            </div>
          </div>
        </div>

        {/* Main RAB Table - Sleek & Light */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Work Items Breakdown</h3>
            <div className="flex gap-2">
              {canEdit && (
                <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
                  <DialogTrigger render={
                    <Button variant="ghost" className="text-[10px] font-black uppercase gap-2 hover:bg-neutral-50">
                      <Plus className="w-3 h-3" /> Add Category
                    </Button>
                  } />
                  <DialogContent className="max-w-sm rounded-3xl border border-neutral-100 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Add Category</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Category Name</Label>
                        <Input 
                          placeholder="e.g. Pekerjaan Atap" 
                          className="h-12 rounded-2xl border-neutral-100 focus:border-black transition-all"
                          value={newCategoryName}
                          onChange={e => setNewCategoryName(e.target.value)}
                        />
                      </div>
                      <Button className="w-full btn-sleek h-12 rounded-2xl" onClick={() => {
                        if (newCategoryName) {
                          setCategories([...categories, newCategoryName]);
                          setNewCategoryName("");
                          setShowAddCategory(false);
                          toast.success("Category added");
                        }
                      }}>Add Category</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {canEdit && (
                <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
                  <DialogTrigger render={
                    <Button variant="ghost" className="text-[10px] font-black uppercase gap-2 hover:bg-neutral-50">
                      <Plus className="w-3 h-3" /> Add Item
                    </Button>
                  } />
                  <DialogContent className="max-w-2xl rounded-3xl border border-neutral-100 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Search Master AHSP</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                      <div className="relative">
                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-neutral-400" />
                        <Input 
                          placeholder="Search work items..." 
                          className="pl-12 h-12 rounded-2xl border-neutral-100 focus:border-black transition-all"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredMaster.map(item => (
                          <div 
                            key={item.id} 
                            className="p-4 border border-neutral-100 hover:border-black rounded-2xl cursor-pointer transition-all group flex justify-between items-center"
                            onClick={() => addItemToRab(item)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm uppercase tracking-tight group-hover:text-black break-words whitespace-normal leading-tight">{item.name}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-[8px] uppercase font-bold rounded-md border-neutral-100">{item.category}</Badge>
                                <span className="text-[9px] text-neutral-400 font-bold uppercase">{item.unit}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-sm">Rp {item.price.toLocaleString('id-ID')}</p>
                              <p className="text-[8px] text-neutral-400 uppercase font-bold">Unit Price</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <div className="border border-neutral-100 rounded-3xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-neutral-50/50">
                <TableRow className="border-b border-neutral-100 hover:bg-transparent">
                  <TableHead className="w-[80px] text-[9px] font-black uppercase text-neutral-400 px-6">Code</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-neutral-400">Description</TableHead>
                  <TableHead className="w-[100px] text-center text-[9px] font-black uppercase text-neutral-400">Volume</TableHead>
                  <TableHead className="w-[80px] text-center text-[9px] font-black uppercase text-neutral-400">Unit</TableHead>
                  <TableHead className="w-[150px] text-right text-[9px] font-black uppercase text-neutral-400">Price</TableHead>
                  <TableHead className="w-[150px] text-right text-[9px] font-black uppercase text-neutral-400 px-6">Total</TableHead>
                  {canEdit && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedItems).map(([catName, items]) => (
                  <React.Fragment key={catName}>
                    {items.length > 0 && (
                      <TableRow className="bg-neutral-50/50 border-b border-neutral-100">
                        <TableCell colSpan={canEdit ? 7 : 6} className="py-2 px-6">
                          <span className="text-[10px] font-black uppercase tracking-widest text-black">{catName}</span>
                        </TableCell>
                      </TableRow>
                    )}
                    {items.map((item, index) => {
                      const globalIndex = rabItems.findIndex(ri => ri.id === item.id && ri.name === item.name);
                      return (
                        <TableRow key={index} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-colors">
                          <TableCell className="font-mono text-[9px] text-neutral-400 font-bold px-6">{item.code || "N/A"}</TableCell>
                          <TableCell className="max-w-[200px] md:max-w-[350px]">
                            <p className="font-bold text-[11px] uppercase tracking-tight text-neutral-800 break-words whitespace-normal leading-tight">{item.name}</p>
                            <p className="text-[8px] text-neutral-400 uppercase font-bold">{item.category}</p>
                          </TableCell>
                          <TableCell>
                            <Input 
                              disabled={!canEdit}
                              type="number" 
                              value={item.volume || 0} 
                              onChange={e => updateItem(globalIndex, { volume: Math.max(0, Number(e.target.value)) })}
                              className="h-7 text-center border-neutral-100 rounded-lg font-bold text-xs bg-transparent focus-visible:ring-black"
                            />
                          </TableCell>
                          <TableCell className="text-center font-bold text-[10px] uppercase text-neutral-400">{item.unit}</TableCell>
                          <TableCell className="text-right font-bold text-[10px] text-neutral-600">
                            Rp {item.price.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-right font-black text-xs tracking-tighter px-6">
                            Rp {item.total.toLocaleString('id-ID')}
                          </TableCell>
                          {canEdit && (
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-200 hover:text-red-500" onClick={() => removeItem(globalIndex)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                ))}
                {rabItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 7 : 6} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-2 text-neutral-200">
                        <FileText className="w-10 h-10" />
                        <p className="uppercase-soft text-[9px] font-black">No items added to this RAB</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
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
          <a href="https://www.instagram.com/tukang.bangunan.jakarta/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold uppercase hover:text-neutral-500 transition-colors">
            <Instagram className="w-4 h-4" /> @tukang.bangunan.jakarta
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
