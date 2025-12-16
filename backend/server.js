const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const NodeCache = require('node-cache');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 FIXED: Remove deprecated options
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.error('❌ MongoDB Error:', err));

const JobSchema = new mongoose.Schema({
  job_title: String,
  company_name: String,
  location: String,
  lat: Number,
  lng: Number,
  salary_string: String,
  job_weight: Number,
});

const Job = mongoose.model('Job', JobSchema);

app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find();
    const heatReady = jobs.map(job => ({
      title: job.job_title,
      company: job.company_name,
      location: job.location,
      lat: job.lat,
      lng: job.lng,
      salary: job.salary_string,
      weight: job.job_weight || 1,
    }));
    res.json(heatReady);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load jobs' });
  }
});


app.listen(process.env.PORT || 5000, () => {
  console.log('🔥 Backend: http://localhost:5000/api/jobs');
});
