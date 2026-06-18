import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getSkillsOptions, getSpecialityOptions } from '../lib/referenceCache.js';

/** Справочник навыков — только после успешной авторизации. */
export function useSkillsOptions(enabled = true) {
  const { ready, authenticated } = useAuth();
  const [skillsOptions, setSkillsOptions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !ready || !authenticated) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getSkillsOptions();
        if (!cancelled) setSkillsOptions(list);
      } catch (e) {
        if (!cancelled) {
          setSkillsOptions([]);
          setError(e.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, ready, authenticated]);

  return { skillsOptions, error, loading };
}

/** Справочник специальностей — только после успешной авторизации. */
export function useSpecialityOptions(enabled = true) {
  const { ready, authenticated } = useAuth();
  const [specialityOptions, setSpecialityOptions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !ready || !authenticated) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getSpecialityOptions();
        if (!cancelled) setSpecialityOptions(list);
      } catch (e) {
        if (!cancelled) {
          setSpecialityOptions([]);
          setError(e.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, ready, authenticated]);

  return { specialityOptions, error, loading };
}
