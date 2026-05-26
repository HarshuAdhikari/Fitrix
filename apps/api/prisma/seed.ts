import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const HARSHIT_EMAIL = "harhsu9souls@gmail.com";

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

interface ExerciseSpec {
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  difficulty: Difficulty;
  description: string;
}

const EXERCISES: ExerciseSpec[] = [
  {
    name: "Barbell Bench Press",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Triceps", "Front Delts"],
    equipment: "Barbell",
    difficulty: "INTERMEDIATE",
    description: "Classic horizontal push. Retract scapula, brace core, drive through mid-foot.",
  },
  {
    name: "Push-Up",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Triceps", "Core"],
    equipment: "Bodyweight",
    difficulty: "BEGINNER",
    description: "Plank with elbow flexion. Keep a straight line from head to heel.",
  },
  {
    name: "Incline Dumbbell Press",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Front Delts", "Triceps"],
    equipment: "Dumbbells",
    difficulty: "INTERMEDIATE",
    description: "30-45 degree bench. Emphasises upper chest fibers.",
  },
  {
    name: "Deadlift",
    primaryMuscle: "Back",
    secondaryMuscles: ["Glutes", "Hamstrings", "Core"],
    equipment: "Barbell",
    difficulty: "ADVANCED",
    description: "Conventional pull from the floor. Hinge, neutral spine, push the earth away.",
  },
  {
    name: "Pull-Up",
    primaryMuscle: "Back",
    secondaryMuscles: ["Biceps", "Rear Delts"],
    equipment: "Pull-up Bar",
    difficulty: "INTERMEDIATE",
    description: "Dead-hang to chin-over-bar. Drive elbows to hips.",
  },
  {
    name: "Bent-Over Barbell Row",
    primaryMuscle: "Back",
    secondaryMuscles: ["Biceps", "Rear Delts"],
    equipment: "Barbell",
    difficulty: "INTERMEDIATE",
    description: "Hinge at hip, pull to lower sternum, control eccentric.",
  },
  {
    name: "Lat Pulldown",
    primaryMuscle: "Back",
    secondaryMuscles: ["Biceps"],
    equipment: "Cable",
    difficulty: "BEGINNER",
    description: "Shoulder-width grip, drive elbows down and back.",
  },
  {
    name: "Back Squat",
    primaryMuscle: "Quads",
    secondaryMuscles: ["Glutes", "Hamstrings", "Core"],
    equipment: "Barbell",
    difficulty: "INTERMEDIATE",
    description: "High-bar or low-bar. Break at the hip, knees tracking toes.",
  },
  {
    name: "Front Squat",
    primaryMuscle: "Quads",
    secondaryMuscles: ["Core", "Upper Back"],
    equipment: "Barbell",
    difficulty: "ADVANCED",
    description: "Front-rack hold. Upright torso demands core stability.",
  },
  {
    name: "Walking Lunge",
    primaryMuscle: "Quads",
    secondaryMuscles: ["Glutes", "Hamstrings"],
    equipment: "Dumbbells",
    difficulty: "BEGINNER",
    description: "Alternating forward lunges with dumbbells at side.",
  },
  {
    name: "Romanian Deadlift",
    primaryMuscle: "Hamstrings",
    secondaryMuscles: ["Glutes", "Back"],
    equipment: "Barbell",
    difficulty: "INTERMEDIATE",
    description: "Soft-knee hinge, bar glued to thighs, load the posterior chain.",
  },
  {
    name: "Hip Thrust",
    primaryMuscle: "Glutes",
    secondaryMuscles: ["Hamstrings"],
    equipment: "Barbell",
    difficulty: "BEGINNER",
    description: "Shoulders on bench, barbell over hips, squeeze at the top.",
  },
  {
    name: "Overhead Press",
    primaryMuscle: "Shoulders",
    secondaryMuscles: ["Triceps", "Upper Chest"],
    equipment: "Barbell",
    difficulty: "INTERMEDIATE",
    description: "Standing strict press. Glutes tight, ribs stacked over pelvis.",
  },
  {
    name: "Dumbbell Lateral Raise",
    primaryMuscle: "Shoulders",
    secondaryMuscles: [],
    equipment: "Dumbbells",
    difficulty: "BEGINNER",
    description: "Lead with the elbow, pause at shoulder height.",
  },
  {
    name: "Face Pull",
    primaryMuscle: "Rear Delts",
    secondaryMuscles: ["Upper Back"],
    equipment: "Cable",
    difficulty: "BEGINNER",
    description: "High cable, rope attachment. Pull to forehead with external rotation.",
  },
  {
    name: "Barbell Curl",
    primaryMuscle: "Biceps",
    secondaryMuscles: ["Forearms"],
    equipment: "Barbell",
    difficulty: "BEGINNER",
    description: "Shoulder-width grip, elbows pinned, full range.",
  },
  {
    name: "Triceps Rope Pushdown",
    primaryMuscle: "Triceps",
    secondaryMuscles: [],
    equipment: "Cable",
    difficulty: "BEGINNER",
    description: "Flare rope at bottom for peak triceps contraction.",
  },
  {
    name: "Plank",
    primaryMuscle: "Core",
    secondaryMuscles: ["Shoulders", "Glutes"],
    equipment: "Bodyweight",
    difficulty: "BEGINNER",
    description: "Forearm plank. Squeeze glutes, neutral neck, breathe.",
  },
  {
    name: "Hanging Leg Raise",
    primaryMuscle: "Core",
    secondaryMuscles: ["Hip Flexors"],
    equipment: "Pull-up Bar",
    difficulty: "ADVANCED",
    description: "Hollow-body hang. Raise legs to horizontal or higher with control.",
  },
  {
    name: "Assault Bike Intervals",
    primaryMuscle: "Full Body",
    secondaryMuscles: ["Cardio"],
    equipment: "Assault Bike",
    difficulty: "INTERMEDIATE",
    description: "30s on / 30s off. Drive arms and legs equally.",
  },
];

