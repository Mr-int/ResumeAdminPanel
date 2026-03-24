/**
 * Списки записей студента без таблицы data / JSON — карточки с понятными полями.
 */

function Card({ children, onDelete, deleteDisabled, recordId }) {
  return (
    <li className="extended-record-card">
      <div className="extended-record-card__main">{children}</div>
      <div className="extended-record-card__actions">
        {recordId != null ? (
          <span className="extended-record-card__ref" title="Внутренний идентификатор в API">
            запись #{recordId}
          </span>
        ) : null}
        <button
          type="button"
          className="btn btn--danger btn--small"
          disabled={deleteDisabled}
          onClick={onDelete}
        >
          Удалить
        </button>
      </div>
    </li>
  );
}

function Empty() {
  return <p className="extended-record-list__empty">Пока нет записей</p>;
}

function Line({ label, children }) {
  if (children == null || children === '') return null;
  return (
    <div className="extended-record-card__line">
      <span className="extended-record-card__label">{label}</span>
      <span className="extended-record-card__value">{children}</span>
    </div>
  );
}

function normExp(item) {
  const e = item?.experience && typeof item.experience === 'object' ? item.experience : item;
  return {
    position: e?.position ?? item?.position ?? '',
    additionalInfo: e?.additionalInfo ?? item?.additionalInfo ?? '',
    startDate: e?.startDate ?? item?.startDate ?? '',
    endDate: e?.endDate ?? item?.endDate ?? '',
    companyId: item?.companyId,
  };
}

function normInst(item) {
  const ins = item?.institution && typeof item.institution === 'object' ? item.institution : item;
  return {
    educationId: item?.educationId ?? ins?.educationId,
    startYear: ins?.startYear ?? item?.startYear,
    endYear: ins?.endYear ?? item?.endYear,
  };
}

export function ExperienceRecordList({ items, onDelete }) {
  if (!items?.length) return <Empty />;
  return (
    <ul className="extended-record-list">
      {items.map((item, idx) => {
        const x = normExp(item);
        const title = x.position || 'Опыт работы';
        return (
          <Card
            key={item.id ?? `exp-${idx}`}
            recordId={item.id}
            deleteDisabled={!item.id}
            onDelete={() => onDelete(item.id)}
          >
            <div className="extended-record-card__title">{title}</div>
            <Line label="Компания (ID в справочнике)">
              {x.companyId != null && x.companyId !== '' ? String(x.companyId) : null}
            </Line>
            <Line label="Период">
              {[x.startDate, x.endDate].filter(Boolean).join(' — ') || null}
            </Line>
            <Line label="Дополнительно">{x.additionalInfo}</Line>
          </Card>
        );
      })}
    </ul>
  );
}

export function InstitutionRecordList({ items, onDelete }) {
  if (!items?.length) return <Empty />;
  return (
    <ul className="extended-record-list">
      {items.map((item, idx) => {
        const x = normInst(item);
        return (
          <Card
            key={item.id ?? `ins-${idx}`}
            recordId={item.id}
            deleteDisabled={!item.id}
            onDelete={() => onDelete(item.id)}
          >
            <div className="extended-record-card__title">Учебное заведение</div>
            <Line label="Связь с Education (ID)">
              {x.educationId != null && x.educationId !== '' ? String(x.educationId) : null}
            </Line>
            <Line label="Годы обучения">
              {x.startYear != null && x.endYear != null
                ? `${x.startYear} — ${x.endYear}`
                : null}
            </Line>
          </Card>
        );
      })}
    </ul>
  );
}

export function EducationRecordList({ items, onDelete }) {
  if (!items?.length) return <Empty />;
  return (
    <ul className="extended-record-list">
      {items.map((item, idx) => (
        <Card
          key={item.id ?? `edu-${idx}`}
          recordId={item.id}
          deleteDisabled={!item.id}
          onDelete={() => onDelete(item.id)}
        >
          <div className="extended-record-card__title">
            {item.institution || 'Образование'}
          </div>
          <Line label="Сайт">{item.webUrl}</Line>
          <Line label="Дополнительно">{item.additionalInfo}</Line>
        </Card>
      ))}
    </ul>
  );
}

export function PortfolioRecordList({ items, onDelete }) {
  if (!items?.length) return <Empty />;
  return (
    <ul className="extended-record-list extended-record-list--portfolio">
      {items.map((item, idx) => (
        <Card
          key={item.id ?? `pf-${idx}`}
          recordId={item.id}
          deleteDisabled={!item.id}
          onDelete={() => onDelete(item.id)}
        >
          <div className="extended-record-card__title">
            {item.name || 'Проект'}
          </div>
          <Line label="Ссылка">
            {item.link ? (
              <a href={item.link} target="_blank" rel="noopener noreferrer">
                {item.link}
              </a>
            ) : null}
          </Line>
          <Line label="Описание">{item.additionalInfo}</Line>
        </Card>
      ))}
    </ul>
  );
}
