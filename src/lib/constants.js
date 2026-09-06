import {
  Zap, FlaskConical, Dna, Calculator, BookOpen,
  Repeat, Building2, Hourglass, GraduationCap, MoreHorizontal,
} from "lucide-react";

// ── Chapter Database ──────────────────────────────────────────────
export const CHAPTER_DB = {
  Physics: ["Physical World & Measurement","Kinematics","Laws of Motion","Work, Energy & Power","Motion of System of Particles","Gravitation","Properties of Bulk Matter","Thermodynamics","Behaviour of Perfect Gas & Kinetic Theory","Oscillations","Waves","Electrostatics","Current Electricity","Magnetic Effects of Current","Magnetism & Matter","Electromagnetic Induction","Alternating Current","Electromagnetic Waves","Ray Optics","Wave Optics","Dual Nature of Radiation","Atoms","Nuclei","Electronic Devices","Communication Systems","Units & Dimensions","Motion in a Straight Line","Motion in a Plane","Circular Motion","Rotational Motion","Fluid Mechanics","Thermal Properties of Matter","Electric Charges & Fields","Electric Potential & Capacitance","Moving Charges & Magnetism","Semiconductor Electronics"],
  Chemistry: ["Some Basic Concepts of Chemistry","Structure of Atom","Classification of Elements","Chemical Bonding","States of Matter","Thermodynamics","Equilibrium","Redox Reactions","Hydrogen","s-Block Elements","p-Block Elements","Organic Chemistry – Basic Principles","Hydrocarbons","Environmental Chemistry","Solid State","Solutions","Electrochemistry","Chemical Kinetics","Surface Chemistry","General Principles of Isolation","d & f Block Elements","Coordination Compounds","Haloalkanes & Haloarenes","Alcohols, Phenols & Ethers","Aldehydes, Ketones & Carboxylic Acids","Amines","Biomolecules","Polymers","Chemistry in Everyday Life","Mole Concept","Stoichiometry","Periodic Table","Ionic Equilibrium","Atomic Structure","Nuclear Chemistry"],
  Biology: ["The Living World","Biological Classification","Plant Kingdom","Animal Kingdom","Morphology of Flowering Plants","Anatomy of Flowering Plants","Structural Organisation in Animals","Cell: The Unit of Life","Biomolecules","Cell Cycle & Cell Division","Transport in Plants","Mineral Nutrition","Photosynthesis","Respiration in Plants","Plant Growth & Development","Digestion & Absorption","Breathing & Exchange of Gases","Body Fluids & Circulation","Excretory Products","Locomotion & Movement","Neural Control & Coordination","Chemical Coordination","Reproduction in Organisms","Sexual Reproduction in Flowering Plants","Human Reproduction","Reproductive Health","Principles of Inheritance","Molecular Basis of Inheritance","Evolution","Human Health & Disease","Strategies for Enhancement","Microbes in Human Welfare","Biotechnology: Principles","Biotechnology Applications","Organisms & Populations","Ecosystem","Biodiversity","Environmental Issues"],
  Mathematics: ["Sets","Relations & Functions","Trigonometric Functions","Principle of Mathematical Induction","Complex Numbers","Linear Inequalities","Permutations & Combinations","Binomial Theorem","Sequences & Series","Straight Lines","Conic Sections","3D Geometry – Introduction","Limits & Derivatives","Mathematical Reasoning","Statistics","Probability","Inverse Trigonometric Functions","Matrices","Determinants","Continuity & Differentiability","Application of Derivatives","Integrals","Application of Integrals","Differential Equations","Vector Algebra","Three Dimensional Geometry","Linear Programming","Bayes Theorem","Relations & Functions (XII)","Calculus","Coordinate Geometry","Algebra","Number Theory","Trigonometry"],
};
export const ALL_CHAPTERS = [...new Set(Object.values(CHAPTER_DB).flat())].sort();

export const BATCH_COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#ec4899","#14b8a6","#f97316","#06b6d4"];

export const MOTIVATIONAL_QUOTES = [
  "100 hours of dedication — you are a true legend! 🌟",
  "Every hour you teach lights up a student's future! 💡",
  "Great teachers don't just teach subjects — they build dreams! 🚀",
  "100 hours down — countless lives changed forever! 🔥",
  "Your dedication inspires more than you will ever know! 💪",
  "The best investment in a student's future is a teacher like you! 🏆",
  "Toppers always remember their favourite teacher! 👑",
  "You didn't just teach — you transformed futures! 🌈",
  "100 hours of passion, patience and purpose! Incredible! 🎯",
  "Behind every successful student is a dedicated teacher like you! ❤️",
];

// Standard icon components for each subject (used instead of emoji in headers/stats)
export const SUBJECT_ICONS = { "Physics": Zap, "Chemistry": FlaskConical, "Biology": Dna, "Mathematics": Calculator, "Multiple Subjects": BookOpen };

// Batch categories — chosen when creating a batch, used to group "Your Batches" on Home
export const BATCH_CATEGORIES = ["Repeaters","Residential","Long Term","Foundation","Tuition","Others"];
export const CATEGORY_ICONS = {
  "Repeaters": Repeat,
  "Residential": Building2,
  "Long Term": Hourglass,
  "Foundation": GraduationCap,
  "Tuition": BookOpen,
  "Others": MoreHorizontal,
};

// Travel Details (for travel allowance records)
export const TRAVEL_PURPOSES = ["Foundation Class","Repeaters","Regular Class","Special Class","Exam Duty","Other"];

// Bump this string whenever a new "What's New" announcement should show again to
// everyone (even people who dismissed a previous one) — it's part of the localStorage key.
export const WHATS_NEW_ID = "travel-details-v1";

export const MASTER = "__MASTER__";
