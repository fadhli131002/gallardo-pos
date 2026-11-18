import { forwardRef, useImperativeHandle, useCallback } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { motion, useAnimate } from "framer-motion";

export const PlusIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      await animate(".plus-group", { rotate: 90, scale: 1.12 }, { duration: 0.25, ease: "easeOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".plus-group", { rotate: 0, scale: 1 }, { duration: 0.2, ease: "easeInOut" });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.g className="plus-group" style={{ transformOrigin: "12px 12px" }}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </motion.g>
      </motion.svg>
    );
  }
);
PlusIcon.displayName = "PlusIcon";

export const PlusCircleIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      animate(".circle-ring", { scale: [1, 1.06, 1] }, { duration: 0.3, ease: "easeOut" });
      await animate(".plus-inner", { rotate: 90 }, { duration: 0.25, ease: "easeOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".circle-ring", { scale: 1 }, { duration: 0.2 });
      animate(".plus-inner", { rotate: 0 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.circle className="circle-ring" cx="12" cy="12" r="9" style={{ transformOrigin: "12px 12px" }} />
        <motion.g className="plus-inner" style={{ transformOrigin: "12px 12px" }}>
          <path d="M9 12h6" />
          <path d="M12 9v6" />
        </motion.g>
      </motion.svg>
    );
  }
);
PlusCircleIcon.displayName = "PlusCircleIcon";

export const MinusIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      await animate(".minus-bar", { scaleX: [1, 1.2, 0.9, 1] }, { duration: 0.3, ease: "easeInOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".minus-bar", { scaleX: 1 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.path className="minus-bar" d="M5 12h14" style={{ transformOrigin: "12px 12px" }} />
      </motion.svg>
    );
  }
);
MinusIcon.displayName = "MinusIcon";

export const MinusCircleIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      animate(".circle-ring", { scale: [1, 1.06, 1] }, { duration: 0.3, ease: "easeOut" });
      await animate(".minus-inner", { scaleX: [1, 1.25, 1] }, { duration: 0.3, ease: "easeInOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".circle-ring", { scale: 1 }, { duration: 0.2 });
      animate(".minus-inner", { scaleX: 1 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.circle className="circle-ring" cx="12" cy="12" r="9" style={{ transformOrigin: "12px 12px" }} />
        <motion.path className="minus-inner" d="M9 12h6" style={{ transformOrigin: "12px 12px" }} />
      </motion.svg>
    );
  }
);
MinusCircleIcon.displayName = "MinusCircleIcon";

export const CalendarIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      animate(".cal-pins", { y: [0, -2, 0] }, { duration: 0.3, ease: "easeOut" });
      await animate(".cal-body", { scale: [1, 1.04, 1] }, { duration: 0.3, ease: "easeOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".cal-pins", { y: 0 }, { duration: 0.2 });
      animate(".cal-body", { scale: 1 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.g className="cal-pins">
          <path d="M8 2v4" />
          <path d="M16 2v4" />
        </motion.g>
        <motion.g className="cal-body" style={{ transformOrigin: "12px 13px" }}>
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 14h.01" />
          <path d="M12 14h.01" />
          <path d="M16 14h.01" />
          <path d="M8 18h.01" />
          <path d="M12 18h.01" />
        </motion.g>
      </motion.svg>
    );
  }
);
CalendarIcon.displayName = "CalendarIcon";

export const CarIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      await animate(".car-frame", { x: [0, 2, -1, 0], y: [0, -1, 0] }, { duration: 0.35, ease: "easeInOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".car-frame", { x: 0, y: 0 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.g className="car-frame">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </motion.g>
      </motion.svg>
    );
  }
);
CarIcon.displayName = "CarIcon";

export const BikeIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      await animate(".bike-group", { x: [0, 3, 0] }, { duration: 0.35, ease: "easeInOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".bike-group", { x: 0 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.g className="bike-group">
          <circle cx="18.5" cy="17.5" r="3.5" />
          <circle cx="5.5" cy="17.5" r="3.5" />
          <circle cx="15" cy="5" r="1" />
          <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
        </motion.g>
      </motion.svg>
    );
  }
);
BikeIcon.displayName = "BikeIcon";

