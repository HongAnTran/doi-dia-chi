# SKELETON

Skeleton **Next.js 16** (App Router) với **PostgreSQL + Prisma**, **Better Auth** (email/mật khẩu + Google), **Tailwind CSS 4**, **shadcn/ui** và **React 19**.

## Yêu cầu

- [Node.js](https://nodejs.org/) (khuyến nghị LTS)
- [pnpm](https://pnpm.io/)
- PostgreSQL (local hoặc hosted)

## Cài đặt nhanh

```bash
pnpm install
```

Tạo file `.env` ở thư mục gốc (xem mục biến môi trường bên dưới), sau đó:

```bash
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Ứng dụng chạy tại [http://localhost:3000](http://localhost:3000).

## Biến môi trường

Các biến được validate trong `src/env.ts` (Zod). Tối thiểu cần:

| Biến                 | Mô tả                                          |
| -------------------- | ---------------------------------------------- |
| `DATABASE_URL`       | Chuỗi kết nối PostgreSQL                       |
| `BETTER_AUTH_SECRET` | Chuỗi bí mật, **ít nhất 32 ký tự**             |
| `BETTER_AUTH_URL`    | URL gốc của app (dev: `http://localhost:3000`) |

Đăng nhập Google (tùy chọn): thêm `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` nếu bật OAuth Google trong `src/lib/auth.ts`.

## Scripts hay dùng

| Lệnh                        | Mục đích                                                |
| --------------------------- | ------------------------------------------------------- |
| `pnpm dev`                  | Chạy dev server                                         |
| `pnpm build` / `pnpm start` | Build và chạy production                                |
| `pnpm check`                | `typecheck` + `lint` + `format:check`                   |
| `pnpm db:generate`          | Sinh Prisma Client (output: `src/app/generated/prisma`) |
| `pnpm db:migrate`           | Chạy migration dev                                      |
| `pnpm db:studio`            | Mở Prisma Studio                                        |

## Cấu trúc `src` (tóm tắt)

- **`src/app/`** — Routes, layout, `globals.css`. API auth: `src/app/api/auth/[...all]/route.ts`.
- **`src/components/`** — UI (shadcn trong `components/ui/`), theme (`theme-provider.tsx`, `mode-toggle.tsx`).
- **`src/lib/`** — `auth.ts` (cấu hình Better Auth), `auth-client.ts` (client React), `prisma.ts` (singleton Prisma + adapter `pg`), `utils.ts`.
- **`src/env.ts`** — Schema và parse biến môi trường; import `env` thay vì dùng `process.env` trực tiếp khi cần type an toàn.
- **`src/app/generated/prisma/`** — Client Prisma do generator tạo (không chỉnh tay).

## Database & Prisma

- Schema: `prisma/schema.prisma` (PostgreSQL, model User/Session/Account/Verification phục vụ Better Auth).
- Sau khi đổi schema: `pnpm db:migrate` (hoặc workflow migrate bạn đang dùng), rồi `pnpm db:generate` nếu cần.

## Auth & trang mẫu

- Đăng ký / đăng nhập: `src/app/sign-up/page.tsx`, `src/app/sign-in/page.tsx`.
- Trang chủ mẫu: `src/app/page.tsx` (đọc session, ví dụ truy vấn Prisma).

Client-side gọi `authClient` từ `src/lib/auth-client.ts`; server dùng `auth` từ `src/lib/auth.ts`.

## UI (shadcn)

Dự án đã có `components.json`. Thêm component:

```bash
pnpm dlx shadcn@latest add <tên-component>
```
