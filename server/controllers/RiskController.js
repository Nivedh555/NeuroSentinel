import { RISK_WEIGHTS, RISK_LABELS } from "../config/riskConfig.js";
import RiskScore from "../models/RiskScore.js";
import DailyQuiz from "../models/DailyQuiz.js";
import { setCache, getCache, cacheKeys } from "../utils/cacheUtils.js";
import { sendEmergencyContactSms } from "../services/emergencyNotificationService.js";

const HELPLINE = {
  page: "/support/helplines",
  resources: [
    { name: "iCall (India)", number: "9152987821", available: "Mon–Sat, 8am–10pm" },
    { name: "Vandrevala Foundation", number: "1860-2662-345", available: "24/7" },
    { name: "AASRA", number: "9820466627", available: "24/7" },
  ],
};

const QUIZ_ROUTES = {
  depression: "/quiz/depression",
  anxiety: "/quiz/anxiety",
  stress: "/quiz/stress",
  sleep: "/quiz/sleep",
};

const calculateDecayRate = (daysOld) => {
  if (daysOld <= 7) return 1.0;
  if (daysOld > 14) return 0.0;
  return 1 - (daysOld - 7) / 7;
};

const getDaysDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
};

// ─── PROXY ───────────────────────────────────────────────────────────────────
const calculateProxyFromDailyQuiz = (dailyQuizScores) => {
  if (!dailyQuizScores)
    return { stress: null, sleep: null, depression: null, anxiety: null };

  const {
    stressScore = 0,
    sleepScore = 0,
    depressionScore = 0,
    anxietyScore = 0,
  } = dailyQuizScores;

  return {
    stress: stressScore,
    sleep: sleepScore,
    depression: depressionScore,
    anxiety: anxietyScore,
  };
};

// ─── CLINICAL SCORE WITH DECAY ───────────────────────────────────────────────
const getClinicalScore = async (userId, quizType, today, proxyScores) => {
  const recentQuiz = await DailyQuiz.findOne({
    userId,
    quizType,
    finalScore: { $ne: null },
  }).sort({ date: -1 });

  if (!recentQuiz) {
    // null = truly no data (not the same as score of 0)
    return { score: proxyScores[quizType] ?? null, date: null };
  }

  const quizDate = new Date(recentQuiz.date).toISOString().split("T")[0];
  const daysOld = getDaysDifference(quizDate, today);

  if (daysOld <= 14) {
    return {
      score: recentQuiz.finalScore * calculateDecayRate(daysOld),
      date: quizDate,
    };
  }

  return { score: proxyScores[quizType] ?? null, date: null };
};

// ─── RISK LEVEL ──────────────────────────────────────────────────────────────
const getRiskLevel = (score) => {
  if (score < 0.3) return "LOW";
  if (score < 0.5) return "MODERATE";
  if (score < 0.7) return "HIGH";
  return "CRITICAL";
};

const getTrend = (current, previous) => {
  if (previous === null || previous === undefined) return "unknown";
  if (current > previous + 0.1) return "declining";
  if (current < previous - 0.1) return "improving";
  return "stable";
};

// ─── TOP FACTORS ─────────────────────────────────────────────────────────────
// Uses RISK_LABELS config thresholds. LLM adds richer context in the response.
const getTopFactors = (scores) => {
  const factors = [];
  for (const { key, label, threshold } of RISK_LABELS) {
    const score = scores[key];
    if (score !== null && score !== undefined && score >= threshold) {
      factors.push(`${label} (${(score * 100).toFixed(2)})`);
    }
  }
  return factors.slice(0, 3);
};

// ─── DISENGAGEMENT SCORE ─────────────────────────────────────────────────────
const calculateDisengagementScore = (daysSinceCheckin, lastKnownScore) => {
  if (daysSinceCheckin === 0) return 0;
  const basePenalty = Math.min(daysSinceCheckin * 0.08, 0.6);
  const riskAmplifier = lastKnownScore ? 1 + lastKnownScore : 1;
  return Math.min(basePenalty * riskAmplifier, 1.0);
};

