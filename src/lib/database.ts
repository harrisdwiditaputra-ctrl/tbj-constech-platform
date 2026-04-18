import { collection, query, limit, getDocsFromServer, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

/**
 * nuclearWipe - Fungsi penghapusan massal Firestore dalam batch 500.
 * Digunakan untuk membersihkan data master (9000+ item) secara paksa.
 * Membantu membersihkan sisa data yang tersangkut di cache browser atau server.
 */
export const nuclearWipe = async (collectionName: string = "master_data", onProgress?: (count: number) => void) => {
  try {
    console.log(`[TBJ OS] Memulai proses Nuclear Wipe untuk koleksi: ${collectionName}`);
    
    let totalDeleted = 0;
    let hasMore = true;
    let iterations = 0;
    const MAX_ITERATIONS = 100; // Batas aman untuk mencegah loop tak terbatas (maks 50.000 dokumen)

    while (hasMore && iterations < MAX_ITERATIONS) {
      iterations++;
      
      // Menggunakan getDocsFromServer untuk bypass cache browser agar data benar-benar bersih dari server langsung
      const q = query(collection(db, collectionName), limit(500));
      const snap = await getDocsFromServer(q);

      if (snap.empty) {
        hasMore = false;
        break;
      }

      const batch = writeBatch(db);
      snap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      totalDeleted += snap.docs.length;
      if (onProgress) onProgress(totalDeleted);
      console.log(`[TBJ OS] Progress: Berhasil menghapus ${totalDeleted} dokumen...`);
    }

    // Jika yang dibersihkan adalah master_data, maka bersihkan juga master_categories agar sinkron
    if (collectionName === "master_data") {
      const catSnap = await getDocsFromServer(collection(db, "master_categories"));
      if (!catSnap.empty) {
        const catBatch = writeBatch(db);
        catSnap.docs.forEach((d) => catBatch.delete(d.ref));
        await catBatch.commit();
      }
    }

    // Alert pemberitahuan keberhasilan kepada user
    alert(`Pembersihan ${totalDeleted}+ Data Berhasil`);
    
    // Melakukan reload halaman secara paksa untuk membersihkan cache browser dan state aplikasi
    window.location.reload();
    
    return totalDeleted;
  } catch (error) {
    console.error("[TBJ OS] Kegagalan fungsi nuclearWipe:", error);
    alert("Peringatan: Terjadi kesalahan sistem saat pembersihan data. Pastikan Anda memiliki hak akses Administrator.");
    throw error;
  }
};
