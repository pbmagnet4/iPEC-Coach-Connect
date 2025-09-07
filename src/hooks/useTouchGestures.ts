import { useCallback, useEffect, useRef } from 'react';

// Touch gesture types
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';
export type PinchDirection = 'in' | 'out';

interface TouchPosition {
  x: number;
  y: number;
}

interface SwipeGestureOptions {
  onSwipe?: (direction: SwipeDirection, distance: number) => void;
  onSwipeLeft?: (distance: number) => void;
  onSwipeRight?: (distance: number) => void;
  onSwipeUp?: (distance: number) => void;
  onSwipeDown?: (distance: number) => void;
  threshold?: number; // Minimum distance to trigger swipe
  velocityThreshold?: number; // Minimum velocity to trigger swipe
  preventScroll?: boolean; // Prevent default scroll behavior
  enabled?: boolean;
}

interface PinchGestureOptions {
  onPinch?: (scale: number, direction: PinchDirection) => void;
  onPinchIn?: (scale: number) => void;
  onPinchOut?: (scale: number) => void;
  threshold?: number; // Minimum scale change to trigger pinch
  enabled?: boolean;
}

interface LongPressOptions {
  onLongPress?: (position: TouchPosition) => void;
  onLongPressStart?: (position: TouchPosition) => void;
  onLongPressEnd?: (position: TouchPosition) => void;
  delay?: number; // Delay before triggering long press
  threshold?: number; // Maximum movement allowed during long press
  enabled?: boolean;
}

interface TapOptions {
  onTap?: (position: TouchPosition) => void;
  onDoubleTap?: (position: TouchPosition) => void;
  doubleTapDelay?: number; // Maximum delay between taps for double tap
  enabled?: boolean;
}

// Hook for swipe gestures
export function useSwipeGesture(
  options: SwipeGestureOptions = {}
) {
  const {
    onSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    velocityThreshold = 0.3,
    preventScroll = true,
    enabled = true,
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const startPosition = useRef<TouchPosition | null>(null);
  const startTime = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    startPosition.current = { x: touch.clientX, y: touch.clientY };
    startTime.current = Date.now();
    isSwiping.current = false;

    if (preventScroll) {
  void e.preventDefault();
    }
  }, [enabled, preventScroll]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !startPosition.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startPosition.current.x;
    const deltaY = touch.clientY - startPosition.current.y;

    // Check if we've moved enough to start swiping
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      isSwiping.current = true;
    }

    if (preventScroll && isSwiping.current) {
  void e.preventDefault();
    }
  }, [enabled, preventScroll]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !startPosition.current) return;

    const touch = e.changedTouches[0];
    const endPosition = { x: touch.clientX, y: touch.clientY };
    const endTime = Date.now();

    const deltaX = endPosition.x - startPosition.current.x;
    const deltaY = endPosition.y - startPosition.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = endTime - startTime.current;
    const velocity = distance / duration;

    // Check if gesture meets threshold requirements
    if (distance >= threshold && velocity >= velocityThreshold) {
      // Determine swipe direction
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      let direction: SwipeDirection;
      if (absX > absY) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      // Trigger callbacks
      onSwipe?.(direction, distance);
      
      switch (direction) {
        case 'left':
          onSwipeLeft?.(distance);
          break;
        case 'right':
          onSwipeRight?.(distance);
          break;
        case 'up':
          onSwipeUp?.(distance);
          break;
        case 'down':
          onSwipeDown?.(distance);
          break;
      }
    }

    // Reset state
    startPosition.current = null;
    startTime.current = 0;
    isSwiping.current = false;
  }, [enabled, threshold, velocityThreshold, onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

  void element.addEventListener('touchstart', handleTouchStart, { passive: false });
  void element.addEventListener('touchmove', handleTouchMove, { passive: false });
  void element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
  void element.removeEventListener('touchstart', handleTouchStart);
  void element.removeEventListener('touchmove', handleTouchMove);
  void element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return elementRef;
}

