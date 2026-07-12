/**
 * Extracts the first readable message from a Zod v4 safeParse error.
 * Zod v4 uses error.issues[], Zod v3 used error.errors[].
 */
function zodMessage(error) {
  const issues = error?.issues ?? error?.errors ?? [];
  return issues[0]?.message ?? 'Validation error';
}

module.exports = { zodMessage };
