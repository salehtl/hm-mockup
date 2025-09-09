import { data } from './data.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      res.status(200).json(data.dcx || []);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to load data' });
  }
}
