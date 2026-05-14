const COOKIE_NAME = 'streammindai_token';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 giorni

export function getToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${COOKIE_NAME}=`);
  if (parts.length === 2) return parts.pop().split(';').shift() || null;
  // Migrazione da localStorage se presente
  const legacy = localStorage.getItem(COOKIE_NAME);
  if (legacy) {
    setToken(legacy);
    localStorage.removeItem(COOKIE_NAME);
    return legacy;
  }
  return null;
}

export function setToken(token) {
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearToken() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  localStorage.removeItem(COOKIE_NAME);
}
