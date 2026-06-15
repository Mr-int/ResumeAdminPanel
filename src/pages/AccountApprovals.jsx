import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import * as accountApi from '../api/accountApprovals.js';
import * as experienceApi from '../api/experience.js';
import * as institutionApi from '../api/institutions.js';
import { useEffectWithAbort } from '../hooks/useEffectWithAbort.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';
import { DetailGrid } from '../components/ui/DetailGrid.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import {
  ACCOUNT_STATUS_LABELS,
  BUSyness_LABELS,
  COURSE_LABELS,
  ROLE_LABELS,
  labelOf,
} from '../lib/labels.js';
import { fmtDate } from '../lib/format.js';

const PAGE_SIZE = 10;
const ROLES = ['', 'STUDENT', 'RECRUITER'];

function roleBadgeClass(role) {
  if (role === 'STUDENT') return 'badge badge--student';
  if (role === 'RECRUITER') return 'badge badge--recruiter';
  return 'badge';
}

function ApprovalDetailPanel({
  user,
  extended,
  extendedLoading,
  onApprove,
  onReject,
}) {
  const isStudent = user.role === 'STUDENT';
  const isRecruiter = user.role === 'RECRUITER';
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || user.username;

  const accountItems = [
    { label: 'Логин', value: user.username },
    { label: 'Отображаемое имя', value: user.name },
    { label: 'Роль', value: labelOf(ROLE_LABELS, user.role, user.role) },
    {
      label: 'Статус',
      value: <StatusBadge variant="pending">{labelOf(ACCOUNT_STATUS_LABELS, user.accountStatus, 'На модерации')}</StatusBadge>,
    },
    { label: 'Телефон подтверждён', value: user.phoneVerified ? 'Да' : 'Нет' },
    { label: 'Зарегистрирован', value: fmtDate(user.createdAt) },
  ];

  const contactItems = [
    { label: 'Имя', value: user.firstName },
    { label: 'Фамилия', value: user.lastName },
    { label: 'Email', value: user.email },
    { label: 'Телефон', value: user.phoneNumber },
    {
      label: 'Telegram',
      value: user.telegramUsername ? `@${String(user.telegramUsername).replace(/^@/, '')}` : null,
    },
  ];

  const recruiterItems = isRecruiter
    ? [{ label: 'Компания', value: user.companyName }]
    : [];

  const studentItems = isStudent
    ? [
          { label: 'Город', value: user.city },
          { label: 'Направление', value: user.speciality },
          { label: 'Курс', value: labelOf(COURSE_LABELS, user.course, user.course) },
          { label: 'Занятость', value: labelOf(BUSyness_LABELS, user.busyness, user.busyness) },
          {
            label: 'Заполненность профиля',
            value: user.profileTextScore != null ? String(user.profileTextScore) : null,
          },
          {
            label: 'Навыки',
            value:
                user.skills?.length > 0 ? (
                    <div className="approval-skills">
                        {user.skills.map((skill) => (
                            <span key={skill} className="approval-skills__chip">
                                {skill}
                            </span>
                        ))}
                    </div>
                ) : null,
          },
          {
            label: 'О себе',
            value: user.bio ? <p className="approval-bio">{user.bio}</p> : null,
          },
          {
            label: 'Карточка студента',
            value: user.studentId ? (
                <Link to={`/students/${user.studentId}`} className="approval-link">
                    Открыть профиль в админке
                </Link>
            ) : (
                'Резюме ещё не заполнено'
            ),
          },
      ]
    : [];

  return (
    <div className="approval-detail">
      <div className="approval-detail__hero">
        <div className="approval-detail__heroText">
          <p className="approval-detail__eyebrow">
            {isStudent ? 'Новый студент' : 'Новый работодатель'}
          </p>
          <h3 className="approval-detail__name">{displayName}</h3>
          <p className="approval-detail__meta">
            <span className={roleBadgeClass(user.role)}>{labelOf(ROLE_LABELS, user.role, user.role)}</span>
            <span className="approval-detail__username">@{user.username}</span>
          </p>
        </div>
        <div className="approval-detail__actions">
          <button type="button" className="btn btn--primary" onClick={() => onApprove(user.id)}>
            Одобрить
          </button>
          <button type="button" className="btn btn--danger" onClick={() => onReject(user.id)}>
            Отклонить
          </button>
        </div>
      </div>

      <div className="approval-detail__grid">
        <section className="approval-detail__section panel panel--accent">
          <h4 className="approval-detail__sectionTitle">Аккаунт</h4>
          <DetailGrid items={accountItems} />
        </section>

        <section className="approval-detail__section panel">
          <h4 className="approval-detail__sectionTitle">Контакты</h4>
          <DetailGrid items={contactItems} />
        </section>

        {recruiterItems.length > 0 ? (
          <section className="approval-detail__section panel">
            <h4 className="approval-detail__sectionTitle">Компания</h4>
            <DetailGrid items={recruiterItems} />
          </section>
        ) : null}

        {studentItems.length > 0 ? (
          <section className="approval-detail__section panel">
            <h4 className="approval-detail__sectionTitle">Резюме</h4>
            <DetailGrid items={studentItems} />
          </section>
        ) : null}

      </div>

      {isStudent && user.studentId ? (
        <section className="approval-detail__section panel">
          <h4 className="approval-detail__sectionTitle">Опыт и образование</h4>
          {extendedLoading ? (
            <LoadingBlock text="Загрузка опыта и образования…" />
          ) : (
            <div className="approval-cvGrid">
              <div>
                <h5 className="approval-cvGrid__title">Опыт работы</h5>
                {extended?.experiences?.length ? (
                  <ul className="approval-cvList">
                    {extended.experiences.map((item) => (
                      <li key={item.id} className="approval-cvList__item">
                        <strong>{item.position || 'Должность не указана'}</strong>
                        {item.companyName ? ` — ${item.companyName}` : ''}
                        {item.startDate ? (
                          <span className="approval-cvList__meta">
                            {item.startDate}
                            {item.endDate ? ` — ${item.endDate}` : ' — н.в.'}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="approval-cvGrid__empty">Не указан</p>
                )}
              </div>
              <div>
                <h5 className="approval-cvGrid__title">Образование</h5>
                {extended?.institutions?.length ? (
                  <ul className="approval-cvList">
                    {extended.institutions.map((item) => (
                      <li key={item.id} className="approval-cvList__item">
                        <strong>{item.institution || 'Учебное заведение'}</strong>
                        {item.startYear || item.endYear ? (
                          <span className="approval-cvList__meta">
                            {item.startYear || '?'} — {item.endYear || '?'}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="approval-cvGrid__empty">Не указано</p>
                )}
              </div>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

export function AccountApprovals() {
  const [role, setRole] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectComment, setRejectComment] = useState('');
  const [msg, setMsg] = useState(null);
  const [extended, setExtended] = useState(null);
  const [extendedLoading, setExtendedLoading] = useState(false);
  const load = useCallback(async (isActive = () => true) => {
    if (isActive()) {
      setError(null);
      setLoading(true);
    }
    try {
      const { data: res } = await accountApi.listAccountApprovals(
        role || undefined,
        page,
        PAGE_SIZE
      );
      if (isActive()) {
        setData(res);
        const rows = res?.data ?? [];
        setSelectedId((prev) => {
          if (!rows.length) return null;
          if (rows.some((row) => row.id === prev)) return prev;
          return rows[0].id;
        });
      }
    } catch (e) {
      if (isActive()) {
        setError(e.message);
        setData(null);
        setSelectedId(null);
      }
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [role, page]);

  useEffectWithAbort((_signal, isActive) => load(isActive), [load]);

  const rows = data?.data ?? [];
  const selected = rows.find((row) => row.id === selectedId) ?? null;

  useEffectWithAbort(
    async (_signal, isActive) => {
      if (!selected?.studentId) {
        if (isActive()) {
          setExtended(null);
          setExtendedLoading(false);
        }
        return;
      }
      if (isActive()) {
        setExtendedLoading(true);
        setExtended(null);
      }
      try {
        const [expRes, instRes] = await Promise.all([
          experienceApi.filterExperience({ studentId: selected.studentId }, 0, 20),
          institutionApi.filterInstitutions({ studentId: selected.studentId }, 0, 20),
        ]);
        if (!isActive()) return;
        const experienceRows = expRes?.data?.data ?? [];
        const institutionRows = instRes?.data?.data ?? [];
        setExtended({
          experiences: experienceRows.map((row) => ({
            id: row.experience?.id ?? row.id,
            position: row.experience?.position,
            companyName: row.companyName,
            startDate: row.experience?.startDate,
            endDate: row.experience?.endDate,
          })),
          institutions: institutionRows.map((row) => ({
            id: row.institution?.id ?? row.educationId,
            institution: row.institutionName || row.name,
            startYear: row.institution?.startYear,
            endYear: row.institution?.endYear,
          })),
        });
      } catch {
        if (isActive()) setExtended({ experiences: [], institutions: [] });
      } finally {
        if (isActive()) setExtendedLoading(false);
      }
    },
    [selected?.studentId]
  );

  async function handleApprove(userId) {
    if (!window.confirm('Одобрить учётную запись?')) return;
    setMsg(null);
    try {
      await accountApi.approveAccount(userId);
      setMsg({ type: 'ok', text: 'Аккаунт одобрен' });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleReject(e) {
    e.preventDefault();
    if (!rejectId) return;
    setMsg(null);
    try {
      await accountApi.rejectAccount(rejectId, {
        comment: rejectComment.trim() || undefined,
      });
      setRejectId(null);
      setRejectComment('');
      setMsg({ type: 'ok', text: 'Аккаунт отклонён' });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="page approval-page">
      <PageHeader
        title="Одобрение аккаунтов"
        lead="Просмотрите данные нового студента или работодателя и примите решение по модерации."
      />

      <div className="panel">
        <h2 className="panel__title">Фильтр</h2>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            load();
          }}
        >
          <div className="field">
            <label htmlFor="appr-role">Роль</label>
            <select id="appr-role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Все</option>
              {ROLES.filter(Boolean).map((r) => (
                <option key={r} value={r}>
                  {labelOf(ROLE_LABELS, r, r)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn--primary">
            Применить
          </button>
        </form>
      </div>

      <FlashMessages error={error} success={msg?.type === 'ok' ? msg.text : null} />

      {loading ? (
        <LoadingBlock />
      ) : rows.length ? (
        <div className="approval-layout">
          <div className="panel approval-queue">
            <div className="approval-queue__head">
              <h2 className="panel__title">Очередь</h2>
              <span className="approval-queue__count">{data?.totalElements ?? rows.length}</span>
            </div>
            <ul className="approval-queue__list">
              {rows.map((user) => {
                const title =
                  [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || user.username;
                const subtitle =
                  user.role === 'RECRUITER'
                    ? user.companyName || 'Компания не указана'
                    : user.speciality || (user.studentId ? 'Резюме заполнено' : 'Резюме не заполнено');
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      className={`approval-queue__card${selectedId === user.id ? ' approval-queue__card--active' : ''}`}
                      onClick={() => setSelectedId(user.id)}
                    >
                      <div className="approval-queue__cardTop">
                        <span className={roleBadgeClass(user.role)}>
                          {labelOf(ROLE_LABELS, user.role, user.role)}
                        </span>
                        <StatusBadge variant="pending">ожидает</StatusBadge>
                      </div>
                      <strong className="approval-queue__cardTitle">{title}</strong>
                      <span className="approval-queue__cardSub">@{user.username}</span>
                      <span className="approval-queue__cardHint">{subtitle}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalElements={data?.totalElements}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </div>

          {selected ? (
            <div className="approval-layout__detail">
              <ApprovalDetailPanel
                user={selected}
                extended={extended}
                extendedLoading={extendedLoading}
                onApprove={handleApprove}
                onReject={(userId) => {
                  setRejectId(userId);
                  setRejectComment('');
                }}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-state__title">Нет ожидающих аккаунтов</p>
          <p className="empty-state__hint">Новые регистрации появятся здесь автоматически.</p>
        </div>
      )}

      {rejectId ? (
        <div className="panel panel--accent">
          <h2 className="panel__title">Отклонение аккаунта</h2>
          <form onSubmit={handleReject}>
            <div className="field">
              <label htmlFor="appr-reject">Комментарий (необязательно)</label>
              <textarea
                id="appr-reject"
                rows={3}
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
              />
            </div>
            <div className="form-row" style={{ marginTop: '0.75rem' }}>
              <button type="submit" className="btn btn--danger">
                Подтвердить отклонение
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setRejectId(null)}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
