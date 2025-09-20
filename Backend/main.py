import os
import glob
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from langchain_community.document_loaders import PDFPlumberLoader, WebBaseLoader
from langchain_ollama import OllamaEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_groq import ChatGroq
from langchain.schema import StrOutputParser

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


def create_vector_store(split_docs):
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    return FAISS.from_documents(split_docs, embeddings)

def create_qa_chain():
    documents = load_pdf_and_web_data()
    split_docs = split_documents(documents)
    vector_store = create_vector_store(split_docs)

    retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 3})
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.7, max_tokens=1500)
    

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True
    )
    return qa_chain


qa_chain = create_qa_chain()


@app.post("/chat")
async def chat_endpoint(query: Query):
    response = qa_chain({"query": query.query})

    parser = StrOutputParser()
    answer = parser.parse(response['result'])

    sources = [doc.metadata.get("source") for doc in response['source_documents']]
    
    return {
        "answer": answer,
        "sources": sources
    }
