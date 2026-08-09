"use client";

import { useEffect, useRef } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";

// Lottie animation states
type AnimationState = "idle" | "typing" | "password" | "error" | "success";

type Props = {
  state: AnimationState;
  className?: string;
};

// Free Lottie animations - these are CDN URLs to popular animations
// You can replace these with your own downloaded JSON files
const animations: Record<AnimationState, object | null> = {
  idle: null, // Will use a default state
  typing: null, // Avatar looking/watching
  password: null, // Avatar covering eyes
  error: null, // Avatar shaking head
  success: null, // Avatar celebrating
};

// Placeholder animation data (simple circle that changes color)
// Replace with actual Lottie JSON when you download them
const defaultAnimation = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 90,
  w: 200,
  h: 200,
  nm: "Avatar",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Face",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [80, 80] },
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.4, 0.6, 1, 1] },
              o: { a: 0, k: 100 },
            },
          ],
          nm: "Circle",
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
    },
  ],
};

export function AnimatedAvatar({ state, className = "" }: Props) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    // Handle animation state changes
    if (lottieRef.current) {
      if (state === "success") {
        lottieRef.current.play();
      } else if (state === "error") {
        lottieRef.current.play();
      }
    }
  }, [state]);

  // Get the appropriate animation for the state
  const getAnimationStyle = () => {
    switch (state) {
      case "typing":
        return "animate-pulse";
      case "password":
        return "opacity-50";
      case "error":
        return "animate-shake";
      case "success":
        return "animate-bounce";
      default:
        return "";
    }
  };

  const getEmojiAvatar = () => {
    switch (state) {
      case "typing":
        return "👀"; // Eyes looking
      case "password":
        return "🙈"; // Monkey covering eyes
      case "error":
        return "😅"; // Try again
      case "success":
        return "🎉"; // Celebration
      default:
        return "😊"; // Idle/default
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* Fallback emoji version - Replace this with Lottie when you have the JSON files */}
      <div
        className={`text-6xl transition-all duration-300 ${getAnimationStyle()}`}
        style={{
          filter: state === "password" ? "blur(2px)" : "none",
        }}
      >
        {getEmojiAvatar()}
      </div>

      {/* Uncomment this when you have Lottie JSON files */}
      {/* <Lottie
        lottieRef={lottieRef}
        animationData={animations[state] || defaultAnimation}
        loop={state === "typing" || state === "idle"}
        autoplay={true}
        style={{ width: 120, height: 120 }}
      /> */}
    </div>
  );
}

