export function FlashMessages({ error, success, warning }) {
  return (
    <>
      {success ? <div className="alert alert--success">{success}</div> : null}
      {warning ? <div className="alert alert--warning">{warning}</div> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}
    </>
  );
}
