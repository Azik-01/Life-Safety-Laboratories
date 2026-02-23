import { useMemo, useState, memo } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import FunctionsIcon from '@mui/icons-material/Functions';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { resolveAssetPath } from '../../data/assetResolver';

export interface FormulaVariable {
  symbol: string;
  description: string;
  unit: string;
}

export interface FormulaExample {
  given: Record<string, number>;
  steps: string[];
  result: string;
}

export interface FormulaBlockProps {
  id?: string;
  /** Label like "(4.1)" */
  label?: string;
  /** Symbolic expression like "LR = L₁ − 20·lg(R) − 8" */
  expression: string;
  /** Path to formula image */
  imagePath?: string;
  /** Variable legend */
  variables: FormulaVariable[];
  /** Worked example */
  example?: FormulaExample;
  /** Extra "explain" text (shown on button click) */
  explanation?: string;
}

function FormulaBlock({
  id,
  label,
  expression,
  imagePath,
  variables,
  example,
  explanation,
}: FormulaBlockProps) {
  const [showExample, setShowExample] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const resolvedImagePath = useMemo(() => resolveAssetPath(imagePath), [imagePath]);

  return (
    <Paper
      id={id}
      variant="outlined"
      sx={{
        p: 2,
        borderLeft: 4,
        borderColor: 'primary.main',
        my: 1.5,
        background: 'linear-gradient(135deg, rgba(19,83,162,0.03) 0%, transparent 100%)',
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <FunctionsIcon color="primary" fontSize="small" />
        <Typography variant="subtitle2" color="primary.main">
          Формула {label ?? ''}
        </Typography>
      </Stack>

      {/* Formula expression */}
      <Typography
        variant="h6"
        sx={{
          fontFamily: '"Cambria Math", "Latin Modern Math", serif',
          fontWeight: 500,
          letterSpacing: 0.5,
          my: 1,
        }}
      >
        {expression}
      </Typography>

      {/* Formula image (if available) */}
      {resolvedImagePath && (
        <Box
          component="img"
          src={resolvedImagePath}
          alt={`Формула ${label ?? expression}`}
          sx={{
            maxWidth: '100%',
            maxHeight: 80,
            objectFit: 'contain',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            my: 1,
          }}
          onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      )}

      {/* Variable legend */}
      <Typography variant="caption" fontWeight={600} sx={{ mt: 1 }}>
        Обозначения:
      </Typography>
      <Table size="small" sx={{ mt: 0.5, '& td': { py: 0.3, borderBottom: 'none' } }}>
        <TableBody>
          {variables.map((v) => (
            <TableRow key={v.symbol}>
              <TableCell sx={{ pl: 0, width: 60 }}>
                <Tooltip title={v.description} arrow placement="right">
                  <Chip
                    label={v.symbol}
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{ fontFamily: 'serif', fontWeight: 600 }}
                  />
                </Tooltip>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {v.description}
                  {v.unit && (
                    <Typography component="span" variant="caption" color="text.secondary">
                      {' '}
                      [{v.unit}]
                    </Typography>
                  )}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Divider sx={{ my: 1 }} />

      {/* Action buttons */}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {example && (
          <Button
            size="small"
            variant={showExample ? 'contained' : 'outlined'}
            startIcon={<ExpandMoreIcon sx={{ transform: showExample ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />}
            onClick={() => setShowExample((prev) => !prev)}
          >
            Пример расчёта
          </Button>
        )}
        {explanation && (
          <Button
            size="small"
            variant={showExplanation ? 'contained' : 'outlined'}
            startIcon={<InfoOutlinedIcon />}
            onClick={() => setShowExplanation((prev) => !prev)}
          >
            Пояснить
          </Button>
        )}
      </Stack>

      {/* Collapsible worked example */}
      <Collapse in={showExample}>
        {example && (
          <Paper variant="outlined" sx={{ p: 1.5, mt: 1, bgcolor: 'action.hover' }}>
            <Typography variant="caption" fontWeight={600}>
              Дано:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
              {Object.entries(example.given).map(([key, val]) => (
                <Chip key={key} label={`${key} = ${val}`} size="small" variant="outlined" />
              ))}
            </Stack>
            <Typography variant="caption" fontWeight={600} sx={{ mt: 1, display: 'block' }}>
              Решение:
            </Typography>
            {example.steps.map((step, i) => (
              <Typography key={i} variant="body2" sx={{ pl: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                {i + 1}. {step}
              </Typography>
            ))}
            <Alert severity="success" sx={{ mt: 1, py: 0 }}>
              <Typography variant="body2" fontWeight={600}>
                {example.result}
              </Typography>
            </Alert>
          </Paper>
        )}
      </Collapse>

      {/* Collapsible explanation */}
      <Collapse in={showExplanation}>
        {explanation && (
          <Alert severity="info" sx={{ mt: 1 }}>
            {explanation}
          </Alert>
        )}
      </Collapse>
    </Paper>
  );
}

export default memo(FormulaBlock);
