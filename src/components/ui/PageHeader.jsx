export function PageHeader({ title, lead, children }) {
  return (
    <header className="page-header">
      <div className="page-header__main">
        <h1 className="page__title">{title}</h1>
        {lead ? <p className="page__lead">{lead}</p> : null}
      </div>
      {children ? <div className="page-header__actions">{children}</div> : null}
    </header>
  );
}
