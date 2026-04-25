from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from scraper import transform_code_to_link, get_subject
import requests
from pydantic import BaseModel

app = FastAPI()

class InputData(BaseModel):
    code: str
    semester: int

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # povolený frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/run-script")
def run_script(data: InputData):
    predecessors = {}

    link = transform_code_to_link(data.code)

    response = requests.get(f"https://is.muni.cz" + link)
    if response.status_code == 200:
        html = response.text
        return get_subject(html, data.code, data.semester, predecessors)
    else:
        print("Failed to fetch page:", response.status_code)