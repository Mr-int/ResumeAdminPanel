import { useEffect, useState } from 'react';
import * as studentsAdminApi from '../api/studentsAdmin.js';
import { getEducation } from '../api/education.js';
import { COURSE_LABELS, labelOf } from '../lib/labels.js';

const BUSYNESS_LABELS = {
  FREE: 'Свободен',
  FREELANCE: 'Парт-тайм',
  EMPLOYED: 'Фулл-тайм',
  PROJECT_WORK: 'Проектная работа',
};

const JOB_SEARCH_LABELS = {
  LOOKING: 'Ищет работу',
  CONSIDERING: 'Рассматривает предложения',
  NOT_LOOKING: 'Не ищет',
};

const GENDER_LABELS = {
  MALE: 'Мужской',
  FEMALE: 'Женский',
};

const EXPERIENCE_TYPE_LABELS = {
  WORK: 'Работа',
  PROJECT: 'Проект',
};

const EDUCATION_TYPE_LABELS = {
  STATE: 'Вуз',
  COURSE: 'Курс',
};

const CARD_FIELDS = [
  ['city', 'Город'],
  ['hhLink', 'Ссылка'],
  ['birthDate', 'Дата рождения'],
  ['bio', 'Описание'],
  ['course', 'Курс', COURSE_LABELS],
  ['busyness', 'Занятость', BUSYNESS_LABELS],
  ['desiredBusyness', 'Желаемый формат', BUSYNESS_LABELS],
  ['jobSearchStatus', 'Статус поиска', JOB_SEARCH_LABELS],
  ['firstName', 'Имя'],
  ['lastName', 'Фамилия'],
  ['middleName', 'Отчество'],
  ['gender', 'Пол', GENDER_LABELS],
  ['email', 'Почта'],
  ['phoneNumber', 'Телефон'],
  ['telegramUsername', 'Telegram'],
  ['speciality', 'Специальность'],
];

const VERSION_STATUS = {
  APPROVED: 'одобрена',
  DRAFT: 'ждёт',
  REJECTED: 'отклонена',
};

function blank(value) {
  return value == null || String(value).trim() === '';
}

function show(value, labels) {
  if (blank(value)) return 'нет';
  if (labels) return labelOf(labels, value, String(value));
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'нет';
  return String(value);
}

function same(left, right) {
  return String(left ?? '') === String(right ?? '');
}

function skillNames(skills) {
  return (skills ?? []).map((item) => item?.name).filter(Boolean);
}

function skillChange(catalogSkills, draftSkills) {
  const catalog = new Set(skillNames(catalogSkills));
  const draft = new Set(skillNames(draftSkills));
  const added = [...draft].filter((name) => !catalog.has(name));
  const removed = [...catalog].filter((name) => !draft.has(name));
  if (!added.length && !removed.length) return null;
  return [
    removed.length ? `убран ${removed.join(', ')}` : 'нет',
    added.length ? `добавлен ${added.join(', ')}` : 'нет',
  ];
}

function nested(item, key) {
  const inner = item?.[key];
  return inner && typeof inner === 'object' ? inner : item ?? {};
}

function recordId(item, key) {
  const inner = nested(item, key);
  const id = key === 'portfolio' ? item?.id : inner.id ?? item?.id;
  return id == null ? null : String(id);
}

function companyTitle(companyId, companies) {
  if (companyId == null || companyId === '' || Number(companyId) === 0) return '';
  const found = (companies ?? []).find((item) => String(item.id) === String(companyId));
  return found?.name || '';
}

function schoolTitle(educationId, schools) {
  if (educationId == null || educationId === '' || Number(educationId) === 0) return '';
  return schools?.get(String(educationId)) || '';
}

function years(start, end) {
  if (blank(start) && blank(end)) return '';
  return `${blank(start) ? '…' : start}–${blank(end) ? '…' : end}`;
}

function experienceView(item, companies) {
  const inner = nested(item, 'experience');
  const company = companyTitle(item?.companyId, companies);
  const position = inner.position || '';
  return {
    id: recordId(item, 'experience'),
    signature: `${position.trim().toLowerCase()}|${item?.companyId ?? ''}`,
    title: [position, company].filter(Boolean).join(', ') || 'Опыт',
    fields: [
      ['Должность', position],
      ['Компания', company || item?.companyId],
      ['Описание', inner.additionalInfo],
      ['Начало', inner.startDate],
      ['Конец', inner.endDate],
      ['Тип', inner.experienceType, EXPERIENCE_TYPE_LABELS],
    ],
  };
}

