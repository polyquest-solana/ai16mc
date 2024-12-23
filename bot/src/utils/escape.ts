const SPECIAL_CHARS = [
  '\\',
  '_',
  //   "*",
  '[',
  ']',
  '(',
  ')',
  '~',
  // '`',
  '>',
  '<',
  '&',
  '#',
  '+',
  '-',
  '=',
  '|',
  '{',
  '}',
  '.',
  '!',
]

export const escapeMarkdown = (text: string) => {
  SPECIAL_CHARS.forEach((char) => (text = text.replaceAll(char, `\\${char}`)))
  return text
}