import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import tailwindcss from "@tailwindcss/vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "30mb" }));

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages = [], prompt = "", taskType = "general", requestedModel } = req.body;

    if (!prompt && (!messages || messages.length === 0)) {
      return res.status(400).json({ error: "Prompt or messages required" });
    }

    let model = requestedModel || "gemini-3.8-flash";
    if (taskType === "fast") {
      model = "gemini-3.1-flash-lite";
    } else if (taskType === "complex") {
      model = "gemini-3.8-flash"; // Reliable high-reasoning fallback without paid requirement
    }

    const contents: any[] = [];
    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (!m.content) continue;
        contents.push({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        });
      }
    }

    if (prompt) {
      contents.push({
        role: "user",
        parts: [{ text: prompt }],
      });
    }

    const systemInstruction = `You are Smart Khaata AI (स्मार्ट खाता एआई), a friendly, highly knowledgeable assistant for Indian farmers, property landlords/tenants, and household budget managers.
You provide clear, accurate guidance in Hindi or English (mirroring the user's language).
Specialties:
1. Agriculture & Farming: crop varieties, pests, yellow rust, fertilizers (DAP, Urea doses), sowing seasons (Kharif, Rabi, Zaid), mandi rates, irrigation advice.
2. Rental Management: room rent calculations, electricity sub-meter calculation (reading differences * rate/unit), polite WhatsApp rent reminders and receipts.
3. Household Budgeting: grocery savings, utility expense tracking, simple financial planning.
Format your responses with clear bullet points, bold headings, and emojis.`;

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
      },
    });

    res.json({
      text: response.text || "No response generated.",
      model,
    });
  } catch (err: any) {
    console.error("Chat API error:", err);
    res.status(500).json({
      error: err.message || "Failed to generate AI response",
    });
  }
});

// Image Analysis endpoint
app.post("/api/analyze-image", async (req, res) => {
  try {
    const { image, mimeType = "image/jpeg", analysisType = "crop_disease", customPrompt } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    const base64Data = image.replace(/^data:[^;]+;base64,/, "");

    let systemPrompt = "";
    if (analysisType === "crop_disease") {
      systemPrompt = `You are an expert plant pathologist and agronomist.
Examine this crop leaf/plant image carefully.
1. Identify the crop and any disease, pest infestation, or nutrient deficiency (e.g., Yellow Rust, Blight, Leaf Spot, Nitrogen deficiency).
2. State the diagnosis clearly in both Hindi and English.
3. List the observed symptoms.
4. Recommend exact immediate treatment (organic remedies, bio-pesticides, or standard chemical sprays with proper dosage).
5. Provide preventive tips for future yield protection.
${customPrompt ? `User's specific query: ${customPrompt}` : ""}`;
    } else if (analysisType === "receipt") {
      systemPrompt = `You are an intelligent bill and receipt OCR assistant.
Examine this bill or receipt image:
1. Shop/Vendor Name and Date (if visible).
2. Itemized list with Quantity, Unit Rate, and Total for each item.
3. Final Grand Total amount in INR (₹).
4. Category suggestion (Farm Expense like Seeds/Fertilizer/Diesel OR Home Expense like Grocery).
Format neatly so the user can review and copy it.
${customPrompt ? `User's specific query: ${customPrompt}` : ""}`;
    } else if (analysisType === "meter") {
      systemPrompt = `You are an electric meter reading assistant.
Examine this digital or analog electricity meter image:
1. Extract the current cumulative kWh reading digits.
2. Note any meter serial number, date, or warning indicator if visible.
3. Provide a clear summary: "Current Reading: [Value] kWh".
${customPrompt ? `User's specific query: ${customPrompt}` : ""}`;
    } else {
      systemPrompt = customPrompt || "Analyze this image in detail and describe all relevant contents clearly in Hindi and English.";
    }

    const model = "gemini-3.8-flash";
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType.includes("svg") ? "image/png" : mimeType,
            },
          },
          {
            text: systemPrompt,
          },
        ],
      },
    });

    res.json({
      analysis: response.text || "No analysis generated.",
      model,
    });
  } catch (err: any) {
    console.error("Image Analysis API error:", err);
    res.status(500).json({
      error: err.message || "Failed to analyze image",
    });
  }
});

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");

    const vite = await createViteServer({
      plugins: [tailwindcss()],
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
