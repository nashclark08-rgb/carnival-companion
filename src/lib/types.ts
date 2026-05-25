export type Role = "student" | "parent";

export type House = {
  id: string;
  name: string;
  color: string;
  points: number;
};

export type AgeGroup = {
  id: string;
  label: string;
};

export type Category = {
  id: string;
  label: string;
};

export type Session = {
  id: string;
  name: string;
  order: number;
};

export type Branding = {
  logoDataUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

export type Carnival = {
  id: string;
  name: string;
  date: string;
  venue: string;
  schoolName: string;
  status: "draft" | "active" | "finished";
  houses: House[];
  ageGroups: AgeGroup[];
  categories: Category[];
  sessions: Session[];
  branding?: Branding;
};

export type EventType = "track" | "field";

export type CarnivalEvent = {
  id: string;
  name: string;
  type: EventType;
  ageGroupId: string;
  categoryId: string;
  sessionId: string;
  scheduledTime: number;
  location: string;
};

export type Severity = "notice" | "reminder" | "urgent";

export type AnnouncementTarget =
  | { kind: "all" }
  | { kind: "house"; houseId: string }
  | { kind: "ageGroup"; ageGroupId: string };

export type Announcement = {
  id: string;
  severity: Severity;
  message: string;
  createdAt: number;
  target?: AnnouncementTarget;
};

export type ChildProfile = {
  houseId: string;
  ageGroupId: string;
  categoryId: string;
  name?: string;
};

export type StudentProfile = {
  role: "student";
  carnivalId: string;
  houseId: string;
  ageGroupId: string;
  categoryId: string;
  name?: string;
};

export type ParentProfile = {
  role: "parent";
  carnivalId: string;
  children: ChildProfile[];
};

export type AttendeeProfile = StudentProfile | ParentProfile;
