"use client";

import { FormEvent, useMemo, useState } from "react";
import { Camera, Dumbbell, Edit3, ImagePlus, Moon, Plus, Save, Scale, Sparkles, Trash2, TrendingUp, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAppState } from "@/lib/app-state";
import { todayISO } from "@/lib/date";
import { generateSmartRecommendations } from "@/services/recommendations/smartAdjustments";
import type { BodyMeasurements, ProgressEntry, WeeklyCheckin } from "@/types";

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function Modal({
  title,
  description,
  children,
  onClose
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <Button size="icon" variant="ghost" aria-label="Close modal" title="Close modal" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ProgressDashboard() {
  const {
    progress,
    setProgress,
    deleteProgressEntry,
    checkins,
    setCheckins,
    sessions,
    foodLogs,
    targets,
    profile,
    uploadProgressPhoto,
    deleteProgressPhoto,
    progressPhotos,
    bodyMeasurements,
    saveBodyMeasurement,
    deleteBodyMeasurement
  } = useAppState();
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [progressPhoto, setProgressPhoto] = useState<File | null>(null);
  const [checkinPhoto, setCheckinPhoto] = useState<File | null>(null);
  const [editingMeasurementId, setEditingMeasurementId] = useState<string | null>(null);
  const [measurementEdit, setMeasurementEdit] = useState({
    waistCm: "",
    hipsCm: "",
    chestCm: "",
    underbustCm: "",
    neckCm: "",
    shouldersCm: "",
    leftArmCm: "",
    rightArmCm: "",
    leftThighCm: "",
    rightThighCm: "",
    glutesCm: "",
    calvesCm: "",
    notes: ""
  });
  const [entry, setEntry] = useState({
    weightKg: "",
    waistCm: "",
    hipsCm: "",
    chestCm: "",
    underbustCm: "",
    neckCm: "",
    shouldersCm: "",
    armCm: "",
    leftArmCm: "",
    rightArmCm: "",
    thighCm: "",
    leftThighCm: "",
    rightThighCm: "",
    glutesCm: "",
    calvesCm: "",
    notes: ""
  });
  const [checkin, setCheckin] = useState({
    currentWeightKg: "",
    energy: "",
    hunger: "",
    sleepQuality: "",
    sleepHours: "",
    trainingConsistency: "",
    dietConsistency: "",
    moodText: "",
    mood: "4",
    trainingDifficulty: "3",
    notes: ""
  });

  const recommendations = generateSmartRecommendations({
    progress,
    foodLogs,
    sessions,
    checkins,
    proteinTarget: targets.protein
  });

  const chartData = progress.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    weight: item.weightKg,
    waist: item.waistCm,
    hips: item.hipsCm,
    chest: item.chestCm,
    calories: item.caloriesAverage,
    protein: item.proteinAverage,
    consistency: item.workoutConsistency
  }));

  const strengthData = useMemo(() => {
    const topSets = new Map<string, number>();
    sessions.forEach((session) => {
      session.sets.forEach((set) => {
        if (!set.weightKg) return;
        topSets.set(set.exerciseId, Math.max(topSets.get(set.exerciseId) ?? 0, set.weightKg));
      });
    });
    return Array.from(topSets.entries()).slice(0, 5);
  }, [sessions]);

  const photos = [
    ...progressPhotos.map((item) => ({
      id: item.id,
      url: item.photoUrl ?? "",
      label: item.label ?? "Progress photo",
      storagePath: item.storagePath,
      progressEntryId: item.progressEntryId,
      weeklyCheckinId: item.weeklyCheckinId
    })),
    ...progress
      .filter((item) => item.photoUrl)
      .map((item) => ({
        id: item.id,
        url: item.photoUrl!,
        label: `Progress ${item.date}`,
        storagePath: item.photoPath,
        progressEntryId: item.id
      })),
    ...checkins
      .filter((item) => item.photoUrl)
      .map((item) => ({
        id: item.id,
        url: item.photoUrl!,
        label: `Check-in ${item.weekStart}`,
        storagePath: item.photoPath,
        weeklyCheckinId: item.id
      }))
  ].filter((photo, index, list) => photo.url && list.findIndex((item) => (item.storagePath || item.url) === (photo.storagePath || photo.url)) === index);

  const summaryCards = [
    { label: "Current weight", value: `${progress.at(-1)?.weightKg ?? profile.weightKg} kg`, icon: Scale, detail: "Latest entry" },
    { label: "Waist", value: `${progress.at(-1)?.waistCm ?? "-"} cm`, icon: TrendingUp, detail: "Optional measurement" },
    { label: "Consistency", value: `${progress.at(-1)?.workoutConsistency ?? 0}%`, icon: Dumbbell, detail: "Workout completion" },
    { label: "Sleep", value: `${checkins.at(-1)?.sleepHours ?? 0} h`, icon: Moon, detail: "Latest check-in" }
  ];

  function measurementFromEntry(nextEntry: ProgressEntry): BodyMeasurements | null {
    const measurement: BodyMeasurements = {
      id: crypto.randomUUID(),
      userId: profile.userId,
      progressEntryId: nextEntry.id,
      measuredAt: nextEntry.date,
      waistCm: nextEntry.waistCm,
      hipsCm: nextEntry.hipsCm,
      chestCm: nextEntry.chestCm,
      underbustCm: nextEntry.underbustCm,
      neckCm: nextEntry.neckCm,
      shouldersCm: nextEntry.shouldersCm,
      leftArmCm: nextEntry.leftArmCm ?? nextEntry.armCm,
      rightArmCm: nextEntry.rightArmCm ?? nextEntry.armCm,
      leftThighCm: nextEntry.leftThighCm ?? nextEntry.thighCm,
      rightThighCm: nextEntry.rightThighCm ?? nextEntry.thighCm,
      glutesCm: nextEntry.glutesCm,
      calvesCm: nextEntry.calvesCm,
      notes: nextEntry.notes
    };
    const hasMeasurement = [
      measurement.waistCm,
      measurement.hipsCm,
      measurement.chestCm,
      measurement.underbustCm,
      measurement.neckCm,
      measurement.shouldersCm,
      measurement.leftArmCm,
      measurement.rightArmCm,
      measurement.leftThighCm,
      measurement.rightThighCm,
      measurement.glutesCm,
      measurement.calvesCm
    ].some((value) => value !== undefined);
    return hasMeasurement ? measurement : null;
  }

  function beginMeasurementEdit(measurement: BodyMeasurements) {
    setEditingMeasurementId(measurement.id);
    setMeasurementEdit({
      waistCm: measurement.waistCm?.toString() ?? "",
      hipsCm: measurement.hipsCm?.toString() ?? "",
      chestCm: measurement.chestCm?.toString() ?? "",
      underbustCm: measurement.underbustCm?.toString() ?? "",
      neckCm: measurement.neckCm?.toString() ?? "",
      shouldersCm: measurement.shouldersCm?.toString() ?? "",
      leftArmCm: measurement.leftArmCm?.toString() ?? "",
      rightArmCm: measurement.rightArmCm?.toString() ?? "",
      leftThighCm: measurement.leftThighCm?.toString() ?? "",
      rightThighCm: measurement.rightThighCm?.toString() ?? "",
      glutesCm: measurement.glutesCm?.toString() ?? "",
      calvesCm: measurement.calvesCm?.toString() ?? "",
      notes: measurement.notes ?? ""
    });
  }

  async function saveMeasurementEdit(measurement: BodyMeasurements) {
    const updated: BodyMeasurements = {
      ...measurement,
      waistCm: optionalNumber(measurementEdit.waistCm),
      hipsCm: optionalNumber(measurementEdit.hipsCm),
      chestCm: optionalNumber(measurementEdit.chestCm),
      underbustCm: optionalNumber(measurementEdit.underbustCm),
      neckCm: optionalNumber(measurementEdit.neckCm),
      shouldersCm: optionalNumber(measurementEdit.shouldersCm),
      leftArmCm: optionalNumber(measurementEdit.leftArmCm),
      rightArmCm: optionalNumber(measurementEdit.rightArmCm),
      leftThighCm: optionalNumber(measurementEdit.leftThighCm),
      rightThighCm: optionalNumber(measurementEdit.rightThighCm),
      glutesCm: optionalNumber(measurementEdit.glutesCm),
      calvesCm: optionalNumber(measurementEdit.calvesCm),
      notes: measurementEdit.notes.trim() || undefined
    };
    await saveBodyMeasurement(updated);
    setEditingMeasurementId(null);
    setNotice("Body measurement updated.");
    window.setTimeout(() => setNotice(""), 2500);
  }

  async function submitProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!entry.weightKg.trim()) return;
    setUploading(true);
    try {
      const uploaded = progressPhoto ? await uploadProgressPhoto(progressPhoto, "progress-entry") : null;
      const nextEntry: ProgressEntry = {
        id: crypto.randomUUID(),
        userId: profile.userId,
        date: todayISO(),
        weightKg: toNumber(entry.weightKg),
        waistCm: optionalNumber(entry.waistCm),
        hipsCm: optionalNumber(entry.hipsCm),
        chestCm: optionalNumber(entry.chestCm),
        underbustCm: optionalNumber(entry.underbustCm),
        neckCm: optionalNumber(entry.neckCm),
        shouldersCm: optionalNumber(entry.shouldersCm),
        armCm: optionalNumber(entry.armCm),
        leftArmCm: optionalNumber(entry.leftArmCm),
        rightArmCm: optionalNumber(entry.rightArmCm),
        thighCm: optionalNumber(entry.thighCm),
        leftThighCm: optionalNumber(entry.leftThighCm),
        rightThighCm: optionalNumber(entry.rightThighCm),
        glutesCm: optionalNumber(entry.glutesCm),
        calvesCm: optionalNumber(entry.calvesCm),
        caloriesAverage: targets.calories,
        proteinAverage: targets.protein,
        workoutConsistency: Math.min(100, Math.round((sessions.length / Math.max(1, profile.daysPerWeek)) * 100)),
        notes: entry.notes.trim() || undefined,
        photoPath: uploaded?.path,
        photoUrl: uploaded?.url
      };
      const nextMeasurement = measurementFromEntry(nextEntry);
      setProgress((current) => [...current, nextEntry]);
      if (nextMeasurement) {
        await saveBodyMeasurement(nextMeasurement);
      }
      setEntry({
        weightKg: "",
        waistCm: "",
        hipsCm: "",
        chestCm: "",
        underbustCm: "",
        neckCm: "",
        shouldersCm: "",
        armCm: "",
        leftArmCm: "",
        rightArmCm: "",
        thighCm: "",
        leftThighCm: "",
        rightThighCm: "",
        glutesCm: "",
        calvesCm: "",
        notes: ""
      });
      setProgressPhoto(null);
      setShowProgressForm(false);
      setNotice("Progress entry saved to Supabase.");
      window.setTimeout(() => setNotice(""), 2500);
    } catch {
      setNotice("Could not save progress. Check the progress-photos bucket and Supabase policies.");
      window.setTimeout(() => setNotice(""), 3500);
    } finally {
      setUploading(false);
    }
  }

  async function submitCheckin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploading(true);
    try {
      const uploaded = checkinPhoto ? await uploadProgressPhoto(checkinPhoto, "weekly-checkin") : null;
      const nextCheckin: WeeklyCheckin = {
        id: crypto.randomUUID(),
        userId: profile.userId,
        weekStart: todayISO(),
        currentWeightKg: optionalNumber(checkin.currentWeightKg),
        mood: Math.max(1, Math.min(5, toNumber(checkin.mood))),
        moodText: checkin.moodText.trim() || undefined,
        energy: Math.max(1, Math.min(10, toNumber(checkin.energy))),
        hunger: Math.max(1, Math.min(10, toNumber(checkin.hunger))),
        sleepHours: optionalNumber(checkin.sleepHours) ?? 0,
        sleepQuality: optionalNumber(checkin.sleepQuality),
        trainingConsistency: optionalNumber(checkin.trainingConsistency),
        dietConsistency: optionalNumber(checkin.dietConsistency),
        trainingDifficulty: Math.max(1, Math.min(5, toNumber(checkin.trainingDifficulty))),
        notes: checkin.notes.trim() || undefined,
        photoPath: uploaded?.path,
        photoUrl: uploaded?.url
      };
      setCheckins((current) => [...current, nextCheckin]);
      setCheckin({
        currentWeightKg: "",
        energy: "",
        hunger: "",
        sleepQuality: "",
        sleepHours: "",
        trainingConsistency: "",
        dietConsistency: "",
        moodText: "",
        mood: "4",
        trainingDifficulty: "3",
        notes: ""
      });
      setCheckinPhoto(null);
      setShowCheckinForm(false);
      setNotice("Weekly check-in saved to Supabase.");
      window.setTimeout(() => setNotice(""), 2500);
    } catch {
      setNotice("Could not save weekly check-in. Check Supabase Storage and RLS policies.");
      window.setTimeout(() => setNotice(""), 3500);
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(photo: { id: string; storagePath?: string; progressEntryId?: string; weeklyCheckinId?: string }) {
    setUploading(true);
    try {
      await deleteProgressPhoto(photo);
      setNotice("Progress photo deleted.");
      window.setTimeout(() => setNotice(""), 2500);
    } catch {
      setNotice("Could not delete photo. Check Supabase Storage delete policy.");
      window.setTimeout(() => setNotice(""), 3500);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
      {notice ? (
        <div className="fixed right-4 top-4 z-50 rounded-lg border border-primary/30 bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-xl">
          {notice}
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {summaryCards.map(({ label, value, icon: Icon, detail }) => (
            <Card key={label}>
              <CardContent className="p-5">
                <Icon className="mb-4 h-6 w-6 text-primary" />
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value}</p>
                <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Body trend</CardTitle>
            <CardDescription>Weight and measurements over time</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="waist" stroke="hsl(var(--accent))" strokeWidth={2} />
                <Line type="monotone" dataKey="hips" stroke="hsl(var(--secondary))" strokeWidth={2} />
                <Line type="monotone" dataKey="chest" stroke="#38bdf8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Calories and protein</CardTitle>
              <CardDescription>Saved averages from progress entries</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="calories" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary) / 0.18)" />
                  <Area type="monotone" dataKey="protein" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.18)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Strength progress</CardTitle>
              <CardDescription>Best saved weights from workout sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {strengthData.length ? (
                strengthData.map(([exerciseId, weight]) => (
                  <div key={exerciseId}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>{exerciseId.replaceAll("-", " ")}</span>
                      <span className="text-muted-foreground">{weight} kg</span>
                    </div>
                    <Progress value={Math.min(100, weight)} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Save a workout with weights to see strength trends.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Camera className="mb-3 h-7 w-7 text-secondary" />
            <CardTitle>Progress photos</CardTitle>
            <CardDescription>Uploaded photos are stored in the protected Supabase Storage bucket.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {photos.length ? (
              photos.map((photo) => (
                <div key={`${photo.id}-${photo.url}`} className="overflow-hidden rounded-lg border bg-background/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.label} className="aspect-[4/5] w-full object-cover" />
                  <div className="flex items-center justify-between gap-2 p-2">
                    <p className="truncate text-xs text-muted-foreground">{photo.label}</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete progress photo"
                      title="Delete progress photo"
                      disabled={uploading}
                      onClick={() => removePhoto(photo)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              ["Front", "Side", "Back"].map((label) => (
                <div key={label} className="grid aspect-[4/5] place-items-center rounded-lg border border-dashed bg-background/50 text-sm text-muted-foreground">
                  {label} photo
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Measurement history</CardTitle>
            <CardDescription>Optional centimeter measurements saved separately from weight entries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bodyMeasurements.length ? (
              bodyMeasurements
                .slice()
                .reverse()
                .map((measurement) => (
                  <div key={measurement.id} className="rounded-lg border bg-background/60 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{measurement.measuredAt}</p>
                        {editingMeasurementId === measurement.id ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <Input value={measurementEdit.waistCm} onChange={(event) => setMeasurementEdit((current) => ({ ...current, waistCm: event.target.value }))} placeholder="Waist in cm, e.g. 78" />
                            <Input value={measurementEdit.hipsCm} onChange={(event) => setMeasurementEdit((current) => ({ ...current, hipsCm: event.target.value }))} placeholder="Hips in cm, e.g. 96" />
                            <Input value={measurementEdit.chestCm} onChange={(event) => setMeasurementEdit((current) => ({ ...current, chestCm: event.target.value }))} placeholder="Chest in cm, e.g. 92" />
                            <Input value={measurementEdit.underbustCm} onChange={(event) => setMeasurementEdit((current) => ({ ...current, underbustCm: event.target.value }))} placeholder="Underbust in cm, e.g. 82" />
                            <Input value={measurementEdit.neckCm} onChange={(event) => setMeasurementEdit((current) => ({ ...current, neckCm: event.target.value }))} placeholder="Neck in cm, e.g. 36" />
                            <Input value={measurementEdit.shouldersCm} onChange={(event) => setMeasurementEdit((current) => ({ ...current, shouldersCm: event.target.value }))} placeholder="Shoulders in cm, e.g. 108" />
                            <Input value={measurementEdit.leftArmCm} onChange={(event) => setMeasurementEdit((current) => ({ ...current, leftArmCm: event.target.value }))} placeholder="Left arm in cm, e.g. 31" />
                            <Input value={measurementEdit.rightArmCm} onChange={(event) => setMeasurementEdit((current) => ({ ...current, rightArmCm: event.target.value }))} placeholder="Right arm in cm, e.g. 31" />
                            <Input value={measurementEdit.leftThighCm} onChange={(event) => setMeasurementEdit((current) => ({ ...current, leftThighCm: event.target.value }))} placeholder="Left thigh in cm, e.g. 56" />
                            <Input value={measurementEdit.rightThighCm} onChange={(event) => setMeasurementEdit((current) => ({ ...current, rightThighCm: event.target.value }))} placeholder="Right thigh in cm, e.g. 56" />
                            <Input value={measurementEdit.glutesCm} onChange={(event) => setMeasurementEdit((current) => ({ ...current, glutesCm: event.target.value }))} placeholder="Glutes in cm, e.g. 101" />
                            <Input value={measurementEdit.calvesCm} onChange={(event) => setMeasurementEdit((current) => ({ ...current, calvesCm: event.target.value }))} placeholder="Calves in cm, e.g. 38" />
                            <Input className="sm:col-span-3" value={measurementEdit.notes} onChange={(event) => setMeasurementEdit((current) => ({ ...current, notes: event.target.value }))} placeholder="Measurement notes, e.g. measured relaxed in the morning" />
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Waist {measurement.waistCm ?? "-"} cm - Hips {measurement.hipsCm ?? "-"} cm - Chest {measurement.chestCm ?? "-"} cm - Arms{" "}
                            {measurement.leftArmCm ?? measurement.rightArmCm ?? "-"} cm - Thighs {measurement.leftThighCm ?? measurement.rightThighCm ?? "-"} cm
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {editingMeasurementId === measurement.id ? (
                          <Button size="icon" aria-label="Save measurement" title="Save measurement" onClick={() => saveMeasurementEdit(measurement)}>
                            <Save className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button size="icon" variant="ghost" aria-label="Edit measurement" title="Edit measurement" onClick={() => beginMeasurementEdit(measurement)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Delete measurement"
                          title="Delete measurement"
                          onClick={() => {
                            void deleteBodyMeasurement(measurement.id);
                            setNotice("Body measurement deleted.");
                            window.setTimeout(() => setNotice(""), 2500);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">Add measurements with a progress entry to see history here.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-primary/20">
          <CardHeader>
            <Sparkles className="mb-3 h-7 w-7 text-primary" />
            <CardTitle>Smart recommendations</CardTitle>
            <CardDescription>Rule-based now, AI-upgradable later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((recommendation) => (
              <div key={recommendation.id} className="rounded-md border bg-background/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{recommendation.title}</p>
                  <Badge className={recommendation.priority === "high" ? "border-accent/20 bg-accent/10 text-accent" : undefined}>
                    {recommendation.priority}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{recommendation.reason}</p>
                <p className="mt-2 text-sm">{recommendation.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Plus className="mb-3 h-7 w-7 text-primary" />
            <CardTitle>Add progress entry</CardTitle>
            <CardDescription>Weight, measurements, notes, and optional photo upload.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setShowProgressForm(true)}>
              <Plus className="h-4 w-4" />
              Add progress entry
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly check-in</CardTitle>
            <CardDescription>Energy, hunger, sleep, consistency, mood, and notes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="secondary" onClick={() => setShowCheckinForm(true)}>
              <Sparkles className="h-4 w-4" />
              Weekly check-in
            </Button>
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle>Check-in history</CardTitle>
            <CardDescription>Latest weekly check-ins saved to Supabase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {checkins.slice().reverse().slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-md border bg-background/60 p-3 text-sm">
                <p className="font-semibold">Week of {item.weekStart}</p>
                <p className="mt-1 text-muted-foreground">
                  Weight {item.currentWeightKg ?? "-"} kg - Energy {item.energy}/10 - Hunger {item.hunger}/10 - Sleep {item.sleepQuality ?? "-"}/10
                </p>
                {item.notes ? <p className="mt-1 text-muted-foreground">{item.notes}</p> : null}
              </div>
            ))}
            {!checkins.length ? <p className="text-sm text-muted-foreground">No weekly check-ins yet.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent entries</CardTitle>
            <CardDescription>Remove a mistaken entry without touching photos or meals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {progress.slice(-4).reverse().map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border bg-background/60 p-3 text-sm">
                <div>
                  <p className="font-semibold">{item.weightKg} kg</p>
                  <p className="text-muted-foreground">{item.date}</p>
                </div>
                <Button size="icon" variant="ghost" aria-label="Delete progress entry" title="Delete progress entry" onClick={() => deleteProgressEntry(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {!progress.length ? <p className="text-sm text-muted-foreground">No progress entries yet.</p> : null}
          </CardContent>
        </Card>
      </div>

      {showProgressForm ? (
        <Modal title="Add progress entry" description="Save body weight, optional measurements, notes, and a photo." onClose={() => setShowProgressForm(false)}>
          <form className="space-y-4" onSubmit={submitProgress}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Body weight
                <Input type="number" min="25" step="0.1" value={entry.weightKg} onChange={(event) => setEntry((current) => ({ ...current, weightKg: event.target.value }))} placeholder="Weight in kg, e.g. 72.5" required />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Waist
                <Input type="number" min="0" step="0.1" value={entry.waistCm} onChange={(event) => setEntry((current) => ({ ...current, waistCm: event.target.value }))} placeholder="Waist in cm, e.g. 78" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Hips
                <Input type="number" min="0" step="0.1" value={entry.hipsCm} onChange={(event) => setEntry((current) => ({ ...current, hipsCm: event.target.value }))} placeholder="Hips in cm, e.g. 96" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Chest / bust
                <Input type="number" min="0" step="0.1" value={entry.chestCm} onChange={(event) => setEntry((current) => ({ ...current, chestCm: event.target.value }))} placeholder="Chest in cm, e.g. 92" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Underbust
                <Input type="number" min="0" step="0.1" value={entry.underbustCm} onChange={(event) => setEntry((current) => ({ ...current, underbustCm: event.target.value }))} placeholder="Underbust in cm, e.g. 82" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Neck
                <Input type="number" min="0" step="0.1" value={entry.neckCm} onChange={(event) => setEntry((current) => ({ ...current, neckCm: event.target.value }))} placeholder="Neck in cm, e.g. 36" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Shoulders
                <Input type="number" min="0" step="0.1" value={entry.shouldersCm} onChange={(event) => setEntry((current) => ({ ...current, shouldersCm: event.target.value }))} placeholder="Shoulders in cm, e.g. 108" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Arms
                <Input type="number" min="0" step="0.1" value={entry.armCm} onChange={(event) => setEntry((current) => ({ ...current, armCm: event.target.value }))} placeholder="Arm circumference in cm, e.g. 31" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Left arm
                <Input type="number" min="0" step="0.1" value={entry.leftArmCm} onChange={(event) => setEntry((current) => ({ ...current, leftArmCm: event.target.value }))} placeholder="Left arm in cm, e.g. 31" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Right arm
                <Input type="number" min="0" step="0.1" value={entry.rightArmCm} onChange={(event) => setEntry((current) => ({ ...current, rightArmCm: event.target.value }))} placeholder="Right arm in cm, e.g. 31" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Thighs
                <Input type="number" min="0" step="0.1" value={entry.thighCm} onChange={(event) => setEntry((current) => ({ ...current, thighCm: event.target.value }))} placeholder="Thigh circumference in cm, e.g. 56" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Left thigh
                <Input type="number" min="0" step="0.1" value={entry.leftThighCm} onChange={(event) => setEntry((current) => ({ ...current, leftThighCm: event.target.value }))} placeholder="Left thigh in cm, e.g. 56" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Right thigh
                <Input type="number" min="0" step="0.1" value={entry.rightThighCm} onChange={(event) => setEntry((current) => ({ ...current, rightThighCm: event.target.value }))} placeholder="Right thigh in cm, e.g. 56" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Glutes
                <Input type="number" min="0" step="0.1" value={entry.glutesCm} onChange={(event) => setEntry((current) => ({ ...current, glutesCm: event.target.value }))} placeholder="Glutes in cm, e.g. 101" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Calves
                <Input type="number" min="0" step="0.1" value={entry.calvesCm} onChange={(event) => setEntry((current) => ({ ...current, calvesCm: event.target.value }))} placeholder="Calves in cm, e.g. 38" />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium">
              Notes
              <Textarea value={entry.notes} onChange={(event) => setEntry((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional notes, e.g. felt stronger this week" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Progress photo
              <Input type="file" accept="image/*" onChange={(event) => setProgressPhoto(event.target.files?.[0] ?? null)} />
            </label>
            <Button className="w-full" type="submit" disabled={uploading}>
              <ImagePlus className="h-4 w-4" />
              {uploading ? "Saving progress..." : "Save progress entry"}
            </Button>
          </form>
        </Modal>
      ) : null}

      {showCheckinForm ? (
        <Modal title="Weekly check-in" description="Save your weekly progress signals and optional photo." onClose={() => setShowCheckinForm(false)}>
          <form className="space-y-4" onSubmit={submitCheckin}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Current weight
                <Input type="number" min="25" step="0.1" value={checkin.currentWeightKg} onChange={(event) => setCheckin((current) => ({ ...current, currentWeightKg: event.target.value }))} placeholder="Current weight in kg, e.g. 72.5" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Energy level
                <Input type="number" min="1" max="10" value={checkin.energy} onChange={(event) => setCheckin((current) => ({ ...current, energy: event.target.value }))} placeholder="Energy level from 1 to 10" required />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Hunger level
                <Input type="number" min="1" max="10" value={checkin.hunger} onChange={(event) => setCheckin((current) => ({ ...current, hunger: event.target.value }))} placeholder="Hunger level from 1 to 10" required />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Sleep quality
                <Input type="number" min="1" max="10" value={checkin.sleepQuality} onChange={(event) => setCheckin((current) => ({ ...current, sleepQuality: event.target.value }))} placeholder="Sleep quality from 1 to 10" required />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Sleep hours
                <Input type="number" min="0" max="14" step="0.5" value={checkin.sleepHours} onChange={(event) => setCheckin((current) => ({ ...current, sleepHours: event.target.value }))} placeholder="Sleep hours, e.g. 7.5" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Training consistency
                <Input type="number" min="0" max="14" value={checkin.trainingConsistency} onChange={(event) => setCheckin((current) => ({ ...current, trainingConsistency: event.target.value }))} placeholder="How many workouts did you complete this week?" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Diet consistency
                <Input type="number" min="1" max="10" value={checkin.dietConsistency} onChange={(event) => setCheckin((current) => ({ ...current, dietConsistency: event.target.value }))} placeholder="Diet consistency from 1 to 10" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Training difficulty
                <Input type="number" min="1" max="5" value={checkin.trainingDifficulty} onChange={(event) => setCheckin((current) => ({ ...current, trainingDifficulty: event.target.value }))} placeholder="Training difficulty from 1 to 5" />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium">
              Mood
              <Input value={checkin.moodText} onChange={(event) => setCheckin((current) => ({ ...current, moodText: event.target.value }))} placeholder="Mood this week, e.g. good, tired, stressed" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Weekly notes
              <Textarea value={checkin.notes} onChange={(event) => setCheckin((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional notes about your week" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Optional progress photo
              <Input type="file" accept="image/*" onChange={(event) => setCheckinPhoto(event.target.files?.[0] ?? null)} />
            </label>
            <Button className="w-full" type="submit" disabled={uploading}>
              <Sparkles className="h-4 w-4" />
              {uploading ? "Saving check-in..." : "Save weekly check-in"}
            </Button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
