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
