import { ogContentType, ogSize, renderOgImage } from "@/lib/og-image";

export const alt = "Đổi Địa Chỉ — chuyển đổi địa chỉ hành chính Việt Nam";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    eyebrow: "Chuyển đổi địa chỉ hành chính",
    title: "Đổi địa chỉ cũ sang mới sau sáp nhập 34 tỉnh",
  });
}
