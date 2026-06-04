/**
 * @param {{ rows: { label: string, value: number }[], maxValue?: number }} props
 */
export function BarChart({ rows, maxValue }) {
  const max = maxValue ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="bar-chart">
      {rows.map((row) => (
        <div key={row.label} className="bar-chart__row">
          <div className="bar-chart__label" title={row.label}>
            {row.label}
          </div>
          <div className="bar-chart__track">
            <div
              className="bar-chart__fill"
              style={{ width: `${Math.round((row.value / max) * 100)}%` }}
            />
          </div>
          <div className="bar-chart__value">{row.value}</div>
        </div>
      ))}
    </div>
  );
}
