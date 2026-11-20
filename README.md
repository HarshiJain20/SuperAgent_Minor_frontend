## 🌟 Features

- **Advanced RAG Pipeline:** Utilizes ChromaDB for high-performance vector storage and context retrieval.
- **Complex Document Parsing:** Integrates the Unstructured library to extract clean, usable data from complex PDFs.
- **Tool Integration (MCP):** Uses Composio to implement the Model Context Protocol, giving the AI agent the ability to securely interact with external APIs and services.
- **Full-Stack Architecture:** Clean separation between the Python-based AI backend and the interactive user interface.
- **Conversation Memory:** Exact chat history is persisted by the backend in Supabase/Postgres. ChromaDB remains reserved for the existing RAG/PDF knowledge base.

---

## 🛠️ Tech Stack

- **Core AI:** Large Language Models (OpenAI, Gemini, or local alternatives)
- **Backend:** Python, ChromaDB, Composio, Unstructured
- **Frontend:** React / Next.js, Tailwind CSS (Adjust based on your specific framework)
- **Architecture:** Model Context Protocol (MCP), Retrieval-Augmented Generation (RAG)

---

## 🚀 Quick Start

To run this project on your local machine, you will need to set up both the backend server and the frontend client.

---

### 1️⃣ Frontend Setup

Navigate to the frontend directory and install dependencies.

```bash
# Clone the repo and navigate to the backend
git clone https://github.com/ACM-PDEU-Student-Chapter/superagent.git

cd superagent

npm i

npm run dev

### Supabase setup

Copy `.env.example` to `.env.local` and add the Supabase project URL and anon key.
In Supabase Auth, enable email/password sign-up and email confirmation. Then run
`SuperAgent_Minor_backend/supabase/migrations/001_chat_history.sql` once in the
Supabase SQL Editor. Database migrations live in the backend repository; this
frontend only contains the Supabase client and UI.
