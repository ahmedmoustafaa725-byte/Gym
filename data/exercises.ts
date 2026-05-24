import type { Exercise } from "@/types";

const commonsNote =
  "Seeded from Wikimedia Commons. Keep the file-page attribution and license link when replacing or adding clips.";
const placeholderNote =
  "Seed placeholder clip. The extra video links give you fast technique sources until you add a verified exercise-specific clip.";

const commonsCategory = "https://commons.wikimedia.org/wiki/Category:Videos_of_people_demonstrating_strength_training_exercises";
const fitnessTrainingCategory = "https://commons.wikimedia.org/wiki/Category:Videos_of_physical_exercises";

function redirectFile(fileName: string) {
  return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${fileName}`;
}

const media = {
  bench: redirectFile("Bench_press_-_exercise_demonstration_video.webm"),
  row: redirectFile("Bent-over_row_-_exercise_demonstration_video.webm"),
  squat: redirectFile("Squat_-_exercise_demonstration_video.webm"),
  deadlift: redirectFile("Deadlift_-_exercise_demonstration_video.webm"),
  shoulderPress: redirectFile("Shoulder_press_-_exercise_demonstration_video.webm"),
  inclinePress: redirectFile("Incline_press_-_exercise_demonstration_video.webm"),
  pullUp: redirectFile("Pull-ups_-_exercise_demonstration_video.webm"),
  legRaise: redirectFile("Leg_raises_-_exercise_demonstration_video.webm"),
  legPress: redirectFile("Hip_Sled_-_How_to_perform_a_45_degree_leg_press.webm"),
  dumbbellShoulderPress: redirectFile("How_To_Properly_Dumbbell_Shoulder_Press.webm"),
  curl: redirectFile("Video_of_EZ_Bar_Curl_and_Straight_Bar_Curl.webm"),
  latPulldown: redirectFile("Common_Lat_Pulldown_Mistakes.webm"),
  tbarRow: redirectFile("How_to_do_a_T-Bar_Row_in_strength_training_workouts.webm"),
  burpee: redirectFile("Burpee.webm"),
  walking: redirectFile("Fit_walking.webmhd.webm")
};

function youtubeSearch(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function videoLinks(name: string, commonsFile?: string): Exercise["videoLinks"] {
  return [
    ...(commonsFile ? [{ title: `${name} Commons file page`, url: commonsFile, source: "Wikimedia Commons" as const }] : []),
    { title: `${name} technique videos`, url: youtubeSearch(`${name} exercise proper form`), source: "YouTube" as const },
    { title: `${name} common mistakes`, url: youtubeSearch(`${name} exercise common mistakes`), source: "YouTube" as const },
    { title: "Wikimedia strength video category", url: commonsCategory, source: "Wikimedia Commons" as const }
  ];
}

export const exercises: Exercise[] = [
  {
    id: "bench-press",
    name: "Bench Press",
    muscleGroup: "Chest",
    equipment: "Barbell",
    difficulty: "intermediate",
    videoUrl: media.bench,
    thumbnail: "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=900&q=80",
    videoSource: "Wikimedia Commons",
    videoLinks: videoLinks("Bench Press", "https://commons.wikimedia.org/wiki/File:Bench_press_-_exercise_demonstration_video.webm"),
    licenseNote: `${commonsNote} Attribution: FitnessScape, CC BY 3.0.`,
    instructions: ["Set your eyes under the bar and pull shoulder blades back.", "Lower the bar under control to mid-chest.", "Press up while keeping feet planted and wrists stacked."],
    commonMistakes: ["Bouncing the bar", "Flaring elbows too wide", "Losing upper-back tightness"],
    alternatives: ["Dumbbell press", "Push-up", "Machine chest press"]
  },
  {
    id: "incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    muscleGroup: "Upper chest",
    equipment: "Dumbbells",
    difficulty: "intermediate",
    videoUrl: media.inclinePress,
    thumbnail: "https://images.unsplash.com/photo-1581009137042-c552e485697a?auto=format&fit=crop&w=900&q=80",
    videoSource: "Wikimedia Commons",
    videoLinks: videoLinks("Incline Dumbbell Press", "https://commons.wikimedia.org/wiki/File:Incline_press_-_exercise_demonstration_video.webm"),
    licenseNote: `${commonsNote} Attribution: FitnessScape, CC BY 3.0.`,
    instructions: ["Set the bench around 30 degrees.", "Lower dumbbells to upper chest with elbows under wrists.", "Press up without letting shoulders shrug."],
    commonMistakes: ["Bench too steep", "Letting dumbbells drift forward", "Short reps"],
    alternatives: ["Incline push-up", "Machine incline press", "Flat dumbbell press"]
  },
  {
    id: "push-up",
    name: "Push-up",
    muscleGroup: "Chest",
    equipment: "Bodyweight",
    difficulty: "beginner",
    videoUrl: media.burpee,
    thumbnail: "https://images.unsplash.com/photo-1598971639058-a6c88443d760?auto=format&fit=crop&w=900&q=80",
    videoSource: "Seed placeholder",
    videoLinks: videoLinks("Push-up"),
    licenseNote: placeholderNote,
    instructions: ["Set hands slightly wider than shoulders.", "Lower chest and hips together.", "Press the floor away while keeping your body in one line."],
    commonMistakes: ["Sagging hips", "Half reps", "Elbows flared straight out"],
    alternatives: ["Incline push-up", "Knee push-up", "Dumbbell press"]
  },
  {
    id: "shoulder-press",
    name: "Shoulder Press",
    muscleGroup: "Shoulders",
    equipment: "Dumbbells",
    difficulty: "beginner",
    videoUrl: media.shoulderPress,
    thumbnail: "https://images.unsplash.com/photo-1597076545399-91a3ff0e71b3?auto=format&fit=crop&w=900&q=80",
    videoSource: "Wikimedia Commons",
    videoLinks: videoLinks("Shoulder Press", "https://commons.wikimedia.org/wiki/File:Shoulder_press_-_exercise_demonstration_video.webm"),
    licenseNote: `${commonsNote} Attribution: FitnessScape, CC BY 3.0.`,
    instructions: ["Start with weights near shoulders and ribs stacked.", "Press overhead without arching your lower back.", "Lower under control to shoulder level."],
    commonMistakes: ["Overarching", "Pressing too far forward", "Locking knees aggressively"],
    alternatives: ["Landmine press", "Pike push-up", "Machine shoulder press"]
  },
  {
    id: "lateral-raise",
    name: "Lateral Raise",
    muscleGroup: "Shoulders",
    equipment: "Dumbbells",
    difficulty: "beginner",
    videoUrl: media.dumbbellShoulderPress,
    thumbnail: "https://images.unsplash.com/photo-1597076545399-91a3ff0e71b3?auto=format&fit=crop&w=900&q=80",
    videoSource: "Seed placeholder",
    videoLinks: videoLinks("Dumbbell Lateral Raise"),
    licenseNote: placeholderNote,
    instructions: ["Hold dumbbells at your sides with soft elbows.", "Raise arms until hands are around shoulder height.", "Lower slowly and keep traps relaxed."],
    commonMistakes: ["Swinging the body", "Shrugging", "Going too heavy"],
    alternatives: ["Cable lateral raise", "Machine lateral raise", "Lean-away lateral raise"]
  },
  {
    id: "triceps-pushdown",
    name: "Triceps Pushdown",
    muscleGroup: "Triceps",
    equipment: "Cable machine",
    difficulty: "beginner",
    videoUrl: media.dumbbellShoulderPress,
    thumbnail: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=900&q=80",
    videoSource: "Seed placeholder",
    videoLinks: videoLinks("Triceps Pushdown"),
    licenseNote: placeholderNote,
    instructions: ["Pin elbows close to your sides.", "Push the rope or bar down until elbows straighten.", "Control the return without shoulders rolling forward."],
    commonMistakes: ["Moving elbows forward", "Using bodyweight", "Stopping short of full lockout"],
    alternatives: ["Close-grip push-up", "Overhead cable extension", "Dumbbell skull crusher"]
  },
  {
    id: "dumbbell-row",
    name: "One-arm Dumbbell Row",
    muscleGroup: "Back",
    equipment: "Dumbbell",
    difficulty: "beginner",
    videoUrl: media.row,
    thumbnail: "https://images.unsplash.com/photo-1598971639058-a6c88443d760?auto=format&fit=crop&w=900&q=80",
    videoSource: "Wikimedia Commons",
    videoLinks: videoLinks("Dumbbell Row", "https://commons.wikimedia.org/wiki/File:Bent-over_row_-_exercise_demonstration_video.webm"),
    licenseNote: `${commonsNote} Attribution: FitnessScape, CC BY 3.0.`,
    instructions: ["Brace one hand on a bench and keep your torso steady.", "Pull the elbow toward your hip.", "Pause briefly, then lower until your lat stretches."],
    commonMistakes: ["Rotating the torso", "Shrugging the shoulder", "Using momentum"],
    alternatives: ["Cable row", "Resistance band row", "Chest-supported row"]
  },
  {
    id: "seated-cable-row",
    name: "Seated Cable Row",
    muscleGroup: "Back",
    equipment: "Cable machine",
    difficulty: "beginner",
    videoUrl: media.tbarRow,
    thumbnail: "https://images.unsplash.com/photo-1598971639058-a6c88443d760?auto=format&fit=crop&w=900&q=80",
    videoSource: "Wikimedia Commons",
    videoLinks: videoLinks("Seated Cable Row", "https://commons.wikimedia.org/wiki/File:How_to_do_a_T-Bar_Row_in_strength_training_workouts.webm"),
    licenseNote: commonsNote,
    instructions: ["Sit tall with ribs down.", "Pull handle toward lower ribs.", "Return slowly until arms are long without rounding hard."],
    commonMistakes: ["Leaning back too far", "Shrugging", "Turning it into a biceps curl"],
    alternatives: ["Chest-supported row", "Band row", "Dumbbell row"]
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    muscleGroup: "Back",
    equipment: "Cable machine",
    difficulty: "beginner",
    videoUrl: media.latPulldown,
    thumbnail: "https://images.unsplash.com/photo-1581009137042-c552e485697a?auto=format&fit=crop&w=900&q=80",
    videoSource: "Wikimedia Commons",
    videoLinks: videoLinks("Lat Pulldown", "https://commons.wikimedia.org/wiki/File:Common_Lat_Pulldown_Mistakes.webm"),
    licenseNote: commonsNote,
    instructions: ["Grip the bar and lean back slightly.", "Pull elbows down toward ribs.", "Return slowly until arms are long."],
    commonMistakes: ["Pulling behind the neck", "Swinging the torso", "Shrugging the shoulders"],
    alternatives: ["Assisted pull-up", "Band pulldown", "Seated row"]
  },
  {
    id: "pull-up",
    name: "Pull-up",
    muscleGroup: "Back",
    equipment: "Pull-up bar",
    difficulty: "advanced",
    videoUrl: media.pullUp,
    thumbnail: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=80",
    videoSource: "Wikimedia Commons",
    videoLinks: videoLinks("Pull-up", "https://commons.wikimedia.org/wiki/File:Pull-ups_-_exercise_demonstration_video.webm"),
    licenseNote: `${commonsNote} Attribution: FitnessScape, CC BY 3.0.`,
    instructions: ["Start from a controlled hang.", "Pull elbows down and chest toward the bar.", "Lower under control to full arm length."],
    commonMistakes: ["Kipping every rep", "Craning the neck", "Stopping high without control"],
    alternatives: ["Assisted pull-up", "Lat pulldown", "Band pulldown"]
  },
  {
    id: "goblet-squat",
    name: "Goblet Squat",
    muscleGroup: "Legs",
    equipment: "Dumbbell",
    difficulty: "beginner",
    videoUrl: media.squat,
    thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
    videoSource: "Wikimedia Commons",
    videoLinks: videoLinks("Goblet Squat", "https://commons.wikimedia.org/wiki/File:Squat_-_exercise_demonstration_video.webm"),
    licenseNote: `${commonsNote} Attribution: FitnessScape, CC BY 3.0.`,
    instructions: ["Hold the weight close to your chest.", "Sit between your hips while keeping knees tracking over toes.", "Drive through the whole foot to stand tall."],
    commonMistakes: ["Heels lifting", "Knees collapsing inward", "Rounding the lower back"],
    alternatives: ["Bodyweight squat", "Leg press", "Box squat"]
  },
  {
    id: "bodyweight-squat",
    name: "Bodyweight Squat",
    muscleGroup: "Legs",
    equipment: "Bodyweight",
    difficulty: "beginner",
    videoUrl: media.squat,
    thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
    videoSource: "Wikimedia Commons",
    videoLinks: videoLinks("Bodyweight Squat", "https://commons.wikimedia.org/wiki/File:Squat_-_exercise_demonstration_video.webm"),
    licenseNote: `${commonsNote} Attribution: FitnessScape, CC BY 3.0.`,
    instructions: ["Stand with feet around shoulder width.", "Sit down and slightly back.", "Stand by pushing the floor away."],
    commonMistakes: ["Knees cave in", "Rushing depth", "Losing balance on toes"],
    alternatives: ["Box squat", "Goblet squat", "Split squat"]
  },
  {
    id: "leg-press",
    name: "Leg Press",
    muscleGroup: "Legs",
    equipment: "Machine",
    difficulty: "beginner",
    videoUrl: media.legPress,
    thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
    videoSource: "Wikimedia Commons",
    videoLinks: videoLinks("Leg Press", "https://commons.wikimedia.org/wiki/File:Hip_Sled_-_How_to_perform_a_45_degree_leg_press.webm"),
    licenseNote: `${commonsNote} This Commons file still needs license review, so replace before public launch.`,
    instructions: ["Set feet around hip to shoulder width.", "Lower until knees are comfortably bent.", "Press through mid-foot without locking knees aggressively."],
    commonMistakes: ["Lower back lifting from pad", "Knees collapsing inward", "Too much range for hip comfort"],
    alternatives: ["Goblet squat", "Hack squat", "Walking lunge"]
  },
  {
    id: "walking-lunge",
    name: "Walking Lunge",
    muscleGroup: "Legs",
    equipment: "Bodyweight or dumbbells",
    difficulty: "intermediate",
    videoUrl: media.squat,
    thumbnail: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=900&q=80",
    videoSource: "Seed placeholder",
    videoLinks: videoLinks("Walking Lunge"),
    licenseNote: placeholderNote,
    instructions: ["Step forward and lower with control.", "Keep front knee tracking over toes.", "Push through the front foot into the next rep."],
    commonMistakes: ["Short unstable steps", "Knee collapsing inward", "Leaning too far forward"],
    alternatives: ["Reverse lunge", "Split squat", "Step-up"]
  },
  {
    id: "romanian-deadlift",
    name: "Romanian Deadlift",
    muscleGroup: "Hamstrings",
    equipment: "Dumbbells",
    difficulty: "intermediate",
    videoUrl: media.deadlift,
    thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
    videoSource: "Wikimedia Commons",
    videoLinks: videoLinks("Romanian Deadlift", "https://commons.wikimedia.org/wiki/File:Deadlift_-_exercise_demonstration_video.webm"),
    licenseNote: `${commonsNote} Attribution: FitnessScape, CC BY 3.0.`,
    instructions: ["Hold weights in front of thighs with soft knees.", "Push hips backward until hamstrings stretch.", "Stand by squeezing glutes, not leaning backward."],
    commonMistakes: ["Squatting instead of hinging", "Rounding the back", "Letting weights drift forward"],
    alternatives: ["Hip thrust", "Cable pull-through", "Hamstring curl"]
  },
  {
    id: "hip-thrust",
    name: "Hip Thrust",
    muscleGroup: "Glutes",
    equipment: "Bench and barbell",
    difficulty: "intermediate",
    videoUrl: media.deadlift,
    thumbnail: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=900&q=80",
    videoSource: "Seed placeholder",
    videoLinks: videoLinks("Hip Thrust"),
    licenseNote: placeholderNote,
    instructions: ["Set upper back on a bench and feet flat.", "Drive hips up until torso is nearly parallel to floor.", "Pause and squeeze glutes without overextending lower back."],
    commonMistakes: ["Feet too far away", "Arching the lower back", "Rushing the top pause"],
    alternatives: ["Glute bridge", "Cable pull-through", "Romanian deadlift"]
  },
  {
    id: "biceps-curl",
    name: "Biceps Curl",
    muscleGroup: "Biceps",
    equipment: "Dumbbells or EZ bar",
    difficulty: "beginner",
    videoUrl: media.curl,
    thumbnail: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=80",
    videoSource: "Wikimedia Commons",
    videoLinks: videoLinks("Biceps Curl", "https://commons.wikimedia.org/wiki/File:Video_of_EZ_Bar_Curl_and_Straight_Bar_Curl.webm"),
    licenseNote: commonsNote,
    instructions: ["Keep elbows close to your sides.", "Curl without swinging your torso.", "Lower slowly until arms are nearly straight."],
    commonMistakes: ["Using hips for momentum", "Elbows drifting forward", "Cutting the bottom short"],
    alternatives: ["Hammer curl", "Cable curl", "Band curl"]
  },
  {
    id: "plank",
    name: "Plank",
    muscleGroup: "Core",
    equipment: "Bodyweight",
    difficulty: "beginner",
    videoUrl: media.legRaise,
    thumbnail: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=900&q=80",
    videoSource: "Seed placeholder",
    videoLinks: videoLinks("Plank"),
    licenseNote: placeholderNote,
    instructions: ["Set elbows under shoulders.", "Squeeze glutes and keep ribs tucked.", "Breathe slowly while holding a straight line."],
    commonMistakes: ["Hips too high", "Lower back sagging", "Holding breath"],
    alternatives: ["Dead bug", "Side plank", "Pallof press"]
  },
  {
    id: "dead-bug",
    name: "Dead Bug",
    muscleGroup: "Core",
    equipment: "Bodyweight",
    difficulty: "beginner",
    videoUrl: media.legRaise,
    thumbnail: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=900&q=80",
    videoSource: "Seed placeholder",
    videoLinks: videoLinks("Dead Bug Exercise"),
    licenseNote: placeholderNote,
    instructions: ["Lie on your back with arms and knees up.", "Keep lower back gently pressed down.", "Extend opposite arm and leg slowly, then switch."],
    commonMistakes: ["Lower back arching", "Moving too fast", "Holding breath"],
    alternatives: ["Plank", "Bird dog", "Leg raise"]
  },
  {
    id: "leg-raise",
    name: "Leg Raise",
    muscleGroup: "Core",
    equipment: "Bodyweight",
    difficulty: "intermediate",
    videoUrl: media.legRaise,
    thumbnail: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=900&q=80",
    videoSource: "Wikimedia Commons",
    videoLinks: videoLinks("Leg Raise", "https://commons.wikimedia.org/wiki/File:Leg_raises_-_exercise_demonstration_video.webm"),
    licenseNote: `${commonsNote} Attribution: FitnessScape, CC BY 3.0.`,
    instructions: ["Keep ribs down and lower back controlled.", "Raise legs without swinging.", "Lower only as far as you can control."],
    commonMistakes: ["Arching the lower back", "Using momentum", "Neck tension"],
    alternatives: ["Dead bug", "Reverse crunch", "Hanging knee raise"]
  },
  {
    id: "burpee",
    name: "Burpee",
    muscleGroup: "Full body",
    equipment: "Bodyweight",
    difficulty: "intermediate",
    videoUrl: media.burpee,
    thumbnail: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=900&q=80",
    videoSource: "Wikimedia Commons",
    videoLinks: videoLinks("Burpee", "https://commons.wikimedia.org/wiki/File:Burpee.webm"),
    licenseNote: commonsNote,
    instructions: ["Place hands on the floor and step or jump feet back.", "Keep the plank strong before returning feet forward.", "Stand tall or add a small jump if joints feel good."],
    commonMistakes: ["Collapsing the lower back", "Rushing sloppy reps", "Landing hard on the knees"],
    alternatives: ["Squat thrust", "Incline burpee", "Mountain climber"]
  },
  {
    id: "mountain-climber",
    name: "Mountain Climber",
    muscleGroup: "Full body",
    equipment: "Bodyweight",
    difficulty: "beginner",
    videoUrl: media.burpee,
    thumbnail: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=900&q=80",
    videoSource: "Seed placeholder",
    videoLinks: videoLinks("Mountain Climber Exercise"),
    licenseNote: placeholderNote,
    instructions: ["Start in a strong high plank.", "Drive one knee toward the chest.", "Alternate legs while keeping hips steady."],
    commonMistakes: ["Hips bouncing high", "Shoulders drifting behind hands", "Moving faster than control allows"],
    alternatives: ["Incline mountain climber", "Marching plank", "Squat thrust"]
  },
  {
    id: "walking",
    name: "Brisk Walking",
    muscleGroup: "Cardio",
    equipment: "None",
    difficulty: "beginner",
    videoUrl: media.walking,
    thumbnail: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=900&q=80",
    videoSource: "Wikimedia Commons",
    videoLinks: [
      { title: "Brisk walking Commons file page", url: "https://commons.wikimedia.org/wiki/File:Fit_walking.webmhd.webm", source: "Wikimedia Commons" },
      { title: "Walking workout videos", url: youtubeSearch("brisk walking workout"), source: "YouTube" },
      { title: "Physical exercise video category", url: fitnessTrainingCategory, source: "Wikimedia Commons" }
    ],
    licenseNote: commonsNote,
    instructions: ["Walk tall with relaxed shoulders.", "Use a pace where talking is possible but effort is clear.", "Build duration gradually."],
    commonMistakes: ["Starting too fast", "Ignoring foot pain", "Skipping hydration in heat"],
    alternatives: ["Stationary bike", "Elliptical", "Incline treadmill"]
  }
];

export const muscleGroups = Array.from(new Set(exercises.map((exercise) => exercise.muscleGroup)));
export const equipmentOptions = Array.from(new Set(exercises.map((exercise) => exercise.equipment)));
