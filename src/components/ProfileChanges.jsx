import { useEffect, useState } from 'react';
import * as studentsAdminApi from '../api/studentsAdmin.js';

const CARD_FIELDS = [
  ['city', 'Город'],
  ['hhLink', 'Ссылка'],
  ['birthDate', 'Дата рождения'],
  ['bio', 'Описание'],
  ['imagePath', 'Фото'],
  ['course', 'Курс'],
  ['busyness', 'Занятость'],
  ['desiredBusyness', 'Желаемый формат'],
  ['jobSearchStatus', 'Статус поиска'],
  ['firstName', 'Имя'],
  ['lastName', 'Фамилия'],
  ['middleName', 'Отчество'],
  ['gender', 'Пол'],
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

function show(field, value) {
  if (field === 'imagePath') return blank(value) ? 'нет' : 'есть';
  if (blank(value)) return 'нет';
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'нет';
  return String(value);
}

function same(left, right) {
  return show('x', left) === show('x', right);
}

function skillLabel(skills) {
  const names = (skills ?? []).map((item) => item?.name).filter(Boolean);
  return names.length ? names.join(', ') : 'нет';
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

function experienceView(item) {
  const inner = nested(item, 'experience');
  return {
    id: recordId(item, 'experience'),
    title: inner.position || 'Опыт',
    fields: [
      ['Должность', inner.position],
      ['Описание', inner.additionalInfo],
      ['Начало', inner.startDate],
      ['Конец', inner.endDate],
      ['Тип', inner.experienceType],
      ['Компания', item?.companyId],
    ],
  };
}

function educationView(item) {
  const inner = nested(item, 'institution');
  return {
    id: recordId(item, 'institution'),
    title: inner.direction || 'Учёба',
    fields: [
      ['Начало', inner.startYear],
      ['Конец', inner.endYear],
      ['Тип', inner.educationType],
      ['Направление', inner.direction],
      ['Уровень', inner.educationLevel],
    ],
  };
}

function portfolioView(item) {
  return {
    id: recordId(item, 'portfolio'),
    title: item?.name || 'Портфолио',
    fields: [
      ['Название', item?.name],
      ['Ссылка', item?.link],
      ['Описание', item?.additionalInfo],
    ],
  };
}

function diffRecords(published, draft, toView) {
  const lines = [];
  const publishedById = new Map();
  for (const item of published ?? []) {
    const view = toView(item);
    if (view.id != null) publishedById.set(view.id, view);
  }
  const seen = new Set();
  for (const item of draft ?? []) {
    const view = toView(item);
    if (view.id == null) continue;
    seen.add(view.id);
    const previous = publishedById.get(view.id);
    if (!previous) {
      lines.push({ kind: 'add', title: view.title, text: 'Добавлено' });
      continue;
    }
    const changed = view.fields.filter(([label, value], index) => !same(previous.fields[index][1], value));
    if (changed.length) {
      lines.push({
        kind: 'edit',
        title: view.title,
        text: changed.map(([label, value]) => {
          const oldValue = previous.fields.find(([name]) => name === label)?.[1];
          return `${label}: ${show(label, oldValue)} → ${show(label, value)}`;
        }).join('; '),
      });
    }
  }
  for (const [id, view] of publishedById) {
    if (!seen.has(id)) lines.push({ kind: 'remove', title: view.title, text: 'Снято' });
  }
  return lines;
}

function buildDiff(published, student, draftLists) {
  const card = published?.card ?? {};
  const fields = CARD_FIELDS.filter(([key]) => !same(card[key], student?.[key])).map(([key, label]) => ({
    label,
    catalog: show(key, card[key]),
    draft: show(key, student?.[key]),
  }));
  const catalogSkills = skillLabel(card.skills);
  const draftSkills = skillLabel(student?.skills);
  if (catalogSkills !== draftSkills) {
    fields.push({ label: 'Навыки', catalog: catalogSkills, draft: draftSkills });
  }
  return {
    fields,
    experience: diffRecords(published?.experience, draftLists.experiences, experienceView),
    education: diffRecords(published?.education, draftLists.institutions, educationView),
    portfolio: diffRecords(published?.portfolio, draftLists.portfolios, portfolioView),
  };
}

function versionLabel(status) {
  return VERSION_STATUS[status] || status || 'версия';
}

export function ProfileChanges({ studentId, student, experiences, institutions, portfolios, refreshKey }) {
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
          if (cancelled) return;
          setState({
            mode: 'diff',
            ribbon,
            diff: buildDiff(snapshot, student, { experiences, institutions, portfolios }),
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
  }, [studentId, student, experiences, institutions, portfolios, refreshKey]);

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
