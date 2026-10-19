import { useCallback, useState } from 'react';
import { useEffectWithAbort } from '../hooks/useEffectWithAbort.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import * as studentsApi from '../api/students.js';
import * as studentsAdminApi from '../api/studentsAdmin.js';
import { contactFieldsFromStudentDto } from '../utils/studentContact.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { MAIL_SKIP_REASONS, labelOf } from '../lib/labels.js';

const PAGE_SIZES = [10, 25, 50, 100];
const MAX_RECIPIENTS = 200;
const SUBJECT_MAX = 200;
const BODY_MAX = 5000;

function studentName(student) {
  const name = `${student?.firstName ?? ''} ${student?.lastName ?? ''}`.trim();
  return name || '—';
}

function studentEmail(student) {
  return contactFieldsFromStudentDto(student).email;
}

function ResultBlock({ title, hint, items, showReason }) {
  return (
    <div className="panel">
      <h2 className="panel__title" style={{ marginBottom: hint ? '0.35rem' : undefined }}>
        {title} · {items.length}
      </h2>
      {hint ? <p className="page__lead" style={{ marginTop: 0 }}>{hint}</p> : null}
      {items.length === 0 ? (
        <p className="page__lead" style={{ margin: 0 }}>Никого</p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Почта</th>
                {showReason ? <th>Причина</th> : null}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={`${item.studentId ?? 'row'}-${index}`}>
                  <td>{item.name || '—'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{item.email || 'нет'}</td>
                  {showReason ? (
                    <td>
                      {showReason === 'skip'
                        ? labelOf(MAIL_SKIP_REASONS, item.reason, item.reason || '—')
                        : item.reason || '—'}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function StudentMail() {
  const [mode, setMode] = useState('selected');
  const [findString, setFindString] = useState('');
  const debouncedFindString = useDebouncedValue(findString);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[1]);
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [allCount, setAllCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [limitMsg, setLimitMsg] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [report, setReport] = useState(null);

  const loadAllCount = useCallback(async (isActive = () => true) => {
    try {
      const { data } = await studentsApi.filterStudents({}, 0, 1);
      if (isActive()) setAllCount(data?.totalElements ?? 0);
    } catch {
      if (isActive()) setAllCount(null);
    }
  }, []);

  const loadList = useCallback(async (isActive = () => true) => {
    if (isActive()) {
      setLoading(true);
      setListError(null);
    }
    try {
      const filter = {};
      if (debouncedFindString.trim()) filter.findString = debouncedFindString.trim();
      const { data } = await studentsApi.filterStudents(filter, page, pageSize);
      if (!isActive()) return;
      setRows(data?.data ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch (e) {
      if (!isActive()) return;
      setListError(e.message);
      setRows([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [debouncedFindString, page, pageSize]);

  useEffectWithAbort((_signal, isActive) => loadAllCount(isActive), [loadAllCount]);
  useEffectWithAbort((_signal, isActive) => loadList(isActive), [loadList]);

  const recipientCount = mode === 'all' ? allCount : selectedIds.size;
  const canSend =
    !sending &&
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    recipientCount != null &&
    recipientCount > 0;

  const pageIds = rows.map((s) => String(s.id));
  const selectedOnPage = pageIds.filter((id) => selectedIds.has(id));
  const allOnPageChecked = pageIds.length > 0 && selectedOnPage.length === pageIds.length;
  const pageSelectDisabled =
    pageIds.length === 0 ||
    (selectedOnPage.length === 0 && selectedIds.size >= MAX_RECIPIENTS);

  function addId(next, id) {
    if (next.has(id)) return false;
    if (next.size >= MAX_RECIPIENTS) return true;
    next.add(id);
    return false;
  }

  function toggleOne(studentId, checked) {
    const key = String(studentId);
    const next = new Set(selectedIds);
    if (!checked) {
      next.delete(key);
      setSelectedIds(next);
      setLimitMsg(null);
      return;
    }
    const hitLimit = addId(next, key);
    setSelectedIds(next);
    setLimitMsg(hitLimit ? 'Не больше 200 получателей за один запрос' : null);
  }

  function togglePage(checked) {
    const next = new Set(selectedIds);
    if (!checked) {
      for (const id of pageIds) next.delete(id);
      setSelectedIds(next);
      setLimitMsg(null);
      return;
    }
    let hitLimit = false;
    for (const id of pageIds) {
      if (addId(next, id)) hitLimit = true;
    }
    setSelectedIds(next);
    setLimitMsg(hitLimit ? 'Не больше 200 получателей за один запрос' : null);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!canSend) return;
    const count = recipientCount;
    const ok = window.confirm(`Отправить ${count} писем?`);
    if (!ok) return;

    setSending(true);
    setSendError(null);
    try {
      const { data } = await studentsAdminApi.sendStudentMail({
        studentIds: mode === 'all' ? [] : [...selectedIds],
        all: mode === 'all',
        subject: subject.trim(),
        body: body.trim(),
      });
      setReport({
        sent: data?.sent ?? [],
        skipped: data?.skipped ?? [],
        failed: data?.failed ?? [],
      });
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Рассылка"
        lead="Письмо уходит обычным текстом. Повторное нажатие отправит его ещё раз."
      />

      <div className="panel">
        <h2 className="panel__title">Кому</h2>
        <div className="form-row">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <input
              type="radio"
              name="mail-mode"
              checked={mode === 'selected'}
              onChange={() => setMode('selected')}
            />
            Выбранным
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <input
              type="radio"
              name="mail-mode"
              checked={mode === 'all'}
              onChange={() => setMode('all')}
            />
            Всем студентам
          </label>
        </div>
        {mode === 'all' ? (
          <p className="page__lead" style={{ marginBottom: 0 }}>
            Письмо уйдёт всем студентам, в любом статусе аккаунта.
            {allCount == null ? ' Считаем…' : ` Сейчас в базе: ${allCount}.`}
          </p>
        ) : (
          <p className="page__lead" style={{ marginBottom: 0 }}>
            Выбрано {selectedIds.size} из {MAX_RECIPIENTS}. Галочки сохраняются при поиске и листании страниц.
          </p>
        )}
      </div>

      {mode === 'selected' ? (
        <>
          <div className="panel">
            <h2 className="panel__title">Поиск</h2>
            <form
              className="form-row"
              onSubmit={(e) => {
                e.preventDefault();
                setPage(0);
                loadList();
              }}
            >
              <div className="field">
                <label htmlFor="mail-find">Строка поиска (ФИО, email)</label>
                <input
                  id="mail-find"
                  value={findString}
                  onChange={(e) => {
                    setFindString(e.target.value);
                    setPage(0);
                  }}
                  placeholder="ФИО или email"
                />
              </div>
              <button type="submit" className="btn btn--primary">
                Применить
              </button>
            </form>
          </div>

          {listError ? <div className="alert alert--error">{listError}</div> : null}
          {limitMsg ? <div className="alert alert--error">{limitMsg}</div> : null}

          <div className="panel">
            <h2 className="panel__title">Студенты</h2>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Загрузка…</p>
            ) : rows.length === 0 ? (
              <EmptyState title="Студенты не найдены" />
            ) : (
              <>
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th style={{ width: 36 }}>
                          <input
                            type="checkbox"
                            checked={allOnPageChecked}
                            disabled={pageSelectDisabled}
                            onChange={(e) => togglePage(e.target.checked)}
                            aria-label="Выбрать всех на странице"
                          />
                        </th>
                        <th>ФИО</th>
                        <th>Email</th>
                        <th>Специальность</th>
                        <th>Курс</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((s) => {
                        const id = String(s.id);
                        const checked = selectedIds.has(id);
                        const blocked = !checked && selectedIds.size >= MAX_RECIPIENTS;
                        return (
                          <tr key={id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={blocked}
                                onChange={(e) => toggleOne(id, e.target.checked)}
                                aria-label={`Выбрать ${studentName(s)}`}
                              />
                            </td>
                            <td>{studentName(s)}</td>
                            <td style={{ fontSize: '0.85rem' }}>{studentEmail(s) || '—'}</td>
                            <td>{s.speciality || '—'}</td>
                            <td>{s.course || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="pager">
                  <span>
                    Стр. {page + 1} из {Math.max(totalPages, 1)} · всего {totalElements}
                  </span>
                  <label className="pager__size">
                    На странице
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(0);
                      }}
                    >
                      {PAGE_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="pager__btns">
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={page <= 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      Назад
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={totalPages && page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Вперёд
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      ) : null}

      <form className="panel panel--accent" onSubmit={handleSend}>
        <h2 className="panel__title">Письмо</h2>
        <p className="page__lead" style={{ marginTop: 0 }}>
          HTML и подстановка имени не работают. Переносы строк сохраняются.
          Адрес берёт сервер: почта регистрации, если её нет — email карточки.
        </p>
        <div className="field">
          <label htmlFor="mail-subject">Тема</label>
          <input
            id="mail-subject"
            value={subject}
            maxLength={SUBJECT_MAX}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <p className="page__lead" style={{ margin: '0.35rem 0 0' }}>
            {subject.length} / {SUBJECT_MAX}
          </p>
        </div>
        <div className="field">
          <label htmlFor="mail-body">Текст</label>
          <textarea
            id="mail-body"
            rows={8}
            value={body}
            maxLength={BODY_MAX}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          <p className="page__lead" style={{ margin: '0.35rem 0 0' }}>
            {body.length} / {BODY_MAX}
          </p>
        </div>
        {sendError ? <div className="alert alert--error">{sendError}</div> : null}
        <div className="form-row" style={{ marginTop: '0.75rem', alignItems: 'center' }}>
          <button type="submit" className="btn btn--primary" disabled={!canSend}>
            {sending ? 'Отправка…' : 'Отправить'}
          </button>
          <span className="page__lead" style={{ margin: 0 }}>
            Получателей: {recipientCount == null ? '…' : recipientCount}
          </span>
        </div>
      </form>

      {report ? (
        <>
          <ResultBlock
            title="Отправлено"
            hint="Почтовый сервер принял письмо. Это не гарантия, что оно лежит во входящих."
            items={report.sent}
          />
          <ResultBlock
            title="Пропущено"
            items={report.skipped}
            showReason="skip"
          />
          <ResultBlock
            title="Не отправилось"
            hint="Этим адресам отправка не удалась. Остальные письма при этом уходят. Если адрес повторялся, смотрите на почту, а не только на имя."
            items={report.failed}
            showReason="raw"
          />
        </>
      ) : null}
    </div>
  );
}
