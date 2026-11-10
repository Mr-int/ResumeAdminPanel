import { useCallback, useEffect, useState } from 'react';
import * as accountApi from '../api/accountApprovals.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { ACCOUNT_STATUS_LABELS, labelOf } from '../lib/labels.js';
import { accountStatusVariant, isPendingApproval } from '../lib/studentAccount.js';

const PAGE_SIZE = 100;

const STATUS_OPTIONS = [
  { id: 'PENDING_APPROVAL', label: 'На модерации', tone: 'pending' },
  { id: 'APPROVED', label: 'Одобрен', tone: 'approved' },
  { id: 'REJECTED', label: 'Отклонён', tone: 'rejected' },
];

const EMAIL_OPTIONS = [
  { id: 'yes', label: 'Подтверждена' },
  { id: 'no', label: 'Не подтверждена' },
];

const SORT_FIELDS = {
  date: 'CREATED_AT',
  company: 'COMPANY_NAME',
  name: 'LAST_NAME',
  status: 'ACCOUNT_STATUS',
};

const SORT_OPTIONS = [
  { id: 'date', label: 'Дата' },
  { id: 'company', label: 'Компания' },
  { id: 'name', label: 'ФИО' },
  { id: 'status', label: 'Статус' },
];

function ChoiceChip({ active, tone, onClick, children }) {
  const toneClass = tone ? ` student-chip--${tone}` : '';
  return (
    <button
      type="button"
      className={`student-chip${toneClass}${active ? ' student-chip--active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ChipRow({ label, children }) {
  return (
    <div className="student-chip-row">
      <span className="student-chip-row__label">{label}</span>
      <div className="student-chip-row__items">{children}</div>
    </div>
  );
}

function SortHeader({ label, sortKey, sort, onSort }) {
  const active = sort.key === sortKey;
  const mark = active ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : '';
  return (
    <button type="button" className="th-sort" onClick={() => onSort(sortKey)}>
      {label}
      {mark}
    </button>
  );
}

function fullName(row) {
  return [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ') || row.name || '—';
}

export function Employers() {
  const [findString, setFindString] = useState('');
  const debouncedFind = useDebouncedValue(findString);
  const [city, setCity] = useState('');
  const debouncedCity = useDebouncedValue(city);
  const [status, setStatus] = useState('');
  const [email, setEmail] = useState('');
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { data: res } = await accountApi.listRecruiterAccounts({
        page,
        size: PAGE_SIZE,
        findString: debouncedFind.trim() || undefined,
        city: debouncedCity.trim() || undefined,
        accountStatus: status || undefined,
        emailVerified: email === 'yes' ? true : email === 'no' ? false : undefined,
        sortBy: sort.key ? SORT_FIELDS[sort.key] : undefined,
        sortDirection: sort.key ? (sort.dir === 'asc' ? 'ASC' : 'DESC') : undefined,
      });
      setData(res);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedFind, debouncedCity, status, email, sort]);

  useEffect(() => {
    load();
  }, [load]);

  function pickStatus(next) {
    setStatus((prev) => (prev === next ? '' : next));
    setPage(0);
  }

  function pickEmail(next) {
    setEmail((prev) => (prev === next ? '' : next));
    setPage(0);
  }

  function handleSort(key) {
    setSort((prev) => {
      if (prev.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      return { key, dir: 'asc' };
    });
    setPage(0);
  }

  async function handleApprove(row) {
    const name = row.companyName || fullName(row);
    if (!window.confirm(`Одобрить «${name}»?`)) return;
    setActionId(row.id);
    setMsg(null);
    try {
      await accountApi.approveAccount(row.id);
      setMsg({ type: 'ok', text: 'Аккаунт одобрен' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(row) {
    const name = row.companyName || fullName(row);
    if (!window.confirm(`Отклонить «${name}»?`)) return;
    setActionId(row.id);
    setMsg(null);
    try {
      await accountApi.rejectAccount(row.id);
      setMsg({ type: 'ok', text: 'Аккаунт отклонён' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setActionId(null);
    }
  }

  const rows = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="page">
      <PageHeader
        title="Работодатели"
        lead="Аккаунты после саморегистрации. Одобрение и отказ доступны, пока статус «На модерации»."
      />

      <div className="panel">
        <div className="form-row">
          <div className="field">
            <label htmlFor="employer-find">Компания или ФИО</label>
            <input
              id="employer-find"
              value={findString}
              onChange={(e) => {
                setFindString(e.target.value);
                setPage(0);
              }}
              placeholder="Компания, фамилия, имя"
            />
          </div>
          <div className="field">
            <label htmlFor="employer-city">Город</label>
            <input
              id="employer-city"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPage(0);
              }}
              placeholder="Город"
            />
          </div>
        </div>
        <div className="student-chip-rows">
          <ChipRow label="Статус">
            <ChoiceChip active={!status} onClick={() => { setStatus(''); setPage(0); }}>
              Все
            </ChoiceChip>
            {STATUS_OPTIONS.map((item) => (
              <ChoiceChip
                key={item.id}
                tone={`status-${item.tone}`}
                active={status === item.id}
                onClick={() => pickStatus(item.id)}
              >
                {item.label}
              </ChoiceChip>
            ))}
          </ChipRow>
          <ChipRow label="Почта">
            <ChoiceChip active={!email} onClick={() => { setEmail(''); setPage(0); }}>
              Все
            </ChoiceChip>
            {EMAIL_OPTIONS.map((item) => (
              <ChoiceChip key={item.id} active={email === item.id} onClick={() => pickEmail(item.id)}>
                {item.label}
              </ChoiceChip>
            ))}
          </ChipRow>
          <ChipRow label="Сортировка">
            <ChoiceChip active={sort.key == null} onClick={() => { setSort({ key: null, dir: 'asc' }); setPage(0); }}>
              Новые сверху
              <span className="student-chip__mark" />
            </ChoiceChip>
            {SORT_OPTIONS.map((item) => (
              <ChoiceChip key={item.id} active={sort.key === item.id} onClick={() => handleSort(item.id)}>
                {item.label}
                <span className="student-chip__mark">
                  {sort.key === item.id ? (sort.dir === 'asc' ? '↑' : '↓') : ''}
                </span>
              </ChoiceChip>
            ))}
          </ChipRow>
        </div>
      </div>

      {msg?.type === 'ok' ? <div className="alert alert--success">{msg.text}</div> : null}
      {msg?.type === 'err' ? <div className="alert alert--error">{msg.text}</div> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="panel">
        {loading ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Загрузка…</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>
                      <SortHeader label="Компания" sortKey="company" sort={sort} onSort={handleSort} />
                    </th>
                    <th>
                      <SortHeader label="ФИО" sortKey="name" sort={sort} onSort={handleSort} />
                    </th>
                    <th>Логин</th>
                    <th>Почта</th>
                    <th>Телефон</th>
                    <th>Telegram</th>
                    <th>Город</th>
                    <th>Почта подтверждена</th>
                    <th>
                      <SortHeader label="Статус" sortKey="status" sort={sort} onSort={handleSort} />
                    </th>
                    <th>
                      <SortHeader label="Дата" sortKey="date" sort={sort} onSort={handleSort} />
                    </th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const pending = isPendingApproval(row.accountStatus);
                    const busy = actionId === row.id;
                    return (
                      <tr key={row.id}>
                        <td>{row.companyName || '—'}</td>
                        <td>{fullName(row)}</td>
                        <td>{row.username || '—'}</td>
                        <td style={{ fontSize: '0.85rem' }}>{row.email || '—'}</td>
                        <td>{row.phoneNumber || '—'}</td>
                        <td>{row.telegramUsername || '—'}</td>
                        <td>{row.city || '—'}</td>
                        <td>{row.emailVerified ? 'Да' : 'Нет'}</td>
                        <td>
                          <StatusBadge variant={accountStatusVariant(row.accountStatus)}>
                            {labelOf(ACCOUNT_STATUS_LABELS, row.accountStatus)}
                          </StatusBadge>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{row.createdAt ? String(row.createdAt).replace('T', ' ').slice(0, 16) : '—'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {pending ? (
                            <>
                              <button
                                type="button"
                                className="btn btn--primary btn--small"
                                disabled={busy}
                                onClick={() => handleApprove(row)}
                              >
                                Одобрить
                              </button>
                              <button
                                type="button"
                                className="btn btn--danger btn--small"
                                style={{ marginLeft: '0.4rem' }}
                                disabled={busy}
                                onClick={() => handleReject(row)}
                              >
                                Отклонить
                              </button>
                            </>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span>
                Стр. {data ? data.page + 1 : 1} из {Math.max(totalPages, 1)} · всего {data?.totalElements ?? 0}
              </span>
              <div className="pager__btns">
                <button type="button" className="btn btn--ghost" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  Назад
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={!totalPages || page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Вперёд
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