export const PrinterIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      await animate(".printer-sheet", { y: [0, 2, 0] }, { duration: 0.35, ease: "easeInOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".printer-sheet", { y: 0 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
        <motion.rect className="printer-sheet" x="6" y="14" width="12" height="8" rx="1" />
      </motion.svg>
    );
  }
);
PrinterIcon.displayName = "PrinterIcon";

export const ArrowLeftRightIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      animate(".arrow-top", { x: [0, -3, 0] }, { duration: 0.3, ease: "easeInOut" });
      await animate(".arrow-bottom", { x: [0, 3, 0] }, { duration: 0.3, ease: "easeInOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".arrow-top, .arrow-bottom", { x: 0 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.g className="arrow-top">
          <path d="M8 3 4 7l4 4" />
          <path d="M4 7h16" />
        </motion.g>
        <motion.g className="arrow-bottom">
          <path d="m16 21 4-4-4-4" />
          <path d="M20 17H4" />
        </motion.g>
      </motion.svg>
    );
  }
);
ArrowLeftRightIcon.displayName = "ArrowLeftRightIcon";

export const ArrowUpDownIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      animate(".arrow-left", { y: [0, 2.5, 0] }, { duration: 0.3, ease: "easeInOut" });
      await animate(".arrow-right", { y: [0, -2.5, 0] }, { duration: 0.3, ease: "easeInOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".arrow-left, .arrow-right", { y: 0 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.g className="arrow-left">
          <path d="m21 16-4 4-4-4" />
          <path d="M17 20V4" />
        </motion.g>
        <motion.g className="arrow-right">
          <path d="m3 8 4-4 4 4" />
          <path d="M7 4v16" />
        </motion.g>
      </motion.svg>
    );
  }
);
ArrowUpDownIcon.displayName = "ArrowUpDownIcon";

export const ArrowUpRightIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      await animate(".diag-up", { x: [0, 2.5, 0], y: [0, -2.5, 0] }, { duration: 0.3, ease: "easeOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".diag-up", { x: 0, y: 0 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.g className="diag-up">
          <path d="M7 7h10v10" />
          <path d="M7 17 17 7" />
        </motion.g>
      </motion.svg>
    );
  }
);
ArrowUpRightIcon.displayName = "ArrowUpRightIcon";

export const ArrowDownRightIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      await animate(".diag-down", { x: [0, 2.5, 0], y: [0, 2.5, 0] }, { duration: 0.3, ease: "easeOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".diag-down", { x: 0, y: 0 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.g className="diag-down">
          <path d="m7 7 10 10" />
          <path d="M17 7v10H7" />
        </motion.g>
      </motion.svg>
    );
  }
);
ArrowDownRightIcon.displayName = "ArrowDownRightIcon";

export const LeftChevronIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      await animate(".chev-left", { x: [0, -3, 0] }, { duration: 0.35, ease: "easeInOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".chev-left", { x: 0 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.path className="chev-left" d="m15 18-6-6 6-6" />
      </motion.svg>
    );
  }
);
LeftChevronIcon.displayName = "LeftChevronIcon";

export const UpChevronIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      await animate(".chev-up", { y: [0, -3, 0] }, { duration: 0.35, ease: "easeInOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".chev-up", { y: 0 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.path className="chev-up" d="m18 15-6-6-6 6" />
      </motion.svg>
    );
  }
);
UpChevronIcon.displayName = "UpChevronIcon";

export const PackageIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      await animate(".pkg-box", { y: [0, -2, 0], scale: [1, 1.04, 1] }, { duration: 0.3, ease: "easeOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".pkg-box", { y: 0, scale: 1 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.g className="pkg-box" style={{ transformOrigin: "12px 12px" }}>
          <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
          <path d="M12 22V12" />
          <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" />
          <path d="m7.5 4.27 9 5.15" />
        </motion.g>
      </motion.svg>
    );
  }
);
PackageIcon.displayName = "PackageIcon";

