// Chart.js defaults for dark mode
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';

// Initialize Node Distribution Chart
const nodeDistCtx = document.getElementById('nodeDistChart').getContext('2d');
const nodeDistChart = new Chart(nodeDistCtx, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Total Requests',
            data: [],
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            borderRadius: 4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true }
        }
    }
});

// Initialize Live Traffic Chart
const liveTrafficCtx = document.getElementById('liveTrafficChart').getContext('2d');
const liveTrafficChart = new Chart(liveTrafficCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Requests / 2 sec',
            data: [],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true }
        },
        animation: { duration: 0 } // Disable animation for smoother live updates
    }
});

let lastTotalRequests = 0;
let isHighLoad = false;

// Handle Load Toggle
const loadToggle = document.getElementById('load-toggle');
const modeText = document.getElementById('mode-text');

loadToggle.addEventListener('change', (e) => {
    isHighLoad = e.target.checked;
    modeText.textContent = isHighLoad ? 'High Load' : 'Normal Load';
    // Send request to server or nodes to change mode if needed
    // For this simple demo, we just set a global flag or could post to a /mode endpoint
    // We will let the nodes poll the server or we can just send an event. 
    // To keep it simple, we can fetch a /mode endpoint to set it, and nodes poll it.
    fetch('/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ high_load: isHighLoad })
    }).catch(console.error);
});

// Fetch Metrics periodically
async function fetchMetrics() {
    try {
        const response = await fetch('/metrics');
        const data = await response.json();
        updateDashboard(data);
    } catch (error) {
        console.error('Error fetching metrics:', error);
    }
}

function updateDashboard(data) {
    // 1. Update Metric Cards
    document.getElementById('total-requests').textContent = data.total_requests;
    
    const errorRatePercent = (data.error_rate * 100).toFixed(1);
    const errorRateEl = document.getElementById('error-rate');
    errorRateEl.textContent = `${errorRatePercent}%`;
    
    if (data.error_rate > 0.3) {
        errorRateEl.classList.add('danger');
        document.getElementById('alert-banner').classList.remove('hidden');
    } else {
        errorRateEl.classList.remove('danger');
        document.getElementById('alert-banner').classList.add('hidden');
    }
    
    document.getElementById('avg-response-time').textContent = `${Math.round(data.avg_response_time)} ms`;

    // 2. Update Node Distribution Chart
    const nodes = Object.keys(data.node_distribution);
    const nodeCounts = Object.values(data.node_distribution);
    
    nodeDistChart.data.labels = nodes;
    nodeDistChart.data.datasets[0].data = nodeCounts;
    nodeDistChart.update();

    // 3. Update Live Traffic Chart
    const currentRequests = data.total_requests;
    const requestsInInterval = currentRequests - lastTotalRequests;
    lastTotalRequests = currentRequests;

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    liveTrafficChart.data.labels.push(timeString);
    liveTrafficChart.data.datasets[0].data.push(requestsInInterval);
    
    // Keep only last 15 points
    if (liveTrafficChart.data.labels.length > 15) {
        liveTrafficChart.data.labels.shift();
        liveTrafficChart.data.datasets[0].data.shift();
    }
    liveTrafficChart.update();

    // 4. Update Node Status
    updateNodeStatus(data.node_last_seen, data.current_time);
}

function updateNodeStatus(nodeLastSeen, currentTime) {
    const nodesGrid = document.getElementById('nodes-grid');
    nodesGrid.innerHTML = ''; // Clear current
    
    const nodes = Object.keys(nodeLastSeen).sort();
    
    nodes.forEach(nodeId => {
        const lastSeen = nodeLastSeen[nodeId];
        const isOffline = (currentTime - lastSeen) > 5; // Offline if no logs for 5 sec
        
        const card = document.createElement('div');
        card.className = 'node-card';
        card.innerHTML = `
            <span class="node-name">Node ${nodeId}</span>
            <div class="status-indicator">
                <span class="status-dot ${isOffline ? 'offline' : 'online'}"></span>
                <span>${isOffline ? 'Offline' : 'Online'}</span>
            </div>
        `;
        nodesGrid.appendChild(card);
    });
}

// Start polling every 2 seconds
setInterval(fetchMetrics, 2000);
fetchMetrics(); // Initial fetch
