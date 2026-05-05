export const ROLE = {
  assistant: t => ({
    body: t.color.text,
    glyph: t.brand.tool,
    prefix: t.color.border
  }),
  system: t => ({
    body: '',
    glyph: '·',
    prefix: t.color.muted
  }),
  tool: t => ({
    body: t.color.muted,
    glyph: '⚡',
    prefix: t.color.muted
  }),
  user: t => ({
    body: t.color.label,
    glyph: t.brand.prompt,
    prefix: t.color.label
  })
};