// ─── PERSONAL BASELINE (min 10 real points) ──────────────────────────────────
const calculateBaseline = async (userId, today) => {
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const history = await RiskScore.find({
    user: userId,
    date: { $gte: thirtyDaysAgo.toISOString().split("T")[0], $lt: today },
    overall_score: { $ne: null },
    is_imputed: { $ne: true },
  }).select("overall_score");

  if (history.length < 10) return { baseline_score: null, std_dev: null };

  const vals = history.map((r) => r.overall_score);
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / vals.length;

  return { baseline_score: parseFloat(mean.toFixed(4)), std_dev: Math.sqrt(variance) };
};

// ─── CONSECUTIVE HIGH RISK DAYS ──────────────────────────────────────────────
const getConsecutiveHighRiskDays = async (userId, today, currentLevel) => {
  if (currentLevel !== "HIGH" && currentLevel !== "CRITICAL") return 0;

  const recent = await RiskScore.find({
    user: userId,
    date: { $lt: today },
    risk_level: { $in: ["HIGH", "CRITICAL"] },
  })
    .sort({ date: -1 })
    .limit(30)
    .select("date risk_level");

  let count = 1; // today counts
  for (const r of recent) {
    if (r.risk_level === "HIGH" || r.risk_level === "CRITICAL") count++;
    else break;
  }
  return count;
};

// ─── QUIZ SUGGESTIONS ────────────────────────────────────────────────────────
const getQuizSuggestions = (scores, riskLevel) => {
  if (riskLevel === "LOW") return [];

  const cfg = [
    { key: "depression_quiz_score", threshold: 0.55, quiz: "depression", label: "Depression Assessment (PHQ-9)" },
    { key: "anxiety_quiz_score", threshold: 0.50, quiz: "anxiety", label: "Anxiety Assessment (GAD-7)" },
    { key: "stress_quiz_score", threshold: 0.55, quiz: "stress", label: "Stress Assessment (PSS)" },
    { key: "sleep_quiz_score", threshold: 0.50, quiz: "sleep", label: "Sleep Quality Assessment" },
  ];

  return cfg
    .filter(({ key, threshold }) => {
      const s = scores[key];
      return s !== null && s !== undefined && s >= threshold;
    })
    .map(({ key, quiz, label, threshold }) => ({
      quiz_type: quiz,
      label,
      reason: `Your ${quiz} indicators are elevated`,
      route: QUIZ_ROUTES[quiz],
      priority: scores[key] >= 0.7 ? "high" : "medium",
    }))
    .sort((a, b) => (a.priority === "high" && b.priority !== "high" ? -1 : 1));
};

// ─── CLINICAL ASSISTANCE NUDGE ───────────────────────────────────────────────
const getClinicalAssistance = (riskLevel, consecutiveHighRiskDays, alerts) => {
  const hasCritical = alerts.some((a) => a.severity === "critical");
  const hasHigh = alerts.some((a) => a.severity === "high");

  if (riskLevel === "CRITICAL" || consecutiveHighRiskDays >= 3 || hasCritical) {
    return {
      show: true,
      urgency: "critical",
      message: "Your mental health scores suggest you may benefit from speaking with a professional. You don't have to face this alone — reaching out is a sign of strength.",
      cta: "View helplines & support resources",
      helpline_page: HELPLINE.page,
      helplines: HELPLINE.resources,
    };
  }

  if (riskLevel === "HIGH" || consecutiveHighRiskDays >= 2 || hasHigh) {
    return {
      show: true,
      urgency: "high",
      message: "We've noticed some concerning patterns in your check-ins. Consider talking to someone — a counselor or a trusted person can make a real difference.",
      cta: "Find support near you",
      helpline_page: HELPLINE.page,
      helplines: HELPLINE.resources,
    };
  }

  return { show: false };
};

// ── DYNAMIC WEIGHTS via XGBoost ─────────────────────────────────────────────
const getDynamicWeights = async () => {
  const cacheKey = "config:risk_weights";
  let weights = await getCache(cacheKey);
  if (weights) return weights;

  try {
    const res = await fetch(`${process.env.PYTHON_SERVER}/api/risk-weights`);
    if (!res.ok) throw new Error(`FastAPI ${res.status}`);
    weights = await res.json();
    console.log("📈 [XGBoost] Fetched dynamic weights:", weights);
    await setCache(cacheKey, weights, 86400); // 24h cache
    return weights;
  } catch (err) {
    console.warn("⚠️ [XGBoost] Weights unavailable, using hardcoded fallback:", err.message);
    return RISK_WEIGHTS;
  }
};