export const PackagePlusIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      animate(".pkg-plus", { rotate: 90, scale: 1.15 }, { duration: 0.25, ease: "easeOut" });
      await animate(".pkg-base", { y: [0, -1.5, 0] }, { duration: 0.3, ease: "easeOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".pkg-plus", { rotate: 0, scale: 1 }, { duration: 0.2 });
      animate(".pkg-base", { y: 0 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.g className="pkg-plus" style={{ transformOrigin: "19px 19px" }}>
          <path d="M16 19h6" />
          <path d="M19 16v6" />
        </motion.g>
        <motion.g className="pkg-base">
          <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
          <path d="m7.5 4.27 9 5.15" />
          <polyline points="3.29 7 12 12 20.71 7" />
          <line x1="12" x2="12" y1="22" y2="12" />
        </motion.g>
      </motion.svg>
    );
  }
);
PackagePlusIcon.displayName = "PackagePlusIcon";

export const WrenchIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      await animate(".wrench-body", { rotate: [0, -18, 12, 0] }, { duration: 0.4, ease: "easeInOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".wrench-body", { rotate: 0 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.path
          className="wrench-body"
          style={{ transformOrigin: "12px 12px" }}
          d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        />
      </motion.svg>
    );
  }
);
WrenchIcon.displayName = "WrenchIcon";

export const StoreIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      await animate(".store-group", { y: [0, -1.5, 0], scale: [1, 1.04, 1] }, { duration: 0.3, ease: "easeOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".store-group", { y: 0, scale: 1 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.g className="store-group" style={{ transformOrigin: "12px 12px" }}>
          <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
          <path d="M2 7h20" />
          <path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" />
        </motion.g>
      </motion.svg>
    );
  }
);
StoreIcon.displayName = "StoreIcon";

export const ArmchairIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      await animate(".chair-group", { y: [0, -1.5, 0] }, { duration: 0.3, ease: "easeOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".chair-group", { y: 0 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.g className="chair-group">
          <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
          <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z" />
          <path d="M5 18v2" />
          <path d="M19 18v2" />
        </motion.g>
      </motion.svg>
    );
  }
);
ArmchairIcon.displayName = "ArmchairIcon";

export const CalculatorIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      await animate(".calc-body", { scale: [1, 1.05, 1] }, { duration: 0.3, ease: "easeOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".calc-body", { scale: 1 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.g className="calc-body" style={{ transformOrigin: "12px 12px" }}>
          <rect width="16" height="20" x="4" y="2" rx="2" />
          <line x1="8" x2="16" y1="6" y2="6" />
          <line x1="16" x2="16" y1="14" y2="18" />
          <path d="M16 10h.01" />
          <path d="M12 10h.01" />
          <path d="M8 10h.01" />
          <path d="M12 14h.01" />
          <path d="M8 14h.01" />
          <path d="M12 18h.01" />
          <path d="M8 18h.01" />
        </motion.g>
      </motion.svg>
    );
  }
);
CalculatorIcon.displayName = "CalculatorIcon";

export const BanknoteIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      await animate(".banknote-group", { scale: [1, 1.06, 1], y: [0, -1, 0] }, { duration: 0.3, ease: "easeOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".banknote-group", { scale: 1, y: 0 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.g className="banknote-group" style={{ transformOrigin: "12px 12px" }}>
          <rect width="20" height="12" x="2" y="6" rx="2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M6 12h.01M18 12h.01" />
        </motion.g>
      </motion.svg>
    );
  }
);
BanknoteIcon.displayName = "BanknoteIcon";

export const ActivityIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      await animate(".pulse-path", { pathLength: [0, 1] }, { duration: 0.45, ease: "easeInOut" });
    }, [animate]);
    const stop = useCallback(() => {
      animate(".pulse-path", { pathLength: 1 }, { duration: 0.2 });
    }, [animate]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.path
          className="pulse-path"
          d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
        />
      </motion.svg>
    );
  }
);
ActivityIcon.displayName = "ActivityIcon";

export const Loader2Icon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
    const [scope, animate] = useAnimate();
    const start = useCallback(async () => {
      await animate(scope.current, { rotate: 360 }, { duration: 0.6, ease: "linear" });
    }, [animate, scope]);
    const stop = useCallback(() => {
      animate(scope.current, { rotate: 0 }, { duration: 0.2 });
    }, [animate, scope]);
    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </motion.svg>
    );
  }
);
Loader2Icon.displayName = "Loader2Icon";
