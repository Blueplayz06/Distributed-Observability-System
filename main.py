from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import time
import random
import threading
import requests
import sys
from typing import Dict, List, Any
from pydantic import BaseModel

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount React static files
app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

class LogEntry(BaseModel):
    node_id: str
    response_time: int
    error: bool

# In-memory storage
logs: List[Dict[str, Any]] = []
node_last_seen: Dict[str, float] = {}

class Mode(BaseModel):
    high_load: bool

current_mode = {"high_load": False}

@app.get("/", response_class=HTMLResponse)
async def get_index():
    with open("frontend/dist/index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.post("/mode")
async def set_mode(mode: Mode):
    current_mode["high_load"] = mode.high_load
    return {"status": "success", "mode": current_mode}

@app.get("/mode")
async def get_mode():
    return current_mode

@app.post("/log")
async def receive_log(log: LogEntry):
    current_time = time.time()
    logs.append({
        "node_id": log.node_id,
        "response_time": log.response_time,
        "error": log.error,
        "timestamp": current_time
    })
    node_last_seen[log.node_id] = current_time
    return {"status": "success"}

@app.get("/metrics")
async def get_metrics():
    # Only keep logs from the last 60 seconds to avoid unbounded memory growth? 
    # The requirement doesn't explicitly state to clear logs, but total_requests could just grow. Let's let it grow.
    total_requests = len(logs)
    error_count = sum(1 for log in logs if log["error"])
    error_rate = (error_count / total_requests) if total_requests > 0 else 0
    
    total_response_time = sum(log["response_time"] for log in logs)
    avg_response_time = (total_response_time / total_requests) if total_requests > 0 else 0
    
    node_distribution = {}
    for log in logs:
        node_id = log["node_id"]
        node_distribution[node_id] = node_distribution.get(node_id, 0) + 1
        
    return {
        "total_requests": total_requests,
        "error_rate": error_rate,
        "avg_response_time": avg_response_time,
        "node_distribution": node_distribution,
        "node_last_seen": node_last_seen,
        "current_time": time.time()
    }

SERVER_URL = "http://localhost:8000"

def get_node_mode():
    try:
        resp = requests.get(f"{SERVER_URL}/mode", timeout=2)
        if resp.status_code == 200:
            return resp.json().get("high_load", False)
    except Exception:
        pass
    return False

def node_worker(node_id, base_delay, error_prob):
    print(f"Started Node {node_id} (Base Delay: {base_delay}s, Error Rate: {error_prob*100}%)")
    while True:
        is_high_load = get_node_mode()
        
        delay = base_delay / 5 if is_high_load else base_delay
        current_error_prob = error_prob * 2 if is_high_load else error_prob
        
        response_time = int(random.gauss(150, 50))
        if response_time < 20:
            response_time = 20
            
        error = random.random() < current_error_prob
        
        log_entry = {
            "node_id": node_id,
            "response_time": response_time,
            "error": error
        }
        
        try:
            requests.post(f"{SERVER_URL}/log", json=log_entry, timeout=2)
        except Exception:
            pass
            
        jitter = random.uniform(-0.1, 0.1) * delay
        time.sleep(max(0.1, delay + jitter))

if __name__ == "__main__":
    print("Starting Distributed Nodes from main.py...")
    thread_a = threading.Thread(target=node_worker, args=("A", 0.5, 0.02), daemon=True)
    thread_a.start()
    
    thread_b = threading.Thread(target=node_worker, args=("B", 1.5, 0.15), daemon=True)
    thread_b.start()
    
    print("Nodes are running. Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down nodes.")
        sys.exit(0)
