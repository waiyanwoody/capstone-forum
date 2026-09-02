export const ALLOWED_TAGS = [
  "Study",
  "Programming",
  "Technology",
  "University",
  "Career",
  "Projects",
  "Events",
  "Resources",
  "Community",
];

export const MAX_TAGS = 5;

export const POST_TYPES = ["Discussion", "Question", "Sharing", "Announcement"] as const;

export type PostType = (typeof POST_TYPES)[number];

export const SOLVABLE_POST_TYPES: PostType[] = ["Discussion", "Question"];

export const isSolvableType = (type?: string | null): boolean =>
  !!type && (SOLVABLE_POST_TYPES as string[]).includes(type);

// Backend stores/expects UPPERCASE enum names (QUESTION, SHARING, ...).
// These helpers convert between the display labels and API values.
export const typeToApi = (type: PostType | string): string => type.toUpperCase();

export const postTypeLabel = (type?: string | null): string => {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

export const postIsSolvable = (type?: string | null): boolean =>
  !!type &&
  ["DISCUSSION", "QUESTION"].includes(postTypeLabel(type).toUpperCase());
