/** Базовый URL API (без завершающего слэша). */
export const API_BASE = (
  import.meta.env.VITE_API_URL ?? 'https://api.singularity-resume.ru'
).replace(/\/$/, '');
