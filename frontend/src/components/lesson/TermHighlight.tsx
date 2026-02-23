import { memo } from 'react';
import { Tooltip, Box } from '@mui/material';

/** Map of term → definition. Built from knowledge layer keywords + theory blocks. */
export type Glossary = Record<string, string>;

interface TermHighlightProps {
  /** Raw text to highlight */
  text: string;
  /** Glossary of term→definition */
  glossary: Glossary;
}

/**
 * Renders text with known terms highlighted as tooltips.
 * Case-insensitive matching, longest-match-first.
 */
function TermHighlight({ text, glossary }: TermHighlightProps) {
  const terms = Object.keys(glossary);
  if (terms.length === 0) return <>{text}</>;

  // Sort longest first to avoid partial matches
  const sorted = [...terms].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const lower = part.toLowerCase();
        const definition = terms.find((t) => t.toLowerCase() === lower);
        if (definition) {
          return (
            <Tooltip key={i} title={glossary[definition]} arrow placement="top">
              <Box
                component="span"
                sx={{
                  borderBottom: '1px dashed',
                  borderColor: 'primary.main',
                  cursor: 'help',
                  color: 'primary.main',
                  fontWeight: 500,
                }}
              >
                {part}
              </Box>
            </Tooltip>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default memo(TermHighlight);