// ── LLM via FastAPI ─────────────────────────────────────────────────────────
const getLLMResult = async (payload) => {
  try {
    const res = await fetch(`${process.env.PYTHON_SERVER}/api/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`FastAPI ${res.status}`);
    console.log("LLM response received for risk context:", payload);
    const result = await res.json();
    return result;
  } catch (err) {
    console.error("LLM unavailable, using static fallback:", err.message);
    const staticSteps = getStaticRecommendations(payload.top_factors);
    return {
      motivational_message: getStaticMotivationalMessage(payload.risk_level),
      coping_steps: staticSteps.length > 0 ? staticSteps : ["Take a moment to breathe deeply", "Check in with a trusted friend or counselor"],
    };
  }
};

const getStaticMotivationalMessage = (riskLevel) => {
  const messages = {
    CRITICAL: "Your wellbeing matters. Please reach out to a mental health professional or crisis hotline for immediate support.",
    HIGH: "You're facing a challenging time, but you're not alone. Take it one step at a time.",
    MODERATE: "You're actively checking in on yourself — that's a positive step. Keep taking care.",
    LOW: "Great job maintaining your wellbeing! Keep up these positive habits.",
  };
  return messages[riskLevel] || "Remember to prioritize your mental health and reach out if you need support.";
};

const getStaticRecommendations = (factors = []) => {
  const recs = [];
  if (factors.some((f) => f.toLowerCase().includes("depression")))
    recs.push("Consider cognitive behavioral therapy (CBT) or counseling.");
  if (factors.some((f) => f.toLowerCase().includes("anxiety")))
    recs.push("Practice mindfulness and relaxation techniques.");
  if (factors.some((f) => f.toLowerCase().includes("stress")))
    recs.push("Engage in regular physical activity and stress management.");
  if (factors.some((f) => f.toLowerCase().includes("sleep")))
    recs.push("Maintain a consistent sleep schedule and create a restful environment.");
  return recs;
};

// ─── INSIGHTS + ALERTS ───────────────────────────────────────────────────────
const generateInsights = (velocity, volatility, currentScore, previousScore, riskLevel) => {
  const insights = [];
  const alerts = [];
  const vp = velocity * 100; // velocity percent

  // Velocity-based
  if (vp > 7) {
    alerts.push({ type: "URGENT", severity: "high", message: "⚠️ Rapid deterioration detected", detail: `Declining by ${vp.toFixed(1)} pts/day. Immediate attention recommended.`, action: "Take a comprehensive mental health assessment now" });
  } else if (vp > 3) {
    alerts.push({ type: "WARNING", severity: "medium", message: "📉 Declining trend detected", detail: `Scores worsening over the past week (+${vp.toFixed(1)} pts/day).`, action: "Consider taking a depression or anxiety assessment" });
  } else if (vp < -7) {
    insights.push({ type: "POSITIVE", message: "✅ Significant improvement", detail: `Improving rapidly (-${Math.abs(vp).toFixed(1)} pts/day). Keep it up!` });
  } else if (vp < -3) {
    insights.push({ type: "POSITIVE", message: "📈 Steady improvement", detail: "Scores are getting better. Continue your current wellness practices." });
  } else {
    insights.push({ type: "INFO", message: "➡️ Stable pattern", detail: "Your wellness scores are relatively consistent this week." });
  }

  // Volatility-based
  if (volatility > 35) {
    alerts.push({ type: "ATTENTION", severity: "medium", message: "🎭 High mood instability", detail: `Scores vary by ${volatility.toFixed(1)}% day-to-day — possible mood swings.`, action: "Consider a mood disorder screening" });
  } else if (volatility > 20) {
    insights.push({ type: "INFO", message: "📊 Moderate mood fluctuation", detail: `Daily scores vary ${volatility.toFixed(1)}%. Normal but worth monitoring.` });
  } else {
    insights.push({ type: "POSITIVE", message: "🎯 Stable mood pattern", detail: "Consistent scores — good emotional stability." });
  }

  // Combination rules
  if (vp > 5 && currentScore >= 0.6) {
    alerts.push({ type: "CRITICAL", severity: "critical", message: "🚨 CRITICAL: High risk + worsening trend", detail: `Score ${(currentScore * 100).toFixed(2)} (${riskLevel}) rapidly increasing.`, action: "Contact a mental health professional or crisis hotline" });
  } else if (vp > 3 && currentScore >= 0.5 && volatility > 25) {
    alerts.push({ type: "URGENT", severity: "high", message: "⚠️ Multiple risk factors", detail: "Declining scores with unstable mood patterns.", action: "Schedule a check-in with a counselor" });
  }
  if (vp > 4 && currentScore < 0.6) {
    alerts.push({ type: "EARLY_WARNING", severity: "medium", message: "💡 Early warning", detail: `Score ${(currentScore * 100).toFixed(2)} is moderate but rising fast.`, action: "Take stress/anxiety quiz now" });
  }
  if (previousScore >= 0.65 && currentScore < 0.5 && vp < -2) {
    insights.push({ type: "RECOVERY", message: "🌱 Recovery progress", detail: "Moving away from high-risk levels. Excellent progress!", action: "Continue current interventions" });
  }
  if (previousScore < 0.45 && currentScore >= 0.55 && vp > 3) {
    alerts.push({ type: "RELAPSE_WARNING", severity: "medium", message: "⚠️ Possible relapse pattern", detail: "After improvement, scores are rising again.", action: "Review what changed — stress, sleep, medication" });
  }

  return { insights, alerts };
};


// ════════════════════════════════════════════════════════════════════════════
// calculateOverallRisk
// ════════════════════════════════════════════════════════════════════════════
export const calculateOverallRisk = async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split("T")[0];

    console.log("🔍 [calculateOverallRisk] Called for userId:", userId, "date:", today);

    const cacheKey = cacheKeys.riskDaily(userId, today);
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log("✅ [calculateOverallRisk] Cache HIT - returning cached data");
      return res.json(cached);
    }
    console.log("❌ [calculateOverallRisk] Cache MISS - computing risk score");

    let todayRisk = await RiskScore.findOne({ user: userId, date: today });
    if (!todayRisk) todayRisk = new RiskScore({ user: userId, date: today });

    const previous = await RiskScore.findOne({ user: userId, date: { $lt: today } }).sort({ date: -1 });
    const previousScore = previous?.overall_score ?? null;

    // ── Daily quiz ──
    const todayDailyQuiz = await DailyQuiz.findOne({
      userId,
      quizType: "daily",
      date: {
        $gte: new Date(today),
        $lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1)),
      },
    });

    const userCheckedInToday = !!todayDailyQuiz;
    const proxyScores = calculateProxyFromDailyQuiz(todayDailyQuiz?.scores ?? null);

    // ── Clinical scores (parallel) ──
    const [depressionData, anxietyData, stressData, sleepData] = await Promise.all([
      getClinicalScore(userId, "depression", today, proxyScores),
      getClinicalScore(userId, "anxiety", today, proxyScores),
      getClinicalScore(userId, "stress", today, proxyScores),
      getClinicalScore(userId, "sleep", today, proxyScores),
    ]);

    // ── Disengagement ──
    const lastCheckinDate = previous?.last_checkin_date ?? previous?.date ?? null;
    const daysSinceCheckin = userCheckedInToday ? 0
      : lastCheckinDate ? getDaysDifference(lastCheckinDate, today) : 0;
    const disengagementScore = calculateDisengagementScore(daysSinceCheckin, previousScore);

    // ── Scores object ──
    // null  = no data at all  → excluded from weighted sum
    // 0     = measured zero   → included in weighted sum
    const scores = {
      depression_quiz_score: depressionData.score,
      anxiety_quiz_score: anxietyData.score,
      stress_quiz_score: stressData.score,
      sleep_quiz_score: sleepData.score,
      journal_score: todayRisk.journal_score ?? null,
      chatbot_score: todayRisk.chatbot_score ?? null,
      quiz_score: todayDailyQuiz?.finalScore ?? todayRisk.quiz_score ?? null,
      community_score: todayRisk.community_score != null ? 1 - todayRisk.community_score : null,
      disengagement_score: disengagementScore,
    };

    // ── Normalised weighted average (null excluded, 0 included) ──
    const weights = await getDynamicWeights();
    let totalWeight = 0, weightedSum = 0;
    for (const [key, weight] of Object.entries(weights)) {
      if (scores[key] !== null && scores[key] !== undefined) {
        weightedSum += scores[key] * weight;
        totalWeight += weight;
      }
    }
    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    const riskLevel = getRiskLevel(overallScore);
    const trend = getTrend(overallScore, previousScore);
    const topFactors = getTopFactors(scores);

    // ── Personal baseline ──
    const { baseline_score, std_dev } = await calculateBaseline(userId, today);
    const baseline_deviation = baseline_score !== null
      ? parseFloat((overallScore - baseline_score).toFixed(4)) : null;
    const isAbovePersonalBaseline =
      baseline_deviation !== null && std_dev !== null && baseline_deviation > 1.5 * std_dev;

    // ── Gap-corrected velocity + volatility ──
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentScores = await RiskScore.find({
      user: userId,
      date: { $gte: sevenDaysAgo.toISOString().split("T")[0], $lte: today },
      overall_score: { $ne: null },
    }).sort({ date: 1 });

    let velocity = 0, volatility = 0, velocityDataPoints = 0;

    if (recentScores.length >= 2) {
      let totalDailyRate = 0, pairs = 0;
      for (let i = 1; i < recentScores.length; i++) {
        const dayGap = getDaysDifference(recentScores[i - 1].date, recentScores[i].date);
        const change = recentScores[i].overall_score - recentScores[i - 1].overall_score;
        totalDailyRate += change / Math.max(dayGap, 1);
        pairs++;
      }
      velocity = totalDailyRate / pairs;

      const vals = recentScores.map((r) => r.overall_score);
      velocityDataPoints = vals.length;
      const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
      const variance = vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / vals.length;
      volatility = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;
    }

    // ── Consecutive high risk days ──
    const consecutiveHighRiskDays = await getConsecutiveHighRiskDays(userId, today, riskLevel);

    // ── Insights + alerts ──
    const { insights, alerts } = generateInsights(velocity, volatility, overallScore, previousScore, riskLevel);

    if (daysSinceCheckin >= 3) {
      alerts.push({
        type: "DISENGAGEMENT",
        severity: daysSinceCheckin >= 5 ? "high" : "medium",
        message: `📵 ${daysSinceCheckin} days without a check-in`,
        detail: "We miss you. Even a quick check-in helps us support you better.",
        action: "Complete a quick mood check today",
      });
    }

    if (isAbovePersonalBaseline) {
      alerts.push({
        type: "ABOVE_BASELINE", severity: "medium",
        message: "📊 Higher than your usual",
        detail: "Today's score is notably above your personal average.",
        action: "Reflect on what's been different lately",
      });
    }

    if (consecutiveHighRiskDays >= 2) {
      alerts.push({
        type: "PERSISTENT_HIGH_RISK",
        severity: consecutiveHighRiskDays >= 3 ? "high" : "medium",
        message: `🔴 ${consecutiveHighRiskDays} consecutive high-risk days`,
        detail: `You've been in a high-risk zone for ${consecutiveHighRiskDays} days in a row.`,
        action: consecutiveHighRiskDays >= 3
          ? "Please consider reaching out to a mental health professional"
          : "Take a clinical assessment to understand what's driving this",
      });
    }

    // ── Quiz suggestions + clinical assistance ──
    const quizSuggestions = getQuizSuggestions(scores, riskLevel);
    const clinicalAssistance = getClinicalAssistance(riskLevel, consecutiveHighRiskDays, alerts);

    // ── LLM (cached 24h by risk context) ──
    const llmCacheKey = `llm:${riskLevel}:${trend}:${topFactors.join(",")}`;
    let llmResult = await getCache(llmCacheKey);
    console.log("📊 LLM cache lookup for key:", llmCacheKey, "Result:", llmResult ? "HIT" : "MISS");
    console.log("📊 llm result object:", llmResult);
    if (!llmResult) {
      console.log("🤖 [LLM] Calling getLLMResult with:", { riskLevel, trend, topFactors, daysSinceCheckin, consecutiveHighRiskDays });
      llmResult = await getLLMResult({
        risk_level: riskLevel,
        trend,
        top_factors: topFactors,
        days_since_checkin: daysSinceCheckin,
        consecutive_high_risk_days: consecutiveHighRiskDays,
      });
      console.log("🤖 [LLM] Got response:", llmResult);
      // Only cache if it's a successful response (has motivational_message from API)
      if (llmResult.motivational_message && llmResult.motivational_message !== null) {
        console.log("💾 [LLM] Caching successful API response");
        await setCache(llmCacheKey, llmResult, 86400);
      } else {
        console.log("⚠️ [LLM] Not caching fallback response (will retry on next request)");
      }
    }

    // ── Persist ──
    const persistedRisk = await RiskScore.findOneAndUpdate(
      { user: userId, date: today },
      {
        depression_quiz_score: depressionData.score,
        depression_quiz_date: depressionData.date,
        anxiety_quiz_score: anxietyData.score,
        anxiety_quiz_date: anxietyData.date,
        stress_quiz_score: stressData.score,
        stress_quiz_date: stressData.date,
        sleep_quiz_score: sleepData.score,
        sleep_quiz_date: sleepData.date,
        journal_score: todayRisk.journal_score,
        chatbot_score: todayRisk.chatbot_score,
        quiz_score: scores.quiz_score,
        community_score: todayRisk.community_score,
        overall_score: overallScore,
        risk_level: riskLevel,
        top_factors: topFactors,
        previous_score: previousScore,
        trend,
        days_since_checkin: daysSinceCheckin,
        last_checkin_date: userCheckedInToday ? today : (lastCheckinDate ?? null),
        is_imputed: !userCheckedInToday,
        disengagement_score: disengagementScore,
        baseline_score,
        baseline_deviation,
        velocity_data_points: velocityDataPoints,
      },
      { upsert: true, new: true }
    );

    // Auto-notify emergency contacts once per day for high-risk mental health states.
    const shouldAutoNotify = riskLevel === "HIGH" || riskLevel === "CRITICAL";
    let autoEmergencyNotification = {
      triggered: false,
      sent: false,
    };

    if (shouldAutoNotify && !persistedRisk.emergency_contact_notified) {
      autoEmergencyNotification.triggered = true;
      try {
        const { sentCount } = await sendEmergencyContactSms({
          userId,
          messageBody:
            "NeuroSentinel alert: We detected a high mental health risk pattern. Please check in with your contact and offer immediate support.",
        });

        autoEmergencyNotification.sent = sentCount > 0;
        autoEmergencyNotification.sent_count = sentCount;

        await RiskScore.findOneAndUpdate(
          { user: userId, date: today },
          {
            emergency_contact_notified: sentCount > 0,
            emergency_contact_notified_at: sentCount > 0 ? new Date() : null,
            emergency_contact_notify_error: sentCount > 0 ? null : "No emergency SMS was delivered.",
          }
        );
      } catch (notifyError) {
        autoEmergencyNotification.error = notifyError.message;
        await RiskScore.findOneAndUpdate(
          { user: userId, date: today },
          {
            emergency_contact_notified: false,
            emergency_contact_notified_at: null,
            emergency_contact_notify_error: notifyError.message,
          }
        );
      }
    }

    const response = {
      daily: {
        score: parseFloat((overallScore * 100).toFixed(2)),
        level: riskLevel,
        trend,
        top_factors: topFactors,
        motivational_message: llmResult.motivational_message,
        recommendations: llmResult.coping_steps,
      },
      insights,
      alerts,
      quiz_suggestions: quizSuggestions,
      clinical_assistance: clinicalAssistance,
      pattern_analysis: {
        velocity_interpretation: velocity > 0 ? "Worsening" : velocity < 0 ? "Improving" : "Stable",
        velocity_reliable: velocityDataPoints >= 4,
        mood_stability: volatility > 30 ? "Unstable" : volatility > 20 ? "Moderate" : "Stable",
        above_personal_baseline: isAbovePersonalBaseline,
        consecutive_high_risk_days: consecutiveHighRiskDays,
        early_intervention_needed: alerts.some((a) => a.severity === "high" || a.severity === "critical"),
      },
      emergency_notification: autoEmergencyNotification,
    };

    await setCache(cacheKey, response, 3600);
    res.json(response);
  } catch (error) {
    console.error("Error calculating risk:", error);
    res.status(500).json({ error: error.message });
  }
};


