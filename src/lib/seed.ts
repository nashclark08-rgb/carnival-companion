"use client";

import { writeBatch, doc, collection, getDocs } from "firebase/firestore";
import { getDb, DEFAULT_CARNIVAL_ID } from "./firebase";
import { Carnival, CarnivalEvent } from "./types";

function uid(prefix: string, n: number) {
  return `${prefix}-${n.toString().padStart(2, "0")}`;
}

function todayAt(hour: number, minute: number): number {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

export async function seedDemoCarnival() {
  const db = getDb();

  const houses = [
    { id: "house-green", name: "Green", color: "#16a34a", points: 320 },
    { id: "house-blue", name: "Blue", color: "#2563eb", points: 410 },
    { id: "house-red", name: "Red", color: "#dc2626", points: 295 },
    { id: "house-gold", name: "Gold", color: "#eab308", points: 380 },
  ];

  const ageGroups = [
    { id: "u12", label: "Under 12" },
    { id: "u13", label: "Under 13" },
    { id: "u14", label: "Under 14" },
    { id: "u15", label: "Under 15" },
    { id: "u16", label: "Under 16" },
    { id: "open", label: "Open" },
  ];

  const categories = [
    { id: "boys", label: "Boys" },
    { id: "girls", label: "Girls" },
    { id: "open", label: "Open" },
    { id: "all-abilities", label: "All-abilities" },
  ];

  const sessions = [
    { id: "s1", name: "Session 1 (morning)", order: 1 },
    { id: "s2", name: "Session 2 (midday)", order: 2 },
    { id: "s3", name: "Session 3 (afternoon)", order: 3 },
  ];

  const carnival: Omit<Carnival, "id"> = {
    name: "Demo Athletics Carnival 2026",
    date: new Date().toISOString().slice(0, 10),
    venue: "Main Oval",
    schoolName: "Demo School",
    status: "active",
    houses,
    ageGroups,
    categories,
    sessions,
  };

  const eventDefs: Array<Omit<CarnivalEvent, "id" | "scheduledTime"> & { hour: number; minute: number }> = [
    { name: "100m sprint", type: "track", ageGroupId: "u13", categoryId: "boys", sessionId: "s1", location: "Track lane 1-6", hour: 9, minute: 0 },
    { name: "100m sprint", type: "track", ageGroupId: "u13", categoryId: "girls", sessionId: "s1", location: "Track lane 1-6", hour: 9, minute: 15 },
    { name: "100m sprint", type: "track", ageGroupId: "u14", categoryId: "boys", sessionId: "s1", location: "Track lane 1-6", hour: 9, minute: 30 },
    { name: "100m sprint", type: "track", ageGroupId: "u14", categoryId: "girls", sessionId: "s1", location: "Track lane 1-6", hour: 9, minute: 45 },
    { name: "Long jump", type: "field", ageGroupId: "u13", categoryId: "boys", sessionId: "s1", location: "Long jump pit A", hour: 9, minute: 30 },
    { name: "Long jump", type: "field", ageGroupId: "u13", categoryId: "girls", sessionId: "s1", location: "Long jump pit B", hour: 9, minute: 30 },
    { name: "Shot put", type: "field", ageGroupId: "u14", categoryId: "boys", sessionId: "s1", location: "Shot put circle", hour: 10, minute: 0 },
    { name: "Shot put", type: "field", ageGroupId: "u14", categoryId: "girls", sessionId: "s1", location: "Shot put circle", hour: 10, minute: 0 },
    { name: "200m", type: "track", ageGroupId: "u15", categoryId: "boys", sessionId: "s2", location: "Track lane 1-6", hour: 11, minute: 0 },
    { name: "200m", type: "track", ageGroupId: "u15", categoryId: "girls", sessionId: "s2", location: "Track lane 1-6", hour: 11, minute: 15 },
    { name: "High jump", type: "field", ageGroupId: "u15", categoryId: "boys", sessionId: "s2", location: "High jump mat", hour: 11, minute: 30 },
    { name: "High jump", type: "field", ageGroupId: "u15", categoryId: "girls", sessionId: "s2", location: "High jump mat", hour: 11, minute: 30 },
    { name: "800m", type: "track", ageGroupId: "u16", categoryId: "boys", sessionId: "s2", location: "Track", hour: 12, minute: 0 },
    { name: "800m", type: "track", ageGroupId: "u16", categoryId: "girls", sessionId: "s2", location: "Track", hour: 12, minute: 15 },
    { name: "Discus", type: "field", ageGroupId: "open", categoryId: "all-abilities", sessionId: "s2", location: "Discus cage", hour: 12, minute: 30 },
    { name: "1500m", type: "track", ageGroupId: "open", categoryId: "open", sessionId: "s3", location: "Track", hour: 14, minute: 0 },
    { name: "Cross country", type: "track", ageGroupId: "u14", categoryId: "boys", sessionId: "s3", location: "Cross-country course", hour: 14, minute: 30 },
    { name: "Cross country", type: "track", ageGroupId: "u14", categoryId: "girls", sessionId: "s3", location: "Cross-country course", hour: 14, minute: 30 },
    { name: "House relay", type: "track", ageGroupId: "open", categoryId: "open", sessionId: "s3", location: "Track", hour: 15, minute: 30 },
  ];

  const events: CarnivalEvent[] = eventDefs.map((e, i) => {
    const { hour, minute, ...rest } = e;
    return {
      ...rest,
      id: uid("evt", i + 1),
      scheduledTime: todayAt(hour, minute),
    };
  });

  const carnivalRef = doc(db, "carnivals", DEFAULT_CARNIVAL_ID);
  const eventsCol = collection(db, "carnivals", DEFAULT_CARNIVAL_ID, "events");
  const announcementsCol = collection(
    db,
    "carnivals",
    DEFAULT_CARNIVAL_ID,
    "announcements",
  );

  const existingEvents = await getDocs(eventsCol);
  const existingAnnouncements = await getDocs(announcementsCol);

  const batch = writeBatch(db);
  batch.set(carnivalRef, carnival);
  existingEvents.forEach((d) => batch.delete(d.ref));
  existingAnnouncements.forEach((d) => batch.delete(d.ref));
  events.forEach((e) => {
    const { id, ...rest } = e;
    batch.set(doc(eventsCol, id), rest);
  });
  batch.set(doc(announcementsCol, "demo-welcome"), {
    severity: "notice",
    message:
      "Welcome to the demo carnival. This is what a real announcement looks like at the top of every attendee's screen.",
    createdAt: Date.now(),
  });

  await batch.commit();
}
