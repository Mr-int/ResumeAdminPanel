export function DetailGrid({ items }) {
  return (
    <dl className="detail-grid">
      {items.map(({ label, value, key }) => (
        <div className="detail-grid__row" key={key ?? label}>
          <dt>{label}</dt>
          <dd>{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
