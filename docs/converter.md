# Bộ chuyển đổi địa chỉ (Converter)

Tài liệu tham chiếu đầy đủ cho tính năng cốt lõi của app: chuyển đổi địa chỉ hành chính
Việt Nam giữa **hệ cũ** (63 tỉnh → quận/huyện → phường/xã, trước 2025‑07‑01) và **hệ mới**
(34 tỉnh → phường/xã, sau sáp nhập), cộng với parser địa chỉ tự do.

> Đọc tài liệu này là đủ để hiểu/sửa tính năng — không cần đọc lại toàn bộ code.
> Các tham chiếu `file:line` để tra cứu nhanh khi cần.

---

## 1. Tổng quan

App giải quyết hai bài toán:

1. **Đổi theo mã đơn vị** — biết mã ward (cũ hoặc mới) → trả về (các) đơn vị tương ứng ở
   hệ kia. Đây là luồng chính xác, không mơ hồ về nhận diện.
2. **Đổi từ địa chỉ tự do** — người dùng dán/gõ một chuỗi địa chỉ bất kỳ
   (`"85/34f lò siêu p16 q11 hcm"`) → parser nhận diện đơn vị → chuyển sang hệ đích, giữ
   nguyên phần địa chỉ cụ thể (số nhà, đường).

Đơn vị nguyên tử của cả hai hệ là **ward** (phường/xã/thị trấn/đặc khu). Mọi mapping đều ở
cấp ward. Quận/huyện ở hệ cũ chỉ dùng để phân biệt và làm "phạm vi" khi nhận diện; hệ mới
**không còn cấp quận/huyện**.

---

## 2. Nguồn dữ liệu & file tĩnh

Dữ liệu được sinh sẵn (build-time), nạp một lần vào bộ nhớ khi server khởi động — **không có
DB runtime**.

| File (`src/data/`)        | Nội dung                                                        |
| ------------------------- | -------------------------------------------------------------- |
| `old-units.json`          | 63 tỉnh → districts → wards (trước 2025‑07‑01)                  |
| `new-units.json`          | 34 tỉnh → wards (sau sáp nhập)                                  |
| `mapping.json`            | Mảng phẳng `[{ oldWardCode, newWardCode, note?, transfer? }]`   |
| `hamlets.json`            | old→new: thôn/ấp/tổ dân phố của ward cũ                         |
| `new-ward-hamlets.json`   | new→old: thôn của ward mới, ánh xạ ngược về ward cũ            |

**Sinh dữ liệu:**

