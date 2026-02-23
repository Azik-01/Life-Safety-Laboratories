import { memo, useMemo, useState } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloseIcon from '@mui/icons-material/Close';
import { resolveAssetPath } from '../../data/assetResolver';

interface FigureZoomProps {
  src: string;
  alt?: string;
  caption?: string;
}

function FigureZoom({ src, alt, caption }: FigureZoomProps) {
  const [open, setOpen] = useState(false);
  const resolvedSrc = useMemo(() => resolveAssetPath(src), [src]);

  if (!resolvedSrc) {
    return null;
  }

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          p: 1,
          position: 'relative',
          cursor: 'zoom-in',
          '&:hover .zoom-icon': { opacity: 1 },
        }}
        onClick={() => setOpen(true)}
      >
        <Box
          component="img"
          src={resolvedSrc}
          alt={alt ?? caption ?? 'Рисунок'}
          sx={{
            width: '100%',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
          onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
            event.currentTarget.style.display = 'none';
          }}
        />
        <Box
          className="zoom-icon"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(0,0,0,0.5)',
            borderRadius: '50%',
            p: 0.5,
            opacity: 0,
            transition: 'opacity 0.2s',
          }}
        >
          <ZoomInIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        {caption && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.8, display: 'block' }}>
            {caption}
          </Typography>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {caption ?? 'Рисунок'}
          <IconButton onClick={() => setOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box
            component="img"
            src={resolvedSrc}
            alt={alt ?? caption ?? 'Рисунок'}
            sx={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default memo(FigureZoom);
