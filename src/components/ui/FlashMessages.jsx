export function FlashMessages({ error, success }) {
  return (
    <>
      {success ? <div className="alert alert--success">{success}</div> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}
    </>
  );
}
