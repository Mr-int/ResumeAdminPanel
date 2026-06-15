import * as recruitersApi from '../api/recruiters.js';
import { pageItems } from '../lib/pageable.js';

let directoryPromise = null;

/** Один запрос — справочник рекрутёров по id (кэш на сессию). */
export function getRecruiterDirectory() {
  if (!directoryPromise) {
    directoryPromise = recruitersApi
      .filterRecruiters({}, 0, 500)
      .then(({ data }) => {
        const byId = {};
        for (const recruiter of pageItems(data)) {
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