function educationView(item, schools) {
  const inner = nested(item, 'institution');
  const school = schoolTitle(item?.educationId, schools);
  return {
    id: recordId(item, 'institution'),
    signature: `${item?.educationId ?? ''}|${inner.startYear ?? ''}`,
    title: [school, years(inner.startYear, inner.endYear)].filter(Boolean).join(', ') || 'Учёба',
    fields: [
      ['Заведение', school || item?.educationId],
      ['Начало', inner.startYear],
      ['Конец', inner.endYear],
      ['Тип', inner.educationType, EDUCATION_TYPE_LABELS],
      ['Направление', inner.direction],
      ['Уровень', inner.educationLevel],
    ],
  };
}

function portfolioView(item) {
  return {
    id: recordId(item, 'portfolio'),
    signature: String(item?.name ?? '').trim().toLowerCase(),
    title: item?.name || 'Портфолио',
    fields: [
      ['Название', item?.name],
      ['Ссылка', item?.link],
      ['Описание', item?.additionalInfo],
    ],
  };
}

function fieldText(label, value, labels) {
  return `${label}: ${show(value, labels)}`;
}

function filledText(fields) {
  return fields
    .filter(([, value]) => !blank(value) && value !== 0)
    .map(([label, value, labels]) => fieldText(label, value, labels))
    .join('; ');
}

function diffRecords(published, draft, toView) {
  const publishedViews = (published ?? []).map(toView);
  const draftViews = (draft ?? []).map(toView);
  const usedDraft = new Set();
  const usedPublished = new Set();
  const pairs = [];

  function takeDraft(predicate) {
    return draftViews.find((item) => !usedDraft.has(item) && predicate(item));
  }

  for (const previous of publishedViews) {
    if (previous.id == null) continue;
    const next = takeDraft((item) => item.id != null && item.id === previous.id);
    if (!next) continue;
    pairs.push([previous, next]);
    usedDraft.add(next);
    usedPublished.add(previous);
  }
  for (const previous of publishedViews) {
    if (usedPublished.has(previous) || !previous.signature) continue;
    const candidates = draftViews.filter((item) => !usedDraft.has(item) && item.signature === previous.signature);
    if (candidates.length !== 1) continue;
    pairs.push([previous, candidates[0]]);
    usedDraft.add(candidates[0]);
    usedPublished.add(previous);
  }

  const lines = [];
  for (const [previous, next] of pairs) {
    const changed = next.fields.filter((field, index) => !same(previous.fields[index][1], field[1]));
    if (!changed.length) continue;
    lines.push({
      title: next.title,
      text: changed.map(([label, value, labels]) => {
        const oldValue = previous.fields.find(([name]) => name === label);
        return `${label}: ${show(oldValue?.[1], oldValue?.[2])} → ${show(value, labels)}`;
      }).join('; '),
    });
  }
  for (const next of draftViews) {
    if (usedDraft.has(next)) continue;
    const details = filledText(next.fields);
    lines.push({ title: next.title, text: details ? `добавлен, ${details}` : 'добавлен' });
  }
  for (const previous of publishedViews) {
    if (usedPublished.has(previous)) continue;
    const details = filledText(previous.fields);
    lines.push({ title: previous.title, text: details ? `снят, было ${details}` : 'снят' });
  }
  return lines;
}

function buildDiff(published, student, draftLists, companies, schools) {
  const card = published?.card ?? {};
  const fields = [];
  if (!same(card.imagePath, student?.imagePath)) {
    const catalogEmpty = blank(card.imagePath);
    const draftEmpty = blank(student?.imagePath);
    fields.push({
      label: 'Фото',
      catalog: catalogEmpty ? 'нет' : 'было',
      draft: draftEmpty ? 'нет' : catalogEmpty ? 'есть' : 'заменено',
    });
  }
  for (const [key, label, labels] of CARD_FIELDS) {
    if (same(card[key], student?.[key])) continue;
    fields.push({
      label,
      catalog: show(card[key], labels),
      draft: show(student?.[key], labels),
    });
  }
  const skills = skillChange(card.skills, student?.skills);
  if (skills) fields.push({ label: 'Навыки', catalog: skills[0], draft: skills[1] });
  return {
    fields,
    experience: diffRecords(published?.experience, draftLists.experiences, (item) => experienceView(item, companies)),
    education: diffRecords(published?.education, draftLists.institutions, (item) => educationView(item, schools)),
    portfolio: diffRecords(published?.portfolio, draftLists.portfolios, portfolioView),
  };
}