interface SessionExerciseSpec {
  exerciseName: string;
  orderIndex: number;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

interface SessionSpec {
  weekNumber: number;
  dayNumber: number;
  name: string;
  notes: string;
  estimatedDurationMin: number;
  exercises: SessionExerciseSpec[];
}

interface ProgramSpec {
  name: string;
  description: string;
  durationWeeks: number;
  difficulty: Difficulty;
  sessions: SessionSpec[];
}

const PROGRAMS: ProgramSpec[] = [
  {
    name: "Foundations: Full-Body Strength",
    description:
      "A 4-week intro program covering the six basic movement patterns. Great for clients new to resistance training.",
    durationWeeks: 4,
    difficulty: "BEGINNER",
    sessions: [
      {
        weekNumber: 1,
        dayNumber: 1,
        name: "Full Body A",
        notes: "Focus on tempo — 3 sec eccentric on all lifts.",
        estimatedDurationMin: 55,
        exercises: [
          { exerciseName: "Back Squat", orderIndex: 1, sets: 3, reps: "8", rest: "90s" },
          { exerciseName: "Push-Up", orderIndex: 2, sets: 3, reps: "10", rest: "60s" },
          { exerciseName: "Lat Pulldown", orderIndex: 3, sets: 3, reps: "10", rest: "60s" },
          { exerciseName: "Plank", orderIndex: 4, sets: 3, reps: "30s", rest: "45s" },
        ],
      },
      {
        weekNumber: 1,
        dayNumber: 3,
        name: "Full Body B",
        notes: "Hinge-pattern day. Film your RDL.",
        estimatedDurationMin: 55,
        exercises: [
          { exerciseName: "Romanian Deadlift", orderIndex: 1, sets: 3, reps: "8", rest: "90s" },
          { exerciseName: "Incline Dumbbell Press", orderIndex: 2, sets: 3, reps: "10", rest: "60s" },
          { exerciseName: "Bent-Over Barbell Row", orderIndex: 3, sets: 3, reps: "10", rest: "60s" },
          { exerciseName: "Walking Lunge", orderIndex: 4, sets: 3, reps: "12/leg", rest: "60s" },
        ],
      },
      {
        weekNumber: 1,
        dayNumber: 5,
        name: "Full Body C",
        notes: "Accessory-heavy day to lock in technique.",
        estimatedDurationMin: 50,
        exercises: [
          { exerciseName: "Hip Thrust", orderIndex: 1, sets: 3, reps: "10", rest: "75s" },
          { exerciseName: "Dumbbell Lateral Raise", orderIndex: 2, sets: 3, reps: "12", rest: "45s" },
          { exerciseName: "Face Pull", orderIndex: 3, sets: 3, reps: "15", rest: "45s" },
          { exerciseName: "Barbell Curl", orderIndex: 4, sets: 3, reps: "10", rest: "45s" },
        ],
      },
    ],
  },
  {
    name: "Hypertrophy: Upper / Lower Split",
    description:
      "A 6-week intermediate mass-building program with an upper/lower split and progressive overload.",
    durationWeeks: 6,
    difficulty: "INTERMEDIATE",
    sessions: [
      {
        weekNumber: 1,
        dayNumber: 1,
        name: "Upper A",
        notes: "Push-dominant upper. RPE 7-8 on working sets.",
        estimatedDurationMin: 65,
        exercises: [
          { exerciseName: "Barbell Bench Press", orderIndex: 1, sets: 4, reps: "6-8", rest: "120s" },
          { exerciseName: "Overhead Press", orderIndex: 2, sets: 3, reps: "8", rest: "90s" },
          { exerciseName: "Pull-Up", orderIndex: 3, sets: 3, reps: "AMRAP", rest: "90s" },
          { exerciseName: "Triceps Rope Pushdown", orderIndex: 4, sets: 3, reps: "12", rest: "45s" },
        ],
      },
      {
        weekNumber: 1,
        dayNumber: 2,
        name: "Lower A",
        notes: "Squat-focus day.",
        estimatedDurationMin: 70,
        exercises: [
          { exerciseName: "Back Squat", orderIndex: 1, sets: 4, reps: "6-8", rest: "150s" },
          { exerciseName: "Romanian Deadlift", orderIndex: 2, sets: 3, reps: "8", rest: "90s" },
          { exerciseName: "Walking Lunge", orderIndex: 3, sets: 3, reps: "10/leg", rest: "75s" },
          { exerciseName: "Hanging Leg Raise", orderIndex: 4, sets: 3, reps: "8-12", rest: "60s" },
        ],
      },
      {
        weekNumber: 1,
        dayNumber: 4,
        name: "Upper B",
        notes: "Pull-dominant upper.",
        estimatedDurationMin: 65,
        exercises: [
          { exerciseName: "Bent-Over Barbell Row", orderIndex: 1, sets: 4, reps: "6-8", rest: "120s" },
          { exerciseName: "Incline Dumbbell Press", orderIndex: 2, sets: 3, reps: "10", rest: "90s" },
          { exerciseName: "Lat Pulldown", orderIndex: 3, sets: 3, reps: "12", rest: "60s" },
          { exerciseName: "Barbell Curl", orderIndex: 4, sets: 3, reps: "10-12", rest: "45s" },
        ],
      },
      {
        weekNumber: 1,
        dayNumber: 6,
        name: "Lower B",
        notes: "Hinge-focus day.",
        estimatedDurationMin: 70,
        exercises: [
          { exerciseName: "Deadlift", orderIndex: 1, sets: 4, reps: "5", rest: "180s" },
          { exerciseName: "Front Squat", orderIndex: 2, sets: 3, reps: "6", rest: "120s" },
          { exerciseName: "Hip Thrust", orderIndex: 3, sets: 3, reps: "10", rest: "75s" },
          { exerciseName: "Plank", orderIndex: 4, sets: 3, reps: "45s", rest: "45s" },
        ],
      },
    ],
  },
  {
    name: "Performance: Athletic Conditioning",
    description:
      "8-week advanced program blending heavy lifting and metabolic conditioning for sport-ready athletes.",
    durationWeeks: 8,
    difficulty: "ADVANCED",
    sessions: [
      {
        weekNumber: 1,
        dayNumber: 1,
        name: "Strength + Conditioning A",
        notes: "Strength first, conditioning finisher.",
        estimatedDurationMin: 75,
        exercises: [
          { exerciseName: "Back Squat", orderIndex: 1, sets: 5, reps: "5", rest: "150s" },
          { exerciseName: "Overhead Press", orderIndex: 2, sets: 4, reps: "6", rest: "120s" },
          { exerciseName: "Pull-Up", orderIndex: 3, sets: 4, reps: "6-8", rest: "90s" },
          { exerciseName: "Assault Bike Intervals", orderIndex: 4, sets: 6, reps: "30s on / 30s off", rest: "30s" },
        ],
      },
      {
        weekNumber: 1,
        dayNumber: 3,
        name: "Strength + Conditioning B",
        notes: "Deadlift day. Treat warm-ups as work sets.",
        estimatedDurationMin: 80,
        exercises: [
          { exerciseName: "Deadlift", orderIndex: 1, sets: 5, reps: "3", rest: "180s" },
          { exerciseName: "Barbell Bench Press", orderIndex: 2, sets: 4, reps: "6", rest: "120s" },
          { exerciseName: "Bent-Over Barbell Row", orderIndex: 3, sets: 4, reps: "6", rest: "90s" },
          { exerciseName: "Hanging Leg Raise", orderIndex: 4, sets: 4, reps: "10", rest: "60s" },
        ],
      },
      {
        weekNumber: 1,
        dayNumber: 5,
        name: "Power + Metcon",
        notes: "Explosive day. Move with intent.",
        estimatedDurationMin: 70,
        exercises: [
          { exerciseName: "Front Squat", orderIndex: 1, sets: 4, reps: "4", rest: "150s" },
          { exerciseName: "Hip Thrust", orderIndex: 2, sets: 4, reps: "6", rest: "90s" },
          { exerciseName: "Face Pull", orderIndex: 3, sets: 3, reps: "15", rest: "45s" },
          { exerciseName: "Assault Bike Intervals", orderIndex: 4, sets: 8, reps: "20s on / 40s off", rest: "40s" },
        ],
      },
    ],
  },
];

interface ClientSpec {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  goals: string[];
  heightCm: number;
  weightKg: number;
  medicalNotes?: string;
}

const CLIENTS: ClientSpec[] = [
  {
    clerkId: "user_seed_client_alex",
    email: "alex.smith@fitrix.seed",
    firstName: "Alex",
    lastName: "Smith",
    goals: ["Lose body fat", "Improve cardio"],
    heightCm: 178,
    weightKg: 84,
    medicalNotes: "Mild left-shoulder impingement — avoid heavy overhead pressing.",
  },
  {
    clerkId: "user_seed_client_priya",
    email: "priya.sharma@fitrix.seed",
    firstName: "Priya",
    lastName: "Sharma",
    goals: ["Build muscle", "Tone glutes"],
    heightCm: 165,
    weightKg: 58,
  },
  {
    clerkId: "user_seed_client_marcus",
    email: "marcus.lee@fitrix.seed",
    firstName: "Marcus",
    lastName: "Lee",
    goals: ["Powerlifting total", "Add 20kg to squat"],
    heightCm: 182,
    weightKg: 96,
  },
];

async function main(): Promise<void> {
  console.log("[seed] start");

  let harshit = await prisma.user.findUnique({
    where: { email: HARSHIT_EMAIL },
  });

  if (!harshit) {
    const fallback = await prisma.user.findFirst({
      where: {
        email: { not: { startsWith: "alex." } },
        deletedAt: null,
        role: { in: ["CLIENT", "COACH"] },
      },
      orderBy: { createdAt: "asc" },
    });

    if (fallback) {
      console.log(
        `[seed] no user with email ${HARSHIT_EMAIL}; adopting earliest user ${fallback.id} as Harshit`,
      );
      harshit = await prisma.user.update({
        where: { id: fallback.id },
        data: {
          email: HARSHIT_EMAIL,
          firstName: "Harshit",
          lastName: "Maharjan",
        },
      });
    }
  }

  if (!harshit) {
    throw new Error(
      `Seed aborted: no existing user found to adopt as Harshit. Sign up via Clerk first.`,
    );
  }

  const coachProfile = await prisma.$transaction(
    async (tx) => {
      await tx.user.update({
        where: { id: harshit!.id },
        data: { role: "COACH" },
      });

      const profile = await tx.coachProfile.upsert({
        where: { userId: harshit!.id },
        update: {},
        create: {
          userId: harshit!.id,
          bio: "Strength & conditioning coach. 5 yrs in the trenches. Based in Kathmandu.",
          specialties: ["Strength training", "Hypertrophy", "Sport performance"],
          yearsOfExperience: 5,
          hourlyRate: new Prisma.Decimal("45.00"),
          timezone: "Asia/Kathmandu",
        },
      });

      return profile;
    },
    { timeout: 30_000 },
  );

  console.log(`[seed] coach profile ${coachProfile.id} ready (user: ${harshit.email})`);

  const exerciseByName = new Map<string, string>();

  await prisma.$transaction(
    async (tx) => {
      for (const spec of EXERCISES) {
        const existing = await tx.exercise.findFirst({ where: { name: spec.name } });
        if (existing) {
          exerciseByName.set(spec.name, existing.id);
          continue;
        }
        const created = await tx.exercise.create({
          data: {
            name: spec.name,
            primaryMuscle: spec.primaryMuscle,
            secondaryMuscles: spec.secondaryMuscles,
            equipment: spec.equipment,
            difficulty: spec.difficulty,
            description: spec.description,
            createdById: harshit!.id,
          },
        });
        exerciseByName.set(spec.name, created.id);
      }
    },
    { timeout: 30_000 },
  );

  console.log(`[seed] exercises: ${exerciseByName.size} ready`);

  const clientProfileIds: string[] = [];

  await prisma.$transaction(
    async (tx) => {
      for (const c of CLIENTS) {
        const user = await tx.user.upsert({
          where: { email: c.email },
          update: {
            firstName: c.firstName,
            lastName: c.lastName,
            role: "CLIENT",
          },
          create: {
            clerkId: c.clerkId,
            email: c.email,
            firstName: c.firstName,
            lastName: c.lastName,
            role: "CLIENT",
          },
        });

        const profile = await tx.clientProfile.upsert({
          where: { userId: user.id },
          update: {
            goals: c.goals,
            heightCm: c.heightCm,
            weightKg: c.weightKg,
            medicalNotes: c.medicalNotes ?? null,
          },
          create: {
            userId: user.id,
            goals: c.goals,
            heightCm: c.heightCm,
            weightKg: c.weightKg,
            medicalNotes: c.medicalNotes ?? null,
          },
        });

        clientProfileIds.push(profile.id);

        await tx.coachClientAssignment.upsert({
          where: {
            coachId_clientId: {
              coachId: coachProfile.id,
              clientId: profile.id,
            },
          },
          update: { status: "ACTIVE", endedAt: null },
          create: {
            coachId: coachProfile.id,
            clientId: profile.id,
            status: "ACTIVE",
          },
        });
      }
    },
    { timeout: 30_000 },
  );

  console.log(`[seed] clients seeded + assigned: ${clientProfileIds.length}`);

  await prisma.$transaction(
    async (tx) => {
      for (const spec of PROGRAMS) {
        const existing = await tx.program.findFirst({
          where: { coachId: coachProfile.id, name: spec.name },
        });

        if (existing) {
          console.log(`[seed] program "${spec.name}" already exists — skipping`);
          continue;
        }

        const program = await tx.program.create({
          data: {
            coachId: coachProfile.id,
            name: spec.name,
            description: spec.description,
            durationWeeks: spec.durationWeeks,
            difficulty: spec.difficulty,
          },
        });

        for (const session of spec.sessions) {
          const createdSession = await tx.workoutSession.create({
            data: {
              programId: program.id,
              weekNumber: session.weekNumber,
              dayNumber: session.dayNumber,
              name: session.name,
              notes: session.notes,
              estimatedDurationMin: session.estimatedDurationMin,
            },
          });

          for (const se of session.exercises) {
            const exerciseId = exerciseByName.get(se.exerciseName);
            if (!exerciseId) {
              throw new Error(
                `Seed error: session refers to unknown exercise "${se.exerciseName}"`,
              );
            }
            await tx.workoutSessionExercise.create({
              data: {
                sessionId: createdSession.id,
                exerciseId,
                orderIndex: se.orderIndex,
                sets: se.sets,
                reps: se.reps,
                rest: se.rest,
                notes: se.notes ?? null,
              },
            });
          }
        }

        console.log(`[seed] program "${spec.name}" created (${spec.sessions.length} sessions)`);
      }
    },
    { timeout: 60_000 },
  );

  console.log("[seed] done");
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
