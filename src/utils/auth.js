export const decodeJwt = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding JWT token:', e);
    return null;
  }
};

export const getActiveUser = () => {
  const token = sessionStorage.getItem('token');
  const payload = decodeJwt(token);
  if (payload) {
    return {
      userId: payload.user_id || payload.id,
      name: payload.name || null,
      role: payload.role || null
    };
  }
  return null;
};
