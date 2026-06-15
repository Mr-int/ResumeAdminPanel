import { PageHeader } from '../components/ui/PageHeader.jsx';
import { StorageBrowser } from '../components/StorageBrowser.jsx';

export function Storage() {
  return (
    <div className="page">
      <PageHeader
        title="Хранилище"
        lead="Файловый менеджер изображений на сервере API: загрузка, просмотр и удаление. Пути из хранилища подставляются в проекты, специальности и галереи как /api/main/photo/имя_файла."
      />
      <div className="panel">
        <StorageBrowser />
      </div>
    </div>
  );
}
