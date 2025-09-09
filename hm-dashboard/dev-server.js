import express from 'express';
import cors from 'cors';
import { data } from './api/data.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// API endpoints
app.get('/api/entities', (req, res) => res.json(data.entities || []));
app.get('/api/services', (req, res) => res.json(data.services || []));
app.get('/api/channels', (req, res) => res.json(data.channels || []));
app.get('/api/serviceReviews', (req, res) => res.json(data.serviceReviews || []));
app.get('/api/channelRatings', (req, res) => res.json(data.channelRatings || []));
app.get('/api/dcxReviews', (req, res) => res.json(data.dcxReviews || []));
app.get('/api/booths', (req, res) => res.json(data.booths || []));
app.get('/api/serviceChannels', (req, res) => res.json(data.serviceChannels || []));
app.get('/api/dcx', (req, res) => res.json(data.dcx || []));

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /api/entities');
  console.log('- GET /api/services'); 
  console.log('- GET /api/channels');
  console.log('- GET /api/serviceReviews');
  console.log('- GET /api/channelRatings');
  console.log('- GET /api/dcxReviews');
  console.log('- GET /api/booths');
  console.log('- GET /api/serviceChannels');
  console.log('- GET /api/dcx');
});