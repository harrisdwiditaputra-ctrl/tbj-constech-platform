import { KalkulasiInput, HasilRAB, MaterialOption } from "../types";

export const MASTER_DATA_ATAP: Record<string, MaterialOption> = {
  alderon: {
    nama: "Alderon Double Layer",
    hargaSatuan: 450000,
    deskripsi: "Atap UPVC tahan panas dan kedap suara"
  },
  spandek: {
    nama: "Spandek Zincalume",
    hargaSatuan: 180000,
    deskripsi: "Atap logam ringan dan ekonomis"
  }
};

export const hitungRABAtap = (input: KalkulasiInput): HasilRAB => {
  const material = MASTER_DATA_ATAP[input.kodeMaterial];
  const hargaRangkaPerM2 = 150000; // Contoh asumsi biaya rangka baja ringan
  
  const biayaMaterial = input.luasAtap * material.hargaSatuan;
  const biayaRangka = input.termasukRangka ? (input.luasAtap * hargaRangkaPerM2) : 0;
  
  return {
    material: material.nama,
    luas: input.luasAtap,
    hargaSatuan: material.hargaSatuan,
    biayaRangka: biayaRangka,
    totalHarga: biayaMaterial + biayaRangka
  };
};
