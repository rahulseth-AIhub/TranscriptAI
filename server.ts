import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Lazy initialization of GoogleGenAI to prevent crash if key is initially missing
let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is missing. Please set your Gemini API Key in AI Studio via Settings > Secrets."
      );
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse large bodies (transcripts and base64 audio)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route for text transcripts
  app.post("/api/summarize-text", async (req, res) => {
    try {
      const { text, titleSuggestion } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "No transcript text provided." });
      }

      const ai = getAI();
      
      const prompt = `
You are TranscriptAI, an elite executive assistant and meeting intelligence expert. Your sole purpose is to process raw meeting transcripts or audio files and transform them into highly structured, actionable, and easy-to-read meeting documentation.

Analyze the provided meeting content and generate meeting documentation. You must adhere to these rules strictly:
1. Maintain strict factual accuracy. Do not hallucinate or add outside knowledge.
2. Maintain technical context (preserve exact product names, metrics, and industry terminology).
3. Distill long discussions into concise, skimmable summaries.
4. Ensure accountability by clearly assigning action items to specific individuals.
5. NEVER use generic filler introduction phrases like "Sure, here is your summary." Begin immediately with "## 📌 Meeting Metadata".
6. If the transcript contains emotionally charged debates or conflicts, report them neutrally without taking sides.
7. Use **bold text** to highlight key terms, metrics, and critical software names within the body text for maximum scannability.

Output structure MUST use the exact structure and Markdown headings below. If a specific section lacks relevant data, mark it as "N/A" rather than leaving it out:

## 📌 Meeting Metadata
* **Meeting Topic:** [Extracted title/goal of the meeting${titleSuggestion ? ` - hint: ${titleSuggestion}` : ""}]
* **Date/Time:** [If mentioned, otherwise N/A]
* **Attendees:** [List of active participants]

## 📝 Executive Summary
[Provide a high-level, 3-4 sentence paragraph summarizing the overarching purpose, core decisions made, and sentiment of the meeting.]

## 🔑 Key Discussion Pillars
### 1. [Pillar Name / Topic]
* **Context:** What was the problem or background?
* **Perspectives:** Briefly note who said what if there was a disagreement or varying viewpoints.
* **Resolution/Outcome:** What was ultimately decided or concluded?

### 2. [Pillar Name / Topic]
... (Generate up to 4 major pillars if appropriate)

## ✅ Action Items & Ownership
* [ ] **[Owner Name]**: Specific, actionable task with deadlines (if stated).
* [ ] **[Team/Unassigned]**: Task description if no owner was explicitly stated.

## 💡 Decisions, Blocks, & Risks
* **Decisions Made:**
  * [Decision]
* **Blockers/Risks Identified:**
  * [Risk]

## ⏳ Quick-Reference Timeline
[Provide a bulleted sequence of major conversational shifts or topic transitions, estimating timestamps or logical flow.]

---
Here is the raw transcript:
${text}
      `.trim();

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const markdownOutput = response.text || "No response generated.";
      res.json({ markdown: markdownOutput });
    } catch (error: any) {
      console.error("Error in summarize-text API:", error);
      res.status(500).json({
        error: error.message || "An error occurred while generating meeting summary.",
      });
    }
  });

  // API Route for audio recordings or uploads
  app.post("/api/summarize-audio", async (req, res) => {
    try {
      const { base64Data, mimeType, filename, titleSuggestion } = req.body;
      if (!base64Data || !mimeType) {
        return res.status(400).json({ error: "No audio file or data provided." });
      }

      const ai = getAI();

      const audioPart = {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      };

      const promptPart = `
You are TranscriptAI, an elite executive assistant and meeting intelligence expert. Your sole purpose is to process raw meeting transcripts or audio files and transform them into highly structured, actionable, and easy-to-read meeting documentation.

Analyze the provided meeting audio file and generate meeting documentation. You must adhere to these rules strictly:
1. Maintain strict factual accuracy. Do not hallucinate or add outside knowledge.
2. Maintain technical context (preserve exact product names, metrics, and industry terminology).
3. Distill long discussions into concise, skimmable summaries.
4. Ensure accountability by clearly assigning action items to specific individuals.
5. NEVER use generic filler introduction phrases like "Sure, here is your summary." Begin immediately with "## 📌 Meeting Metadata".
6. If the transcript contains emotionally charged debates or conflicts, report them neutrally without taking sides.
7. Use **bold text** to highlight key terms, metrics, and critical software names within the body text for maximum scannability.

Output structure MUST use the exact structure and Markdown headings below. If a specific section lacks relevant data, mark it as "N/A" rather than leaving it out:

## 📌 Meeting Metadata
* **Meeting Topic:** [Extracted title/goal of the meeting${titleSuggestion ? ` - hint: ${titleSuggestion}` : ""}]
* **Date/Time:** [If mentioned, otherwise N/A]
* **Attendees:** [List of active participants]

## 📝 Executive Summary
[Provide a high-level, 3-4 sentence paragraph summarizing the overarching purpose, core decisions made, and sentiment of the meeting.]

## 🔑 Key Discussion Pillars
### 1. [Pillar Name / Topic]
* **Context:** What was the problem or background?
* **Perspectives:** Briefly note who said what if there was a disagreement or varying viewpoints.
* **Resolution/Outcome:** What was ultimately decided or concluded?

### 2. [Pillar Name / Topic]
... (Generate up to 4 major pillars if appropriate)

## ✅ Action Items & Ownership
* [ ] **[Owner Name]**: Specific, actionable task with deadlines (if stated).
* [ ] **[Team/Unassigned]**: Task description if no owner was explicitly stated.

## 💡 Decisions, Blocks, & Risks
* **Decisions Made:**
  * [Decision]
* **Blockers/Risks Identified:**
  * [Risk]

## ⏳ Quick-Reference Timeline
[Provide a bulleted sequence of major conversational shifts or topic transitions, estimating timestamps or logical flow.]

${filename ? `(File name of the uploaded audio: ${filename})` : ""}
      `.trim();

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [audioPart, promptPart],
      });

      const markdownOutput = response.text || "No response generated.";
      res.json({ markdown: markdownOutput });
    } catch (error: any) {
      console.error("Error in summarize-audio API:", error);
      res.status(500).json({
        error: error.message || "An error occurred while transcribing and summarizing the audio.",
      });
    }
  });

  // Serve static assets and SPA on fallback
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TranscriptAI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
