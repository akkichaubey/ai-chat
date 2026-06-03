'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Loader2 
} from 'lucide-react';

export interface LightboxImage {
  messageId: string;
  name: string;
  type: string;
  data: string; // Base64 data string
}

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: LightboxImage[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export default function ImageLightbox({
  isOpen,
  onClose,
  images,
  currentIndex,
  onIndexChange
}: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);

  const imageRef = useRef<HTMLImageElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Reset zoom, offset and loader on image change
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setLoading(true);
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    onIndexChange((currentIndex + 1) % images.length);
  }, [currentIndex, images, onIndexChange]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    onIndexChange((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images, onIndexChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Wheel zoom (non-passive to allow e.preventDefault)
  useEffect(() => {
    const imgEl = imageRef.current;
    if (!imgEl) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 0.15;
      if (e.deltaY < 0) {
        setZoom(prev => Math.min(prev + zoomFactor, 4));
      } else {
        setZoom(prev => {
          const nextZoom = Math.max(prev - zoomFactor, 1);
          if (nextZoom === 1) {
            setOffset({ x: 0, y: 0 });
          }
          return nextZoom;
        });
      }
    };

    imgEl.addEventListener('wheel', onWheel, { passive: false });
    return () => imgEl.removeEventListener('wheel', onWheel);
  }, [currentIndex]);

  if (!isOpen || images.length === 0) return null;

  const currentImg = images[currentIndex];
  if (!currentImg) return null;

  // Swipe detection & touch pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;

      if (zoom > 1) {
        setIsDragging(true);
        setDragStart({ 
          x: e.touches[0].clientX - offset.x, 
          y: e.touches[0].clientY - offset.y 
        });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (zoom > 1 && isDragging && e.touches.length === 1) {
      e.preventDefault();
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      setOffset({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);

    if (touchStartX.current === null || touchStartY.current === null) return;
    if (zoom > 1) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    // Horizontal swipe threshold 60px
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 60) {
      if (diffX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Mouse drag gestures (zoom = 1 triggers swipe, zoom > 1 triggers pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    touchStartX.current = e.clientX; // repurpose touchStartX for mouse drag start
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    if (zoom > 1) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    if (zoom === 1 && touchStartX.current !== null) {
      const diffX = e.clientX - touchStartX.current;
      const swipeThreshold = 60; // 60px
      if (Math.abs(diffX) > swipeThreshold) {
        if (diffX > 0) {
          handlePrev();
        } else {
          handleNext();
        }
      }
    }
    touchStartX.current = null;
  };

  // Double click toggles zoom
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (zoom > 1) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    } else {
      setZoom(2);
      setOffset({ x: 0, y: 0 });
    }
  };

  // Zoom buttons
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => {
      const nextZoom = Math.max(prev - 0.25, 1);
      if (nextZoom === 1) {
        setOffset({ x: 0, y: 0 });
      }
      return nextZoom;
    });
  };

  const handleZoomReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Download high res base64 content
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = `data:${currentImg.type};base64,${currentImg.data}`;
    link.download = currentImg.name || `image_${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-between bg-zinc-950/95 backdrop-blur-md font-sans text-slate-100 animate-in fade-in duration-200"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Lightbox Header Panel */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent shrink-0 z-10 select-none">
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-slate-100 truncate max-w-[280px] sm:max-w-md" title={currentImg.name}>
            {currentImg.name}
          </span>
          {images.length > 1 && (
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
              Image {currentIndex + 1} of {images.length}
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Level Info */}
          {zoom > 1 && (
            <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full select-none">
              {Math.round(zoom * 100)}%
            </span>
          )}

          <button
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {zoom > 1 && (
            <button
              onClick={handleZoomReset}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-450 hover:text-slate-200 transition-colors cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <div className="w-px h-4 bg-slate-800 mx-0.5" />

          <button
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Download Image"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div 
        className="relative flex-1 w-full overflow-hidden flex items-center justify-center select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-transparent z-0">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* Carousel Next/Prev overlay buttons for screen edges */}
        {images.length > 1 && zoom === 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-4 z-20 p-3 rounded-full bg-black/55 hover:bg-black/75 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer select-none active:scale-95 shadow-lg shadow-black/40"
              title="Previous Image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 z-20 p-3 rounded-full bg-black/55 hover:bg-black/75 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer select-none active:scale-95 shadow-lg shadow-black/40"
              title="Next Image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Lightbox Image Element */}
        <div 
          className="relative max-w-full max-h-full flex items-center justify-center p-4 transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
        >
          <img
            ref={imageRef}
            src={`data:${currentImg.type};base64,${currentImg.data}`}
            alt={currentImg.name}
            onLoad={() => setLoading(false)}
            onDoubleClick={handleDoubleClick}
            className="max-w-full max-h-[80vh] object-contain rounded transition-transform duration-100 select-none pointer-events-auto"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          />
        </div>
      </div>

      {/* Footer Info panel */}
      <div className="px-4 py-3 text-center bg-gradient-to-t from-black/85 to-transparent shrink-0 text-slate-400 text-[10px] select-none">
        {zoom > 1 ? (
          <span>Drag to pan when zoomed in. Double click image to reset.</span>
        ) : (
          <span>Swipe or use left/right arrow keys to navigate. Scroll wheel to zoom.</span>
        )}
      </div>
    </div>
  );
}
