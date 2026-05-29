# 🎯 Phase 1: Basic AI Chat Platform (LLM-Direct Integration)
**Goal:** Create a functional, multi-turn conversational interface where users can consult the AI on legal questions. The AI replies using Gemini's general knowledge formatted as professional, well-structured legal answers.

### 1. Database Schema Extensions (Mongoose)
To support conversations, you need to store chat history so that the LLM remembers context. Create two key schemas in MongoDB:

* **Chat Session Schema (`ChatSession`)**
  * `userId`: MongoDB ObjectId (references the authenticated user).
  * `title`: String (auto-generated from the first message, e.g., "Landlord Dispute Consultation").
  * `status`: Enum (`active`, `archived`).
  * `timestamps`: Created & Updated dates.
* **Message Schema (`Message`)**
  * `sessionId`: ObjectId (references the corresponding `ChatSession`).
  * `sender`: Enum (`user`, `assistant`).
  * `content`: String (the markdown-formatted text).
  * `tokenCount`: Optional Number (to track LLM cost and billing).
  * `timestamps`: Created date.

### 2. Backend Route Architecture
Create a new router file `chat.routes.js` mounted at `/api/chat` protected by your `authMiddleware`:
* `POST /api/chat/new`
  * Initializes a new `ChatSession` and returns the session ID.
* `GET /api/chat/sessions`
  * Retrieves all past chat sessions belonging to the logged-in user (ordered by last updated).
* `GET /api/chat/sessions/:sessionId`
  * Retrieves all messages inside a specific session to load the conversation history.
* `POST /api/chat/sessions/:sessionId/message`
  * Receives the user's message body.
  * Fetches the last *N* messages from the database to supply context to the LLM.
  * Calls the Gemini API using the official SDK, sending the context + the new message.
  * Saves both the user's message and the Gemini response to the `Message` collection.
  * Returns the markdown response.
* `DELETE /api/chat/sessions/:sessionId`
  * Deletes or archives the conversation session.

### 3. Gemini System Prompt & Persona Design
To make Gemini act like a highly qualified, professional lawyer, you must instantiate the model with strong **System Instructions**. Your system instructions must enforce:
* **Professional Persona:** Speak objectively, structured, and authoritatively.
* **Citation Rule:** When discussing a legal issue, explicitly look up and quote relevant Acts, Sections, and articles (e.g., *"Under Section 302 of the Indian Penal Code..."*).
* **Clear Formatting:** Structure responses using bold headers, bulleted lists, and step-by-step logic.
* **Legal Disclaimer (Critical):** Every consultation session must display or append a clear notice stating: *"I am an AI assistant, not a human lawyer. This represents general legal information, not formal attorney-client advice."*

---