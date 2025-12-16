import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import './App.css';

function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    const heat = L.heatLayer(points, {
      radius: 30,
      blur: 20,
      maxZoom: 8,
      max: 1.5,
      minOpacity: 0.2,
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
}

function App() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/jobs')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setJobs(data);
        setLoading(false);

        const cityStats = {};
        data.forEach((job) => {
          if (job.location) {
            cityStats[job.location] = (cityStats[job.location] || 0) + 1;
          }
        });

        const arr = Object.entries(cityStats)
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count);

        setStats(arr);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const heatPoints = jobs
    .filter((j) => j.lat && j.lng)
    .map((j) => [j.lat, j.lng, j.weight || 1]);

  if (loading) {
    return (
      <div className="loading">
        <h1>🔴 CSE Job Heatmap LIVE [Day 1]</h1>
        <p>Loading CSE Jobs...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {/* HEADER */}
      <header className="app-header">
        <div className="app-title-row">
          <span className="live-dot" />
          <h1>CSE Job Heatmap LIVE [Day 1]</h1>
        </div>
        <p className="app-subtitle">
          {jobs.length} Jobs Mapped · Top: {stats[0]?.city} ({stats[0]?.count || 0}🔥)
        </p>
      </header>

      {/* MAIN CONTENT */}
      <main className="app-main">
        {/* MAP CARD */}
        <section className="card card-map">
          <h2 className="card-title">India Job Heatmap</h2>
          <div className="map-container">
            <MapContainer
              center={[21.5, 78.5]}
              zoom={5.2}
              style={{ height: '360px', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <HeatmapLayer points={heatPoints} />
            </MapContainer>
          </div>
        </section>

        {/* STATS + LATEST JOBS CARD */}
        <section className="card card-stats">
          <h2 className="card-title">Top Cities</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.slice(0, 7)}>
                <XAxis dataKey="city" angle={-30} textAnchor="end" height={60} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#ff4b5c" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="latest-wrapper">
            <h3 className="section-label">Latest Jobs</h3>
            <div className="latest-list">
              {jobs.slice(0, 5).map((job, i) => {
                const title = (job.title || 'Untitled').replace(/\s+/g, ' ').trim();
                const company = (job.company || 'Unknown').trim();
                const loc = (job.location || 'India').trim();
                const salary =
                  job.salary && job.salary !== 'NaN' ? job.salary : '';

                return (
                  <div key={i} className="job-chip">
                    <div className="job-chip-main">
                      <span className="job-title">
                        {title.slice(0, 32)}
                        {title.length > 32 ? '…' : ''}
                      </span>
                      <span className="job-company">
                        {company} · {loc}
                      </span>
                    </div>
                    {salary && <span className="job-salary">{salary}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="app-footer">
        <a
          href="http://localhost:5000/api/jobs"
          target="_blank"
          rel="noreferrer"
          className="footer-link"
        >
          📊 Raw Data API ({jobs.length} jobs)
        </a>
        <span>CSE Live Builds · Day 1</span>
      </footer>
    </div>
  );
}

export default App;
