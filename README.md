🏅 Sports Chatbot – AI-Powered Conversational Assistant
<img width="1902" height="986" alt="Screenshot 2025-10-04 134141" src="https://github.com/user-attachments/assets/7a681d8a-e22e-4bd9-a9ab-ac1ba1c60514" />
<img width="1901" height="984" alt="Screenshot 2025-10-04 134347" src="https://github.com/user-attachments/assets/610ba0a6-4795-41d3-b79b-d7e51a05b5a8" />
An intelligent AI chatbot built for sports fans and analysts 🧠⚽.
It leverages LangChain, FAISS, and Groq LLM to deliver fast, context-aware answers based on your custom sports data.
Developed using a FastAPI backend and a Next.js frontend with a clean, responsive UI.

🌟 Key Features
🤖 Smart Sports Chatbot

Conversational Q&A powered by RAG (Retrieval-Augmented Generation)

Context-aware answers with document citations

Streamed responses from Groq LLM for real-time interaction

📄 Knowledge from Your Data

Upload sports-related documents (CSV, TXT, or PDFs)

Automatically chunked and embedded in FAISS vector store

Fast semantic similarity search and context retrieval

🎨 Modern Web Interface

Sleek Next.js + Tailwind CSS design

Real-time chat bubbles with typing animations

Mobile-friendly and dark-mode optimized

⚙️ High-Performance Backend

FastAPI for async performance

LangChain integration for pipeline management

FAISS for lightweight local vector search

🧠 Architecture Overview

graph TD
A[Frontend (Next.js)] -->|Query| B(FastAPI Backend)
B --> C{RAG Pipeline}
C --> D[FAISS Vector DB]
C --> E[Groq LLM API]
E -->|Streamed Response| A

🚀 Quick Start

🔧 Requirements

Python ≥ 3.9

Node.js ≥ 18

Groq API key



