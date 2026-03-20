const DISCLAIMER_SPLIT_RE =
  /\n\n(?:This is (?:general information|not a substitute)|Consult a healthcare)[\s\S]+$/;

export function splitDisclaimer(reply: string): { main: string; disclaimer: string | null } {
  const match = reply.match(DISCLAIMER_SPLIT_RE);
  if (!match || typeof match.index !== "number") {
    return { main: reply, disclaimer: null };
  }
  return {
    main: reply.slice(0, match.index),
    disclaimer: match[0].trim(),
  };
}
