import { useEffect, useState } from 'react';
import { mainPhotoUrl } from '../../utils/mediaUrl.js';

/**
 * Превью файла из хранилища: GET /main/photo/{image_path} через same-origin /api.
 */
export function ApiPhoto({
  imagePath,
  alt = '',
  className,
  brokenClassName,
  brokenText = 'нет превью',
  ...imgProps
}) {
  const src = mainPhotoUrl(imagePath);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [imagePath, src]);

  if (!src) return null;

  if (broken) {
    return (
      <span className={brokenClassName} title="Файл в списке, но не отдаётся с сервера">
        {brokenText}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
      {...imgProps}
    />
  );
}
