# 🏅 Sports Chatbot – AI-Powered Conversational Assistant

<p align="center">
  <img src="docs/demo1.png"" alt="Chatbot Demo" width="45%" />
  <img src="docs/demo2.png"" alt="Chatbot UI" width="45%" />
</p>


An intelligent **AI chatbot** built for sports fans and analysts 🧠⚽.  
It leverages **LangChain**, **FAISS**, and **Groq LLM** to deliver **fast, context-aware answers** based on your custom sports data.  
Developed using a **FastAPI backend** and a **Next.js frontend** with a clean, responsive UI.

---

## 🌟 Key Features

### 🤖 Smart Sports Chatbot
- Conversational Q&A powered by **RAG (Retrieval-Augmented Generation)**
- Context-aware answers with document citations
- Streamed responses from **Groq LLM** for real-time interaction

### 📄 Knowledge from Your Data
- Upload sports-related documents (CSV, TXT, or PDFs)
- Automatically chunked and embedded in **FAISS vector store**
- Fast semantic similarity search and context retrieval

### 🎨 Modern Web Interface
- Sleek **Next.js + Tailwind CSS** design  
- Real-time chat bubbles with typing animations  
- Mobile-friendly and dark-mode optimized  

### ⚙️ High-Performance Backend
- **FastAPI** for async performance  
- **LangChain** integration for pipeline management  
- **FAISS** for lightweight local vector search  

---

## 🧠 Architecture Overview

```mermaid
graph TD
    A[Frontend (Next.js)] -->|Query| B(FastAPI Backend)
    B --> C{RAG Pipeline}
    C --> D[FAISS Vector DB]
    C --> E[Groq LLM API]
    E -->|Streamed Response| A
```

## 🚀 Quick Start

### 🔧 Requirements
- **Python** ≥ 3.9  
- **Node.js** ≥ 18  
- **Groq API Key**

---

 🧩 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/sports-chatbot.git
cd sports-chatbot
```
🧠 2. Backend Setup (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

🔐 Configure Environment Variables

Create a .env file inside the backend folder:

```bash
GROQ_API_KEY=your-groq-api-key
```

▶️ Run the Backend Server

```bash
uvicorn main:app --reload
```

💻 3. Frontend Setup (Next.js)

```bash
cd frontend
npm install
npm run dev
```

⚡ API Endpoints

| Endpoint  | Method   | Description                       |
| --------- | -------- | --------------------------------- |
| `/chat`   | **POST** | Send a question to the AI chatbot |
| `/health` | **GET**  | Health check                      |

🧱 Project Structure

```bash

sports-chatbot/
├── Backend/
│   ├── main.py               # FastAPI entry point
│   ├── sports_data/          # Uploaded sports documents
│   ├── vector_store/         # FAISS vector database
│   └── .env                  # Environment variables
│
├── Frontend/
│   ├── public/               # Public assets
│   ├── src/                  # Source code (pages, components, styles)
│   ├── .gitignore
│   ├── biome.json
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── package-lock.json
│   ├── package.json
│   └── postcss.config.mjs
│
├── docs/                     # Screenshots and documentation
├── .gitignore
├── README.md
└── requirements.txt
```
☁️ Environment Variables

| Variable            | Description                               |
| ------------------- | ----------------------------------------- |
| `GROQ_API_KEY`      | API key for Groq LLM                      |
| `MODEL_NAME`        | Groq model name (default: `mixtral-8x7b`) |
| `VECTOR_STORE_PATH` | FAISS index storage path                  |

🧠 Tech Stack

| Layer                | Technologies                 |
| -------------------- | ---------------------------- |
| **Frontend**         | Next.js, Tailwind CSS, Axios |
| **Backend**          | FastAPI, LangChain           |
| **Vector DB**        | FAISS                        |
| **LLM**              | Groq API                     |
| **Containerization** | Docker                       |
| **Version Control**  | Git + GitHub                 |





