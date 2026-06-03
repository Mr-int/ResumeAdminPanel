import { PageHeader } from '../components/ui/PageHeader.jsx';
import { StorageBrowser } from '../components/StorageBrowser.jsx';

export function Storage() {
  return (
    <div className="page">
      <PageHeader
        title="Хранилище"
        lead="Изображения на сервере: просмотр, загрузка и удаление. Файлы используются в проектах и других разделах через путь /main/photo/…"
      />
      <div className="panel">
        <StorageBrowser />
      </div>
    </div>
  );
}
