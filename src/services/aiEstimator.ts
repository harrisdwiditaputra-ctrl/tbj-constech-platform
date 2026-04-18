import { GoogleGenAI, Type as GenType } from "@google/genai";
import { WORK_ITEMS_MASTER } from "../constants";
import { AIEstimateResponse } from "../types";
import { calculateAdminPrice, calculateClientPrice } from "../lib/utils";

export async function getAIEstimation(userProblem: string, category: string, masterData?: any[], userRole: string = 'user'): Promise<AIEstimateResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const dataToUse = masterData && masterData.length > 0 ? masterData : WORK_ITEMS_MASTER;
  const limitedData = dataToUse.slice(0, 200);
  
  const masterDataString = limitedData.map(item => {
    const finalPrice = userRole === 'admin' || userRole === 'pm' 
      ? calculateAdminPrice(item.price) 
      : calculateClientPrice(item.price);
    
    return `- [${item.code || 'N/A'}] ${item.name} (${item.unit}): Rp ${finalPrice.toLocaleString('id-ID')}`;
  }).join('\n');

  const promptText = `
    Anda adalah "TBJ Constech OS", Chief Estimator AI eksklusif untuk platform TBJ Constech.
    Tugas Anda: Menganalisa permasalahan konstruksi/renovasi klien secara mendalam dan memberikan estimasi RAB (Rencana Anggaran Anggaran Biaya).

    STANDAR KATEGORI TBJ:
    1. ARSITEKTUR
    2. Struktur
    3. Lapangan / Sitework
    4. Mekanikal Elektrikal
    5. Plumbing
    6. Site Development

    Kategori Proyek Saat Ini: ${category}
    Deskripsi Permasalahan/Kebutuhan Klien: "${userProblem}"

    DATA MASTER HARGA (SUDAH TERMASUK MARKUP GLOBAL 20%):
    ${masterDataString}

    ATURAN ESTIMASI KETAT:
    1. Analisa harus sangat teknis, mencakup tahapan pekerjaan.
    2. PRIORITASKAN item dari DATA MASTER.
    3. Jika item tidak ada di DATA MASTER, buatlah item baru dengan harga pasar konstruksi Indonesia (sudah termasuk markup 20% + margin profit jika relevan).
    4. Volume harus dihitung secara logis.
    5. Biaya Digital Assessment (Survey) adalah Rp 399.000 (Mutlak).
    6. Output harus dalam format JSON yang valid.
  `;

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: promptText }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: GenType.OBJECT,
        properties: {
          analysis: {
            type: GenType.STRING,
            description: "Analisa singkat mengenai permasalahan dan solusi yang diusulkan."
          },
          items: {
            type: GenType.ARRAY,
            items: {
              type: GenType.OBJECT,
              properties: {
                name: { type: GenType.STRING },
                quantity: { type: GenType.NUMBER },
                unit: { type: GenType.STRING },
                pricePerUnit: { type: GenType.NUMBER },
                totalPrice: { type: GenType.NUMBER },
                reasoning: { type: GenType.STRING, description: "Alasan mengapa item ini diperlukan." }
              },
              required: ["name", "quantity", "unit", "pricePerUnit", "totalPrice", "reasoning"]
            }
          },
          totalEstimatedCost: { type: GenType.NUMBER }
        },
        required: ["analysis", "items", "totalEstimatedCost"]
      }
    }
  });

  try {
    const text = result.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text) as AIEstimateResponse;
  } catch (error) {
    console.error("Failed to parse AI estimation:", error);
    throw error;
  }
}