// Hook for pinch gestures
export function usePinchGesture(
  options: PinchGestureOptions = {}
) {
  const {
    onPinch,
    onPinchIn,
    onPinchOut,
    threshold = 0.1,
    enabled = true,
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const initialDistance = useRef<number>(0);
  const initialScale = useRef<number>(1);

  const getDistance = (touches: TouchList): number => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || e.touches.length !== 2) return;

    initialDistance.current = getDistance(e.touches);
    initialScale.current = 1;
  void e.preventDefault();
  }, [enabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || e.touches.length !== 2 || initialDistance.current === 0) return;

    const currentDistance = getDistance(e.touches);
    const scale = currentDistance / initialDistance.current;
    const deltaScale = scale - initialScale.current;

    if (Math.abs(deltaScale) >= threshold) {
      const direction: PinchDirection = deltaScale > 0 ? 'out' : 'in';
      
      onPinch?.(scale, direction);
      
      if (direction === 'in') {
        onPinchIn?.(scale);
      } else {
        onPinchOut?.(scale);
      }

      initialScale.current = scale;
    }

  void e.preventDefault();
  }, [enabled, threshold, onPinch, onPinchIn, onPinchOut]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    initialDistance.current = 0;
    initialScale.current = 1;
  }, [enabled]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

  void element.addEventListener('touchstart', handleTouchStart, { passive: false });
  void element.addEventListener('touchmove', handleTouchMove, { passive: false });
  void element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
  void element.removeEventListener('touchstart', handleTouchStart);
  void element.removeEventListener('touchmove', handleTouchMove);
  void element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return elementRef;
}

// Hook for long press gestures
export function useLongPress(
  options: LongPressOptions = {}
) {
  const {
    onLongPress,
    onLongPressStart,
    onLongPressEnd,
    delay = 500,
    threshold = 10,
    enabled = true,
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const startPosition = useRef<TouchPosition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    startPosition.current = { x: touch.clientX, y: touch.clientY };
    isLongPressing.current = false;

    onLongPressStart?.(startPosition.current);

    timeoutRef.current = setTimeout(() => {
      if (startPosition.current) {
        isLongPressing.current = true;
        onLongPress?.(startPosition.current);
      }
    }, delay);
  }, [enabled, delay, onLongPress, onLongPressStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !startPosition.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startPosition.current.x;
    const deltaY = touch.clientY - startPosition.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Cancel long press if moved too far
    if (distance > threshold) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      startPosition.current = null;
    }
  }, [enabled, threshold]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isLongPressing.current && startPosition.current) {
      onLongPressEnd?.(startPosition.current);
    }

    startPosition.current = null;
    isLongPressing.current = false;
  }, [enabled, onLongPressEnd]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

  void element.addEventListener('touchstart', handleTouchStart, { passive: false });
  void element.addEventListener('touchmove', handleTouchMove, { passive: false });
  void element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
  void element.removeEventListener('touchstart', handleTouchStart);
  void element.removeEventListener('touchmove', handleTouchMove);
  void element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return elementRef;
}

// Hook for tap gestures
export function useTap(
  options: TapOptions = {}
) {
  const {
    onTap,
    onDoubleTap,
    doubleTapDelay = 300,
    enabled = true,
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const lastTapTime = useRef<number>(0);
  const tapCount = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.changedTouches[0];
    const position = { x: touch.clientX, y: touch.clientY };
    const currentTime = Date.now();

    tapCount.current += 1;

    if (tapCount.current === 1) {
      // First tap
      lastTapTime.current = currentTime;
      
      timeoutRef.current = setTimeout(() => {
        if (tapCount.current === 1) {
          onTap?.(position);
        }
        tapCount.current = 0;
      }, doubleTapDelay);
    } else if (tapCount.current === 2) {
      // Second tap
      const timeDelta = currentTime - lastTapTime.current;
      
      if (timeDelta <= doubleTapDelay) {
        // Valid double tap
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        onDoubleTap?.(position);
        tapCount.current = 0;
      } else {
        // Too slow, treat as single tap
        onTap?.(position);
        tapCount.current = 0;
      }
    }
  }, [enabled, onTap, onDoubleTap, doubleTapDelay]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

  void element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
  void element.removeEventListener('touchend', handleTouchEnd);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, handleTouchEnd]);

  return elementRef;
}

