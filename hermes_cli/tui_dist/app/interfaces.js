// Single source of truth for indicator style names.  Union type is
// derived from this tuple so adding/removing a style only touches one
// line — `useConfigSync` (validation) and `session.ts` (slash arg
// validation + usage hint) both import it.
export const INDICATOR_STYLES = ['ascii', 'emoji', 'kaomoji', 'unicode'];
export const DEFAULT_INDICATOR_STYLE = 'kaomoji';