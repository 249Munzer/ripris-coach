/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Exercise } from '../types';

export const EXERCISE_DATABASE: Exercise[] = [
  // Chest
  {
    id: "ex_bench_press_bb",
    name: "Barbell Flat Bench Press",
    nameAr: "بنش برس مستوي بالبار",
    muscle: "Chest",
    equipment: "Barbell",
    difficulty: "intermediate",
    pattern: "Push",
    instructions: "Lie flat on a bench, grip the barbell slightly wider than shoulder-width, lower to mid-chest, and push up explosively.",
    instructionsAr: "استلقِ بشكل مسطح على المقعد، وأمسك البار بنطاق أوسع قليلاً من عرض الكتفين، واخفضه إلى منتصف الصدر، ثم ادفعه بقوة لأعلى.",
    injurySafe: true
  },
  {
    id: "ex_incline_press_db",
    name: "Incline Dumbbell Bench Press",
    nameAr: "تجميع بنش مائل عالي بالدمبلز",
    muscle: "Chest",
    equipment: "Dumbbell",
    difficulty: "intermediate",
    pattern: "Push",
    instructions: "Set bench to 30-45 degrees, lower dumbbells slowly to the sides of your upper chest, press up and squeeze.",
    instructionsAr: "اضبط المقعد بزاوية 30-45 درجة، واخفض الدامبلز ببطء إلى جانبي الجزء العلوي من الصدر، ثم اضغط لأعلى مع العصر.",
    injurySafe: true
  },
  {
    id: "ex_chest_fly_cable",
    name: "Standing Cable Chest Fly",
    nameAr: "تفتيح صدر كابل واقفا",
    muscle: "Chest",
    equipment: "Cable",
    difficulty: "beginner",
    pattern: "Push",
    instructions: "Bring cable handles together in front of your chest with a slight elbow bend, focusing on chest contraction.",
    instructionsAr: "اجمع مقابض الكابل معًا أمام صدرك مع ثني طفيف في الكوع، مع التركيز على انقباض عضلات الصدر.",
    injurySafe: true
  },

  // Back
  {
    id: "ex_deadlift_bb",
    name: "Barbell Conventional Deadlift",
    nameAr: "الرفعة المميتة التقليدية بالبار",
    muscle: "Back",
    equipment: "Barbell",
    difficulty: "advanced",
    pattern: "Hinge",
    instructions: "Stand with mid-foot under the bar. Grip bar, bend knees, keep back flat, stand up pushing through the floor.",
    instructionsAr: "قف مع وضع منتصف القدم تحت البار. أمسك البار، واثنِ ركبتيك، وحافظ على استقامة ظهرك، ثم قف دافعاً الأرض بقدميك.",
    injurySafe: false // Requires strict form
  },
  {
    id: "ex_lat_pulldown",
    name: "Wide-Grip Lat Pulldown",
    nameAr: "سحب عريض للظهر على الكابل",
    muscle: "Back",
    equipment: "Cable",
    difficulty: "beginner",
    pattern: "Pull",
    instructions: "Pull bar down to upper chest, retracting shoulder blades, keeping elbows pointed down.",
    instructionsAr: "اسحب البار لأسفل نحو الجزء العلوي من الصدر مع سحب لوحي الكتف للخلف والحفاظ على الكوعين متوجهين لأسفل.",
    injurySafe: true
  },
  {
    id: "ex_db_row",
    name: "Single-Arm Dumbbell Row",
    nameAr: "منشار ظهر بالدمبل فردي",
    muscle: "Back",
    equipment: "Dumbbell",
    difficulty: "intermediate",
    pattern: "Pull",
    instructions: "Place one knee on flat bench, pull dumbbell to your hip pocket, keeping spine neutral.",
    instructionsAr: "ضع ركبة واحدة على مقعد مسطح، واسحب الدامبل باتجاه جيب الفخذ، مع الحفاظ على استقامة العمود الفقري.",
    injurySafe: true
  },

  // Quads
  {
    id: "ex_squat_bb",
    name: "Barbell Back Squat",
    nameAr: "سكوات بالبار الخلفي",
    muscle: "Quads",
    equipment: "Barbell",
    difficulty: "intermediate",
    pattern: "Squat",
    instructions: "Rack bar on upper traps, step back, descend by bending hips and knees until thighs are parallel to floor.",
    instructionsAr: "ضع البار على عضلات الترابيس العلوية، وتراجع للخلف، ثم انزل بثني الفخذين والركبتين حتى يوازي الفخذان الأرض.",
    injurySafe: true
  },
  {
    id: "ex_leg_press",
    name: "45-Degree Leg Press",
    nameAr: "ضغط رجلين 45 درجة على الجهاز",
    muscle: "Quads",
    equipment: "Machine",
    difficulty: "beginner",
    pattern: "Squat",
    instructions: "Place feet shoulder-width on sled, lower fully until knees are at 90 degrees, press up without locking knees.",
    instructionsAr: "ضع قدميك بعرض الكتفين على المنصة، وانزل بالوزن حتى تصبح ركبتيك بزاوية 90 درجة، ثم اضغط لأعلى دون قفل الركبتين.",
    injurySafe: true
  },

  // Hamstrings & Glutes
  {
    id: "ex_romanian_deadlift_db",
    name: "Dumbbell Romanian Deadlift (RDL)",
    nameAr: "رفعة رومانية بالدمبلز للخلفيات",
    muscle: "Hamstrings",
    equipment: "Dumbbell",
    difficulty: "intermediate",
    pattern: "Hinge",
    instructions: "Keep knees slightly bent, hinge at the hips, lowering dumbbells along shins until hamstring stretch is felt.",
    instructionsAr: "حافظ على ثني ركبتيك قليلاً، وادفع الحوض للخلف من المفاصل، واخفض الدامبلز بمحاذاة الساقين حتى تشعر بتمزق خفيف وشد في الفخذ الخلفي.",
    injurySafe: true
  },
  {
    id: "ex_leg_curl",
    name: "Lying Leg Curl Machine",
    nameAr: "ثني أرجل خلفي على الجهاز مستلقيا",
    muscle: "Hamstrings",
    equipment: "Machine",
    difficulty: "beginner",
    pattern: "Pull",
    instructions: "Lie down on machine, align knees with pivot, curl pad toward glutes and contract hamstrings.",
    instructionsAr: "استلقِ على جهاز التمرين، وحاذِ ركبتيك مع محور الدوران، واثنِ الأرجل مقربًا الجهاز نحو المؤخرة مع عصر العضلات.",
    injurySafe: true
  },

  // Shoulders
  {
    id: "ex_overhead_press_db",
    name: "Seated Dumbbell Shoulder Press",
    nameAr: "ضغط كتف بالدمبلز جالساً",
    muscle: "Shoulders",
    equipment: "Dumbbell",
    difficulty: "intermediate",
    pattern: "Push",
    instructions: "Sit on high-back bench, press dumbbells from shoulder level straight overhead, lowering slowly to 90 degrees.",
    instructionsAr: "اجلس على مقعد ذو ظهر مرتفع، واضغط الدامبلز من مستوى الكتف مباشرة إلى الأعلى، ثم اخفضهما ببطء إلى زاوية 90 درجة.",
    injurySafe: true
  },
  {
    id: "ex_lateral_raise_cable",
    name: "Cable Lateral Raise",
    nameAr: "رفرفة كتف جانبي بالكابل",
    muscle: "Shoulders",
    equipment: "Cable",
    difficulty: "beginner",
    pattern: "Push",
    instructions: "Pull cable across body out to your side up to shoulder height, keeping a very slight elbow bend.",
    instructionsAr: "اسحب الكابل عبر الجسم إلى الجانب حتى مستوى ارتفاع الكتف مع الحفاظ على ثني كوعك بشكل طفيف جداً.",
    injurySafe: true
  },

  // Arms
  {
    id: "ex_bicep_curl_db",
    name: "Incline Dumbbell Bicep Curl",
    nameAr: "تبادل بايسبس بالدمبلز على المقعد المائل",
    muscle: "Arms",
    equipment: "Dumbbell",
    difficulty: "beginner",
    pattern: "Pull",
    instructions: "Sit on incline bench, curl dumbbells fully flexing the biceps, rotate wrist at the top.",
    instructionsAr: "اجلس على مقعد مائل، واثنِ الدامبلز للأعلى مع ثني عضلات البايسبس تدريجياً، ولف معصمك عند الوصول للقمة.",
    injurySafe: true
  },
  {
    id: "ex_tricep_pushdown_cable",
    name: "Tricep Rope Pushdown",
    nameAr: "ترايسبس بالحبل على الكابل لأسفل",
    muscle: "Arms",
    equipment: "Cable",
    difficulty: "beginner",
    pattern: "Push",
    instructions: "Grip rope, lock elbows at sides, extend arms downward spreading the rope split at the bottom.",
    instructionsAr: "أمسك الحبل، وقفل كوعيك عند جانبيك، وافرد ذراعيك لأسفل مباعداً طرفي الحبل عند نهاية الحركة.",
    injurySafe: true
  }
];
