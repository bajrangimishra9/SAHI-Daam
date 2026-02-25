import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const exitTimer = setTimeout(() => setVisible(false), 2600);
    const completeTimer = setTimeout(() => onComplete(), 3200);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }} // ✅ no blur (keeps teal rich, not grey)
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{
            // ✅ Strong solid background like Image 1 (no transparency)
            background:
              "radial-gradient(1000px 700px at 70% 25%, rgba(42,170,170,0.25) 0%, rgba(0,0,0,0) 55%), linear-gradient(135deg, #062A2F 0%, #0B3F47 45%, #0A2F38 100%)",
          }}
        >
          {/* Blueprint grid overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              pointerEvents: "none",
            }}
          />

          {/* Subtle radial glow (kept subtle, does not wash out) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Scan line */}
          <motion.div
            className="absolute left-0 right-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(218,168,60,0.55) 30%, rgba(218,168,60,0.9) 50%, rgba(218,168,60,0.55) 70%, transparent 100%)",
              boxShadow: "0 0 20px 2px rgba(218,168,60,0.25)",
            }}
            initial={{ top: "0%", opacity: 0 }}
            animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.2, ease: "easeInOut", delay: 0.3 }}
          />

          {/* Content */}
          <div className="relative z-10 text-center px-6">
            <motion.h1
              className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 30, letterSpacing: "0.15em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.02em" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            >
              <span className="text-white">SAHI</span>{" "}
              <span style={{ color: "#DAA83C" }}>दाम</span>
            </motion.h1>

            <motion.div
              className="mx-auto mt-4 mb-5 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(218,168,60,0.85) 50%, transparent 100%)",
              }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 120, opacity: 0.8 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.7 }}
            />

            <motion.p
              className="text-sm sm:text-base md:text-lg font-light tracking-[0.2em] uppercase"
              style={{ color: "rgba(220, 230, 235, 0.9)" }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 1.0 }}
            >
              AI Construction Materials &amp; Equipment Marketplace
            </motion.p>

            <motion.div
              className="mx-auto mt-8 flex gap-1.5 justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "#DAA83C" }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroAnimation;