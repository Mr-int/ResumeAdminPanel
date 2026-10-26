import { useState } from 'react';
import {
  ACCOUNT_REJECTION_REASONS,
  OTHER_REJECTION_REASON,
  accountRejectBody,
} from '../lib/accountRejection.js';

export function AccountRejectForm({ title, submitting, onSubmit, onCancel }) {
  const [reasonCode, setReasonCode] = useState(ACCOUNT_REJECTION_REASONS[0].code);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const commentRequired = reasonCode === OTHER_REJECTION_REASON;

  function handleSubmit(event) {
    event.preventDefault();
    const result = accountRejectBody(reasonCode, comment);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError('');
    onSubmit(result.body);
  }

  return (
    <div className="panel" style={{ marginTop: '1rem', marginBottom: 0 }}>
      <h2 className="panel__title">{title}</h2>
      <form onSubmit={handleSubmit}>
        {error ? <div className="alert alert--error">{error}</div> : null}
        <div className="field" style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="account-reject-reason">Причина</label>
          <select
            id="account-reject-reason"
            value={reasonCode}
            onChange={(event) => {
              setReasonCode(event.target.value);
              if (error) setError('');
            }}
          >
            {ACCOUNT_REJECTION_REASONS.map((reason) => (
              <option key={reason.code} value={reason.code}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="account-reject-comment">
            {commentRequired ? 'Комментарий' : 'Комментарий (необязательно)'}
          </label>
          <textarea
            id="account-reject-comment"
            rows={3}
            maxLength={2000}
            value={comment}
            required={commentRequired}
            onChange={(event) => {
              setComment(event.target.value);
              if (error) setError('');
            }}
          />
        </div>
        <div className="form-row" style={{ marginTop: '0.75rem' }}>
          <button type="submit" className="btn btn--danger" disabled={submitting}>
            Подтвердить отклонение
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={submitting}
            onClick={onCancel}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