// ════════════════════════════════════════════════════════════════════════════
// weeklyInsights
// ════════════════════════════════════════════════════════════════════════════
export const weeklyInsights = async (req, res) => {
  try {
    const { userId } = req.params;
    const cacheKey = cacheKeys.riskWeekly(userId);
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const dailyScores = await RiskScore.find({
      user: userId,
      date: { $gte: sevenDaysAgo.toISOString().split("T")[0], $lte: today.toISOString().split("T")[0] },
    })
      .sort({ date: 1 })
      .select("date overall_score depression_quiz_score anxiety_quiz_score stress_quiz_score sleep_quiz_score risk_level is_imputed");

    if (!dailyScores?.length)
      return res.status(404).json({ message: "No data available for the past week" });

    const totalDays = dailyScores.length;
    const avgScore = dailyScores.reduce((s, d) => s + (d.overall_score || 0), 0) / totalDays;

    // Linear regression trend (more accurate than first-vs-last)
    let trend = "stable";
    if (totalDays >= 2) {
      const xMean = (totalDays - 1) / 2;
      let num = 0, den = 0;
      dailyScores.forEach((d, i) => {
        num += (i - xMean) * ((d.overall_score || 0) - avgScore);
        den += Math.pow(i - xMean, 2);
      });
      const slope = den !== 0 ? num / den : 0;
      if (slope > 0.01) trend = "declining";
      else if (slope < -0.01) trend = "improving";
    }

    const chartData = dailyScores.map((d) => ({
      date: d.date,
      overall: parseFloat(((d.overall_score || 0) * 100).toFixed(2)),
      depression: parseFloat(((d.depression_quiz_score || 0) * 100).toFixed(2)),
      anxiety: parseFloat(((d.anxiety_quiz_score || 0) * 100).toFixed(2)),
      stress: parseFloat(((d.stress_quiz_score || 0) * 100).toFixed(2)),
      sleep: parseFloat(((d.sleep_quiz_score || 0) * 100).toFixed(2)),
      level: d.risk_level,
      is_imputed: d.is_imputed ?? false,
    }));

    const response = {
      summary: { avg_score: parseFloat((avgScore * 100).toFixed(2)), trend, days_tracked: totalDays },
      chart_data: chartData,
    };

    await setCache(cacheKey, response, 21600);
    res.json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};


// ════════════════════════════════════════════════════════════════════════════
// monthlyInsights
// ════════════════════════════════════════════════════════════════════════════
export const monthlyInsights = async (req, res) => {
  try {
    const { userId } = req.params;
    const cacheKey = cacheKeys.riskMonthly(userId);
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const monthlyScores = await RiskScore.find({
      user: userId,
      date: { $gte: thirtyDaysAgo.toISOString().split("T")[0], $lte: today.toISOString().split("T")[0] },
    })
      .sort({ date: 1 })
      .select("date overall_score depression_quiz_score anxiety_quiz_score stress_quiz_score sleep_quiz_score risk_level is_imputed");

    if (!monthlyScores?.length)
      return res.status(404).json({ message: "No data available for the past month" });

    const totalDays = monthlyScores.length;
    const avgScore = monthlyScores.reduce((s, d) => s + (d.overall_score || 0), 0) / totalDays;

    const weeklyData = [];
    for (let i = 0; i < monthlyScores.length; i += 7) {
      const week = monthlyScores.slice(i, i + 7);
      const weekAvg = week.reduce((s, d) => s + (d.overall_score || 0), 0) / week.length;
      weeklyData.push({
        week: Math.floor(i / 7) + 1,
        avg_score: parseFloat((weekAvg * 100).toFixed(2)),
        start_date: week[0].date,
        end_date: week[week.length - 1].date,
      });
    }

    let trend = "stable";
    if (totalDays >= 2) {
      const first = monthlyScores[0].overall_score;
      const last = monthlyScores[totalDays - 1].overall_score;
      if (last < first - 0.1) trend = "improving";
      else if (last > first + 0.1) trend = "declining";
    }

    // Fixed: real check-ins only for consistency
    const realCheckins = monthlyScores.filter((d) => !d.is_imputed).length;

    const chartData = monthlyScores.map((d) => ({
      date: d.date,
      overall: parseFloat(((d.overall_score || 0) * 100).toFixed(2)),
      depression: parseFloat(((d.depression_quiz_score || 0) * 100).toFixed(2)),
      anxiety: parseFloat(((d.anxiety_quiz_score || 0) * 100).toFixed(2)),
      stress: parseFloat(((d.stress_quiz_score || 0) * 100).toFixed(2)),
      sleep: parseFloat(((d.sleep_quiz_score || 0) * 100).toFixed(2)),
      is_imputed: d.is_imputed ?? false,
    }));

    const response = {
      summary: {
        avg_score: parseFloat((avgScore * 100).toFixed(2)),
        trend,
        days_tracked: totalDays,
        consistency: parseFloat(((realCheckins / 30) * 100).toFixed(2)),
      },
      weekly_overview: weeklyData,
      chart_data: chartData,
    };

    await setCache(cacheKey, response, 43200);
    res.json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};


// ════════════════════════════════════════════════════════════════════════════
// updateSilentUsers — nightly cron job
// ════════════════════════════════════════════════════════════════════════════
export const updateSilentUsers = async () => {
  const today = new Date().toISOString().split("T")[0];
  try {
    const usersWithHistory = await RiskScore.distinct("user", { date: { $lt: today } });
    const usersWithToday = new Set(
      (await RiskScore.distinct("user", { date: today })).map(String)
    );
    const silentIds = usersWithHistory.filter((id) => !usersWithToday.has(String(id)));
    console.log(`[Nightly] ${silentIds.length} silent users`);

    const weights = await getDynamicWeights(); // Fetch once for all users

    const bulkOps = [];
    for (const userId of silentIds) {
      const previous = await RiskScore.findOne({ user: userId, date: { $lt: today } }).sort({ date: -1 });
      if (!previous) continue;

      const lastCheckinDate = previous.last_checkin_date ?? previous.date;
      const daysSinceCheckin = getDaysDifference(lastCheckinDate, today);
      const disengagementScore = calculateDisengagementScore(daysSinceCheckin, previous.overall_score);
      const previousOverall = previous.overall_score ?? 0;
      const imputedScore = Math.min(previousOverall + disengagementScore * 0.1, 1.0);

      bulkOps.push({
        updateOne: {
          filter: { user: userId, date: today },
          update: {
            $set: {
              overall_score: imputedScore,
              risk_level: getRiskLevel(imputedScore),
              trend: getTrend(imputedScore, previousOverall),
              previous_score: previousOverall,
              days_since_checkin: daysSinceCheckin,
              last_checkin_date: lastCheckinDate,
              is_imputed: true,
              disengagement_score: disengagementScore,
              depression_quiz_score: previous.depression_quiz_score,
              depression_quiz_date: previous.depression_quiz_date,
              anxiety_quiz_score: previous.anxiety_quiz_score,
              anxiety_quiz_date: previous.anxiety_quiz_date,
              stress_quiz_score: previous.stress_quiz_score,
              stress_quiz_date: previous.stress_quiz_date,
              sleep_quiz_score: previous.sleep_quiz_score,
              sleep_quiz_date: previous.sleep_quiz_date,
            },
          },
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) await RiskScore.bulkWrite(bulkOps);
    console.log(`[Nightly] Done. ${bulkOps.length} records updated.`);
  } catch (err) {
    console.error("[Nightly] Failed:", err.message);
  }
};