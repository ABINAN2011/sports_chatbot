import os
import glob
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from langchain_community.document_loaders import PDFPlumberLoader, WebBaseLoader
from langchain_ollama import OllamaEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain.schema import StrOutputParser

import asyncio


load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")
os.environ["USER_AGENT"] = os.getenv("USER_AGENT", "SportsChatbot/1.0")


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    query: str


def load_pdf_and_web_data():
    urls = [
        "https://en.wikipedia.org/wiki/History_of_cricket",
        "https://en.wikipedia.org/wiki/History_of_association_football",
        "https://en.wikipedia.org/wiki/History_of_basketball",
        "https://en.wikipedia.org/wiki/History_of_the_Olympic_Games",
        "https://en.wikipedia.org/wiki/Cricket_World_Cup",
        "https://en.wikipedia.org/wiki/FIFA_World_Cup",
        "https://en.wikipedia.org/wiki/Cricket",
        "https://en.wikipedia.org/wiki/Men%27s_T20_World_Cup",
        "https://en.wikipedia.org/wiki/Test_cricket",
        "https://en.wikipedia.org/wiki/Football",
        "https://en.wikipedia.org/wiki/Football_player",
        "https://en.wikipedia.org/wiki/Basketball",
        "https://en.wikipedia.org/wiki/FIFA",
        "https://en.wikipedia.org/wiki/FIFA_Club_World_Cup",
        "https://en.wikipedia.org/wiki/Women%27s_cricket",
        "https://en.wikipedia.org/wiki/History_of_women%27s_football",
        "https://en.wikipedia.org/wiki/Olympic_Games",
        "https://en.wikipedia.org/wiki/NBA_G_League",
        "https://en.wikipedia.org/wiki/UEFA_Champions_League",
        "https://en.wikipedia.org/wiki/UEFA_Europa_League",
        "https://en.wikipedia.org/wiki/UEFA_Europa_Conference_League",
        "https://en.wikipedia.org/wiki/UEFA_Super_Cup",
        "https://en.wikipedia.org/wiki/English_Football_League",
        "https://en.wikipedia.org/wiki/Premier_League",
        "https://en.wikipedia.org/wiki/La_Liga",
        "https://en.wikipedia.org/wiki/Serie_A",
        "https://en.wikipedia.org/wiki/Bundesliga",
        "https://en.wikipedia.org/wiki/Ligue_1",
        "https://en.wikipedia.org/wiki/NBA",
        "https://en.wikipedia.org/wiki/WNBA",
        "https://en.wikipedia.org/wiki/EuroLeague",
        "https://en.wikipedia.org/wiki/NCAA_Basketball Tournament",
        "https://en.wikipedia.org/wiki/History_of_the_FIFA_Women%27s_World_Cup",
        "https://en.wikipedia.org/wiki/FIFA_Women%27s_World_Cup",
        "https://en.wikipedia.org/wiki/Women%27s_Basketball_Association",   
        "https://en.wikipedia.org/wiki/Asia_Cup",
        "https://en.wikipedia.org/wiki/Player_of_the_Match_awards_(cricket)"
        "https://en.wikipedia.org/wiki/ICC_Men%27s_T20_World_Cup",
        "https://en.wikipedia.org/wiki/ICC_Women%27s_T20_World_Cup",
        "https://en.wikipedia.org/wiki/Indian_Premier_League",
        "https://en.wikipedia.org/wiki/British_Broadcasting_Corporation",
        "https://en.wikipedia.org/wiki/ESPN",
        "https://en.wikipedia.org/wiki/Sky_Sports",
        "https://en.wikipedia.org/wiki/Badminton",
        "https://en.wikipedia.org/wiki/Tennis",
        "https://en.wikipedia.org/wiki/Golf",
        "https://en.wikipedia.org/wiki/Rugby_union",
        "https://en.wikipedia.org/wiki/2025_Indian_Premier_League",
        "https://freakcricket.com/ipl",
        "https://en.wikipedia.org/wiki/List_of_Indian_Premier_League_seasons_and_results",
    ]

    web_loader = WebBaseLoader(
        urls,
        header_template={"User-Agent": "SportsChatbot/1.0 (contact: k.abinan20@gmail.com)"}
    )
    web_data = web_loader.load()

    pdf_files = glob.glob("sports_data/*.pdf")
    pdf_data = []
    for pdf_file in pdf_files:
        loader = PDFPlumberLoader(pdf_file)
        pdf_data.extend(loader.load())

    return web_data + pdf_data


def split_documents(documents):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=500)
    return text_splitter.split_documents(documents)

def create_or_load_vector_store(split_docs, persist_dir="vector_store"):
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    if os.path.exists(persist_dir):
        return FAISS.load_local(persist_dir, embeddings, allow_dangerous_deserialization=True)

    vector_store = FAISS.from_documents(split_docs, embeddings)
    vector_store.save_local(persist_dir)
    return vector_store

def create_qa_chain():
    documents = load_pdf_and_web_data()
    split_docs = split_documents(documents)
    vector_store = create_or_load_vector_store(split_docs)

    retriever = vector_store.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 5, "fetch_k": 10}
    )

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.7,
        max_tokens=1500,
        streaming=True  
    )

    prompt = PromptTemplate(
        template="""You are a knowledgeable sports assistant. 
Answer the following question clearly and concisely. 
If you use sources, mention them briefly.

Question: {question}
Context: {context}
Answer:""",
        input_variables=["question", "context"],
    )

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        chain_type_kwargs={"prompt": prompt},
        return_source_documents=True,
    )
    return qa_chain


qa_chain = create_qa_chain()


@app.post("/chat/stream")
async def chat_stream(query: Query):
    response = qa_chain({"query": query.query}, return_only_outputs=False)

    async def event_generator():
        parser = StrOutputParser()
        for chunk in response:
            if "result" in chunk:
                yield parser.parse(chunk["result"])

    return StreamingResponse(event_generator(), media_type="text/plain")


@app.post("/chat")
async def chat_endpoint(query: Query):
    response = qa_chain({"query": query.query})

    parser = StrOutputParser()
    answer = parser.parse(response["result"])

    

    return {
        "answer": answer,
    }
