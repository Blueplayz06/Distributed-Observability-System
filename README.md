# Distributed API Observability & Monitoring System

A client-server based distributed system that collects API logs from multiple nodes, processes them centrally in real-time, and provides advanced monitoring, analytics, and fault detection through a premium interactive web dashboard.

## 🧠 Core Concept
This project simulates a distributed architecture where:
1. **Multiple client nodes** generate API traffic logs with varying behaviors (delays, error rates).
2. **Logs are sent to a central server** (aggregator) via HTTP POST.
3. **The server processes the logs** and computes real-time metrics (total requests, error rates, average response times).
4. **A dynamic React dashboard** visualizes these metrics, live traffic patterns, and detects node faults or systemic anomalies.

## 🧩 Architecture & Tech Stack

- **Backend / Aggregator Server**: Built with **FastAPI** (Python). Handles log ingestion and computes metrics in-memory for lightning-fast reads.
- **Client Nodes**: Simulated using Python threading and `requests`. Simulates a fast, reliable node (Node A) and a slow, error-prone node (Node B).
- **Frontend Dashboard**: Built with **React** and **Vite**. 
  - Styled with custom CSS for a modern, glassmorphic aesthetic.
  - Uses **Recharts** for fluid, animated data visualization.
  - Uses **Lucide-React** for premium iconography.

## 🔥 Key Features

- **Node Behavior Variation**: Different nodes exhibit different traffic patterns and reliability metrics.
- **Dynamic Load Control**: Toggle "High Load" mode from the UI to instantly increase node traffic and error probabilities.
- **Real-Time Anomaly Alerts**: The UI actively monitors the error rate and triggers a critical visual alert if the cluster error rate exceeds 30%.
- **Automatic Fault Detection**: The server tracks node heartbeats. If a node fails to send logs for 5 seconds, the dashboard automatically marks the node as **OFFLINE**.
- **Live Traffic Visualizations**: Real-time line and bar charts tracking requests-per-second and node distribution.

## ⚙️ How to Run Locally

You will need **Python 3.8+** and **Node.js** installed.

### 1. Install Dependencies
First, install the backend requirements:
```bash
pip install -r requirements.txt
```
*(Note: The React frontend is pre-built into the `frontend/dist` folder, so you don't need to run `npm install` unless you plan to edit the React code).*

### 2. Start the Aggregator Server
Open a terminal and start the server:
```bash
python run_server.py
```
*The server will start on `http://0.0.0.0:8000` and automatically serve the React dashboard.*

### 3. Start the Client Nodes
Open a **second** terminal in the same directory and start the nodes:
```bash
python main.py
```
*This starts Node A and Node B, which will immediately begin sending logs to the server.*

### 4. View the Dashboard
Open your browser and navigate to:
**[http://localhost:8000](http://localhost:8000)**

## 🎯 Demo Guide

1. **Observe Normal Traffic**: Notice the steady stream of requests on the area chart and the low error rate.
2. **Trigger High Load**: Click the `Traffic Mode` toggle in the top right. Watch the traffic spike and the error rate climb.
3. **Trigger Anomaly Alert**: As the error rate surpasses 30% under high load, a pulsing critical alert banner will appear.
4. **Simulate Node Failure**: Go to the terminal running the nodes (`python main.py`) and stop the process (`Ctrl+C`). Watch the dashboard detect the heartbeat failure and mark the nodes as offline after 5 seconds.

---
