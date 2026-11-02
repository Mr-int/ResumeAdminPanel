import { PageHeader } from '../components/ui/PageHeader.jsx';
import { StorageBrowser } from '../components/StorageBrowser.jsx';

export function Storage() {
  return (
    <div className="page">
      <PageHeader
        title="Хранилище"
        lead="Картинки для проектов, специальностей и галерей. Загрузите файл и вставьте его путь в карточку."
      />
      <div className="panel">
        <StorageBrowser />
      </div>
    </div>
  );
}
