# Video Downloader

Веб-приложение для скачивания видео с YouTube (включая YouTube Music) с премиум-дизайном.

![Video Downloader](https://img.shields.io/badge/version-2.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Поддерживаемые платформы

- ✅ YouTube (включая YouTube Music)
- ⏳ Instagram (в разработке)
- ⏳ TikTok (в разработке)

## Возможности

- 🎬 Скачивание видео в различных качествах (360p - 1080p)
- 🎵 Скачивание только аудио (M4A формат) или только видео
- 🖼️ Превью видео перед скачиванием
- 📊 Отображение прогресса загрузки (Подготовка → X%)
- 🎨 Премиум-дизайн с эффектами стекла и анимациями
- 🔒 HTTPS поддержка
- ⏱️ Без ограничений по длительности видео
- 📱 Адаптивный интерфейс
- 🌐 **Прокси/VPN** — поддержка SOCKS5, HTTP прокси, VLESS (через Xray)

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
│  [           Скачать            ]       │
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
After=network.target xray.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/video_downloader/backend
ExecStart=/opt/video_downloader/backend/viddown
Restart=always
RestartSec=5
Environment=PORT=8080
Environment=MAX_CONCURRENT=5
Environment=RATE_LIMIT_RPM=30
Environment=YTDLP_PATH=/usr/local/bin/yt-dlp
Environment="PROXY_URL=socks5://127.0.0.1:1080"

[Install]
WantedBy=multi-user.target
```

> **Прокси/VPN:** Для обхода блокировок YouTube настройте Xray (VLESS) как локальный SOCKS5-прокси на порту 1080. См. раздел «Прокси и VPN» ниже.

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
| YTDLP_PATH | /usr/local/bin/yt-dlp | Путь к yt-dlp |
| MAX_CONCURRENT | 5 | Макс. параллельных загрузок |
| RATE_LIMIT_RPM | 30 | Лимит запросов в минуту |
| PROXY_URL | — | Прокси для yt-dlp (socks5://, http://) |
| COOKIES_FILE | — | Путь к файлу cookies для yt-dlp |

## Прокси и VPN

Если YouTube блокирует IP сервера, используйте прокси или VPN:

**Вариант 1: VLESS (Xray)**  
1. Установите Xray: `bash <(curl -L https://raw.githubusercontent.com/XTLS/Xray-install/main/install-release.sh)`  
2. Настройте `/usr/local/etc/xray/config.json` с вашим VLESS-сервером и локальным SOCKS5 inbound на `127.0.0.1:1080`  
3. Установите `PROXY_URL=socks5://127.0.0.1:1080`

**Вариант 2: SOCKS5/HTTP прокси**  
Установите `PROXY_URL=socks5://user:pass@host:port` или `PROXY_URL=http://host:port`

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
│   │   ├── hooks/      # Custom hooks (useDisclaimer)
│   │   ├── types/      # TypeScript типы
│   │   ├── App.tsx     # Главный компонент
│   │   └── index.css   # Глобальные стили
│   └── package.json
└── README.md
```

## Известные ограничения

- YouTube может блокировать IP датацентров. Используйте прокси/VPN (PROXY_URL).
- Требуется ffmpeg для объединения видео+аудио потоков.

## Лицензия

MIT

## Автор

by goudini
