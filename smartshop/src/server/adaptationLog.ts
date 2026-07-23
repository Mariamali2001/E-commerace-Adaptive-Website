import "server-only";

import connectDB from "@/lib/mongodb";
import AdaptationLogModel from "@/models/AdaptationLog";
import type { FinalUIConfiguration } from "@/lib/adaptiveEngine/types";

/**
 * Persist adaptation log to Mongo — never throws to caller path.
 * Fire-and-forget from the Adaptive Engine API.
 */
export function persistAdaptationLogAsync(
  configuration: FinalUIConfiguration
): void {
  void (async () => {
    try {
      await connectDB();
      const tokensSnapshot: Record<string, string> = {};
      for (const [key, tok] of Object.entries(configuration.tokens)) {
        tokensSnapshot[key] = tok.value;
      }
      await AdaptationLogModel.create({
        participantId: configuration.contextRef.participantId,
        userId: configuration.contextRef.userId,
        device: configuration.device,
        persona: configuration.persona,
        mood: configuration.mood,
        detectedMood: configuration.detectedMood,
        pipeline: configuration.pipeline,
        log: configuration.log,
        tokensSnapshot,
        nudges: configuration.nudges,
      });
    } catch (err) {
      console.warn("[adaptation_logs] persist skipped:", err);
    }
  })();
}
