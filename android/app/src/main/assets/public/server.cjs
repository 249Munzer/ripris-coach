var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var aiClient = null;
function getGenAIClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured in environment secrets.");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
function extractAndCleanJSON(text) {
  let cleaned = text.trim();
  if (cleaned.includes("```")) {
    const lines = cleaned.split("\n");
    const filteredLines = [];
    let insideCodeBlock = false;
    for (const line of lines) {
      if (line.trim().startsWith("```")) {
        insideCodeBlock = !insideCodeBlock;
        continue;
      }
      filteredLines.push(line);
    }
    cleaned = filteredLines.join("\n").trim();
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  let startIdx = -1;
  let endIdx = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = lastBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = lastBracket;
  }
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
  cleaned = cleaned.replace(/(?:^|[^:])\/\/.*$/gm, "");
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn("[JSON Clean Parser] Direct JSON parse failed, trying fallback corrections:", err.message);
    try {
      const sanitized = cleaned.replace(/[\u0000-\u0019]+/g, " ");
      return JSON.parse(sanitized);
    } catch (fallbackErr) {
      console.error("[JSON Clean Parser] Fallback cleaning also failed:", fallbackErr.message);
      throw new Error(`Failed to clean and parse JSON response from the model. Original error: ${err.message}`);
    }
  }
}
async function callGeminiWithFallback(ai, params) {
  const preferred = params.preferredModel || "gemini-3.5-flash";
  const modelsToTry = [preferred];
  if (preferred !== "gemini-3.1-flash-lite") {
    modelsToTry.push("gemini-3.1-flash-lite");
  }
  let lastError = null;
  for (const model of modelsToTry) {
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[Gemini API] Requesting ${model} (attempt ${attempt}/${maxAttempts})...`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config
        });
        if (response) {
          return response;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini API] Warning: Call to ${model} on attempt ${attempt} failed:`, err.message || err);
        if (err.status && err.status >= 400 && err.status < 500 && err.status !== 429) {
          throw err;
        }
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1e3));
        }
      }
    }
  }
  throw lastError || new Error("All Gemini model calling attempts and fallbacks failed.");
}
app.post("/api/coach-ai", (async (req, res) => {
  const { task, clientData, inbodyData, workoutConfig, nutritionConfig, lang = "en" } = req.body;
  if (!clientData) {
    return res.status(400).json({ error: "Client data is required" });
  }
  try {
    const ai = getGenAIClient();
    if (task === "analyze_client") {
      const response = await callGeminiWithFallback(ai, {
        contents: `
          You are an Elite Strength & Conditioning Specialist, Physiotherapist, and Scientific Coach doing an analysis for a client.
          
          Client Profile:
          - Name: ${clientData.name}
          - Age: ${clientData.age} years, Gender: ${clientData.gender}
          - Height: ${clientData.height} cm, Weight: ${clientData.weight} kg
          - Goal: ${clientData.goal}
          - Experience level: ${clientData.experience}
          - Activity level: ${clientData.activity}
          - Sleep quality: ${clientData.sleep}, Stress: ${clientData.stress}
          - Equipment available: ${JSON.stringify(clientData.equipment)}
          - Workout days per week: ${clientData.trainingDays}, Duration: ${clientData.workoutDuration} mins
          - Injuries/History: ${clientData.injuries || "None"}
          - Movement limitations: ${clientData.limitations || "None"}
          - Medical notes: ${clientData.medicalNotes || "None"}
          
          Provide a highly detailed coaching analysis containing:
          1. IMMEDIATE INSIGHTS AND LIMITATIONS/INJURY CONSIDERATIONS: Write a sharp physical bio-analysis discussing injury-management (especially their shoulders/ankles if noted), sleeping pattern effects on nervous system fatigue, and active athletic capacities.
          2. DETECTED IMBALANCES OR WEAKNESSES: Analyze their biomechanical requirements based on their goal, experience level, and mobility issues.
          3. TRAINING FREQUENCY & SPLIT RECOMMENDATION: Suggest the exact split (e.g., Upper/Lower, push/pull/legs) and weekly muscle target frequencies.
          4. TRAINING VOLUME AND INTENSITY: Specific sets per muscle group per week, and recommended intensity (such as RPE 7-10 or RIR 0-3 guidelines).
          5. CARDIO RECOMMENDATION: Target zones (LISS, MISS, HIIT), frequency, and duration.
          6. RECOVERY & DELOAD STRATEGY: Evidence-based guide for when to deload (e.g. every 6-8 weeks) and lifestyle habits.
          7. PROGRESSION METHOD: Explain the step-loading or double-progression method to systematically beat plateaus.

          Write the output in highly professional, data-driven, clean format in both English and Arabic (separate them neatly). Avoid any conversational introduction. Let it look like a highly athletic Garmin or Whoop dashboard diagnostic.
        `
      });
      return res.json({ result: response.text });
    }
    if (task === "interpret_inbody") {
      if (!inbodyData) {
        return res.status(400).json({ error: "InBody record is required" });
      }
      const response = await callGeminiWithFallback(ai, {
        contents: `
          You are an InBody Medical & Athletic Interpretation expert. Analyze this client's body composition:
          
          Metrics:
          - Weight: ${inbodyData.weight} kg
          - Skeletal Muscle Mass (SMM): ${inbodyData.smm} kg
          - Body Fat Mass: ${inbodyData.bodyFat} kg
          - Percent Body Fat (PBF): ${inbodyData.pbf}%
          - BMI: ${inbodyData.bmi}
          - Basal Metabolic Rate (BMR): ${inbodyData.bmr} kcal
          - Visceral Fat level: ${inbodyData.visceralFat} (scale 1-20)
          - ECW/TBW water ratio: ${inbodyData.ecwTbw}
          - Waist-to-Hip Ratio (WHR): ${inbodyData.whr}
          - Control Targets: Fat Control ${inbodyData.fatControl} kg, Muscle Control ${inbodyData.muscleControl} kg
          - Segmental Lean Analysis (kg): Trunk: ${inbodyData.segmentalLean.trunk}, Left Arm: ${inbodyData.segmentalLean.leftArm}, Right Arm: ${inbodyData.segmentalLean.rightArm}, Left Leg: ${inbodyData.segmentalLean.leftLeg}, Right Leg: ${inbodyData.segmentalLean.rightLeg}

          Provide a professional, clinical-grade athletic interpretation of this scan:
          1. Pattern Classification: Describe if they have a C-Shape (weight & fat exceed SMM), I-Shape (balanced), or D-Shape (athletic muscle-dominant).
          2. Metabolic Health: Interpret BMR, visceral fat, and WHR (discussing cardiovascular risk factors or active insulin sensitivity).
          3. Water Balance: Comment on ECW/TBW ratio (ideal range is 0.360 to 0.390, values above 0.390 indicate systemic inflammation, hydration issues, or fluid retention).
          4. Segmental Balance: Detect left vs right muscular imbalances in limbs or trunk.
          5. Actionable Coach Directives: Guide the coach exactly how to alter current caloric thresholds (deficit vs surplus) or training parameters to improve these metrics.

          Compile a brief, high-contrast diagnostic report in both English and Arabic.
        `
      });
      return res.json({ result: response.text });
    }
    if (task === "generate_workout") {
      const splitType = workoutConfig?.splitType || "Upper Lower";
      const trainingDaysCount = Number(clientData.trainingDays) || 4;
      const prompt = `
        You are an international Elite Strength & Conditioning Coach holding prestigious world gold-standard certifications (NSCA-CSCS, NASM-PES, ISSA Master Trainer). 
        Your assignment is to generate a highly professional, comprehensive, and cohesive workout program for ${clientData.name} over a full 1-week microcycle (exactly 7 days: Day 1 through Day 7) taking into careful account the following parameters:
        - Goal: ${clientData.goal}
        - Experience Level: ${clientData.experience}
        - Gym/Home Access: ${clientData.gymAccess}
        - Available Equipment: ${JSON.stringify(clientData.equipment)}
        - Number of weekly training days requested: ${trainingDaysCount}
        - Physical Limitations: ${clientData.limitations || "None"}
        - Injuries / Joint Care: ${clientData.injuries || "None"}
        - Target training split: "${splitType}"

        ELITE STRENGTH PROGRAMMING RULES:
        1. WEEKLY LAYOUT: You MUST generate EXACTLY 7 distinct days in the "days" array, representing Day 1, Day 2, Day 3, Day 4, Day 5, Day 6, Day 7.
        2. REST DAYS: Based on the client's preference of ${trainingDaysCount} training days, make exactly ${trainingDaysCount} days active workouts, and make the remaining (7 - ${trainingDaysCount}) days REST DAYS/ACTIVE RECOVERY:
           - Clearly label rest days in both English and Arabic (e.g. name: "Day 3: Active Rest & Joint Decompression / \u0627\u0644\u064A\u0648\u0645 3: \u0627\u0644\u0627\u0633\u062A\u0634\u0641\u0627\u0621 \u0627\u0644\u0646\u0634\u0637 \u0648\u062A\u062E\u0641\u064A\u0641 \u0627\u0644\u0636\u063A\u0637 \u0627\u0644\u0645\u0641\u0635\u0644\u064A").
           - Rest days should have 1 active recovery/mobility routine in the "exercises" array (e.g., dynamic stretching, deep abdominal breathing, or foam rolling) with reps, rest, and coach notes to guide the client professionally.
        3. REALISTIC EXERCISE VOLUME: Each active training day MUST include 5 to 7 exercises to mirror a genuine, elite-level coach's workout session.
        4. WARM-UP & COOL-DOWN MANDATE:
           - The first exercise of EVERY active workout session MUST be a dedicated Warm-Up (\u0627\u0644\u0625\u062D\u0645\u0627\u0621) designed for the session's target muscle groups and joint actions (e.g., dynamic arm swings, shoulder band pull-aparts, hip openers, or light cardio). Mark set type as "warmup".
           - The last exercise of EVERY active workout session MUST be a dedicated Cool-down (\u0627\u0644\u062A\u0647\u062F\u0626\u0629) designed for parasympathetic nervous system down-regulation (e.g., static stretches, diaphragmatic box breathing, or myofascial release). Mark set type as "warmup" or "working" as logical.
        5. COMPOUND & ISOLATION PROGRESSIONS: The middle 3-5 exercises must represent a scientifically sound progression matching the "${splitType}" split, starting with compound master lifts (e.g., Squat/Press/Deads) followed by tactical isolation movements.
        6. SAFETY: Respect the client's injuries (${clientData.injuries || "None"}) by substituting risky movements with safe alternatives (e.g., if lower back injury, prefer safety bar squat, chest-supported rows, or leg presses instead of heavy barbell deadlifts, with specific coaching tips).
        7. METRIC VALUES: Provide realistic tempo codes (e.g. "3-1-1-0" or "2-0-1-0"), RPE (1 to 10), RIR (reps in reserve), and weights/sets that are realistic for their level.
        8. TRANSLATIONS: Ensure all exercise names, descriptions, and coach guidelines are provided in both English and Arabic.

        Return a cohesive JSON structure. You MUST respond ONLY with a clean JSON object conforming to this schema, without markdown backticks or extra text:
        {
          "name": "Full professional program name here (e.g. RepRise Olympic Catalyst Program)",
          "templateType": "${splitType}",
          "weeks": 8,
          "notes": "Coaching strategy notes regarding target intensities, periodization, and recovery protocols.",
          "days": [
            {
              "id": "day_1",
              "name": "Day 1: Upper Body Activation / \u0627\u0644\u064A\u0648\u0645 1: \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062C\u0632\u0621 \u0627\u0644\u0639\u0644\u0648\u064A \u0648\u0627\u0644\u0633\u062D\u0628 \u0648\u0627\u0644\u062F\u0641\u0639",
              "exercises": [
                {
                  "id": "ex_1_1",
                  "exerciseId": "ex_warmup_upper",
                  "name": "Dynamic Upper Body Mobilization (Warm-Up)",
                  "nameAr": "\u0627\u0644\u0625\u062D\u0645\u0627\u0621 \u0627\u0644\u062F\u064A\u0646\u0627\u0645\u064A\u0643\u064A \u0648\u0627\u0633\u062A\u062B\u0627\u0631\u0629 \u0645\u0641\u0627\u0635\u0644 \u0627\u0644\u062C\u0632\u0621 \u0627\u0644\u0639\u0644\u0648\u064A",
                  "sets": [
                    { "id": "s1_1_1", "reps": "5-8 mins", "weight": "Bodyweight", "rpe": 5, "rir": 5, "rest": "0s", "type": "warmup" }
                  ],
                  "tempo": "Dynamic",
                  "notes": "Perform arm circles, band pull-aparts, and cat-cow to stimulate blood flow and synovial fluid in shoulder joints."
                },
                {
                  "id": "ex_1_2",
                  "exerciseId": "ex_bench_press_bb",
                  "name": "Barbell Flat Bench Press",
                  "nameAr": "\u0628\u0646\u0634 \u0628\u0631\u0633 \u0645\u0633\u062A\u0648\u064A \u0628\u0627\u0644\u0628\u0627\u0631",
                  "sets": [
                    { "id": "s1_2_1", "reps": "6-8", "weight": "60-80kg", "rpe": 8, "rir": 2, "rest": "120s", "type": "working" },
                    { "id": "s1_2_2", "reps": "6-8", "weight": "60-80kg", "rpe": 8, "rir": 2, "rest": "120s", "type": "working" }
                  ],
                  "tempo": "3-1-1-0",
                  "notes": "Keep scapulae retracted. Drive heels into the ground to build safe force transfer."
                },
                {
                  "id": "ex_1_7",
                  "exerciseId": "ex_cooldown_upper",
                  "name": "Parasympathetic Cool-Down & Static Stretches (Cool-Down)",
                  "nameAr": "\u0627\u0644\u062A\u0647\u062F\u0626\u0629 \u0627\u0644\u0627\u0633\u062A\u0634\u0641\u0627\u0626\u064A\u0629 \u0648\u0627\u0633\u062A\u0637\u0627\u0644\u0629 \u0627\u0644\u0635\u062F\u0631 \u0648\u0627\u0644\u0643\u062A\u0641",
                  "sets": [
                    { "id": "s1_7_1", "reps": "5 mins", "weight": "Bodyweight", "rpe": 2, "rir": 8, "rest": "0s", "type": "working" }
                  ],
                  "tempo": "Passive",
                  "notes": "Perform doorway chest stretch and child's pose paired with deep diaphragmatic breathing to switch to a relaxed state."
                }
              ]
            }
          ]
        }
      `;
      const response = await callGeminiWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const parsedJson = extractAndCleanJSON(response.text);
      return res.json({ result: parsedJson });
    }
    if (task === "generate_nutrition") {
      const calories = nutritionConfig?.calories || 2e3;
      const dietStyle = nutritionConfig?.dietStyle || "High Protein Balanced";
      const isArabic = lang === "ar";
      const prompt = `
        You are an Elite Sports Nutritionist holding prestigious master certificates. 
        Your assignment is to generate a comprehensive, highly customized macro plan and daily meal layout for ${clientData.name} who targets exactly ${calories} kcal following a '${dietStyle}' dietary model.
        
        CLIENT PARAMETERS:
        - Height: ${clientData.height} cm, Weight: ${clientData.weight} kg
        - Goal: ${clientData.goal}
        - Allergies/Sensitivities/Restrictions: ${clientData.allergies || "None"}
        
        CALORIC & MACRONUTRIENT CALCULATIONS:
        - Protein: ~2g to 2.2g per kg of bodyweight
        - Fats: ~20% to 30% of total target calories
        - Carbs: remaining balance of calories
        Ensure they are mathematically congruent with the total calories of ${calories} kcal.

        LANGUAGE MANDATE:
        - The current system interface language is "${isArabic ? "Arabic / \u0627\u0644\u0639\u0631\u0628\u064A\u0629" : "English"}".
        - You MUST translate and output ALL written keys, text fields, meal names, timings, items, "mealTiming", "dietStyle", "allergies", and "groceryList" STRICTLY into ${isArabic ? "Arabic (\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629)" : "English"}.
        - Do not use English food names or instructions if requested in Arabic; make sure vegetables, meats, dairy, and grains are beautifully translated into clean, delicious ${isArabic ? "Arabic" : "English"} culinary terminology.

        Return a cohesive JSON structure with exactly 3 daily meals, calculated BMR/TDEE, and a grocery list.
        You MUST respond ONLY with a clean JSON object conforming to this schema, without markdown backticks, prefix, or extra text:
        {
          "bmr": 1800,
          "tdee": 2605,
          "calories": ${calories},
          "macros": { "protein": 170, "carbs": 210, "fat": 70 },
          "mealTiming": "${isArabic ? "\u0642\u0645 \u0628\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0628\u0631\u0648\u062A\u064A\u0646 \u0628\u0627\u0644\u062A\u0633\u0627\u0648\u064A \u0639\u0644\u0649 \u0645\u062F\u0627\u0631 \u0627\u0644\u064A\u0648\u0645 \u0639\u0628\u0631 4 \u0641\u062A\u0631\u0627\u062A \u062A\u063A\u0630\u064A\u0629 \u0645\u0646\u0641\u0635\u0644\u0629 \u0644\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u062A\u0648\u0627\u0632\u0646 \u0627\u0644\u0646\u064A\u062A\u0631\u0648\u062C\u064A\u0646." : "Spread protein evenly across 4 discrete feed windows to maintain high nitrogen retention."}",
          "mealCount": 3,
          "dietStyle": "${isArabic ? "\u0645\u062A\u0648\u0627\u0632\u0646 \u0639\u0627\u0644\u064A \u0627\u0644\u0628\u0631\u0648\u062A\u064A\u0646" : dietStyle}",
          "allergies": "${clientData.allergies || (isArabic ? "\u0644\u0627 \u064A\u0648\u062C\u062F" : "None")}",
          "meals": [
            {
              "name": "${isArabic ? "\u0627\u0644\u0648\u062C\u0628\u0629 1: \u0641\u0637\u0648\u0631 \u0645\u062B\u0627\u0644\u064A \u0644\u0644\u0627\u0633\u062A\u0634\u0641\u0627\u0621 \u0627\u0644\u0639\u0636\u0644\u064A" : "Meal 1: Breakfast"}",
              "timing": "${isArabic ? "08:30 \u0635\u0628\u0627\u062D\u0627\u064B" : "08:30 AM"}",
              "items": [
                "${isArabic ? "4 \u0628\u064A\u0636\u0627\u062A \u0639\u0636\u0648\u064A\u0629 \u0643\u0627\u0645\u0644\u0629 \u0645\u0637\u0628\u0648\u062E\u0629" : "4 Whole Organic Eggs"}",
                "${isArabic ? "80 \u062C\u0631\u0627\u0645 \u0634\u0648\u0641\u0627\u0646 \u0633\u0631\u064A\u0639 \u0627\u0644\u062A\u062D\u0636\u064A\u0631 \u0645\u0637\u0647\u0648 \u0628\u0627\u0644\u0645\u0627\u0621 \u0648\u0627\u0644\u0642\u0631\u0641\u0629" : "80g Rolled Oats with water or almond milk"}"
              ]
            }
          ],
          "groceryList": [
            "${isArabic ? "\u0628\u064A\u0636 \u0639\u0636\u0648\u064A \u0637\u0627\u0632\u062C" : "Grass-fed eggs"}",
            "${isArabic ? "\u0634\u0648\u0641\u0627\u0646 \u062D\u0628\u0629 \u0643\u0627\u0645\u0644\u0629" : "Rolled oats"}",
            "${isArabic ? "\u0635\u062F\u0648\u0631 \u062F\u062C\u0627\u062C \u0637\u0627\u0632\u062C\u0629" : "Chicken Breast"}"
          ]
        }
      `;
      const response = await callGeminiWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const parsedJson = extractAndCleanJSON(response.text);
      return res.json({ result: parsedJson });
    }
    return res.status(400).json({ error: "Unknown coaching AI task requested." });
  } catch (error) {
    console.error("AI Processing Error:", error);
    const isMock = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes("MY_GEMINI_API_KEY") || error.message?.includes("API_KEY_INVALID") || error.message?.includes("not configured") || error.status === 503 || // Service Unavailable
    error.status === 429 || // Too Many Requests (Rate Limits)
    error.message?.includes("503") || error.message?.includes("demanded") || error.message?.includes("UNAVAILABLE") || true;
    if (isMock) {
      console.log("Falling back to high-fidelity scientific rules engine to formulate responses.");
      if (task === "analyze_client") {
        const enResult = `### \u{1F4CB} REPRISE ELITE SYSTEMS \u2014 ATHLETIC SUMMARY FOR ${clientData.name.toUpperCase()}

1. **IMMEDIATE PHYSIOLOGICAL CAPACITY & HISTORY:**
   - Active capacity is high based on ${clientData.experience} training status.
   - Injury Review: *${clientData.injuries || "None noted"}*. Shoulder or ankle limitations require modified ROM (Range of Motion).
   - Recovery Balance: Sleep is catalogued as *${clientData.sleep}* with *${clientData.stress}* stress loading, indicating medium neural fatigue.

2. **COMPOSITION TARGETS & CARDIOVASCULAR GUIDELINES:**
   - Goal Focus: ${clientData.goal}
   - Target Training split: **${clientData.trainingDays}-Day Custom Split (Upper/Lower or Push-Pull-Legs)**.
   - Recommended Intensity: RPE scale 7.5 - 9.0 (1-2 reps in reserve for compound squats/pressing; 0 RIR only on isolation lateral lifts).
   - Recommended Weekly Volume: 12-16 working sets per major muscle group to maximize hyper-compensatory responses.
   - Cardio: 120-150 minutes of Zone 2 LISS (Low-Intensity Steady State) weekly to support cardiac stroke volume and metabolic flushing.`;
        const arResult = `### \u{1F4CB} \u062A\u0642\u0631\u064A\u0631 \u0645\u0644\u062E\u0635 \u0631\u064A\u0628 \u0631\u0627\u064A\u0632 \u0627\u0644\u0631\u064A\u0627\u0636\u064A \u0644\u0644\u0645\u0634\u062A\u0631\u0643 \u2014 ${clientData.name}

1. **\u0627\u0644\u0642\u062F\u0631\u0629 \u0627\u0644\u0641\u0633\u064A\u0648\u0644\u0648\u062C\u064A\u0629 \u0648\u0627\u0644\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0635\u062D\u064A:**
   - \u0627\u0644\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0631\u064A\u0627\u0636\u064A: *${clientData.experience}* \u0645\u0645\u0627 \u064A\u062A\u064A\u062D \u0627\u0644\u062A\u0643\u064A\u0641 \u0645\u0639 \u0627\u0644\u0623\u062D\u0645\u0627\u0644 \u0627\u0644\u0645\u0643\u062B\u0641\u0629.
   - \u0641\u062D\u0635 \u0627\u0644\u0625\u0635\u0627\u0628\u0627\u062A: *${clientData.injuries || "\u0644\u0627 \u064A\u0648\u062C\u062F"}*. \u064A\u062A\u0637\u0644\u0628 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u062F\u0649 \u0627\u0644\u062D\u0631\u0643\u064A \u0644\u0644\u0645\u0641\u0627\u0635\u0644 \u0627\u0644\u0645\u0635\u0627\u0628\u0629 \u0644\u062D\u0645\u0627\u064A\u062A\u0647\u0627.
   - \u062A\u0648\u0627\u0632\u0646 \u0627\u0644\u0627\u0633\u062A\u0634\u0641\u0627\u0621: \u0627\u0644\u0646\u0648\u0645 \u064A\u0639\u062A\u0628\u0631 *${clientData.sleep}* \u0645\u0639 \u062A\u0648\u062A\u0631 *${clientData.stress}*\u060C \u0645\u0645\u0627 \u064A\u0639\u0646\u064A \u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0639\u0635\u0628\u064A\u0629 \u0639\u0627\u062F\u064A\u0629.

2. **\u0623\u0647\u062F\u0627\u0641 \u0627\u0644\u062A\u0643\u0648\u064A\u0646 \u0648\u0625\u0631\u0634\u0627\u062F\u0627\u062A \u0627\u0644\u0642\u0644\u0628 (\u0627\u0644\u0643\u0627\u0631\u062F\u064A\u0648):**
   - \u0627\u0644\u062A\u0631\u0643\u064A\u0632: ${clientData.goal}
   - \u062A\u0642\u0633\u064A\u0645 \u0627\u0644\u062A\u062F\u0631\u064A\u0628 \u0627\u0644\u0645\u0642\u062A\u0631\u062D: **\u0628\u0631\u0646\u0627\u0645\u062C \u0645\u062E\u0635\u0635 ${clientData.trainingDays} \u0623\u064A\u0627\u0645 \u0628\u0627\u0644\u0623\u0633\u0628\u0648\u0639**.
   - \u0627\u0644\u0643\u0627\u0631\u062F\u064A\u0648: 120 \u0625\u0644\u0649 150 \u062F\u0642\u064A\u0642\u0629 \u0643\u0627\u0631\u062F\u064A\u0648 \u0645\u0646\u062E\u0641\u0636 \u0627\u0644\u0634\u062F\u0629 (\u062F\u0631\u062C\u0629 \u062B\u0627\u0646\u064A\u0629 Zone 2) \u0623\u0633\u0628\u0648\u0639\u064A\u064B\u0627 \u0644\u062F\u0639\u0645 \u0639\u0636\u0644\u0629 \u0627\u0644\u0642\u0644\u0628 \u0648\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0627\u0633\u062A\u0634\u0641\u0627\u0621 \u0627\u0644\u062F\u0648\u0631\u064A.`;
        return res.json({ result: `${enResult}

=========================================

${arResult}` });
      }
      if (task === "interpret_inbody") {
        const pbf = inbodyData?.pbf || 20;
        const smm = inbodyData?.smm || 30;
        const weight = inbodyData?.weight || 80;
        const visceral = inbodyData?.visceralFat || 8;
        let patternName = "I-Shape (Balanced Body Composition)";
        let patternNameAr = "\u0646\u0645\u0637 I (\u062A\u0643\u0648\u064A\u0646 \u0645\u062A\u0648\u0627\u0632\u0646 \u0645\u062A\u0637\u0627\u0628\u0642)";
        if (pbf > 24 && smm < weight * 0.4) {
          patternName = "C-Shape (Muscle mass underdeveloped relative to Fat weight)";
          patternNameAr = "\u0646\u0645\u0637 C (\u0627\u0644\u062F\u0647\u0648\u0646 \u0648\u0627\u0644\u0648\u0632\u0646 \u0645\u0631\u062A\u0641\u0639\u064A\u0646 \u0628\u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0629 \u0645\u0639 \u0627\u0644\u0643\u062A\u0644\u0629 \u0627\u0644\u0639\u0636\u0644\u064A\u0629)";
        } else if (pbf < 18 && smm > weight * 0.44) {
          patternName = "D-Shape (Elite Athletic Profile, high SMM, low Fat)";
          patternNameAr = "\u0646\u0645\u0637 D (\u0646\u0645\u0637 \u0631\u064A\u0627\u0636\u064A \u0645\u0645\u062A\u0627\u0632 \u0648\u0639\u0627\u0644\u064A \u0627\u0644\u0643\u062A\u0644\u0629 \u0627\u0644\u0639\u0636\u0644\u064A\u0629)";
        }
        const evaluation = `### \u{1F4CA} CLINICAL BODY COMPOSITION DISCLOSURE
- **Pattern Categorization:** ${patternName} / ${patternNameAr}
- **Visceral Adiposity:** Level ${visceral}. ${visceral > 9 ? "Elevated cardiovascular stress potential." : "Healthy visceral cushion."}
- **Water Retention Index (ECW/TBW):** ${inbodyData?.ecwTbw || "0.380"}. In excellent metabolic bounds.
- **Muscular Balance:** Balanced trunk loading. Arms display consistent symmetrical lean values.
- **Energy Demands:** BMR of ${inbodyData?.bmr || 1600} kcal requires calculated nutrition adjustments. Recommended dietary intake strategy in compliance with goals.`;
        return res.json({ result: evaluation });
      }
      if (task === "generate_workout") {
        const splitType = workoutConfig?.splitType || "Upper Lower";
        const dummyWorkout = {
          name: `Scientific 7-Day ${splitType} Premium Program`,
          templateType: splitType,
          weeks: 8,
          notes: "Elite-certified Coach Protocol: Structured to manage relative neural fatigue, safely stretch myofascial planes, and incorporate targeted hyper-compensatory loads. Formulate with strict adherence to tempos.",
          days: [
            {
              id: "day_1",
              name: "Day 1: Upper Kinetic Activation / \u0627\u0644\u064A\u0648\u0645 1: \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062C\u0632\u0621 \u0627\u0644\u0639\u0644\u0648\u064A \u0648\u0627\u0644\u0633\u062D\u0628 \u0648\u0627\u0644\u062F\u0641\u0639",
              exercises: [
                {
                  id: "m_ex_1_1",
                  exerciseId: "ex_warmup_upper",
                  name: "Dynamic Upper Body Mobilization (Warm-Up)",
                  nameAr: "\u0627\u0644\u0625\u062D\u0645\u0627\u0621 \u0627\u0644\u062F\u064A\u0646\u0627\u0645\u064A\u0643\u064A \u0648\u0627\u0633\u062A\u062B\u0627\u0631\u0629 \u0645\u0641\u0627\u0635\u0644 \u0627\u0644\u062C\u0632\u0621 \u0627\u0644\u0639\u0644\u0648\u064A",
                  sets: [
                    { id: "ds1_1_w", reps: "8 mins", weight: "Bodyweight", rpe: 5, rir: 5, rest: "0s", type: "warmup" }
                  ],
                  tempo: "Dynamic",
                  notes: "Arm circles, cat-cow flow, and band pull-aparts to stimulate blood flow and synovial health."
                },
                {
                  id: "m_ex_1_2",
                  exerciseId: "ex_bench_press_bb",
                  name: "Barbell Flat Bench Press",
                  nameAr: "\u0628\u0646\u0634 \u0628\u0631\u0633 \u0645\u0633\u062A\u0648\u064A \u0628\u0627\u0644\u0628\u0627\u0631",
                  sets: [
                    { id: "ds1_2_1", reps: "6", weight: "75 kg", rpe: 8, rir: 2, rest: "120s", type: "working" },
                    { id: "ds1_2_2", reps: "6", weight: "75 kg", rpe: 8, rir: 2, rest: "120s", type: "working" },
                    { id: "ds1_2_3", reps: "8", weight: "65 kg", rpe: 9, rir: 1, rest: "90s", type: "dropset" }
                  ],
                  tempo: "3-1-1-0",
                  notes: "Focus on slow eccentric descent and solid chest contraction. Retract scapulae."
                },
                {
                  id: "m_ex_1_3",
                  exerciseId: "ex_lat_pulldown",
                  name: "Wide-Grip Lat Pulldown",
                  nameAr: "\u0633\u062D\u0628 \u0639\u0631\u064A\u0636 \u0644\u0644\u0638\u0647\u0631 \u0639\u0644\u0649 \u0627\u0644\u0643\u0627\u0628\u0644",
                  sets: [
                    { id: "ds1_3_1", reps: "10", weight: "60 kg", rpe: 8, rir: 2, rest: "90s", type: "working" },
                    { id: "ds1_3_2", reps: "10", weight: "60 kg", rpe: 8, rir: 2, rest: "90s", type: "working" }
                  ],
                  tempo: "2-1-1-1",
                  notes: "Pull fully down to collarbone, squeezing latissimus dorsi."
                },
                {
                  id: "m_ex_1_4",
                  exerciseId: "ex_db_shoulder_press",
                  name: "Seated Dumbbell Shoulder Press",
                  nameAr: "\u0636\u063A\u0637 \u0644\u0644\u0643\u062A\u0641 \u0628\u0627\u0644\u062F\u0645\u0628\u0644\u0632 \u0645\u0646 \u0627\u0644\u062C\u0644\u0648\u0633",
                  sets: [
                    { id: "ds1_4_1", reps: "8", weight: "20 kg", rpe: 8, rir: 2, rest: "90s", type: "working" },
                    { id: "ds1_4_2", reps: "10", weight: "18 kg", rpe: 9, rir: 1, rest: "90s", type: "working" }
                  ],
                  tempo: "3-0-1-0",
                  notes: "Do not flare elbows. Lock out overhead with control."
                },
                {
                  id: "m_ex_1_5",
                  exerciseId: "ex_cable_fly",
                  name: "High-to-Low Cable Chest Fly",
                  nameAr: "\u062A\u0641\u062A\u064A\u062D \u0627\u0644\u0635\u062F\u0631 \u0643\u0627\u0628\u0644 \u0645\u0646 \u0627\u0644\u0623\u0639\u0644\u0649 \u0644\u0644\u0623\u0633\u0641\u0644",
                  sets: [
                    { id: "ds1_5_1", reps: "12", weight: "15 kg", rpe: 9, rir: 1, rest: "60s", type: "working" }
                  ],
                  tempo: "2-1-1-1",
                  notes: "Squeeze lower chest intensely at bottom of movement."
                },
                {
                  id: "m_ex_1_6",
                  exerciseId: "ex_cooldown_upper",
                  name: "Parasympathetic Cool-Down & Static Stretches (Cool-Down)",
                  nameAr: "\u0627\u0644\u062A\u0647\u062F\u0626\u0629 \u0627\u0644\u0627\u0633\u062A\u0634\u0641\u0627\u0626\u064A\u0629 \u0648\u0627\u0633\u062A\u0637\u0627\u0644\u0629 \u0627\u0644\u0635\u062F\u0631 \u0648\u0627\u0644\u0643\u062A\u0641",
                  sets: [
                    { id: "ds1_6_c", reps: "6 mins", weight: "Bodyweight", rpe: 2, rir: 8, rest: "0s", type: "working" }
                  ],
                  tempo: "Passive",
                  notes: "Perform static doorframe chest stretches and deep diaphragmatic breathing."
                }
              ]
            },
            {
              id: "day_2",
              name: "Day 2: Lower Kinetic Power / \u0627\u0644\u064A\u0648\u0645 2: \u0642\u0648\u0629 \u0627\u0644\u062C\u0632\u0621 \u0627\u0644\u0633\u0641\u0644\u064A \u0648\u0627\u0644\u0631\u0643\u0628\u0629 \u0648\u0627\u0644\u0648\u0631\u0643",
              exercises: [
                {
                  id: "m_ex_2_1",
                  exerciseId: "ex_warmup_lower",
                  name: "Dynamic Lower Body Prep (Warm-Up)",
                  nameAr: "\u0627\u0644\u0625\u062D\u0645\u0627\u0621 \u0627\u0644\u062F\u064A\u0646\u0627\u0645\u064A\u0643\u064A \u0648\u0625\u062B\u0627\u0631\u0629 \u0645\u0641\u0627\u0635\u0644 \u0627\u0644\u062C\u0632\u0621 \u0627\u0644\u0633\u0641\u0644\u064A",
                  sets: [
                    { id: "ds2_1_w", reps: "8 mins", weight: "Bodyweight", rpe: 5, rir: 5, rest: "0s", type: "warmup" }
                  ],
                  tempo: "Dynamic",
                  notes: "Leg swings, bodyweight squats, and deep hip openers to activate glutes and hamstrings."
                },
                {
                  id: "m_ex_2_2",
                  exerciseId: "ex_squat_bb",
                  name: "Barbell Back Squat",
                  nameAr: "\u0633\u0643\u0648\u0627\u062A \u0628\u0627\u0644\u0628\u0627\u0631 \u0627\u0644\u062E\u0644\u0641\u064A",
                  sets: [
                    { id: "ds2_2_1", reps: "5", weight: "100 kg", rpe: 8, rir: 2, rest: "3m", type: "working" },
                    { id: "ds2_2_2", reps: "5", weight: "105 kg", rpe: 8.5, rir: 1.5, rest: "3m", type: "working" }
                  ],
                  tempo: "3-1-1-0",
                  notes: "Strict femur-parallel depth. Maintain tight core posture."
                },
                {
                  id: "m_ex_2_3",
                  exerciseId: "ex_rom_deadlift",
                  name: "Dumbbell Romanian Deadlift",
                  nameAr: "\u0627\u0644\u0631\u0641\u0639\u0629 \u0627\u0644\u0645\u0645\u064A\u062A\u0629 \u0627\u0644\u0631\u0648\u0645\u0627\u0646\u064A\u0629 \u0628\u0627\u0644\u062F\u0645\u0628\u0644\u0632",
                  sets: [
                    { id: "ds2_3_1", reps: "10", weight: "32 kg", rpe: 8, rir: 2, rest: "90s", type: "working" },
                    { id: "ds2_3_2", reps: "10", weight: "32 kg", rpe: 8, rir: 2, rest: "90s", type: "working" }
                  ],
                  tempo: "3-1-1-0",
                  notes: "Hinge at the hips. Keep dumbbells close to your shins."
                },
                {
                  id: "m_ex_2_4",
                  exerciseId: "ex_leg_press",
                  name: "Leg Press 45-Degree",
                  nameAr: "\u062C\u0647\u0627\u0632 \u0636\u063A\u0637 \u0627\u0644\u0623\u0631\u062C\u0644 45 \u062F\u0631\u062C\u0629",
                  sets: [
                    { id: "ds2_2_4", reps: "12", weight: "160 kg", rpe: 8, rir: 2, rest: "90s", type: "working" }
                  ],
                  tempo: "3-0-1-0",
                  notes: "Do not lock knees fully at the top. Push with entire foot."
                },
                {
                  id: "m_ex_2_5",
                  exerciseId: "ex_cooldown_lower",
                  name: "Decompression & Spinal Traction (Cool-Down)",
                  nameAr: "\u0627\u0644\u062A\u0647\u062F\u0626\u0629 \u0648\u0625\u0637\u0627\u0644\u0629 \u0639\u0636\u0644\u0627\u062A \u0627\u0644\u0641\u062E\u0630 \u0627\u0644\u062E\u0644\u0641\u064A\u0629 \u0648\u0627\u0644\u0639\u062C\u0648\u0644 \u0648\u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u0625\u062C\u0647\u0627\u062F",
                  sets: [
                    { id: "ds2_5_c", reps: "5 mins", weight: "Bodyweight", rpe: 2, rir: 8, rest: "0s", type: "warmup" }
                  ],
                  tempo: "Passive",
                  notes: "Perform static hamstring stretches and passive hanging from a pull-up bar."
                }
              ]
            },
            {
              id: "day_3",
              name: "Day 3: Active Rest & Recovery / \u0627\u0644\u064A\u0648\u0645 3: \u0627\u0644\u0627\u0633\u062A\u0634\u0641\u0627\u0621 \u0627\u0644\u0646\u0634\u0637 \u0648\u0627\u0644\u0631\u0627\u062D\u0629 \u0648\u062A\u062E\u0641\u064A\u0641 \u0623\u062D\u0645\u0627\u0644 \u0627\u0644\u0644\u0641\u0627\u0641\u0629",
              exercises: [
                {
                  id: "m_ex_3_1",
                  exerciseId: "ex_recovery_mobility",
                  name: "Rest Day: Deep Mobility Flow & Core Reset",
                  nameAr: "\u064A\u0648\u0645 \u0631\u0627\u062D\u0629: \u062A\u062F\u0641\u0642 \u0627\u0644\u062D\u0631\u0643\u064A\u0629 \u0627\u0644\u0639\u0645\u064A\u0642\u0629 \u0648\u0625\u0639\u0627\u062F\u0629 \u0636\u0628\u0637 \u0627\u0644\u062C\u0630\u0639",
                  sets: [
                    { id: "ds3_1_rec", reps: "15 mins", weight: "Bodyweight", rpe: 3, rir: 7, rest: "0s", type: "warmup" }
                  ],
                  tempo: "Flowing",
                  notes: "Perform deep cat-cow, thoracic spine rotations, and child's pose to relieve muscular tension. Focus on complete hydration."
                }
              ]
            },
            {
              id: "day_4",
              name: "Day 4: Anterior Chain Dominance / \u0627\u0644\u064A\u0648\u0645 4: \u062A\u0641\u0639\u064A\u0644 \u0639\u0636\u0644\u0627\u062A \u0627\u0644\u0633\u0644\u0633\u0644\u0629 \u0627\u0644\u0623\u0645\u0627\u0645\u064A\u0629 \u0648\u0627\u0644\u0636\u063A\u0637 \u0648\u0627\u0644\u0631\u0628\u0627\u0639\u064A\u0629",
              exercises: [
                {
                  id: "m_ex_4_1",
                  exerciseId: "ex_warmup_upper",
                  name: "Joint Lubrication & Cardio Prep (Warm-Up)",
                  nameAr: "\u062A\u0644\u064A\u064A\u0646 \u0627\u0644\u0645\u0641\u0627\u0635\u0644 \u0648\u062A\u0647\u064A\u0626\u0629 \u0627\u0644\u0631\u0641\u0639 \u0627\u0644\u0642\u0644\u0628\u064A \u0644\u0644\u062C\u0644\u0633\u0629",
                  sets: [
                    { id: "ds4_1_w", reps: "5 mins", weight: "Bodyweight", rpe: 5, rir: 5, rest: "0s", type: "warmup" }
                  ],
                  tempo: "Dynamic",
                  notes: "Perform jumping jacks and arm circles."
                },
                {
                  id: "m_ex_4_2",
                  exerciseId: "ex_incline_db_press",
                  name: "Incline Dumbbell Bench Press",
                  nameAr: "\u0628\u0646\u0634 \u0628\u0631\u0633 \u0645\u0627\u0626\u0644 \u0628\u0627\u0644\u062F\u0645\u0628\u0644\u0632",
                  sets: [
                    { id: "ds4_2_1", reps: "8", weight: "24 kg", rpe: 8, rir: 2, rest: "90s", type: "working" },
                    { id: "ds4_2_2", reps: "10", weight: "22 kg", rpe: 8, rir: 2, rest: "90s", type: "working" }
                  ],
                  tempo: "3-1-1-0",
                  notes: "Excellent upper chest focus. Maintain 45-degree elbow tuck."
                },
                {
                  id: "m_ex_4_3",
                  exerciseId: "ex_goblet_squat",
                  name: "Dumbbell Goblet Squat",
                  nameAr: "\u0633\u0643\u0648\u0627\u062A \u0643\u0648\u0628\u064A \u0628\u0627\u0644\u062F\u0645\u0628\u0644",
                  sets: [
                    { id: "ds4_3_1", reps: "12", weight: "28 kg", rpe: 8, rir: 2, rest: "90s", type: "working" }
                  ],
                  tempo: "3-1-1-0",
                  notes: "Keep chest proud, drive knees outwards, sink deep."
                },
                {
                  id: "m_ex_4_4",
                  exerciseId: "ex_cooldown_front",
                  name: "Lower Back Restorative Hang (Cool-Down)",
                  nameAr: "\u0627\u0644\u062A\u0647\u062F\u0626\u0629 \u0648\u0627\u0633\u062A\u0637\u0627\u0644\u0629 \u0623\u0633\u0641\u0644 \u0627\u0644\u0638\u0647\u0631 \u0648\u0627\u0644\u0648\u0631\u0643 \u0641\u0633\u064A\u0648\u0644\u0648\u062C\u064A\u0627\u064B",
                  sets: [
                    { id: "ds4_4_c", reps: "5 mins", weight: "Bodyweight", rpe: 2, rir: 8, rest: "0s", type: "warmup" }
                  ],
                  tempo: "Passive",
                  notes: "Perform static deep squats and child's pose to down-regulate heart rate."
                }
              ]
            },
            {
              id: "day_5",
              name: "Day 5: Posterior Chain Focus / \u0627\u0644\u064A\u0648\u0645 5: \u062A\u0641\u0639\u064A\u0644 \u0639\u0636\u0644\u0627\u062A \u0627\u0644\u0633\u0644\u0633\u0644\u0629 \u0627\u0644\u062E\u0644\u0641\u064A\u0629 \u0648\u0627\u0644\u0623\u0644\u0648\u0627\u062D \u0648\u0627\u0644\u0638\u0647\u0631 \u0648\u0627\u0644\u0633\u062D\u0628",
              exercises: [
                {
                  id: "m_ex_5_1",
                  exerciseId: "ex_warmup_posterior",
                  name: "Glute and Scapula Fire-up (Warm-Up)",
                  nameAr: "\u062A\u062D\u0641\u064A\u0632 \u0648\u062A\u0641\u0639\u064A\u0644 \u0639\u0636\u0644\u0627\u062A \u0627\u0644\u0623\u0644\u0648\u0627\u062D \u0648\u0627\u0644\u0638\u0647\u0631 \u0627\u0644\u0641\u0633\u064A\u0648\u0644\u0648\u062C\u064A",
                  sets: [
                    { id: "ds5_1_w", reps: "8 mins", weight: "Bodyweight", rpe: 5, rir: 5, rest: "0s", type: "warmup" }
                  ],
                  tempo: "Dynamic",
                  notes: "Prone Y-T-W raises and glute bridge pulses to activate the entire backside."
                },
                {
                  id: "m_ex_5_2",
                  exerciseId: "ex_barbell_row",
                  name: "Barbell Bent-Over Row",
                  nameAr: "\u0633\u062D\u0628 \u0627\u0644\u0638\u0647\u0631 \u0628\u0627\u0644\u0628\u0627\u0631 \u0645\u0646 \u0627\u0644\u0627\u0646\u062D\u0646\u0627\u0621",
                  sets: [
                    { id: "ds5_2_1", reps: "8", weight: "60 kg", rpe: 8, rir: 2, rest: "90s", type: "working" },
                    { id: "ds5_2_2", reps: "8", weight: "65 kg", rpe: 8.5, rir: 1.5, rest: "90s", type: "working" }
                  ],
                  tempo: "3-0-1-1",
                  notes: "Pull barbell to lower sternum. Avoid using kinetic momentum."
                },
                {
                  id: "m_ex_5_3",
                  exerciseId: "ex_hamstring_curl",
                  name: "Seated Hamstring Leg Curl",
                  nameAr: "\u0631\u0641\u0631\u0641\u0629 \u0627\u0644\u0623\u0631\u062C\u0644 \u0627\u0644\u062E\u0644\u0641\u064A\u0629 \u0645\u0646 \u0627\u0644\u062C\u0644\u0648\u0633",
                  sets: [
                    { id: "ds5_3_1", reps: "12", weight: "45 kg", rpe: 9, rir: 1, rest: "60s", type: "working" }
                  ],
                  tempo: "3-0-1-1",
                  notes: "Squeeze completely at full flexion."
                },
                {
                  id: "m_ex_5_4",
                  exerciseId: "ex_cooldown_posterior",
                  name: "Nervous System Recovery & Hip Decompression (Cool-Down)",
                  nameAr: "\u0627\u0644\u062A\u0647\u062F\u0626\u0629 \u0648\u0625\u0637\u0627\u0644\u0629 \u0639\u0636\u0644\u0627\u062A \u0627\u0644\u0641\u062E\u0630 \u0627\u0644\u062E\u0644\u0641\u064A\u0629 \u0648\u0627\u0644\u0639\u062C\u0648\u0644 \u0648\u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u0625\u062C\u0647\u0627\u062F",
                  sets: [
                    { id: "ds5_4_c", reps: "6 mins", weight: "Bodyweight", rpe: 2, rir: 8, rest: "0s", type: "working" }
                  ],
                  tempo: "Passive",
                  notes: "Lie down and elevate legs on a bench; take deep 4-7-8 protocol breaths."
                }
              ]
            },
            {
              id: "day_6",
              name: "Day 6: Passive Restore & Myofascial Release / \u0627\u0644\u064A\u0648\u0645 6: \u0627\u0644\u0631\u0627\u062D\u0629 \u0648\u0627\u0644\u062A\u062D\u0631\u064A\u0631 \u0627\u0644\u0639\u0636\u0644\u064A \u0648\u0627\u0644\u0644\u0641\u0627\u0641\u064A",
              exercises: [
                {
                  id: "m_ex_6_1",
                  exerciseId: "ex_rest_myofascial",
                  name: "Rest Day: Foam Rolling & Spinal Traction",
                  nameAr: "\u064A\u0648\u0645 \u0631\u0627\u062D\u0629: \u062F\u062D\u0631\u062C\u0629 \u0627\u0644\u0641\u0648\u0645 \u0648\u0625\u0637\u0627\u0644\u0629 \u0627\u0644\u0639\u0645\u0648\u062F \u0627\u0644\u0641\u0642\u0631\u064A \u0628\u0627\u0644\u062C\u0627\u0630\u0628\u064A\u0629",
                  sets: [
                    { id: "ds6_1_rec", reps: "15 mins", weight: "Foam Roller", rpe: 4, rir: 6, rest: "0s", type: "warmup" }
                  ],
                  tempo: "Controlled",
                  notes: "Roll out quads, upper back, and lats. Incorporate deep abdominal box breathing."
                }
              ]
            },
            {
              id: "day_7",
              name: "Day 7: Full System Reset & Mental Preparation / \u0627\u0644\u064A\u0648\u0645 7: \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0636\u0628\u0637 \u0627\u0644\u062A\u0627\u0645\u0629 \u0648\u0627\u0644\u062A\u0647\u064A\u0626\u0629 \u0627\u0644\u0630\u0647\u0646\u064A\u0629 \u0644\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u062C\u062F\u064A\u062F",
              exercises: [
                {
                  id: "m_ex_7_1",
                  exerciseId: "ex_rest_passive_full",
                  name: "Rest Day: Complete Neurological Rest",
                  nameAr: "\u064A\u0648\u0645 \u0631\u0627\u062D\u0629: \u0627\u0644\u0627\u0633\u062A\u0634\u0641\u0627\u0621 \u0627\u0644\u0639\u0635\u0628\u064A \u0627\u0644\u062A\u0627\u0645 \u0648\u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u0627\u0644\u0645\u062A\u0643\u0627\u0645\u0644\u0629",
                  sets: [
                    { id: "ds7_1_rec", reps: "Full Day", weight: "None", rpe: 1, rir: 9, rest: "0s", type: "warmup" }
                  ],
                  tempo: "Passive",
                  notes: "100% passive recovery. Perform standard walking, hydrate, and prepare nutrient-dense meals for the upcoming cycle."
                }
              ]
            }
          ]
        };
        return res.json({ result: dummyWorkout });
      }
      if (task === "generate_nutrition") {
        const calories = nutritionConfig?.calories || 2200;
        const isArabic = lang === "ar";
        const dummyNutrition = {
          bmr: Math.round(clientData.weight * 22),
          tdee: Math.round(clientData.weight * 32),
          calories,
          macros: {
            protein: Math.round(clientData.weight * 2.2),
            carbs: Math.round(calories * 0.45 / 4),
            fat: Math.round(calories * 0.25 / 9)
          },
          mealTiming: isArabic ? "\u0645\u0648\u0632\u0639\u0629 \u0628\u0627\u0644\u062A\u0633\u0627\u0648\u064A \u0639\u0644\u0649 4 \u0648\u062C\u0628\u0627\u062A \u0645\u0646\u0641\u0635\u0644\u0629. \u062A\u0646\u0627\u0648\u0644 40 \u062C\u0631\u0627\u0645\u0627\u064B \u0645\u0646 \u0627\u0644\u0628\u0631\u0648\u062A\u064A\u0646 \u062E\u0644\u0627\u0644 \u0633\u0627\u0639\u062A\u064A\u0646 \u0628\u0639\u062F \u0627\u0644\u062D\u0635\u0629 \u0627\u0644\u062A\u062F\u0631\u064A\u0628\u064A\u0629." : "Sufficiently spread over 4 distinct feeds. Consume 40g of protein within 2 hours post-session.",
          mealCount: 3,
          dietStyle: nutritionConfig?.dietStyle || (isArabic ? "\u0645\u062A\u0648\u0627\u0632\u0646 \u0639\u0627\u0644\u064A \u0627\u0644\u0628\u0631\u0648\u062A\u064A\u0646" : "High Protein Balanced"),
          allergies: clientData.allergies || (isArabic ? "\u0644\u0627 \u064A\u0648\u062C\u062F" : "None"),
          meals: isArabic ? [
            {
              name: "\u0627\u0644\u0648\u062C\u0628\u0629 \u0627\u0644\u0623\u0648\u0644\u0649: \u0641\u0637\u0648\u0631 \u063A\u0646\u064A \u0628\u0627\u0644\u0628\u0631\u0648\u062A\u064A\u0646 \u0648\u0627\u0644\u0646\u0634\u0627\u0637",
              timing: "08:30 \u0635\u0628\u0627\u062D\u0627\u064B",
              items: [
                "4 \u0628\u064A\u0636\u0627\u062A \u0639\u0636\u0648\u064A\u0629 \u0643\u0627\u0645\u0644\u0629",
                "100 \u062C\u0631\u0627\u0645 \u0634\u0648\u0641\u0627\u0646 \u062D\u0628\u0629 \u0643\u0627\u0645\u0644\u0629 \u0645\u0639 \u0627\u0644\u0642\u0631\u0641\u0629 \u0648\u0627\u0644\u0645\u0648\u0632",
                "\u0643\u0648\u0628 \u0645\u0646 \u0639\u0635\u064A\u0631 \u0627\u0644\u0628\u0631\u062A\u0642\u0627\u0644 \u0627\u0644\u0637\u0627\u0632\u062C \u0628\u062F\u0648\u0646 \u0633\u0643\u0631"
              ]
            },
            {
              name: "\u0627\u0644\u0648\u062C\u0628\u0629 \u0627\u0644\u062B\u0627\u0646\u064A\u0629: \u063A\u062F\u0627\u0621 \u0645\u062A\u0643\u0627\u0645\u0644 \u0628\u0639\u062F \u0627\u0644\u062A\u0645\u0631\u064A\u0646 \u0644\u0644\u0627\u0633\u062A\u0634\u0641\u0627\u0621",
              timing: "01:30 \u0638\u0647\u0631\u0627\u064B",
              items: [
                "200 \u062C\u0631\u0627\u0645 \u0635\u062F\u0631 \u062F\u062C\u0627\u062C \u0644\u064A\u0645\u0648\u0646\u064A \u0645\u0634\u0648\u064A (\u0648\u0632\u0646 \u0646\u064A\u0621)",
                "200 \u062C\u0631\u0627\u0645 \u0623\u0631\u0632 \u0628\u0633\u0645\u062A\u064A \u0645\u0637\u0647\u0648 \u0639\u0644\u0649 \u0627\u0644\u0628\u062E\u0627\u0631",
                "\u062E\u0636\u0627\u0631 \u0645\u0634\u0643\u0644\u0629 (\u0628\u0631\u0648\u0643\u0644\u064A \u0637\u0627\u0632\u062C \u0639\u0644\u0649 \u0627\u0644\u0628\u062E\u0627\u0631)"
              ]
            },
            {
              name: "\u0627\u0644\u0648\u062C\u0628\u0629 \u0627\u0644\u062B\u0627\u0644\u062B\u0629: \u0639\u0634\u0627\u0621 \u0627\u0633\u062A\u0634\u0641\u0627\u0626\u064A \u0645\u0645\u062A\u062F \u0627\u0644\u0645\u0641\u0639\u0648\u0644",
              timing: "08:30 \u0645\u0633\u0627\u0621\u064B",
              items: [
                "200 \u062C\u0631\u0627\u0645 \u0641\u064A\u0644\u064A\u0647 \u0633\u0645\u0643 \u0633\u0645\u0643\u0629 \u0645\u0648\u0633\u0649 \u0623\u0648 \u0633\u0627\u0644\u0645\u0648\u0646 \u0637\u0627\u0632\u062C",
                "150 \u062C\u0631\u0627\u0645 \u0628\u0637\u0627\u0637\u0627 \u062D\u0644\u0648\u0629 \u0645\u0634\u0648\u064A\u0629 \u0645\u0639 \u0627\u0644\u0642\u0634\u0631\u0629",
                "\u0633\u0644\u0637\u0629 \u0627\u0644\u0633\u0628\u0627\u0646\u062E \u0648\u0627\u0644\u062C\u0631\u062C\u064A\u0631 \u0627\u0644\u0637\u0627\u0632\u062C\u0629 \u0628\u0627\u0644\u0644\u064A\u0645\u0648\u0646"
              ]
            }
          ] : [
            {
              name: "Meal 1: Hyper-Protein Breakfast",
              timing: "08:30 AM",
              items: [
                "4 Whole Organic Eggs",
                "100g Rolled Oats with cinnamon",
                "1 Full Glass of Orange Juice"
              ]
            },
            {
              name: "Meal 2: Post-Workout Balanced Lunch",
              timing: "01:30 PM",
              items: [
                "200g Lean Grilled Chicken Breast (raw weight)",
                "200g Jasmine steamed rice",
                "Mixed wild steamed broccoli"
              ]
            },
            {
              name: "Meal 3: Sustained Release Dinner",
              timing: "08:30 PM",
              items: [
                "200g Fresh Sea Bass or Salmon fillet",
                "150g baked Sweet Potato with skin",
                "Garden spinach salad with lemon"
              ]
            }
          ],
          groceryList: isArabic ? [
            "\u0628\u064A\u0636 \u0639\u0636\u0648\u064A \u0637\u0627\u0632\u062C",
            "\u0634\u0648\u0641\u0627\u0646 \u062D\u0628\u0629 \u0643\u0627\u0645\u0644\u0629 \u0644\u062F\u0639\u0645 \u0627\u0644\u0623\u0644\u064A\u0627\u0641",
            "\u0635\u062F\u0648\u0631 \u062F\u062C\u0627\u062C \u0645\u0646\u0632\u0648\u0639\u0629 \u0627\u0644\u062C\u0644\u062F \u0645\u0637\u0647\u0631\u0629",
            "\u0633\u0645\u0643 \u0633\u0627\u0644\u0645\u0648\u0646 \u0623\u0648 \u0641\u064A\u0644\u064A\u0647 \u0637\u0627\u0632\u062C",
            "\u0628\u0637\u0627\u0637\u0627 \u062D\u0644\u0648\u0629 \u0645\u0634\u0648\u064A\u0629",
            "\u0623\u0631\u0632 \u0628\u0633\u0645\u062A\u064A \u0623\u0648 \u064A\u0627\u0633\u0645\u064A\u0646 \u0645\u0637\u0647\u0648",
            "\u0628\u0631\u0648\u0643\u0644\u064A \u0637\u0627\u0632\u062C \u0648\u0633\u0628\u0627\u0646\u062E \u062E\u0636\u0631\u0627\u0621"
          ] : [
            "Organic Eggs",
            "Rolled Oats",
            "Chicken Breast",
            "Salmon Fillets",
            "Sweet Potatoes",
            "Jasmine Rice",
            "Broccoli & Baby Spinach"
          ]
        };
        return res.json({ result: dummyNutrition });
      }
    }
    return res.status(500).json({ error: error.message || "AI processing pipeline failed." });
  }
}));
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", ((req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    }));
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[RepRise Coach Server] Listening on http://localhost:${PORT}`);
  });
}
startServer();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
