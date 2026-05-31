// In development:
//   VITE_API_URL is not set → API_BASE = '' → fetch('/api/rooms') works via Vite proxy
//   VITE_SOCKET_URL is not set → SOCKET_URL = '' → io(undefined) connects to same origin
//
// In production on Render:
//   VITE_API_URL = 'https://coderoom-server.onrender.com'
//   VITE_SOCKET_URL = 'https://coderoom-server.onrender.com'
//   These get baked into the built JS at build time by Vite

export const API_BASE   = import.meta.env.VITE_API_URL    || '';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';