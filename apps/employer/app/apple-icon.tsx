import { AppMark, MARK_COLORS } from "@repo/ui/mark";
import { ImageResponse } from "next/og";

// iPhone home screen icon. iOS rounds the corners itself.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppMark size={180} colors={MARK_COLORS.employer} />, size);
}
