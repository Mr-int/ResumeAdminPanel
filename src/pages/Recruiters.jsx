import { useCallback, useEffect, useRef, useState } from 'react';
import * as recruitersApi from '../api/recruiters.js';
import { useEffectWithAbort } from '../hooks/useEffectWithAbort.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { resetRecruiterDirectory } from '../lib/recruiterDirectory.js';
import { recruiterHasEmail } from '../utils/recruiterDisplay.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';

const PAGE_SIZE = 20;

const EMAIL_FILTERS = [
  { value: '', label: 'Все' },
  { value: 'with', label: 'С email' },
  { value: 'without', label: 'Без email' },
];

function emptyForm() {
  return {
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    telegramUsername: '',
  };
}

export function Recruiters() {
  const [name, setName] = useState('');
  const debouncedName = useDebouncedValue(name);
  const [emailFilter, setEmailFilter] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [counts, setCounts] = useState({ total: 0, withEmail: 0, withoutEmail: 0 });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  useEffect(() => {
    setPage(0);
  }, [debouncedName, emailFilter]);

  const load = useCallback(async (isActive = () => true) => {
    if (isActive()) {
      setError(null);
      setLoading(true);
    }
    try {
      const filter = {};
      if (debouncedName.trim()) filter.name = debouncedName.trim();

      const allRows = await recruitersApi.fetchAllRecruiters(filter);
      const withEmail = allRows.filter(recruiterHasEmail);
      const withoutEmail = allRows.filter((r) => !recruiterHasEmail(r));
      const filtered =
        emailFilter === 'with'
          ? withEmail
          : emailFilter === 'without'
            ? withoutEmail
            : allRows;

      const totalElements = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE) || 1);
      const safePage = totalElements === 0 ? 0 : Math.min(page, totalPages - 1);
      if (safePage !== page) {
        if (isActive()) setPage(safePage);
        return;
      }
      const start = safePage * PAGE_SIZE;
      const pageRows = filtered.slice(start, start + PAGE_SIZE);

      if (isActive()) {
        setCounts({
          total: allRows.length,
          withEmail: withEmail.length,
          withoutEmail: withoutEmail.length,
        });
        setData({
          data: pageRows,
          totalElements,
          totalPages,
          page: safePage,
        });
        const currentId = selectedIdRef.current;
        if (currentId) {
          const updated = allRows.find((r) => r.id === currentId);
          if (updated) setSelectedRecruiter(updated);
        }
      }
    } catch (e) {
      if (isActive()) {
        setError(e.message);
        setData(null);
        setCounts({ total: 0, withEmail: 0, withoutEmail: 0 });
      }
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [debouncedName, emailFilter, page]);

  useEffectWithAbort((_signal, isActive) => load(isActive), [load]);

  const totalPages = data?.totalPages ?? 0;
  const rows = data?.data ?? [];

  useEffect(() => {
    if (!selectedRecruiter) return;
    setForm({
      companyName: selectedRecruiter.companyName ?? '',
      firstName: selectedRecruiter.firstName ?? '',
      lastName: selectedRecruiter.lastName ?? '',
      email: selectedRecruiter.email ?? '',
      phoneNumber: selectedRecruiter.phoneNumber ?? '',
      telegramUsername: selectedRecruiter.telegramUsername ?? '',
    });
  }, [selectedRecruiter]);

  async function handleDelete(id) {
    const ok = window.confirm(
      'Удалить профиль рекрутера?\n\n' +
        'Каскадно будут удалены: вакансии и отклики, заявки на контакт, чаты, ' +
        'связанная учётная запись пользователя. Это действие необратимо.'
    );
    if (!ok) return;
    setMsg(null);
    try {
      await recruitersApi.deleteRecruiter(id);
      if (selectedId === id) {
        setSelectedId(null);
        setSelectedRecruiter(null);
        setForm(emptyForm());
      }
      resetRecruiterDirectory();
      await load();
      setMsg({ type: 'ok', text: 'Рекрутер удалён' });
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  async function handlePut(e) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setMsg(null);
    try {
      await recruitersApi.updateRecruiter(selectedId, {
        companyName: form.companyName.trim(),
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        email: form.email || undefined,
        phoneNumber: form.phoneNumber || undefined,
        telegramUsername: form.telegramUsername || undefined,
      });
      resetRecruiterDirectory();
      await load();
      setMsg({ type: 'ok', text: 'Профиль полностью обновлён' });
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function handlePatch() {
    if (!selectedId) return;
    setSaving(true);
    setMsg(null);
    try {
      const payload = {};
      if (form.companyName.trim()) payload.companyName = form.companyName.trim();
      if (form.firstName.trim()) payload.firstName = form.firstName.trim();
      if (form.lastName.trim()) payload.lastName = form.lastName.trim();
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.phoneNumber.trim()) payload.phoneNumber = form.phoneNumber.trim();
      if (form.telegramUsername.trim()) payload.telegramUsername = form.telegramUsername.trim();

      await recruitersApi.patchRecruiter(selectedId, payload);
      resetRecruiterDirectory();
      await load();
      setMsg({ type: 'ok', text: 'Изменения сохранены (частичное обновление)' });
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Рекрутеры"
        lead="Профили работодателей: компания, контакты, привязка к учётной записи."
      />

      <div className="panel">
        <h2 className="panel__title">Фильтр</h2>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
          }}
        >
          <div className="field">
            <label htmlFor="rec-name">Имя или компания</label>
            <input
              id="rec-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Пусто — показать всех"
            />
          </div>
          <div className="field">
            <label htmlFor="rec-email-filter">Email</label>
            <select
              id="rec-email-filter"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
            >
              {EMAIL_FILTERS.map((f) => {
                const count =
                  f.value === 'with'
                    ? counts.withEmail
                    : f.value === 'without'
                      ? counts.withoutEmail
                      : counts.total;
                return (
                  <option key={f.value || 'all'} value={f.value}>
                    {f.label} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </form>
      </div>

      <FlashMessages
        error={error || (msg?.type === 'err' ? msg.text : null)}
        success={msg?.type === 'ok' ? msg.text : null}
      />

      <div className="panel">
        <h2 className="panel__title">Список</h2>
        {!loading && counts.total > 0 ? (
          <p className="page__lead" style={{ marginTop: 0 }}>
            Всего {counts.total}: с email — {counts.withEmail}, без email — {counts.withoutEmail}
          </p>
        ) : null}
        {loading ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <EmptyState title="Рекрутеры не найдены" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Компания</th>
                    <th>ФИО</th>
                    <th>Email</th>
                    <th>Telegram</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.companyName}</td>
                      <td>
                        {[r.firstName, r.lastName].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td>{r.email ?? '—'}</td>
                      <td>{r.telegramUsername ? `@${r.telegramUsername.replace(/^@/, '')}` : '—'}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn btn--ghost btn--small"
                            onClick={() => {
                              setSelectedId(r.id);
                              setSelectedRecruiter(r);
                            }}
                          >
                            Редактировать
                          </button>
                          <button type="button" className="btn btn--danger btn--small" onClick={() => handleDelete(r.id)}>
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalElements={data?.totalElements}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </div>

      {selectedId ? (
        <div className="panel panel--accent">
          <h2 className="panel__title">Редактирование рекрутера</h2>
          <form onSubmit={handlePut}>
            <div className="form-row">
              <div className="field">
                <label>Компания *</label>
                <input
                  required
                  value={form.companyName}
                  onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Имя</label>
                <input
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Фамилия</label>
                <input
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Телефон</label>
                <input
                  value={form.phoneNumber}
                  onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Telegram</label>
                <input
                  value={form.telegramUsername}
                  onChange={(e) => setForm((p) => ({ ...p, telegramUsername: e.target.value }))}
                  placeholder="username"
                />
              </div>
            </div>
            <div className="form-row">
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Сохранение…' : 'Сохранить полностью'}
              </button>
              <button type="button" className="btn btn--ghost" disabled={saving} onClick={handlePatch}>
                Сохранить изменённые поля
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setSelectedId(null);
                  setSelectedRecruiter(null);
                  setForm(emptyForm());
                }}
              >
                Закрыть
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
