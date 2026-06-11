##Latest Implements:

- Add multi-model support and audio processing
- Integrate support for Google, OpenAI, and Anthropic models
- Implement Audio share option
- Add display-capture permission to metadata
- Implement robust filtering for empty decision/risk notes
- Update documentation and cleanup environment configuration


##Past Improvements:

- Implement dark mode with persistent storage
- Add `jspdf` dependency for future export capabilities
- Improve markdown section parsing resilience for metadata and headings
- Update documentation and cleanup imports

##RUN Online

https://transcriptai-2886744896.asia-southeast1.run.app/


##Run Locally

**Prerequisites:** Node.js

1. Copy the repo locally
2. Make a copy of .env.example to .env `cp .env.example .env`
3. Set the `GEMINI_API_KEY` in [.env](.env) to your Gemini API key
4. Install dependencies: `npm install`
5. Run the app: `npm run dev`
6. Open your web browser and navigate to `http://localhost:3000`. Your custom meeting suite is now live, fully integrated, and running locally!


##How to Test:

- Get a Gemini API Key: It’s completely free! Go to https://aistudio.google.dev/app/apikey and click "Create API Key."
- Select Sources: Either record live or upload recorded audio (m4a, mp3, wav) or text files (Zoom/Teams transcripts).
- Generate: Hit the "Analyze with TranscriptAI" button and watch the report appear.
💡 Pro-Tip:
If you run into an error (like a rate limit or "model not found"), just use the dropdown menu to switch the AI model (e.g., try Gemini 3.5 Flash or Gemini 2.5 Flash) and try again.
