import { richTextHtmlToPlainText } from "@/lib/issue-description";

export interface DiscussionSummaryComment {
  body: string;
  userName: string | null;
  createdAt: Date;
}

export interface GeneratedDiscussionSummary {
  text: string | null;
  generatedAt: string | null;
  sourceCommentCount: number;
}

const MIN_SUMMARY_COMMENTS = 2;
const KEYWORD_GROUPS = {
  decisions:
    /\b(decided|decision|approved|agreed|ship|shipping|landed|resolved|confirmed|chosen|merged)\b/i,
  blockers:
    /\b(blocked|blocker|blocking|waiting|stuck|failed|failing|error|risk|dependency|depends on)\b/i,
  nextSteps:
    /\b(next|todo|to do|follow up|action|need to|needs to|will|should|plan|owner|assign)\b/i,
  questions: /\?|\b(question|unclear|open|verify|confirm|whether)\b/i,
} as const;

function cleanCommentBody(body: string): string {
  return richTextHtmlToPlainText(body).replace(/\s+/g, " ").trim();
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function truncateSentence(sentence: string, maxLength = 180): string {
  if (sentence.length <= maxLength) {
    return sentence;
  }

  return `${sentence.slice(0, maxLength - 1).trimEnd()}…`;
}

function findSentence(
  entries: { author: string; text: string }[],
  pattern: RegExp,
): string | null {
  for (const entry of entries) {
    const sentence = splitSentences(entry.text).find((currentSentence) =>
      pattern.test(currentSentence),
    );
    if (sentence) {
      return `${entry.author}: ${truncateSentence(sentence)}`;
    }
  }

  return null;
}

function formatParticipants(comments: DiscussionSummaryComment[]): string {
  const participants = Array.from(
    new Set(comments.map((current) => current.userName ?? "Unknown user")),
  );

  if (participants.length === 1) {
    return participants[0];
  }

  if (participants.length === 2) {
    return participants.join(" and ");
  }

  return `${participants.slice(0, -1).join(", ")}, and ${participants.at(-1)}`;
}

export function buildGeneratedDiscussionSummary(
  comments: DiscussionSummaryComment[],
): GeneratedDiscussionSummary {
  const usableEntries = comments
    .map((currentComment) => ({
      author: currentComment.userName ?? "Unknown user",
      text: cleanCommentBody(currentComment.body),
    }))
    .filter((entry) => entry.text.length > 0);

  if (usableEntries.length < MIN_SUMMARY_COMMENTS) {
    return {
      text: null,
      generatedAt: null,
      sourceCommentCount: usableEntries.length,
    };
  }

  const threadNarrative = usableEntries
    .map((entry) => `${entry.author}: ${truncateSentence(entry.text, 140)}`)
    .slice(0, 4)
    .join("; ");
  const decisions = findSentence(usableEntries, KEYWORD_GROUPS.decisions);
  const blockers = findSentence(usableEntries, KEYWORD_GROUPS.blockers);
  const nextSteps = findSentence(usableEntries, KEYWORD_GROUPS.nextSteps);
  const questions = findSentence(usableEntries, KEYWORD_GROUPS.questions);
  const latestEntry = usableEntries.at(-1);

  const bullets = [
    `Overview: ${formatParticipants(comments)} discussed ${threadNarrative}.`,
    decisions ? `Decision/status: ${decisions}.` : null,
    blockers ? `Blockers/risks: ${blockers}.` : null,
    nextSteps ? `Next steps: ${nextSteps}.` : null,
    !nextSteps && questions ? `Open question: ${questions}.` : null,
    latestEntry
      ? `Latest update: ${latestEntry.author}: ${truncateSentence(latestEntry.text, 160)}.`
      : null,
  ].filter((bullet): bullet is string => Boolean(bullet));

  return {
    text: bullets.map((bullet) => `• ${bullet}`).join("\n"),
    generatedAt: new Date().toISOString(),
    sourceCommentCount: usableEntries.length,
  };
}