// Combined gesture hook
export function useGestures(options: {
  swipe?: SwipeGestureOptions;
  pinch?: PinchGestureOptions;
  longPress?: LongPressOptions;
  tap?: TapOptions;
}) {
  const swipeRef = useSwipeGesture(options.swipe);
  const pinchRef = usePinchGesture(options.pinch);
  const longPressRef = useLongPress(options.longPress);
  const tapRef = useTap(options.tap);

  // Merge refs to single element
  const mergedRef = useCallback((element: HTMLElement | null) => {
    if (swipeRef.current !== element) swipeRef.current = element;
    if (pinchRef.current !== element) pinchRef.current = element;
    if (longPressRef.current !== element) longPressRef.current = element;
    if (tapRef.current !== element) tapRef.current = element;
  }, [swipeRef, pinchRef, longPressRef, tapRef]);

  return mergedRef;
}

// Hook for haptic feedback
export function useHapticFeedback() {
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
  void navigator.vibrate(pattern);
    }
  }, []);

  const lightFeedback = useCallback(() => {
    vibrate(10);
  }, [vibrate]);

  const mediumFeedback = useCallback(() => {
    vibrate(50);
  }, [vibrate]);

  const heavyFeedback = useCallback(() => {
    vibrate([100, 50, 100]);
  }, [vibrate]);

  const errorFeedback = useCallback(() => {
    vibrate([100, 50, 100, 50, 100]);
  }, [vibrate]);

  const successFeedback = useCallback(() => {
    vibrate([50, 25, 50]);
  }, [vibrate]);

  return {
    vibrate,
    lightFeedback,
    mediumFeedback,
    heavyFeedback,
    errorFeedback,
    successFeedback,
  };
}

// Hook for device orientation
export function useDeviceOrientation() {
  const [orientation, setOrientation] = React.useState<{
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
    absolute: boolean;
  }>({
    alpha: null,
    beta: null,
    gamma: null,
    absolute: false,
  });

  const [permission, setPermission] = React.useState<'granted' | 'denied' | 'default'>('default');

  const requestPermission = useCallback(async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && 'requestPermission' in DeviceOrientationEvent) {
      try {
        const result = await (DeviceOrientationEvent as any).requestPermission();
        setPermission(result);
        return result === 'granted';
      } catch (error) {
  void console.error('Error requesting device orientation permission:', error);
        setPermission('denied');
        return false;
      }
    }
    return true; // Permission not required on this device
  }, []);

  useEffect(() => {
    const handleOrientationChange = (event: DeviceOrientationEvent) => {
      setOrientation({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        absolute: event.absolute,
      });
    };

    if (permission === 'granted' || permission === 'default') {
  void window.addEventListener('deviceorientation', handleOrientationChange);
      return () => window.removeEventListener('deviceorientation', handleOrientationChange);
    }
  }, [permission]);

  return { orientation, permission, requestPermission };
}

// Hook for touch pressure sensitivity
export function useTouchPressure() {
  const [pressure, setPressure] = React.useState<number>(0);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if ('force' in touch) {
        setPressure(touch.force);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if ('force' in touch) {
        setPressure(touch.force);
      }
    };

    const handleTouchEnd = () => {
      setPressure(0);
    };

  void element.addEventListener('touchstart', handleTouchStart, { passive: true });
  void element.addEventListener('touchmove', handleTouchMove, { passive: true });
  void element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
  void element.removeEventListener('touchstart', handleTouchStart);
  void element.removeEventListener('touchmove', handleTouchMove);
  void element.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return { pressure, elementRef };
}