function versionLabel(status) {
  return VERSION_STATUS[status] || status || 'версия';
}

export function ProfileChanges({
  studentId,
  student,
  experiences,
  institutions,
  portfolios,
  companies,
  refreshKey,
}) {
  const [state, setState] = useState({ mode: 'hidden' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: versions } = await studentsAdminApi.listStudentProfileVersions(studentId);
        const list = Array.isArray(versions) ? [...versions] : [];
        list.sort((a, b) => (a.versionNumber ?? 0) - (b.versionNumber ?? 0));
        const latest = list[list.length - 1];
        if (!list.length || latest?.status === 'APPROVED') {
          if (!cancelled) setState({ mode: 'hidden' });
          return;
        }
        const ribbon = list.map((item) => `${item.versionNumber} ${versionLabel(item.status)}`).join(' · ');
        try {
          const { data: snapshot } = await studentsAdminApi.getPublishedSnapshot(studentId);
          const schoolIds = new Set();
          for (const item of [...(snapshot?.education ?? []), ...(institutions ?? [])]) {
            if (item?.educationId) schoolIds.add(item.educationId);
          }
          const schoolEntries = await Promise.all([...schoolIds].map(async (schoolId) => {
            try {
              const { data } = await getEducation(schoolId);
              return [String(schoolId), data?.institution || ''];
            } catch {
              return [String(schoolId), ''];
            }
          }));
          if (cancelled) return;
          setState({
            mode: 'diff',
            ribbon,
            diff: buildDiff(snapshot, student, { experiences, institutions, portfolios }, companies, new Map(schoolEntries)),
          });
        } catch (error) {
          if (cancelled) return;
          if (error.status === 404) {
            setState({ mode: 'first', ribbon });
            return;
          }
          setState({ mode: 'error', text: error.message });
        }
      } catch (error) {
        if (!cancelled) setState({ mode: 'error', text: error.message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, student, experiences, institutions, portfolios, companies, refreshKey]);

  if (state.mode === 'hidden') return null;

  const sections = state.mode === 'diff'
    ? [
        ['Опыт', state.diff.experience],
        ['Учёба', state.diff.education],
        ['Портфолио', state.diff.portfolio],
      ].filter(([, lines]) => lines.length)
    : [];
  const nothing = state.mode === 'diff'
    && !state.diff.fields.length
    && !sections.length;

  return (
    <div className="profile-changes">
      <h3 className="profile-changes__title">Что изменилось</h3>
      {state.ribbon ? <p className="profile-changes__ribbon">{state.ribbon}</p> : null}
      {state.mode === 'first' ? (
        <p className="page__lead" style={{ margin: 0 }}>Первая публикация, сравнивать не с чем.</p>
      ) : null}
      {state.mode === 'error' ? <p className="page__lead" style={{ margin: 0 }}>{state.text}</p> : null}
      {nothing ? <p className="page__lead" style={{ margin: 0 }}>Отличий от каталога нет.</p> : null}
      {state.mode === 'diff' && state.diff.fields.length ? (
        <div className="profile-changes__fields">
          <div className="profile-changes__field profile-changes__field--head">
            <span />
            <span>В каталоге</span>
            <span>В черновике</span>
          </div>
          {state.diff.fields.map((row) => (
            <div className="profile-changes__field" key={row.label}>
              <span className="profile-changes__label">{row.label}</span>
              <span>{row.catalog}</span>
              <span>{row.draft}</span>
            </div>
          ))}
        </div>
      ) : null}
      {sections.map(([title, lines]) => (
        <div key={title} className="profile-changes__group">
          <p className="profile-changes__group-title">{title}</p>
          {lines.map((line) => (
            <p className="profile-changes__line" key={`${line.kind}-${line.title}-${line.text}`}>
              <strong>{line.title}.</strong> {line.text}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
