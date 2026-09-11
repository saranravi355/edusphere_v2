/**
 * The fixed PYP progress-report template: which sections exist and which
 * rating questions belong to each. Modeled on a real sample report card —
 * same set of subjects, strands and criteria — so a teacher filling this in
 * is answering the same questions a paper PYP report asks, just through a
 * form instead of a blank Word table. Content that varies per student
 * (ratings, comments, unit themes, book list) lives in ProgressReport.data;
 * everything here is the shared skeleton.
 */

export const RATING_SCALE = [
  { value: "EX", label: "Excelling", description: "Independently demonstrates advanced understanding and application." },
  { value: "PF", label: "Proficient", description: "Evident and consistently meets expectations." },
  { value: "PG", label: "Progressing", description: "Making steady and positive progress toward mastery." },
  { value: "EM", label: "Emerging", description: "Developing understanding; requires more time and practice." },
  { value: "AB", label: "Absent", description: "Not assessed this term." },
] as const;

export type RatingValue = (typeof RATING_SCALE)[number]["value"];
export const RATING_VALUES = RATING_SCALE.map((r) => r.value) as readonly string[];

export function ratingLabel(value: string): string {
  return RATING_SCALE.find((r) => r.value === value)?.label ?? value;
}

export const LEARNER_PROFILE = [
  { name: "Balanced", description: "We understand the importance of balancing different aspects of our lives—intellectual, physical, and emotional—to achieve well-being for ourselves and others." },
  { name: "Thinkers", description: "We use critical and creative thinking skills to analyse and take responsible action on complex problems." },
  { name: "Inquirers", description: "We nurture our curiosity, developing skills for inquiry and research. We know how to learn independently and with others." },
  { name: "Caring", description: "We show empathy, compassion and respect. We have a commitment to service, and we act to make a positive difference." },
  { name: "Principled", description: "We act with integrity and honesty, with a strong sense of fairness and justice, and with respect for the dignity and rights of people everywhere." },
  { name: "Reflective", description: "We thoughtfully consider the world and our own ideas and experience, working to understand our strengths and weaknesses." },
  { name: "Knowledgeable", description: "We develop and use conceptual understanding, exploring knowledge across a range of disciplines." },
  { name: "Risk-takers", description: "We approach uncertainty with forethought and determination; we work independently and cooperatively to explore new ideas." },
  { name: "Open-minded", description: "We critically appreciate our own cultures and personal histories, as well as the values and traditions of others." },
  { name: "Communicators", description: "We express ourselves confidently and creatively in more than one language and in many ways." },
] as const;

export const UOI_CRITERIA = [
  "Demonstrates understanding of concepts related to the Unit of Inquiry.",
  "Poses thoughtful and relevant questions to deepen understanding.",
  "Effectively gathers and investigates new information.",
  "Utilizes a variety of resources to support learning and inquiry.",
  "Exhibits logical and critical thinking skills.",
  "Applies knowledge effectively in different contexts.",
  "Manages tasks independently and collaborates well in teams.",
] as const;

export const UOI_COUNT = 3;

type Strand = { name: string | null; items: readonly string[] };
type SubjectDef = { key: string; name: string; strands: readonly Strand[] };

const oralVisual: Strand[] = [
  { name: "Oral Language — Listening and Speaking", items: [
    "Pays attention and gives thoughtful responses.",
    "Shares ideas in an organized and clear way.",
    "Takes part in discussions and activities actively.",
  ]},
  { name: "Visual Language — Viewing and Presenting", items: [
    "Develops and shares deeper understanding using visual texts.",
    "Interprets visual texts effectively to support learning.",
    "Responds to and combines information from visual texts.",
    "Enjoys and learns through visual language.",
  ]},
  { name: "Written Language — Reading", items: [
    "Articulates words accurately.",
    "Reads with fluency, appropriate tone, and expression based on the text.",
    "Demonstrates understanding of the material read and offers thoughtful reflections.",
    "Applies new vocabulary learned from reading into their own language.",
    "Reads independently at a level suitable for their development.",
  ]},
  { name: "Written Language — Writing", items: [
    "Writes words and sentences independently with confidence.",
    "Expresses ideas clearly and fluently, maintaining focus throughout.",
    "Structures sentences correctly using appropriate grammar and punctuation.",
    "Uses language creatively and effectively to convey thoughts and ideas.",
    "Spells words correctly, demonstrating attention to detail and accuracy.",
  ]},
];

