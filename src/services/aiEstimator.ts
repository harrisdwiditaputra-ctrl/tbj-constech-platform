import { GoogleGenAI, Type } from "@google/genai";
import { WORK_ITEMS_MASTER } from "../constants";
import { AIEstimateResponse } from "../types";

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!key) {
    console.warn("GEMINI_API_KEY is not defined. AI features may not work.");
  }
  return key || "";
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export async function getAIEstimation(userProblem: string, category: string, masterData?: any[]): Promise<AIEstimateResponse> {
  const dataToUse = masterData && masterData.length > 0 ? masterData : WORK_ITEMS_MASTER;
  
  const masterDataString = dataToUse.map(item => 
    `- [${item.code || 'N/A'}] ${item.name} (${item.unit}): Rp ${item.price.toLocaleString('id-ID')}`
  ).join('\n');

  const prompt = `
    Anda adalah "TBJ Constech OS", Chief Estimator AI eksklusif untuk platform TBJ Constech.
    Tugas Anda: Menganalisa permasalahan konstruksi/renovasi klien dan memberikan estimasi RAB (Rencana Anggaran Biaya) yang akurat.

    Kategori Proyek: ${category}
    Deskripsi Permasalahan/Kebutuhan Klien: "${userProblem}"

    DATA MASTER HARGA (Gunakan item ini jika relevan):
    ${masterDataString}

    ATURAN ESTIMASI:
    1. Analisa harus profesional, solutif, dan teknis.
    2. Pilih item dari DATA MASTER yang paling mendekati kebutuhan.
    3. Jika item tidak ada di DATA MASTER, buatlah item baru dengan harga pasar yang wajar (markup 20% dari modal).
    4. Volume harus logis berdasarkan deskripsi permasalahan.
    5. Gunakan unit standar konstruksi: m2 (meter persegi), m3 (meter kubik), m' (meter lari), kg, sak, ls (lumpsum), titik, unit, bh (buah).
    6. JANGAN gunakan unit yang tidak standar atau singkatan yang membingungkan.
    7. Total Biaya adalah akumulasi dari (Volume x Harga Satuan).
    8. Semua harga dalam Rupiah (Rp).
    9. Berikan alasan (reasoning) teknis untuk setiap item yang dipilih.

    Format Output: JSON.
    Bahasa: Indonesia.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: {
            type: Type.STRING,
            description: "Analisa singkat mengenai permasalahan dan solusi yang diusulkan."
          },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                pricePerUnit: { type: Type.NUMBER },
                totalPrice: { type: Type.NUMBER },
                reasoning: { type: Type.STRING, description: "Alasan mengapa item ini diperlukan." }
              },
              required: ["name", "quantity", "unit", "pricePerUnit", "totalPrice", "reasoning"]
            }
          },
          totalEstimatedCost: { type: Type.NUMBER }
        },
        required: ["analysis", "items", "totalEstimatedCost"]
      }
    }
  });

  return JSON.parse(response.text);
}
