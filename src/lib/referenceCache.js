import * as skillsApi from '../api/skills.js';
import * as specialitiesApi from '../api/specialities.js';
import * as companiesApi from '../api/companies.js';
import { pageItems } from '../lib/pageable.js';

const caches = {
  skills: null,
  specialities: null,
  companies: null,
};

function loadOnce(key, fetcher) {
  if (!caches[key]) {
    caches[key] = fetcher().catch((err) => {
      caches[key] = null;
      throw err;
    });
  }
  return caches[key];
}

export function getSkillsOptions() {
  return loadOnce('skills', () =>
    skillsApi.filterSkills({}, 0, 500, ['id,asc']).then(({ data }) => pageItems(data))
  );
}

export function getSpecialityOptions() {
  return loadOnce('specialities', () =>
    specialitiesApi.filterSpecialities({}, 0, 500, ['id,asc']).then(({ data }) => pageItems(data))
  );
}

export function getCompaniesOptions() {
  return loadOnce('companies', () =>
    companiesApi.filterCompanies({}, 0, 500, ['id,asc']).then(({ data }) => pageItems(data))
  );
}

export function resetReferenceCache() {
  caches.skills = null;
  caches.specialities = null;
  caches.companies = null;
}
