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

## Docker & CI/CD

Dự án có sẵn `Dockerfile` (multi-stage, Next.js standalone), `docker-compose.yml` (Next.js + Postgres) và workflow `.github/workflows/ci-cd.yml`.

### Luồng CI/CD

Mỗi lần push lên `master`:

1. **test** — `pnpm install` → `pnpm prisma generate` → `pnpm check` (typecheck + lint + format).
2. **build-and-push** — chạy nếu test pass: build image `linux/amd64` rồi push lên Docker Hub với 2 tag: `latest` và `sha-<short>`.
3. **deploy** — SSH vào VPS, chạy `docker compose pull && docker compose up -d` rồi dọn image cũ (`docker image prune -f`).

Pull request vào `master` chỉ chạy job test (không build, không deploy).

### Setup một lần

#### 1) Trên Docker Hub

- Tạo repo `xeup` (public hoặc private).
- Tạo Access Token (Account Settings → Security → New Access Token, scope **Read & Write**).

#### 2) Trên VPS

```bash
# cài Docker (nếu chưa)
curl -fsSL https://get.docker.com | sh

# tạo thư mục project
mkdir -p ~/xeup && cd ~/xeup

# copy docker-compose.yml và .env.production.example từ repo về
# rồi đổi tên thành .env và chỉnh giá trị
cp .env.production.example .env
nano .env

# nếu Docker Hub repo là private:
docker login

# chạy lần đầu để verify
docker compose pull && docker compose up -d
```

Tạo SSH key dành riêng cho deploy và thêm public key vào `~/.ssh/authorized_keys` của VPS.

#### 3) GitHub Secrets

Vào repo → Settings → Secrets and variables → Actions, thêm:

| Secret                | Giá trị                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `DOCKERHUB_USERNAME`  | Username Docker Hub                                                |
| `DOCKERHUB_TOKEN`     | Access token tạo ở bước 1                                          |
| `VPS_HOST`            | IP hoặc domain của VPS                                             |
| `VPS_USER`            | User SSH (vd `root`, `ubuntu`)                                     |
| `VPS_SSH_KEY`         | **Private key** SSH (toàn bộ nội dung, gồm `-----BEGIN ...-----`)  |
| `VPS_SSH_PORT`        | (Tuỳ chọn) Port SSH nếu khác `22`                                  |
| `VPS_PROJECT_PATH`    | Đường dẫn tuyệt đối tới thư mục chứa `docker-compose.yml` (vd `/root/xeup`) |

#### 4) Cập nhật `docker-compose.yml` trên VPS

Trong `.env` trên VPS đặt `DOCKER_IMAGE=<DOCKERHUB_USERNAME>/xeup:latest`. Mọi lần deploy GHA sẽ pull tag `latest` mới nhất.

### Build thủ công (khẩn cấp / không qua GHA)

```bash
docker buildx build --platform linux/amd64 \
  -t <username>/xeup:latest --push .

# trên VPS
docker compose pull && docker compose up -d
```

## File Naming Conventions

- Name component files in kebab-case, e.g. `sign-in-form.tsx`, `submit-button.tsx`.
- Export React components in PascalCase, e.g. `SignInForm`, `SubmitButton`.
- Name hook files with the `use-` prefix in kebab-case, e.g. `use-media-query.ts`.
- Export hooks in camelCase and start them with `use`, e.g. `useMediaQuery`.
- Name lib, utility, config, service, and validation files in kebab-case, e.g. `api-client.ts`, `auth-utils.ts`.
- Name route folders in kebab-case, e.g. `sign-in`, `user-settings`.
- Keep Next.js special files using their official names: `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx`.
- Avoid broad barrel exports such as `components/index.ts`; prefer direct imports from the source file.
