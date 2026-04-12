import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Megaphone } from "lucide-react";
import { useCMSConfig } from "@/lib/hooks";

export default function Ticker() {
  const [updates, setUpdates] = useState<string[]>([]);
  const { config: cmsConfig } = useCMSConfig();

  useEffect(() => {
    const q = query(collection(db, "status_updates"), orderBy("createdAt", "desc"), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let baseUpdates = [
        "Client Deal: Renovasi Rumah Pondok Indah",
        "Assessment Schedule: Interior Apartemen Sudirman",
        "New Project: Bangun Baru Jagakarsa",
        "Project Completed: Kitchen Set Kelapa Gading",
        "Client Deal: Maintenance Kantor Kuningan"
      ];

      if (!snapshot.empty) {
        baseUpdates = snapshot.docs.map(doc => doc.data().text);
      }
      
      setUpdates(baseUpdates);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "status_updates");
    });
    return () => unsubscribe();
  }, []);

  const allUpdates = cmsConfig?.promoActive && cmsConfig?.promoText 
    ? [cmsConfig.promoText, ...updates] 
    : updates;

  return (
    <div className="bg-accent text-white py-2 overflow-hidden border-b border-black/10">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
        <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0">
          <Megaphone className="w-3 h-3" />
          <span>Live Updates</span>
        </div>
        <div className="relative flex-grow h-6 overflow-hidden">
          <div className="absolute whitespace-nowrap animate-ticker flex gap-12 items-center h-full">
            {allUpdates.map((text, i) => (
              <span key={i} className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                {text}
              </span>
            ))}
            {/* Duplicate for seamless loop */}
            {allUpdates.map((text, i) => (
              <span key={`dup-${i}`} className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
