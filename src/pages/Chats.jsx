import { useCallback, useEffect, useState } from 'react';
import * as chatApi from '../api/chat.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';
import { fmtDate, shortUuid } from '../lib/format.js';
import {
  CHAT_SYSTEM_EVENT_LABELS,
  REQUEST_STATUS_LABELS,
  TU_PHASE_LABELS,
  labelOf,
} from '../lib/labels.js';

const CHAT_PAGE_SIZE = 30;
const MSG_PAGE_SIZE = 100;

function chatParticipantsLabel(chat) {
  if (!chat) return '—';
  const recruiter =
    chat.recruiterDisplayName?.trim() ||
    (chat.recruiterId ? shortUuid(chat.recruiterId) : '—');
  const student =
    chat.studentDisplayName?.trim() ||
    (chat.studentId ? shortUuid(chat.studentId) : '—');
  return `${recruiter} ↔ ${student}`;
}

function messageBody(m) {
  if (m.deletedAt || m.deletedByAdmin) return '(удалено)';
  if (m.messageKind === 'SYSTEM' && m.systemEvent) {
    return labelOf(CHAT_SYSTEM_EVENT_LABELS, m.systemEvent, m.systemEvent);
  }
  return m.body || m.systemEvent || '—';
}

export function Chats() {
  const { isAdmin } = useAuth();
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [context, setContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const loadChats = useCallback(async () => {
    setChatsLoading(true);
    setError(null);
    try {
      const { data } = await chatApi.listChats(0, CHAT_PAGE_SIZE);
      const rows = data?.data ?? data?.content ?? (Array.isArray(data) ? data : []);
      setChats(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setError(e.message);
      setChats([]);
    } finally {
      setChatsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    setMessagesLoading(true);
    setError(null);
    try {
      const { data } = await chatApi.getChatMessages(chatId, 0, MSG_PAGE_SIZE);
      const rows = data?.data ?? data?.content ?? (Array.isArray(data) ? data : []);
      setMessages(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setError(e.message);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      setContext(null);
      return;
    }

    let cancelled = false;
    const chatId = selectedChatId;

    (async () => {
      setMessagesLoading(true);
      setError(null);
      try {
        const { data } = await chatApi.getChatMessages(chatId, 0, MSG_PAGE_SIZE);
        if (cancelled) return;
        const rows = data?.data ?? data?.content ?? (Array.isArray(data) ? data : []);
        setMessages(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setMessages([]);
        }
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    })();

    if (isAdmin) {
      (async () => {
        setContextLoading(true);
        try {
          const { data } = await chatApi.getChatContext(chatId);
          if (!cancelled) setContext(data ?? null);
        } catch (e) {
          if (!cancelled) {
            setContext(null);
            setError(e.message);
          }
        } finally {
          if (!cancelled) setContextLoading(false);
        }
      })();
    } else {
      setContext(null);
    }

    return () => {
      cancelled = true;
    };
  }, [selectedChatId, isAdmin]);

  async function handleSend(e) {
    e.preventDefault();
    if (!selectedChatId || !draft.trim()) return;
    const text = draft.trim();
    setSending(true);
    setMsg(null);
    try {
      await chatApi.sendChatMessage(selectedChatId, text);
      setDraft('');
      setMsg({ type: 'ok', text: 'Сообщение отправлено' });
      await loadMessages(selectedChatId);
      setChats((prev) =>
        prev.map((c) =>
          c.id === selectedChatId
            ? {
                ...c,
                lastMessagePreview: text,
                lastActivityAt: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteMessage(messageId) {
    if (!selectedChatId) return;
    if (!window.confirm('Мягко удалить сообщение (admin)?')) return;
    setMsg(null);
    try {
      await chatApi.adminDeleteChatMessage(selectedChatId, messageId);
      setMsg({ type: 'ok', text: 'Сообщение удалено' });
      await loadMessages(selectedChatId);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDeleteChat() {
    if (!selectedChatId || !isAdmin) return;
    if (
      !window.confirm(
        'Удалить чат целиком? Будут удалены заявки, отклики и все сообщения.'
      )
    ) {
      return;
    }
    setDeletingChat(true);
    setMsg(null);
    try {
      await chatApi.deleteChat(selectedChatId);
      setMsg({ type: 'ok', text: 'Чат удалён' });
      setSelectedChatId(null);
      await loadChats();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingChat(false);
    }
  }

  const selected =
    chats.find((c) => c.id === selectedChatId) ?? context?.summary ?? null;
  const contextRequests = context?.requests ?? [];
  const contextApplications = context?.vacancyApplications ?? [];

  return (
    <div className="page">
      <PageHeader
        title="Чаты"
        lead="Переписка рекрутеров и студентов: просмотр, контекст заявок и ТУ, ответ администратора."
      />

      <FlashMessages error={error} success={msg?.type === 'ok' ? msg.text : null} />

      <div className="chats-layout">
        <div className="panel chats-layout__list">
          <h2 className="panel__title">Диалоги</h2>
          {chatsLoading ? (
            <LoadingBlock />
          ) : chats.length ? (
            <ul className="chats-list">
              {chats.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`chats-list__item${selectedChatId === c.id ? ' chats-list__item--active' : ''}`}
                    onClick={() => setSelectedChatId(c.id)}
                  >
                    <span className="chats-list__title">{chatParticipantsLabel(c)}</span>
                    <span className="chats-list__preview">
                      {c.lastMessagePreview || '—'}
                    </span>
                    <span className="chats-list__meta">
                      {fmtDate(c.lastActivityAt)}
                      {c.tuPhase && c.tuPhase !== 'NOT_APPLICABLE'
                        ? ` · ${labelOf(TU_PHASE_LABELS, c.tuPhase)}`
                        : ''}
                      {c.unreadCount > 0 ? ` · непрочитано: ${c.unreadCount}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Чатов нет</p>
          )}
        </div>

        <div className="chats-layout__main">
          <div className="panel chats-layout__thread">
            <h2 className="panel__title">Переписка</h2>
            {!selectedChatId ? (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Выберите чат слева</p>
            ) : (
              <>
                <div className="chats-thread-head">
                  <p className="page__lead" style={{ margin: 0 }}>
                    {chatParticipantsLabel(selected)}
                    {selected?.tuPhase && selected.tuPhase !== 'NOT_APPLICABLE' ? (
                      <span className="badge badge--muted" style={{ marginLeft: '0.5rem' }}>
                        {labelOf(TU_PHASE_LABELS, selected.tuPhase)}
                      </span>
                    ) : null}
                  </p>
                  {isAdmin ? (
                    <button
                      type="button"
                      className="btn btn--danger btn--small"
                      disabled={deletingChat}
                      onClick={handleDeleteChat}
                    >
                      {deletingChat ? 'Удаление…' : 'Удалить чат'}
                    </button>
                  ) : null}
                </div>
                {messagesLoading ? (
                  <LoadingBlock />
                ) : (
                  <div className="chat-thread">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`chat-message${m.deletedAt || m.deletedByAdmin ? ' chat-message--deleted' : ''}${m.messageKind === 'SYSTEM' ? ' chat-message--system' : ''}`}
                      >
                        <div className="chat-message__head">
                          <strong>
                            {m.messageKind === 'SYSTEM'
                              ? 'Система'
                              : m.authorUsername ?? '—'}
                          </strong>
                          <span>{fmtDate(m.createdAt)}</span>
                          {m.messageKind ? (
                            <span className="chat-message__kind">{m.messageKind}</span>
                          ) : null}
                        </div>
                        <p className="chat-message__body">{messageBody(m)}</p>
                        {isAdmin && !m.deletedAt && !m.deletedByAdmin ? (
                          <button
                            type="button"
                            className="btn btn--danger btn--small"
                            onClick={() => handleDeleteMessage(m.id)}
                          >
                            Удалить
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
                <form className="chat-compose" onSubmit={handleSend}>
                  <div className="field">
                    <label htmlFor="chat-draft">Ответ администратора</label>
                    <textarea
                      id="chat-draft"
                      rows={3}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Текст сообщения…"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={sending || !draft.trim()}
                  >
                    {sending ? 'Отправка…' : 'Отправить'}
                  </button>
                </form>
              </>
            )}
          </div>

          {isAdmin && selectedChatId ? (
            <div className="panel chats-layout__context">
              <h2 className="panel__title">Контекст чата</h2>
              {contextLoading ? (
                <LoadingBlock />
              ) : (
                <>
                  <section className="chat-context-section">
                    <h3 className="chat-context-section__title">Заявки</h3>
                    {contextRequests.length ? (
                      <ul className="chat-context-list">
                        {contextRequests.map((r) => (
                          <li key={r.id} className="chat-context-list__item">
                            <div>
                              <strong>#{r.id}</strong>
                              {' · '}
                              {labelOf(REQUEST_STATUS_LABELS, r.result)}
                            </div>
                            {r.tuPhase && r.tuPhase !== 'NOT_APPLICABLE' ? (
                              <div className="chat-context-list__meta">
                                ТУ: {labelOf(TU_PHASE_LABELS, r.tuPhase)}
                              </div>
                            ) : null}
                            {(r.studentTuConfirmedAt || r.recruiterTuConfirmedAt) && (
                              <div className="chat-context-list__meta">
                                {r.studentTuConfirmedAt
                                  ? `Студент: ${fmtDate(r.studentTuConfirmedAt)}`
                                  : null}
                                {r.studentTuConfirmedAt && r.recruiterTuConfirmedAt
                                  ? ' · '
                                  : null}
                                {r.recruiterTuConfirmedAt
                                  ? `Рекрутер: ${fmtDate(r.recruiterTuConfirmedAt)}`
                                  : null}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="chat-context-empty">Нет заявок</p>
                    )}
                  </section>
                  <section className="chat-context-section">
                    <h3 className="chat-context-section__title">Отклики на вакансии</h3>
                    {contextApplications.length ? (
                      <ul className="chat-context-list">
                        {contextApplications.map((a) => (
                          <li key={a.id} className="chat-context-list__item">
                            <div>
                              <strong>{a.vacancyTitle || shortUuid(a.vacancyId)}</strong>
                              {' · '}
                              {a.status}
                            </div>
                            {a.tuPhase && a.tuPhase !== 'NOT_APPLICABLE' ? (
                              <div className="chat-context-list__meta">
                                ТУ: {labelOf(TU_PHASE_LABELS, a.tuPhase)}
                              </div>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="chat-context-empty">Нет откликов</p>
                    )}
                  </section>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
