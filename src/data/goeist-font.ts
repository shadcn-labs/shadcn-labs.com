export type FontFamily = "sans" | "mono" | "serif";

export const FONT_VERSION = "0.1.0";
export const GITHUB_URL = "https://github.com/shadcn-labs/goeist-font";
export const RELEASE_URL = `${GITHUB_URL}/releases/tag/v${FONT_VERSION}`;
export const LICENSE_URL = `${GITHUB_URL}/blob/main/OFL.txt`;

export const DOWNLOAD_URL = `${GITHUB_URL}/releases/download/v${FONT_VERSION}/Goeist-Family-v${FONT_VERSION}.zip`;
export const DOWNLOAD_SIZE = "8.8 MB";

const GOEIST_FONTS_CDN = `https://cdn.jsdelivr.net/gh/shadcn-labs/goeist-font@v${FONT_VERSION}/fonts`;
const GEIST_FONTS_CDN =
  "https://cdn.jsdelivr.net/gh/vercel/geist-font@v1.9.2/fonts";

export const STATIC_WEIGHTS = [
  { name: "Thin", value: 100 },
  { name: "ExtraLight", value: 200 },
  { name: "Light", value: 300 },
  { name: "Regular", value: 400 },
  { name: "Medium", value: 500 },
  { name: "SemiBold", value: 600 },
  { name: "Bold", value: 700 },
  { name: "ExtraBold", value: 800 },
  { name: "Black", value: 900 },
] as const;

export type StaticWeight = (typeof STATIC_WEIGHTS)[number]["name"];

const FILE_PREFIX: Record<FontFamily, { geist: string; goeist: string }> = {
  mono: { geist: "GeistMono", goeist: "GoeistMono" },
  sans: { geist: "Geist", goeist: "Goeist" },
  serif: { geist: "GeistSerif", goeist: "GoeistSerif" },
};

export const glyphSources = (family: FontFamily, weight: StaticWeight) => {
  const style = family === "serif" ? "Regular" : weight;
  const { geist, goeist } = FILE_PREFIX[family];

  return {
    geist: `${GEIST_FONTS_CDN}/${geist}/ttf/${geist}-${style}.ttf`,
    goeist: `${GOEIST_FONTS_CDN}/${goeist}/ttf/${goeist}-${style}.ttf`,
  };
};

export const FAMILY_NAMES: Record<
  FontFamily,
  { geist: string; goeist: string }
> = {
  mono: { geist: "Geist Mono", goeist: "Goeist Mono" },
  sans: { geist: "Geist Sans", goeist: "Goeist Sans" },
  serif: { geist: "Geist Serif", goeist: "Goeist Serif" },
};
