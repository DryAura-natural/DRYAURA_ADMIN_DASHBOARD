// lib/cors.js
export default function cors(req, res, next) {
      res.setHeader('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_FRONTEND_URL 
  ? new URL(process.env.NEXT_PUBLIC_FRONTEND_URL).origin 
  : '*'); // Allow all origins
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Allow specific methods
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allow specific headers
    
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }
    
      next();
    }

