import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import * as studentsApi from '../api/students.js';
import * as accountApi from '../api/accountApprovals.js';
import * as mainApi from '../api/main.js';
import { checksFilled, listProfileChecks } from '../lib/studentProfileChecks.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';

const QUICK_LINKS = [
  { to: '/students', title: 'Студенты', desc: 'Карточки резюме и модерация аккаунтов' },
  { to: '/mail', title: 'Рассылка', desc: 'Письмо выбранным студентам или всем сразу' },
];

const STATUS_CARDS = [
  { id: 'APPROVED', label: 'Одобрен' },
  { id: 'PENDING_APPROVAL', label: 'На модерации' },
  { id: 'REJECTED', label: 'Отклонён' },
];

async function loadAllStudents() {
  const size = 100;
  const all = [];
  let total = 0;
  for (let current = 0; current < 500; current += 1) {
    const { data: res } = await studentsApi.filterStudents({}, current, size);
    const chunk = res?.data ?? [];
    if (current === 0) total = res?.totalElements ?? chunk.length;
    all.push(...chunk);
    const pages = res?.totalPages ?? 1;
    if (current + 1 >= pages || !chunk.length) break;
  }
  return { all, total };
}

function countByStatus(students, approvals) {
  const buckets = {
    APPROVED: { total: 0, gaps: 0 },
    PENDING_APPROVAL: { total: 0, gaps: 0 },
    REJECTED: { total: 0, gaps: 0 },
  };
  for (const student of students) {
    const entry = approvals.get(String(student?.id));
    const status = entry?.accountStatus;
    if (!status || !buckets[status]) continue;
    buckets[status].total += 1;
    const checks = listProfileChecks(student, entry.emailVerified === true, entry);
    if (!checksFilled(checks).complete) buckets[status].gaps += 1;
  }
  return buckets;
}

export function Dashboard() {
  const { isRecruiter } = useAuth();
  const [studentCount, setStudentCount] = useState(null);
  const [version, setVersion] = useState(null);
  const [versionError, setVersionError] = useState(false);
  const [buckets, setBuckets] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isRecruiter) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [list, approvals, statusResult] = await Promise.all([
          loadAllStudents(),
          accountApi.loadPendingStudentApprovals(),
          mainApi.getStatus().then(
            (res) => ({ ok: true, version: res?.data?.version || '—' }),
            () => ({ ok: false, version: null }),
          ),
        ]);
        if (cancelled) return;
        setStudentCount(list.total);
        setBuckets(countByStatus(list.all, approvals));
        setVersion(statusResult.version);
        setVersionError(!statusResult.ok);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setStudentCount(null);
          setBuckets(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isRecruiter]);

  if (isRecruiter) {
    return <Navigate to="/vacancies" replace />;
  }

  return (
    <div className="page">
      <PageHeader
        title="Главная"
        lead="Сводка и переход к разделам."
      />

      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <p className="stat-card__label">Студенты</p>
          <p className="stat-card__value">
            {studentCount == null ? '…' : <Link to="/students">{studentCount}</Link>}
          </p>
          <p className="stat-card__hint">Все анкеты</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Версия</p>
          <p className="stat-card__value" style={{ fontSize: '1.1rem' }}>
            {versionError ? 'Недоступен' : (version ?? '…')}
          </p>
          <p className="stat-card__hint">
            {versionError ? 'Сервер не ответил' : 'Сборка сервера'}
          </p>
        </div>
        {STATUS_CARDS.map((card) => {
          const bucket = buckets?.[card.id];
          const statusUrl = `/students?status=${card.id}`;
          return (
            <div className="stat-card" key={card.id}>
              <p className="stat-card__label">{card.label}</p>
              <p className="stat-card__value">
                {bucket == null ? '…' : <Link to={statusUrl}>{bucket.total}</Link>}
              </p>
              <p className="stat-card__hint">
                {bucket == null ? (
                  'Загрузка'
                ) : (
                  <>
                    <Link to={`${statusUrl}&gaps=1`}>{bucket.gaps} с нехваткой полей</Link>
                    {' · '}
                    <Link to={`${statusUrl}&ready=1`}>
                      {Math.max(0, bucket.total - bucket.gaps)} всё заполнено
                    </Link>
                  </>
                )}
              </p>
            </div>
          );
        })}
      </div>

      {error ? (
        <div className="alert alert--error">
          Не удалось собрать сводку. {error}
        </div>
      ) : null}

      <div className="panel panel--accent">
        <h2 className="panel__title">Быстрые ссылки</h2>
        <div className="quick-links">
          {QUICK_LINKS.map((item) => (
            <Link key={item.to} to={item.to} className="quick-link">
              <p className="quick-link__title">{item.title}</p>
              <p className="quick-link__desc">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {loading ? <LoadingBlock text="Загрузка сводки…" /> : null}
    </div>
  );
}
