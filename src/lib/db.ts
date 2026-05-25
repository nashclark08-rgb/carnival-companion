"use client";

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { getDb } from "./firebase";
import {
  Announcement,
  AnnouncementTarget,
  Carnival,
  CarnivalEvent,
  House,
  Severity,
} from "./types";

function carnivalRef(carnivalId: string) {
  return doc(getDb(), "carnivals", carnivalId);
}

function eventsRef(carnivalId: string) {
  return collection(getDb(), "carnivals", carnivalId, "events");
}

function announcementsRef(carnivalId: string) {
  return collection(getDb(), "carnivals", carnivalId, "announcements");
}

export function useCarnival(carnivalId: string) {
  const [carnival, setCarnival] = useState<Carnival | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(carnivalRef(carnivalId), (snap) => {
      if (snap.exists()) {
        setCarnival({ id: snap.id, ...(snap.data() as Omit<Carnival, "id">) });
      } else {
        setCarnival(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [carnivalId]);

  return { carnival, loading };
}

export function useEvents(carnivalId: string) {
  const [events, setEvents] = useState<CarnivalEvent[]>([]);

  useEffect(() => {
    const q = query(eventsRef(carnivalId), orderBy("scheduledTime", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setEvents(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CarnivalEvent, "id">),
        })),
      );
    });
    return unsub;
  }, [carnivalId]);

  return events;
}

export function useAnnouncements(carnivalId: string) {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    const q = query(
      announcementsRef(carnivalId),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Announcement, "id">),
        })),
      );
    });
    return unsub;
  }, [carnivalId]);

  return items;
}

export async function saveCarnival(carnival: Carnival) {
  const { id, ...rest } = carnival;
  await setDoc(carnivalRef(id), rest, { merge: true });
}

export async function updateHousePoints(
  carnivalId: string,
  houses: House[],
) {
  await updateDoc(carnivalRef(carnivalId), {
    houses,
    pointsUpdatedAt: Date.now(),
  });
}

export async function upsertEvent(
  carnivalId: string,
  event: CarnivalEvent,
) {
  const { id, ...rest } = event;
  await setDoc(doc(eventsRef(carnivalId), id), rest);
}

export async function deleteEvent(carnivalId: string, eventId: string) {
  await deleteDoc(doc(eventsRef(carnivalId), eventId));
}

export async function sendAnnouncement(
  carnivalId: string,
  severity: Severity,
  message: string,
  target: AnnouncementTarget = { kind: "all" },
  expiresAt?: number,
) {
  await addDoc(announcementsRef(carnivalId), {
    severity,
    message,
    target,
    createdAt: Date.now(),
    expiresAt,
    createdAtServer: serverTimestamp(),
  });
}

export async function deleteAnnouncement(
  carnivalId: string,
  announcementId: string,
) {
  await deleteDoc(doc(announcementsRef(carnivalId), announcementId));
}

export async function clearExpiredAnnouncements(
  carnivalId: string,
  beforeMs: number = Date.now(),
) {
  const { getDocs } = await import("firebase/firestore");
  const snap = await getDocs(announcementsRef(carnivalId));
  const stale = snap.docs.filter((d) => {
    const data = d.data() as Announcement;
    return data.expiresAt !== undefined && data.expiresAt < beforeMs;
  });
  await Promise.all(stale.map((d) => deleteDoc(d.ref)));
  return stale.length;
}
