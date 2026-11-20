import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";

// Display face for headings and money; a plain grotesque for everything else.
export const head = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-head", display: "swap" });
export const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
