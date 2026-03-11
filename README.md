# LawGPT - AI Legal Assistant

LawGPT is a hackathon prototype web application that demonstrates AI-powered legal assistance using Google's Gemini API. It features a simplified ChatGPT-like interface tailored for legal inquiries, contract scanning, and document generation.

## Features

1. **Legal Query Answer**: Ask any legal question in plain English and get simple explanations referencing relevant laws (specialized for Indian law context by default).
2. **Contract Risk Scanner**: Upload a PDF, DOCX, or TXT contract to identify potentially risky clauses and suggest safer alternatives.
3. **Legal Document Generator**: Automatically draft structured legal documents (e.g., Non-disclosure agreement, Rental agreement) based on your specific requirements.

## Tech Stack
- **Frontend**: HTML5, TailwindCSS (via CDN), Vanilla JavaScript, Marked.js (for markdown formatting)
- **Backend**: Node.js, Express.js
- **File Parsing**: multer, pdf-parse, mammoth
- **AI**: Gemini API (`@google/generative-ai`)

## Application Structure

```
/lawgpt
  /public/
    index.html
    style.css
    script.js
  /server/
    server.js
  package.json
  .env
```

## Setup Instructions

1. **Install Dependencies**
   Run the following command in the project root directory:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Open the `.env` file in the project root and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```
   *Note: Get an API key from [Google AI Studio](https://aistudio.google.com/).*

3. **Start the Server**
   Run the following command from the project root:
   ```bash
   node server/server.js
   ```

4. **Access the App**
   Open your browser and navigate to:
   [http://localhost:3000](http://localhost:3000)

## Important Notes
- This is a hackathon prototype. The AI responses are for demonstration purposes only and should **never** be used as professional legal advice.
- When parsing very large PDFs or Word documents, the server may take a few seconds to extract the text and get a response from the Gemini API.
