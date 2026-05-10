import jwt from 'jsonwebtoken';

/**
 * Verifica il JWT Bearer nella richiesta e popola req.user con il payload.
 * Esporta sia `authenticateToken` (nome richiesto) che `requireAuth` (alias).
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mancante' });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token non valido o scaduto' });
  }
}

// Alias per le route già esistenti
export const requireAuth = authenticateToken;
