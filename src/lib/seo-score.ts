export type SeoTrafficLevel = "red" | "orange" | "green";

export type BlogSeoAnalysis = {
  traffic: SeoTrafficLevel;
  wordCount: number;
  metaLength: number;
  keywordInTitle: boolean;
  keywordInMeta: boolean;
  keywordInBody: boolean;
  readabilityScore: number;
  readabilityLabel: string;
  issues: string[];
};

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function countSyllables(word: string) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const groups = w.match(/[aeiouy]+/g);
  let n = groups ? groups.length : 1;
  if (w.endsWith("e")) n -= 1;
  return Math.max(1, n);
}

/** Rough Flesch Reading Ease–style score (0–100, higher = easier). */
function readabilityEase(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 15) return { score: 50, label: "Add more content to measure readability." };

  const sentences = text.split(/[.!?]+\s/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);
  const wordCount = words.length;
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  const asl = wordCount / sentenceCount;
  const asw = syllables / wordCount;
  const score = Math.max(
    0,
    Math.min(100, 206.835 - 1.015 * asl - 84.6 * asw)
  );

  let label = "Comfortable for most readers.";
  if (score < 35) label = "Fairly difficult — shorten sentences and simplify wording.";
  else if (score < 55) label = "Moderate — consider simpler words or shorter sentences.";
  else if (score < 70) label = "Fairly easy.";

  return { score: Math.round(score), label };
}

export function analyzeBlogSeo(input: {
  title: string;
  metaDescription: string;
  bodyHtml: string;
  focusKeyword: string;
}): BlogSeoAnalysis {
  const kw = input.focusKeyword.trim().toLowerCase();
  const plain = stripHtml(input.bodyHtml);
  const words = plain.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const metaLength = input.metaDescription.trim().length;

  const titleLower = input.title.toLowerCase();
  const metaLower = input.metaDescription.toLowerCase();
  const bodyLower = plain.toLowerCase();

  const keywordInTitle = kw.length > 0 && titleLower.includes(kw);
  const keywordInMeta = kw.length > 0 && metaLower.includes(kw);
  const keywordInBody = kw.length > 0 && bodyLower.includes(kw);

  const { score: readabilityScore, label: readabilityLabel } = readabilityEase(plain);

  const issues: string[] = [];
  if (wordCount < 300) issues.push("Content is thin — aim for at least ~300 words for competitive topics.");
  if (metaLength > 0 && metaLength < 120) issues.push("Meta description is short — 120–160 characters is a good target.");
  if (metaLength > 160) issues.push("Meta description may be truncated in search results (keep under ~160 characters).");
  if (kw && !keywordInTitle) issues.push("Focus keyword not found in the title.");
  if (kw && !keywordInMeta) issues.push("Focus keyword not found in the meta description.");
  if (kw && !keywordInBody) issues.push("Focus keyword not found in the article body.");
  if (/<h1[\s>]/i.test(input.bodyHtml)) {
    issues.push("Body contains an H1 — the page already uses the title as H1; consider H2/H3 in the article.");
  }

  let scorePoints = 0;
  if (wordCount >= 300) scorePoints += 2;
  else if (wordCount >= 150) scorePoints += 1;
  if (metaLength >= 120 && metaLength <= 165) scorePoints += 2;
  else if (metaLength > 0) scorePoints += 1;
  if (keywordInTitle) scorePoints += 2;
  if (keywordInMeta) scorePoints += 2;
  if (keywordInBody) scorePoints += 1;
  if (readabilityScore >= 45 && readabilityScore <= 85) scorePoints += 1;

  let traffic: SeoTrafficLevel = "orange";
  if (scorePoints >= 8) traffic = "green";
  else if (scorePoints <= 4) traffic = "red";

  return {
    traffic,
    wordCount,
    metaLength,
    keywordInTitle,
    keywordInMeta,
    keywordInBody,
    readabilityScore,
    readabilityLabel,
    issues,
  };
}
