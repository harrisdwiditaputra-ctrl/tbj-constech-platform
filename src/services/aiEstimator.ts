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
  
  // Limit to top 50 relevant items to avoid prompt size issues
  const limitedData = dataToUse.slice(0, 50);
  
  const masterDataString = limitedData.map(item => 
    `- [${item.code || 'N/A'}] ${item.name} (${item.unit}): Rp ${item.price.toLocaleString('id-ID')}`
  ).join('\n');

  const prompt = `
    Anda adalah "TBJ Constech OS", Chief Estimator AI eksklusif untuk platform TBJ Constech.
    Tugas Anda: Menganalisa permasalahan konstruksi/renovasi klien secara mendalam dan memberikan estimasi RAB (Rencana Anggaran Biaya) yang sangat akurat, profesional, dan real-time.

    Kategori Proyek: ${category}
    Deskripsi Permasalahan/Kebutuhan Klien: "${userProblem}"

    DATA MASTER HARGA (CONTOH ITEM RELEVAN):
    ${masterDataString}
    ... (dan item master lainnya)

    ATURAN ESTIMASI KETAT:
    1. Analisa harus sangat teknis, mencakup tahapan pekerjaan dari persiapan hingga finishing.
    2. PRIORITASKAN item dari DATA MASTER. Jika ada kecocokan kode (misal: PT010), gunakan kode tersebut.
    3. Jika item tidak ada di DATA MASTER, buatlah item baru dengan harga pasar konstruksi Indonesia yang wajar (sudah termasuk markup 20%).
    4. Volume harus dihitung secara logis berdasarkan standar teknik (misal: luas dinding, volume galian, titik lampu).
    5. Gunakan unit standar: m2, m3, m', kg, sak, ls, titik, unit, bh.
    6. Berikan alasan (reasoning) teknis yang kuat mengapa item tersebut diperlukan untuk solusi klien.
    7. Pastikan total biaya dihitung dengan benar (Volume x Harga Satuan).
    8. Output harus dalam format JSON yang valid.

    Format Output: JSON.
    Bahasa: Indonesia.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
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
