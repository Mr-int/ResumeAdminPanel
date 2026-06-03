export function Pagination({ page, totalPages, totalElements, onPrev, onNext }) {
  const current = page + 1;
  const pages = Math.max(totalPages, 1);

  return (
    <div className="pager">
      <span>
        Страница {current} из {pages}
        {totalElements != null ? ` · всего ${totalElements}` : ''}
      </span>
      <div className="pager__btns">
        <button type="button" className="btn btn--ghost" disabled={page <= 0} onClick={onPrev}>
          Назад
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={totalPages > 0 && page >= totalPages - 1}
          onClick={onNext}
        >
          Вперёд
        </button>
      </div>
    </div>
  );
}
