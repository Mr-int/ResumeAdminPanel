import { useCallback, useEffect, useState } from 'react';
import * as chatApi from '../api/chat.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { LoadingBlock } from '../components/ui/LoadingBlock.jsx';
import { FlashMessages } from '../components/ui/FlashMessages.jsx';
import { fmtDate, shortUuid } from '../lib/format.js';

const CHAT_PAGE_SIZE = 30;
const MSG_PAGE_SIZE = 100;

export function Chats() {
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
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
    if (selectedChatId) loadMessages(selectedChatId);
    else setMessages([]);
  }, [selectedChatId, loadMessages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!selectedChatId || !draft.trim()) return;
    setSending(true);
    setMsg(null);
    try {
      await chatApi.sendChatMessage(selectedChatId, draft.trim());
      setDraft('');
      setMsg({ type: 'ok', text: 'Сообщение отправлено' });
      await loadMessages(selectedChatId);
      await loadChats();
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

  const selected = chats.find((c) => c.id === selectedChatId);

  return (
    <div className="page">
      <PageHeader
        title="Чаты"
        lead="Переписка рекрутеров и студентов: просмотр, ответ от администратора, мягкое удаление сообщений."
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
                    <span className="chats-list__title">
                      {shortUuid(c.recruiterId)} ↔ {shortUuid(c.studentId)}
                    </span>
                    <span className="chats-list__preview">
                      {c.lastMessagePreview || '—'}
                    </span>
                    <span className="chats-list__meta">
                      {fmtDate(c.lastActivityAt)}
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

        <div className="panel chats-layout__thread">
          <h2 className="panel__title">Переписка</h2>
          {!selectedChatId ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Выберите чат слева</p>
          ) : (
            <>
              <p className="page__lead" style={{ marginTop: 0 }}>
                Чат {shortUuid(selectedChatId)}
                {selected ? ` · рекрутер ${shortUuid(selected.recruiterId)} · студент ${shortUuid(selected.studentId)}` : ''}
              </p>
              {messagesLoading ? (
                <LoadingBlock />
              ) : (
                <div className="chat-thread">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`chat-message${m.deletedAt || m.deletedByAdmin ? ' chat-message--deleted' : ''}`}
                    >
                      <div className="chat-message__head">
                        <strong>{m.authorUsername ?? '—'}</strong>
                        <span>{fmtDate(m.createdAt)}</span>
                        {m.messageKind ? <span className="chat-message__kind">{m.messageKind}</span> : null}
                      </div>
                      <p className="chat-message__body">
                        {m.deletedAt || m.deletedByAdmin
                          ? '(удалено)'
                          : m.body || m.systemEvent || '—'}
                      </p>
                      {!m.deletedAt && !m.deletedByAdmin ? (
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
                <button type="submit" className="btn btn--primary" disabled={sending || !draft.trim()}>
                  {sending ? 'Отправка…' : 'Отправить'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
