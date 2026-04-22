import { useState, useEffect } from 'react'
import { Activity, AlertTriangle, Clock, Server, Zap, ServerOff } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import './index.css'

function App() {
  const [metrics, setMetrics] = useState({
    total_requests: 0,
    error_rate: 0,
    avg_response_time: 0,
    node_distribution: {},
    node_last_seen: {},
    current_time: Date.now() / 1000
  })
  
  const [trafficHistory, setTrafficHistory] = useState([])
  const [isHighLoad, setIsHighLoad] = useState(false)
  const [lastTotal, setLastTotal] = useState(0)

  // Fetch initial mode
  useEffect(() => {
    fetch('/mode')
      .then(res => res.json())
      .then(data => setIsHighLoad(data.high_load))
      .catch(console.error)
  }, [])

  // Poll metrics
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/metrics')
        const data = await res.json()
        setMetrics(data)
        
        setTrafficHistory(prev => {
          const newReqs = data.total_requests - lastTotal
          setLastTotal(data.total_requests)
          
          const now = new Date()
          const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
          
          const newPoint = { time: timeLabel, reqs: Math.max(0, newReqs) }
          const next = [...prev, newPoint]
          return next.slice(-15) // keep last 15
        })
      } catch (error) {
        console.error("Error fetching metrics:", error)
      }
    }, 2000)
    
    return () => clearInterval(interval)
  }, [lastTotal])

  const toggleLoad = async () => {
    const newMode = !isHighLoad
    setIsHighLoad(newMode)
    try {
      await fetch('/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ high_load: newMode })
      })
    } catch (e) {
      console.error(e)
    }
  }

  const errorRatePercent = (metrics.error_rate * 100).toFixed(1)
  const isDanger = metrics.error_rate > 0.3

  // Format node distribution for Recharts
  const nodeDistData = Object.entries(metrics.node_distribution).map(([node, count]) => ({
    name: `Node ${node}`,
    requests: count
  }))

  const nodes = Object.keys(metrics.node_last_seen).sort()

  return (
    <div className="dashboard-container">
      {/* Dynamic Background Blurs */}
      <div className="bg-blur blur-blue" />
      <div className="bg-blur blur-emerald" />
      <div className="bg-blur blur-purple" />

      <div className="dashboard-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-titles">
            <h1>API Observability System</h1>
            <p><Activity size={16} className="icon-emerald" /> Real-time distributed metrics & fault detection</p>
          </div>
          
          <div className="controls">
            <span>Traffic Mode:</span>
            <button onClick={toggleLoad} className={`toggle-btn ${isHighLoad ? 'active' : ''}`}>
              <div className="toggle-slider" />
            </button>
            <span className={`mode-label ${isHighLoad ? 'text-rose' : 'text-emerald'}`}>
              {isHighLoad ? 'HIGH LOAD' : 'NORMAL'}
            </span>
          </div>
        </header>

        {/* Alert Banner */}
        <div className={`alert-banner ${isDanger ? 'visible' : ''}`}>
          <AlertTriangle size={24} className="icon-rose" />
          <span>Critical Error Rate Detected ({errorRatePercent}%)</span>
          <AlertTriangle size={24} className="icon-rose" />
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="glass-card metric-card hover-blue">
            <div className="metric-header">
              <h3>Total Requests</h3>
              <div className="icon-box bg-blue"><Server size={20} className="icon-blue" /></div>
            </div>
            <div className="metric-value">{metrics.total_requests.toLocaleString()}</div>
          </div>

          <div className={`glass-card metric-card transition-all ${isDanger ? 'danger-card' : 'hover-emerald'}`}>
            <div className="metric-header">
              <h3>Error Rate</h3>
              <div className={`icon-box ${isDanger ? 'bg-rose' : 'bg-emerald'}`}>
                {isDanger ? <ServerOff size={20} className="icon-rose" /> : <Activity size={20} className="icon-emerald" />}
              </div>
            </div>
            <div className={`metric-value ${isDanger ? 'text-rose' : ''}`}>
              {errorRatePercent}%
            </div>
          </div>

          <div className="glass-card metric-card hover-purple">
            <div className="metric-header">
              <h3>Avg Response</h3>
              <div className="icon-box bg-purple"><Clock size={20} className="icon-purple" /></div>
            </div>
            <div className="metric-value">{Math.round(metrics.avg_response_time)}<span className="unit">ms</span></div>
          </div>
        </div>

        {/* Charts & Nodes Grid */}
        <div className="main-grid">
          <div className="charts-column">
            
            <div className="glass-card chart-card">
              <div className="card-header">
                <Zap size={20} className="icon-amber" />
                <h2>Live Traffic (Requests / 2s)</h2>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficHistory}>
                    <defs>
                      <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" tick={{fill: '#64748b'}} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" tick={{fill: '#64748b'}} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Area type="monotone" dataKey="reqs" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReqs)" animationDuration={300} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card chart-card">
              <div className="card-header">
                <Server size={20} className="icon-blue" />
                <h2>Node Distribution</h2>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={nodeDistData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" tick={{fill: '#64748b'}} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#e2e8f0" fontWeight="bold" tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#3b82f6' }}
                    />
                    <Bar dataKey="requests" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={32} animationDuration={500} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          <div className="glass-card nodes-card">
            <div className="card-header">
              <Activity size={20} className="icon-purple" />
              <h2>Cluster Status</h2>
            </div>
            
            <div className="nodes-list">
              {nodes.map(nodeId => {
                const lastSeen = metrics.node_last_seen[nodeId]
                const isOffline = (metrics.current_time - lastSeen) > 5
                
                return (
                  <div key={nodeId} className="node-item">
                    <div className="node-info">
                      <div className={`node-icon ${isOffline ? 'bg-rose text-rose' : 'bg-emerald text-emerald'}`}>
                        {isOffline ? <ServerOff size={20} /> : <Server size={20} />}
                      </div>
                      <div>
                        <div className="node-name">Node {nodeId}</div>
                        <div className="node-desc">
                          {isOffline ? 'Connection lost' : 'Active and syncing'}
                        </div>
                      </div>
                    </div>
                    <div className="node-status">
                      <span className="status-ping-container">
                        {!isOffline && <span className="status-ping"></span>}
                        <span className={`status-dot ${isOffline ? 'bg-rose-solid' : 'bg-emerald-solid'}`}></span>
                      </span>
                      <span className={`status-text ${isOffline ? 'text-rose' : 'text-emerald'}`}>
                        {isOffline ? 'OFFLINE' : 'ONLINE'}
                      </span>
                    </div>
                  </div>
                )
              })}
              
              {nodes.length === 0 && (
                <div className="empty-nodes">
                  <ServerOff size={48} />
                  <p>Waiting for nodes to connect...</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}

export default App
