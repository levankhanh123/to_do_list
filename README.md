# Daily Corner

Ứng dụng quản lý task + mood/photo journal.

## Stack

- Frontend: React, Vite, Tailwind CSS, lucide-react
- Backend: Laravel 12
- Local hiện tại: SQLite để chạy ngay, không cần bật XAMPP/MySQL
- Deploy thật: MySQL hoặc PostgreSQL trên hosting/server

## Chạy local

Backend:

```bash
cd backend
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5174
```

Mở app tại:

```text
http://127.0.0.1:5174
```

## Dùng MySQL Local

Hiện tại app đang dùng SQLite nên bạn chưa cần bật XAMPP. Khi muốn chuyển sang MySQL local:

1. Bật MySQL trong XAMPP.
2. Tạo database tên `daily_corner`.
3. Sửa file `backend/.env`:

```text
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=daily_corner
DB_USERNAME=root
DB_PASSWORD=
```

4. Chạy migrate:

```bash
cd backend
php artisan migrate:fresh
```

Mẫu cấu hình MySQL nằm ở `backend/.env.mysql.example`.

## Deploy public

Frontend có thể deploy lên Vercel hoặc Netlify. Set biến môi trường:

```text
VITE_API_URL=https://your-laravel-domain.com/api
```

Backend Laravel có thể deploy lên Render, Railway, VPS, Laravel Forge hoặc shared hosting có PHP 8.2+. Khi deploy, không dùng MySQL trong XAMPP trên máy bạn. Database phải nằm trên server/hosting, ví dụ MySQL của shared hosting, Railway, Render, PlanetScale, VPS hoặc dịch vụ cloud database.

Luồng deploy gọn:

1. Deploy backend Laravel trước.
2. Tạo database MySQL trên hosting.
3. Set `.env` production theo `backend/.env.mysql.example`.
4. Chạy `php artisan migrate --force`.
5. Deploy frontend React.
6. Set `VITE_API_URL` trỏ về domain Laravel `/api`.

Với bản public thật, nên set CORS theo domain frontend thay vì `*`.

## Deploy Backend Lên Koyeb

Repository này đã có Dockerfile cho Laravel ở `backend/Dockerfile`.

Trước khi deploy backend, trong Aiven bạn cần tạo **MySQL service**, không phải Kafka. Service trong ảnh hiện tại là Kafka nên chưa dùng được cho Laravel.

Trên Koyeb:

1. Create Web Service.
2. Chọn GitHub repository `levankhanh123/to_do_list`.
3. Chọn branch `main`.
4. Work directory: `backend`.
5. Builder: Dockerfile.
6. Dockerfile path: `Dockerfile`.
7. Exposed port: `8000`, protocol HTTP.
8. Thêm environment variables:

```text
APP_NAME=Daily Corner
APP_ENV=production
APP_KEY=base64:your-generated-key
APP_DEBUG=false
APP_URL=https://your-koyeb-domain.koyeb.app
APP_LOCALE=vi
APP_FALLBACK_LOCALE=en

DB_CONNECTION=mysql
DB_HOST=your-aiven-mysql-host
DB_PORT=your-aiven-mysql-port
DB_DATABASE=defaultdb
DB_USERNAME=avnadmin
DB_PASSWORD=your-aiven-password
MYSQL_ATTR_SSL_CA_CONTENT=-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
RUN_MIGRATIONS=true
```

Tạo `APP_KEY` bằng lệnh local:

```bash
cd backend
php artisan key:generate --show
```

Sau khi Koyeb deploy xong, backend URL sẽ có dạng:

```text
https://your-koyeb-domain.koyeb.app
```

Kiểm tra API:

```text
https://your-koyeb-domain.koyeb.app/api/tasks
```

Với Aiven MySQL có `SSL mode = REQUIRED`, mở dòng `CA certificate`, copy toàn bộ certificate và đưa vào biến `MYSQL_ATTR_SSL_CA_CONTENT` trên Koyeb. Container sẽ tự ghi certificate vào file khi start.

## Scripts kiểm tra

```bash
cd frontend
npm run lint
npm run build
```

```bash
cd backend
php artisan test
```
