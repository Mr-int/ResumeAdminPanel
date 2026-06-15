import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import * as skillsApi from '../api/skills.js';
import * as specialitiesApi from '../api/specialities.js';
import { pageItems } from '../lib/pageable.js';

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
        const { data: skillsRes } = await skillsApi.filterSkills({}, 0, 500, ['id,asc']);
        if (!cancelled) setSkillsOptions(pageItems(skillsRes));
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
        const { data: specRes } = await specialitiesApi.filterSpecialities({}, 0, 500, ['id,asc']);
        if (!cancelled) setSpecialityOptions(pageItems(specRes));
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
