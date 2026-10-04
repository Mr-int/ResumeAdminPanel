import { fetchAllRecruiters } from '../api/recruiters.js';

let directoryPromise = null;

/** Один запрос — справочник рекрутёров по id (кэш на сессию). */
export function getRecruiterDirectory() {
  if (!directoryPromise) {
    directoryPromise = fetchAllRecruiters({})
      .then((recruiters) => {
        const byId = {};
        for (const recruiter of recruiters) {
          if (recruiter?.id) byId[recruiter.id] = recruiter;
        }
        return byId;
      })
      .catch((err) => {
        directoryPromise = null;
        throw err;
      });
  }
  return directoryPromise;
}

export function resetRecruiterDirectory() {
  directoryPromise = null;
}
