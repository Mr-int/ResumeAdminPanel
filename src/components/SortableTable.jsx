import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableRow({ id, disabled, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };
  return (
    <tr ref={setNodeRef} style={style} className={isDragging ? 'sortable-row--dragging' : ''}>
      <td className="sortable-row__handle-cell">
        <button
          type="button"
          className="sortable-row__handle btn btn--ghost"
          aria-label="Перетащить"
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
      </td>
      {children}
    </tr>
  );
}

/**
 * @param {{
 *   items: { id: string|number }[],
 *   disabled?: boolean,
 *   onReorder: (orderedIds: (string|number)[]) => void | Promise<void>,
 *   renderCells: (item: object, index: number) => import('react').ReactNode,
 *   headerCells: import('react').ReactNode,
 *   extraHeaderCells?: import('react').ReactNode,
 * }} props
 */
export function SortableTable({
  items,
  disabled = false,
  onReorder,
  renderCells,
  headerCells,
  extraHeaderCells,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((x) => String(x.id) === String(active.id));
    const newIndex = items.findIndex((x) => String(x.id) === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    await onReorder(next.map((x) => x.id));
  }

  const ids = items.map((x) => String(x.id));

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th style={{ width: 44 }} aria-label="Порядок" />
              {headerCells}
              {extraHeaderCells}
            </tr>
          </thead>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <tbody>
              {items.map((item, index) => (
                <SortableRow key={item.id} id={String(item.id)} disabled={disabled}>
                  {renderCells(item, index)}
                </SortableRow>
              ))}
            </tbody>
          </SortableContext>
        </table>
      </div>
    </DndContext>
  );
}
