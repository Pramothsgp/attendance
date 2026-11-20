import { AppMark, MARK_COLORS } from "@repo/ui/mark";
import { ImageResponse } from "next/og";

// Served at /icon/192 and /icon/512; the manifest and the favicon link use them.
export function generateImageMetadata() {
  return [192, 512].map((n) => ({ id: String(n), size: { width: n, height: n }, contentType: "image/png" }));
}

export default async function Icon({ id }: { id: string | Promise<string> }) {
  const size = Number(await id) === 512 ? 512 : 192;
  return new ImageResponse(<AppMark size={size} colors={MARK_COLORS.employer} />, { width: size, height: size });
}
