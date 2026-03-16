import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, type CanvasProps } from '@react-three/fiber';
import type { RootState } from '@react-three/fiber';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';

export default function SafeCanvas({ children, onCreated, gl, frameloop, ...rest }: CanvasProps) {
  const [isLost, setIsLost] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onLostRef = useRef<((event: Event) => void) | null>(null);
  const onRestoredRef = useRef<(() => void) | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  /* ── Pause the render-loop while the canvas is off-screen ──
     This saves significant GPU time when several scenes coexist
     on the same page (e.g. multiple MiniSimulators on a Theory tab). */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (canvasRef.current && onLostRef.current && onRestoredRef.current) {
        canvasRef.current.removeEventListener('webglcontextlost', onLostRef.current);
        canvasRef.current.removeEventListener('webglcontextrestored', onRestoredRef.current);
      }
    };
  }, []);

  const handleCreated = useCallback((state: RootState) => {
    const canvas = state.gl.domElement;
    canvasRef.current = canvas;

    onLostRef.current = (event: Event) => {
      event.preventDefault();
      setIsLost(true);
    };

    onRestoredRef.current = () => {
      setIsLost(false);
      setCanvasKey((k) => k + 1);
    };

    canvas.addEventListener('webglcontextlost', onLostRef.current, false);
    canvas.addEventListener('webglcontextrestored', onRestoredRef.current, false);

    if (onCreated) {
      onCreated(state);
    }
  }, [onCreated]);

  const mergedGl = useMemo(() => ({
    powerPreference: 'high-performance' as const,
    antialias: false,
    ...(typeof gl === 'object' ? gl : {}),
  }), [gl]);

  /* When off-screen, stop the render loop entirely. */
  const activeFrameloop = isVisible ? (frameloop ?? 'always') : 'never';

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        key={canvasKey}
        onCreated={handleCreated}
        dpr={[1, 1.25]}
        gl={mergedGl}
        frameloop={activeFrameloop}
        performance={{ min: 0.5 }}
        {...rest}
      >
        {children}
      </Canvas>

      {isLost && (
        <Paper
          elevation={6}
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            bgcolor: 'rgba(10, 25, 41, 0.85)',
            color: '#fff',
            p: 3,
          }}
        >
          <Stack spacing={2} alignItems="center">
            <Typography variant="h6">Контекст WebGL потерян</Typography>
            <Typography variant="body2" sx={{ maxWidth: 360 }}>
              Такое бывает при нехватке ресурсов GPU. Попробуйте перезапустить сцену или перезагрузить страницу.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="contained"
                onClick={() => {
                  setIsLost(false);
                  setCanvasKey((k) => k + 1);
                }}
              >
                Перезапустить сцену
              </Button>
              <Button variant="outlined" onClick={() => window.location.reload()}>
                Перезагрузить страницу
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
