# Video Downloader

Веб-приложение для скачивания видео с популярных платформ с премиум-дизайном.

![Video Downloader](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Поддерживаемые платформы

- ✅ YouTube (включая YouTube Music)
- ⏳ Instagram (в разработке)
- ⏳ TikTok (в разработке)

## Возможности

- 🎬 Скачивание видео в различных качествах (360p - 1080p)
- 🎵 Скачивание только аудио (M4A формат)
- 🖼️ Превью видео перед скачиванием
- 📊 Двухфазное отображение прогресса:
  - "Скачивание на сервере..." — пока yt-dlp обрабатывает видео
  - "Загрузка X%" — передача файла в браузер
- 📋 **Очередь загрузок** — до 3 видео в очереди
- 🎨 Премиум-дизайн с эффектами стекла и анимациями
- 🔒 HTTPS поддержка
- ⏱️ Без ограничений по длительности видео
- 📱 Адаптивный интерфейс

## Скриншот

```
┌─────────────────────────────────────────┐
│           Video Downloader              │
│     Скачивайте видео быстро и без       │
│            ограничений                  │
│                                         │
│  [YouTube ●] [Instagram скоро] [TikTok] │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Вставьте ссылку на видео...    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🖼️ Превью видео               │    │
│  │ Название: Example Video         │    │
│  │ Длительность: 5:30              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Видео] [Аудио]                        │
│  ○ 1080p Full HD (видео + аудио)       │
│  ○ 720p HD (видео + аудио)             │
│  ○ Лучшее аудио (128kbps)              │
│                                         │
│  [      Скачать / В очередь      ]      │
│                                         │
│  ┌────────────────┐ Очередь загрузок    │
│  │ ▶ Video 1  45% │ (плавающая панель)  │
│  │ ⏳ Video 2     │                     │
│  │ ⏳ Video 3     │                     │
│  └────────────────┘                     │
└─────────────────────────────────────────┘
```

## Технологии

### Backend
- Go 1.21+
- Chi router
- yt-dlp с поддержкой Node.js runtime
- Semaphore для ограничения параллельных загрузок

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion (анимации)
- Vite
- Lucide React (иконки)

## Установка

### Требования
- Go 1.21+
- Node.js 18+ (требуется для yt-dlp)
- yt-dlp (последняя версия)
- ffmpeg
- Nginx (для production)

### Backend

```bash
cd backend
go mod download
go build -o viddown .
./viddown
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # Development
npm run build    # Production
```

### Systemd сервис (рекомендуется)

Создайте файл `/etc/systemd/system/viddown.service`:

```ini
[Unit]
Description=Video Downloader Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/video_downloader/backend
ExecStart=/opt/video_downloader/backend/viddown
Restart=always
RestartSec=5
Environment=PORT=8080
Environment=MAX_CONCURRENT=3
Environment=RATE_LIMIT_RPM=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable viddown
sudo systemctl start viddown
```

### Nginx конфигурация

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Frontend
    location /download {
        alias /opt/video_downloader/frontend/dist;
        try_files $uri $uri/ /download/index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
        proxy_buffering off;
    }

    # Redirect root to /download
    location = / {
        return 301 /download;
    }
}
```

## Переменные окружения

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| PORT | 8080 | Порт API сервера |
| YTDLP_PATH | yt-dlp | Путь к yt-dlp |
| MAX_CONCURRENT | 3 | Макс. параллельных загрузок |
| RATE_LIMIT_RPM | 10 | Лимит запросов в минуту |

## API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | /api/health | Проверка статуса сервера |
| POST | /api/analyze | Анализ видео по URL |
| GET | /api/download | Скачивание видео |
| GET | /api/thumbnail | Прокси для превью изображений |

## Структура проекта

```
video_downloader/
├── backend/
│   ├── config/         # Конфигурация
│   ├── handlers/       # HTTP обработчики
│   ├── middleware/     # Middleware (CORS, Rate Limiting)
│   ├── services/       # Бизнес-логика (yt-dlp, semaphore)
│   └── main.go
├── frontend/
│   ├── src/
│   │   ├── api/        # API клиент
│   │   ├── components/ # React компоненты
│   │   ├── hooks/      # Custom hooks (useDisclaimer, useDownloadQueue)
│   │   ├── types/      # TypeScript типы
│   │   ├── App.tsx     # Главный компонент
│   │   └── index.css   # Глобальные стили
│   └── package.json
└── README.md
```

## Известные ограничения

- Некоторые хостинг-провайдеры блокируют доступ к серверам Google Video (googlevideo.com). Убедитесь, что ваш сервер может подключаться к этим адресам.
- Для корректной работы yt-dlp требуется Node.js runtime (используется флаг `--js-runtimes node`).
- Рекомендуется использовать `--force-ipv4` если есть проблемы с IPv6.

## Лицензия

MIT

## Автор

by goudini
