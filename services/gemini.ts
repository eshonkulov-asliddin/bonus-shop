
import { GoogleGenAI } from "@google/genai";
import { Transaction, User } from "../types";

export const getInsights = async (transactions: Transaction[], users: User[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';

  const dataContext = transactions.map(t => ({
    user: users.find(u => u.id === t.userId)?.name || 'Unknown',
    type: t.type,
    amount: t.amount,
    cashback: t.cashbackAmount,
    date: t.timestamp
  })).slice(0, 20); // Limit context to recent 20

  const prompt = `
    As a business analyst for a small shop, analyze these recent loyalty program transactions:
    ${JSON.stringify(dataContext)}

    Provide a very short, punchy summary (2 sentences max) of business health and customer loyalty trends.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to load smart insights at this time.";
  }
};