export const SUBJECTS: readonly SubjectDef[] = [
  { key: "mathematics", name: "Mathematics", strands: [
    { name: "Number & Data Handling", items: [
      "Demonstrates the ability to compare numbers effectively.",
      "Engages in exploration and experimentation with numbers.",
      "Organizes numbers systematically.",
      "Computes and calculates.",
      "Rearranges and sequences numbers logically.",
      "Applies basic number operations confidently.",
      "Establishes connections and relationships in problem-solving contexts.",
      "Conveys understanding by translating concepts into symbols.",
      "Identifies relevant sources of data (e.g., surveys, observations, experiments).",
      "Sorts and analyzes numerical data accurately.",
      "Collects information systematically.",
      "Uses tally marks, charts, or tables to organize raw data.",
      "Represents data using different types of graphs (bar graphs, pictographs, pie charts, line graphs).",
    ]},
  ]},
  { key: "english", name: "English", strands: oralVisual },
  { key: "tamil", name: "Tamil", strands: oralVisual },
  { key: "hindi", name: "Hindi", strands: oralVisual },
  { key: "french", name: "French", strands: oralVisual },
  { key: "dance", name: "Dance", strands: [
    { name: null, items: [
      "Engages with dance through spoken, visual, and kinesthetic responses.",
      "Appreciates dance as a performing art.",
      "Collaborates effectively with the team, coordinating movements seamlessly.",
      "Performs with grace, adaptability, and emotional depth.",
      "Innovates and choreographs unique dance sequences.",
    ]},
  ]},
  { key: "music", name: "Music", strands: [
    { name: null, items: [
      "Demonstrates a deep interest in both live and recorded songs.",
      "Displays a genuine passion for vocal music.",
      "Expresses a strong interest in learning to play musical instruments.",
      "Connects meaningfully with music by understanding lyrics and emotions.",
      "Exhibits creativity and originality in composing and creating music.",
    ]},
  ]},
  { key: "visualArts", name: "Visual Arts", strands: [
    { name: null, items: [
      "Demonstrates a strong passion for visual art.",
      "Effectively expresses ideas and emotions through visual art.",
      "Blends colors and applies brush strokes to create texture, depth and visual interest.",
      "Composes and creates original visual art pieces.",
    ]},
  ]},
  { key: "pspe", name: "PSPE", strands: [
    { name: null, items: [
      "Shows a developing interest in games and sports.",
      "Displays a strong focus on physical fitness and stamina.",
      "Exhibits strong team spirit and emotional and physical balance.",
      "Displays competence in preparing, executing, and critically analyzing tasks.",
    ]},
  ]},
] as const;

export const ATL_GROUPS = [
  { name: "Thinking Skills", items: ["Critical thinking", "Creative thinking", "Information transfer", "Reflection and metacognition"] },
  { name: "Research Skills", items: ["Information literacy", "Media literacy", "Ethical use of media/information"] },
  { name: "Communication Skills", items: ["Exchanging information", "ICT", "Literacy"] },
  { name: "Social Skills", items: ["Interpersonal relationships, social and emotional intelligence"] },
  { name: "Self-management Skills", items: ["Organisation", "States of mind"] },
] as const;

// ---------------------------------------------------------------------------
// The shape of ProgressReport.data
// ---------------------------------------------------------------------------

export type UnitOfInquiryAnswer = {
  theme: string;
  centralIdea: string;
  inquiryPoints: string[]; // free-length list
  ratings: (RatingValue | "")[]; // aligned to UOI_CRITERIA
  comment: string;
};

export type SubjectAnswer = {
  itemRatings: (RatingValue | "")[]; // flattened across all strands, in strand+item order
  overall: RatingValue | "";
  comment: string;
};

export type ProgressReportData = {
  homeroomTeacherName: string;
  introLetter: string;
  unitsOfInquiry: UnitOfInquiryAnswer[];
  subjects: Record<string, SubjectAnswer>;
  atl: Record<string, (RatingValue | "")[]>; // keyed by ATL group name, aligned to that group's items
  learnerProfile: Record<string, RatingValue | "">; // keyed by LEARNER_PROFILE name
  booksRead: string[];
};

export function emptyProgressReportData(): ProgressReportData {
  return {
    homeroomTeacherName: "",
    introLetter:
      "We are pleased to share your child's progress in the IB PYP. This report reflects your child's continuous growth across their learning, highlighting strengths, areas of improvement, and overall engagement in the classroom.",
    unitsOfInquiry: Array.from({ length: UOI_COUNT }, () => ({
      theme: "",
      centralIdea: "",
      inquiryPoints: ["", "", ""],
      ratings: UOI_CRITERIA.map(() => "" as const),
      comment: "",
    })),
    subjects: Object.fromEntries(
      SUBJECTS.map((s) => [
        s.key,
        {
          itemRatings: s.strands.flatMap((st) => st.items).map(() => "" as const),
          overall: "" as const,
          comment: "",
        },
      ])
    ),
    atl: Object.fromEntries(ATL_GROUPS.map((g) => [g.name, g.items.map(() => "" as const)])),
    learnerProfile: Object.fromEntries(LEARNER_PROFILE.map((p) => [p.name, "" as const])),
    booksRead: [],
  };
}
