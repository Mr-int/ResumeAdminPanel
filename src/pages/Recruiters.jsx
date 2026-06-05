import { useCallback, useEffect, useMemo, useState } from 'react';
import * as recruitersApi from '../api/recruiters.js';
import { useEffectWithAbort } from '../hooks/useEffectWithAbort.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';

const PAGE_SIZE = 10;

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
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async (isActive = () => true) => {
    if (isActive()) {
      setError(null);
      setLoading(true);
    }
    try {
      const filter = {};
      if (name.trim()) filter.name = name.trim();
      const { data: res } = await recruitersApi.filterRecruiters(filter, page, PAGE_SIZE);
      if (isActive()) setData(res);
    } catch (e) {
      if (isActive()) {
        setError(e.message);
        setData(null);
      }
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [name, page]);

  useEffectWithAbort((_signal, isActive) => load(isActive), [load]);

  const totalPages = data?.totalPages ?? 0;
  const rows = data?.data ?? [];
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setForm({
      companyName: selected.companyName ?? '',
      firstName: selected.firstName ?? '',
      lastName: selected.lastName ?? '',
      email: selected.email ?? '',
      phoneNumber: selected.phoneNumber ?? '',
      telegramUsername: selected.telegramUsername ?? '',
    });
  }, [selected]);

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
        setForm(emptyForm());
      }
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
        <h2 className="panel__title">Поиск</h2>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            load();
          }}
        >
          <div className="field">
            <label>Имя или компания</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Пусто — показать всех"
            />
          </div>
          <button type="submit" className="btn btn--primary">
            Найти
          </button>
        </form>
      </div>

      <FlashMessages
        error={error || (msg?.type === 'err' ? msg.text : null)}
        success={msg?.type === 'ok' ? msg.text : null}
      />

      <div className="panel">
        <h2 className="panel__title">Список</h2>
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
                          <button type="button" className="btn btn--ghost btn--small" onClick={() => setSelectedId(r.id)}>
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
