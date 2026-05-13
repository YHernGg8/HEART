import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// In-memory cache
const cache = new Map<string, { data: any, expiry: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// In-memory rate limiter per IP
const rateLimits = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_WINDOW = 1000 * 60; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 60;

// Middleware: Require Authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Bearer token required' });
    return;
  }
  // In a production app using Firebase:
  // const token = authHeader.split('Bearer ')[1];
  // const decodedToken = await getAuth().verifyIdToken(token);
  // req.user = decodedToken;
  next();
}

// Middleware: Rate Limiter
function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  const limitData = rateLimits.get(ip)!;
  if (now > limitData.resetTime) {
    limitData.count = 1;
    limitData.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }

  if (limitData.count >= MAX_REQUESTS_PER_MINUTE) {
    res.status(429).json({ error: 'Too Many Requests: Quota exceeded' });
    return;
  }

  limitData.count += 1;
  next();
}

// Cache Helpers
function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

// Apply Middlewares to all /api/maps routes
router.use(requireAuth);
router.use(rateLimiter);

// 1. Geocoding Endpoint
router.post('/geocode', async (req: Request, res: Response) => {
  try {
    const { address } = req.body;
    if (!address || typeof address !== 'string') {
      res.status(400).json({ error: 'Valid address string is required' });
      return;
    }

    const cacheKey = `geocode_${address.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Server misconfiguration: Google Maps API key missing' });
      return;
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error(`[Maps API Error] Geocode: ${data.status} - ${data.error_message || ''}`);
      const status = data.status === 'OVER_QUERY_LIMIT' ? 429 : 400;
      res.status(status).json({ error: 'Failed to geocode address', details: data.status });
      return;
    }

    const result = data.results[0];
    const output = {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted_address: result.formatted_address,
      place_id: result.place_id,
    };

    setCache(cacheKey, output);
    res.json(output);
  } catch (error: any) {
    console.error(`[Maps API Error] Geocode exception: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Reverse Geocoding Endpoint
router.post('/reverse-geocode', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      res.status(400).json({ error: 'Valid lat and lng numbers are required' });
      return;
    }

    const cacheKey = `rev_geocode_${lat}_${lng}`;
    const cached = getCached(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Server misconfiguration: Google Maps API key missing' });
      return;
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error(`[Maps API Error] Reverse Geocode: ${data.status} - ${data.error_message || ''}`);
      const status = data.status === 'OVER_QUERY_LIMIT' ? 429 : 400;
      res.status(status).json({ error: 'Failed to reverse geocode', details: data.status });
      return;
    }

    const result = data.results[0];
    const output = {
      formatted_address: result.formatted_address,
      place_id: result.place_id,
      lat,
      lng
    };

    setCache(cacheKey, output);
    res.json(output);
  } catch (error: any) {
    console.error(`[Maps API Error] Reverse Geocode exception: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Places Search Endpoint
router.get('/places', async (req: Request, res: Response) => {
  try {
    const { query, lat, lng } = req.query;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query parameter is required' });
      return;
    }

    const cacheKey = `places_${query}_${lat}_${lng}`;
    const cached = getCached(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Server misconfiguration: Google Maps API key missing' });
      return;
    }

    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    if (lat && lng) {
      url += `&location=${lat},${lng}&radius=50000`; // Search within 50km
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error(`[Maps API Error] Places Search: ${data.status} - ${data.error_message || ''}`);
      const status = data.status === 'OVER_QUERY_LIMIT' ? 429 : 400;
      res.status(status).json({ error: 'Failed to search places', details: data.status });
      return;
    }

    const output = (data.results || []).map((place: any) => ({
      name: place.name,
      address: place.formatted_address,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      place_id: place.place_id,
      rating: place.rating
    }));

    setCache(cacheKey, output);
    res.json(output);
  } catch (error: any) {
    console.error(`[Maps API Error] Places Search exception: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Distance/Duration Matrix Endpoint
router.post('/distance', async (req: Request, res: Response) => {
  try {
    const { origins, destinations, mode = 'driving' } = req.body;
    if (!origins || !destinations || !Array.isArray(origins) || !Array.isArray(destinations)) {
      res.status(400).json({ error: 'origins and destinations arrays are required' });
      return;
    }

    const cacheKey = `distance_${JSON.stringify(origins)}_${JSON.stringify(destinations)}_${mode}`;
    const cached = getCached(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Server misconfiguration: Google Maps API key missing' });
      return;
    }

    const originsStr = origins.map(o => encodeURIComponent(o)).join('|');
    const destinationsStr = destinations.map(d => encodeURIComponent(d)).join('|');
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&mode=${mode}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error(`[Maps API Error] Distance Matrix: ${data.status} - ${data.error_message || ''}`);
      const status = data.status === 'OVER_QUERY_LIMIT' ? 429 : 400;
      res.status(status).json({ error: 'Failed to calculate distance', details: data.status });
      return;
    }

    setCache(cacheKey, data);
    res.json(data);
  } catch (error: any) {
    console.error(`[Maps API Error] Distance Matrix exception: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