- `scripts/build-data.ts` — ingest từ repo mở [`vietnamadminunits`](https://github.com/tranngocminhhieu/vietnamadminunits)
  (CSV đã xử lý). Chạy: `pnpm tsx scripts/build-data.ts`. Tải về cache ở `scripts/.cache` để
  chạy lại offline.
- `scripts/build-hamlets.ts` — sinh dữ liệu thôn (xem comment trong file về nguồn & quy tắc an toàn).

**Trường hợp đặc biệt:** 5 huyện đảo (Bạch Long Vĩ, Cồn Cỏ, Hoàng Sa, …) ở hệ cũ không có cấp
ward và trở thành "đặc khu". Chúng được biểu diễn bằng một ward tổng hợp với mã `d<districtCode>`
để cascade ward-level và mapping vẫn phủ được.

---

## 3. Khái niệm chính

### 3.1 `TransferKind` — kiểu chuyển dịch lãnh thổ

(`src/lib/address-types.ts:43`) Mô tả phần đất/dân của ward cũ chuyển vào ward mới như thế nào:

- `"landOnly"` — chỉ một phần **diện tích**, **không kèm dân cư**.
- `"fullPopulation"` — toàn bộ **dân số** của đơn vị cũ chuyển về đây.
- `undefined` — chuyển cả diện tích lẫn dân số (hoặc nhập toàn bộ).

Quan trọng cho luồng cư dân: khi đổi old→new mà ward cũ bị chia, ta **ưu tiên các đích nhận
dân cư** (loại bỏ `landOnly`) — xem `convertFreeform` (§7).

### 3.2 Quan hệ many‑to‑many

- **old → new** có thể là **1‑nhiều** (`isAmbiguous`): ward cũ bị chia vào nhiều ward mới.
- **new → old** thường là **nhiều‑1**: ward mới gộp từ nhiều ward cũ (`sources` luôn là danh
  sách đầy đủ).

### 3.3 Thôn (hamlet)

Khi có dữ liệu, thôn dùng để **gỡ mơ hồ chính xác**: với ward cũ bị chia, một thôn có
`newWardCode` ghim đúng ward mới; chiều ngược lại, mỗi thôn của ward mới ánh xạ về ward cũ.

---

## 4. Bản đồ module

| File                          | Vai trò                                                                |
| ----------------------------- | ---------------------------------------------------------------------- |
| `src/lib/address-types.ts`    | Toàn bộ type/interface (schema dữ liệu + kết quả converter).           |
| `src/lib/normalize.ts`        | `normalizeVietnamese`, `stripUnitPrefix` — chuẩn hoá để so khớp.       |
| `src/lib/converter.ts`        | Nạp dữ liệu, dựng index, và mọi hàm chuyển đổi/parse.                  |
| `src/app/api/**`              | Các route HTTP mỏng, chỉ gọi vào `converter.ts`.                       |

---

## 5. Index dựng sẵn (lúc nạp module)

Tất cả ở `src/lib/converter.ts`, build một lần:

- `oldWardIndex: Map<wardCode, {ward, district, province}>` (`:80`)
- `newWardIndex: Map<wardCode, {ward, province}>` (`:89`)
- `oldToNew: Map<oldWardCode, MappingRecord[]>` & `newToOld: Map<newWardCode, MappingRecord[]>` (`:96`)
- `hamletsByOldWard`, `hamletsByNewWard` (`:39`, `:54`) — kèm `nameNormalized` tính sẵn cho ô tìm kiếm.
- `oldProvincesByKey`, `newProvincesByKey` (`:240`, `:331`) — phục vụ parser: tra tỉnh → wards/districts
  theo **key đã chuẩn hoá** (bỏ dấu, bỏ tiền tố). Old có thêm `districtKeys` để giới hạn phạm vi.

`unitKey(name)` (`:201`) = `stripUnitPrefix(normalizeVietnamese(name))` — khoá chuẩn cho mọi tra cứu.

---

## 6. Chuyển đổi theo mã ward (chính xác)

### `convertOldToNew(oldWardCode): OldToNewResult | null` (`:147`)

- `null` nếu mã không tồn tại.
- `matches: NewUnitRef[]` — **mọi** ward mới mà ward cũ được gán vào.
- `isAmbiguous = matches.length > 1` — ward cũ bị chia.
- `hamlets?` — danh sách thôn của ward cũ (khi nguồn có), làm picker chính xác cho ward bị chia
  hoặc chỉ để hoàn thiện địa chỉ cho ward không chia.

### `convertNewToOld(newWardCode): NewToOldResult | null` (`:173`)

- `null` nếu mã không tồn tại.
- `sources: OldUnitRef[]` — **toàn bộ** ward cũ đã gộp vào ward mới (luôn là danh sách đầy đủ).
- Mỗi source có thể kèm `hamletNames` — các thôn của ward cũ đó hiện nằm trong ward mới được hỏi.
- `hamlets?` — thôn của ward mới, mỗi thôn ánh xạ ngược về ward cũ (chọn 1 thôn → ghim đúng địa chỉ cũ).

> Ward tổng hợp của huyện đảo: nếu `ward.name === district.name`, `fullAddress` không lặp tên
> (`toOldRef`, `:107`).

---

## 7. Parser địa chỉ tự do

Đây là phần phức tạp nhất. Pipeline: **tách token → phân loại → so khớp + chấm điểm → xếp hạng**.

### 7.1 Chuẩn hoá (`src/lib/normalize.ts`)

`normalizeVietnamese(input)` (`:5`): NFD → bỏ dấu tổ hợp → `đ/Đ→d` → lowercase → gộp khoảng trắng.
Cho phép so khớp không phân biệt dấu (`"Phường" ↔ "phuong"`).

`stripUnitPrefix(normalized)` (`:24`): bỏ **một** tiền tố đơn vị để token khớp tên đơn vị.
- Dạng dính số: `p6`/`f6`/`p.6`/`q1` → `6`/`1` (`f` là cách viết tắt không chính thức của "phường").
- Dạng tiền tố + tên: `"phuong thanh khe"` → `"thanh khe"`.
- Gộp số 0 đầu: `"p.06"` → `"6"`.

### 7.2 Phân loại token — `classifyToken(part)` (`src/lib/converter.ts:210`)

Trả `{ key, type }` với `type ∈ {"ward","district","province","any"}`, dựa vào **tiền tố khai báo**:

- `p`/`f`/`phường` + số → `ward`; `q`/`h`/`quận`/`huyện` + số → `district`.
- Tiền tố chữ: `phường/xã/thị trấn/tt/p/f` → `ward`; `quận/huyện/thị xã/tx/q/h` → `district`;
  `thành phố/tp/tỉnh` → `province`.
- Không tiền tố → `any` (có thể là ward **hoặc** province khi khớp).

`canBeWard(i)` = type là `ward` hoặc `any`; `canBeProvince(i)` = `province` hoặc `any` (`:359`).

### 7.3 Tách token khi KHÔNG có dấu phẩy — `segmentFreeformPart(part)` (`:303`)

Input không phẩy như `"85/34f lò siêu p16 q11 hcm"` vốn là **một** token. Hàm này chèn ranh giới
**trước mỗi "mốc" đơn vị hành chính**, biến nó thành `["85/34f lò siêu","p16","q11","hcm"]`, rồi
cho qua đúng pipeline cũ. Được gọi qua `.flatMap(segmentFreeformPart)` sau khi split dấu phẩy (`:353`),
nên áp dụng cho **cả** từng phần đã tách phẩy lẫn chuỗi không phẩy.

Một từ là "mốc" (chèn ranh giới, chỉ khi segment hiện tại đã có nội dung) nếu:

| Loại mốc                              | Ví dụ                          | Điều kiện               |
| ------------------------------------- | ------------------------------ | ----------------------- |
| Đơn vị **dính số**                    | `p16`, `q11`, `f6`, `p.16`    | luôn                    |
| Alias tỉnh (1 hoặc 2 từ)              | `hcm`, `tphcm`, `sai gon`     | luôn                    |
| Tiền tố 2 từ                          | `thành phố`, `thị xã`, `thị trấn` | luôn                |
| Viết tắt thành phố                    | `tp`, `tx`                     | có từ theo sau          |
| `phường/quận/huyện/xã` **rời**        | `phường 16`, `quận 11`        | **từ sau là số**        |
| Chữ cái đơn `p/f/q/h/x` **rời**       | `p 16`, `q 11`                | **từ sau là số**        |

**Vì sao có điều kiện "từ sau là số"?** Tránh nhầm tên riêng/biển hiệu với tiền tố: `"Phương"`,
`"Huyền"` (→ `phuong`/`huyen`), hay `"quán …"` (→ `quan`) sẽ **không** bị tách vì không có số theo sau.

**Mốc ở đầu chuỗi không tách** (guard `current.length > 0`): phần địa chỉ cụ thể dẫn đầu giữ nguyên,
và `"85/34f"` không bị nhầm (bắt đầu bằng số → không khớp regex dính‑số).

**Giới hạn cố ý:** đơn vị **có tên chữ** viết liền không phẩy (vd `"… quận thanh khê đà nẵng"`)
**không** được tách tự động — vẫn nên dùng dấu phẩy. Trường hợp toàn số (phổ biến nhất) hoạt động đầy đủ.

### 7.4 Alias tỉnh — `PROVINCE_ALIASES` (`:261`) & `provinceKeyVariants(part)` (`:274`)

Bảng biệt danh → key tên chính thức: `hcm/tphcm/hcmc/saigon/sai gon/sg → ho chi minh`,
`hn/hanoi → ha noi`, `dn → da nang`. `provinceKeyVariants` sinh các key ứng viên cho một token
(xử lý tiền tố + bỏ dấu chấm/khoảng trắng: `"tp.hcm" → "tphcm"` + alias).

### 7.5 Thuật toán & chấm điểm — `parseAddress(input): ParseResult` (`:350`)

1. **Tách**: `split(",")` → `flatMap(segmentFreeformPart)` → trim → bỏ rỗng.
2. **Phân loại** mỗi part → `keys[]`, `types[]`.
3. **Duyệt tỉnh từ phải sang trái** (province thường ở cuối). Với mỗi part có thể là province:
   - Thử **hệ mới**: tỉnh khớp → tìm ward (key) trong tỉnh đó. Điểm `13 - wi` (ward càng gần đầu càng cao).
   - Thử **hệ cũ**: tỉnh khớp → nếu input có token **district** thì coi đó là **phạm vi cứng**
     (chỉ nhận ward thuộc district đã nêu, không bịa ward trùng tên ở district khác). Token được khai
     báo là ward (`p/f/phường`) **không** tính là district dù trùng số.
     Điểm `13 - wi + (có district ? +2 : 0) − (cùng key ward ở nhiều district ? −4 : 0)`.
4. **Khử trùng** theo `system:wardCode`, giữ điểm cao nhất.
5. **Cắt nhiễu**: bỏ ứng viên có điểm `< topScore − 2` (tránh đọc nhầm "Quận 1" thành "Phường 1").
6. Trả tối đa **5** ứng viên, kèm `street` = các part **không** được dùng, nối lại bằng `", "`.

`ParseCandidate` (`address-types.ts:130`): `{ system, wardCode, label, street }`.
Trả `candidates: []` khi không nhận diện được ward nào (vd chỉ có tỉnh — `parseAddress("Đà Nẵng")`).

### 7.6 Chuyển đổi 1 địa chỉ tự do (bulk) — `convertFreeform(input, target)` (`:494`)

Đơn vị đứng sau bulk Excel/CSV. Lấy `candidates[0]` từ `parseAddress`, rồi:

- Không nhận diện → `status: "notFound"`.
- Đã ở đúng hệ đích → `"passthrough"` (`note`: "Đã là địa chỉ mới/cũ").
- `target: "new"` (old→new): gọi `convertOldToNew`. **Ưu tiên đích nhận dân cư** (loại `landOnly`).
  - 1 đích → `"converted"`.
  - nhiều đích → `"ambiguous"` + `alternatives[]` + note "Đơn vị cũ chia vào N xã mới — đã chọn mặc định…".
- `target: "old"` (new→old): gọi `convertNewToOld`.
  - 1 nguồn → `"converted"`; nhiều nguồn → `"ambiguous"` + `alternatives[]` + note "gộp từ N xã cũ…".

`withStreet(street, address)` (`:484`) ghép `"<street>, <address>"`, hoặc chỉ `address` nếu không có street.
`FreeformConversion` (`address-types.ts:147`): `{ input, status, recognized?, result?, alternatives?, note? }`.

---

## 8. API endpoints

Tất cả route mỏng, đặt `Cache-Control: no-store` (kết quả đổi theo mỗi lần rebuild dữ liệu;
React Query đã dedupe in‑memory theo session). Có cổng same‑origin ở `src/proxy.ts` chặn gọi
cross‑site cho `/api` (trừ `/api/auth`).

| Method & path                              | Vào                       | Ra                                        |
| ------------------------------------------ | ------------------------- | ----------------------------------------- |
| `GET /api/parse?q=<addr>`                  | `parseAddress(q)`         | `ParseResult` (q rỗng → `candidates: []`) |
| `POST /api/parse-bulk`                     | `{ addresses: string[], target?: "new"\|"old" }` | `{ results: FreeformConversion[] }` |
| `GET /api/convert/old-to-new/[wardCode]`   | `convertOldToNew(code)`   | `OldToNewResult` (404 nếu không thấy)     |
| `GET /api/convert/new-to-old/[wardCode]`   | `convertNewToOld(code)`   | `NewToOldResult` (404 nếu không thấy)     |

`parse-bulk`: tối đa **20.000 dòng**/lần (`MAX_ROWS`, vượt → 413); body sai → 400; `target` mặc định `"new"`.

---

## 9. Ví dụ

```
"85/34f lò siêu p16 q11 hcm"
  → segment: ["85/34f lò siêu","p16","q11","hcm"]
  → top: { system:"old", wardCode: <Phường 16, Quận 11>,
           label:"Phường 16, Quận 11, Thành phố Hồ Chí Minh",
           street:"85/34f lò siêu" }

"123 Lê Văn Sỹ, P6, Q10, TPHCM"  ≡  "123 Lê Văn Sỹ, f.06, quận 10, hcm"
  → "Phường 6, Quận 10, Thành phố Hồ Chí Minh", street "123 Lê Văn Sỹ"

"P6, Quận 3, TPHCM"
  → []  (Quận 3 không có Phường 6 — không bịa ward trùng tên ở quận khác)

"Đà Nẵng"
  → []  (chỉ có tỉnh, không có ward)
```

Xem thêm các case trong `src/lib/converter.test.ts`.

---

## 10. Edge cases & giới hạn đã biết

- **Tên riêng trùng tiền tố**: `Phương`/`Huyền`/`quán` chỉ tách nếu **theo sau là số** (§7.3).
- **`tp`/`tx` rời + tên** không phẩy được tách; **tỉnh có tên chữ** viết liền (`tỉnh Hà Nam`) thì không —
  cố ý loại `tinh` khỏi mốc để không cắt nhầm `Hà Tĩnh` (`"ha tinh"`).
- **Nhầm hiếm gặp**: `quán/quận` trong tên giữa chuỗi không phẩy có thể chèn ranh giới thừa → phần
  street bị thêm dấu phẩy, nhưng địa chỉ vẫn nhận diện đúng (suy biến nhẹ, không sai kết quả).
- **`f` = phường** là quy ước không chính thức nhưng phổ biến, được hỗ trợ ở mọi nơi.
- Parser chỉ trả ứng viên **chuyển đổi được** (giải về một ward); địa chỉ thiếu ward → rỗng.

---

## 11. Mở rộng / bảo trì

- **Thêm alias tỉnh**: sửa `PROVINCE_ALIASES` (`converter.ts:261`). Nếu là alias 1‑từ/2‑từ cũng
  được dùng làm mốc tách tự động (qua `PROVINCE_ALIAS_KEYS`, `:286`).
- **Thêm dạng viết tắt đơn vị**: chỉnh regex/sets trong `segmentFreeformPart` (consts `:286`–`:294`, hàm `:303`) và
  `classifyToken` (`:210`) / `stripUnitPrefix` (`normalize.ts:24`). Giữ nguyên tắc "tên chữ chỉ tách
  khi an toàn".
- **Cập nhật dữ liệu**: chạy lại `scripts/build-data.ts` (và `build-hamlets.ts`). Mọi kết quả đổi
  theo dữ liệu nên route đặt `no-store`.
- **Test**: `npx vitest run src/lib/converter.test.ts`. Thêm case khi sửa parser — đặc biệt các
  biến thể viết tắt và không dấu phẩy.
