import { AIEstimateResponse } from "../types";

export async function getAIEstimation(userProblem: string, category: string, masterData?: any[], userRole: string = 'user', globalMarkup: number = 20): Promise<AIEstimateResponse> {
  try {
    const response = await fetch("/api/ai-estimation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userProblem,
        category,
        masterData,
        userRole,
        globalMarkup,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Gagal menghubungi server AI");
    }

    return await response.json();
  } catch (error: any) {
    console.error("AI Estimation Service Error:", error);
    throw new Error(error.message || "Gagal melakukan Analisa AI (Server Error)");
  }
}
