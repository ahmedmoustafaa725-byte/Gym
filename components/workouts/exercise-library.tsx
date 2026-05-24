"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { exercises as seedExercises } from "@/data/exercises";
import { listExercises } from "@/services/database/repository";
import type { Exercise } from "@/types";
import { includesSearch } from "@/utils/search";

export function ExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>(seedExercises);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("all");
  const [equipment, setEquipment] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  useEffect(() => {
    void listExercises().then((rows) => {
      if (rows.length) setExercises(rows);
    });
  }, []);

  const muscleGroups = useMemo(() => Array.from(new Set(exercises.map((exercise) => exercise.muscleGroup))), [exercises]);
  const equipmentOptions = useMemo(() => Array.from(new Set(exercises.map((exercise) => exercise.equipment))), [exercises]);

  const filtered = useMemo(
    () =>
      exercises.filter((exercise) => {
        const matchesQuery = includesSearch([exercise.name, exercise.arabicName ?? "", exercise.muscleGroup, exercise.equipment], query);
        return (
          matchesQuery &&
          (muscle === "all" || exercise.muscleGroup === muscle) &&
          (equipment === "all" || exercise.equipment === equipment) &&
          (difficulty === "all" || exercise.difficulty === difficulty)
        );
      }),
    [difficulty, equipment, muscle, query]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_180px_180px_180px]">
          <label className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercise, muscle, equipment..." />
          </label>
          <Select value={muscle} onChange={(event) => setMuscle(event.target.value)} aria-label="Filter by muscle">
            <option value="all">All muscles</option>
            {muscleGroups.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select value={equipment} onChange={(event) => setEquipment(event.target.value)} aria-label="Filter by equipment">
            <option value="all">All equipment</option>
            {equipmentOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} aria-label="Filter by difficulty">
            <option value="all">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        {filtered.length} exercises found
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((exercise, index) => (
          <motion.div key={exercise.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
            <Card className="h-full overflow-hidden">
              <div className="aspect-video bg-cover bg-center" style={{ backgroundImage: `url(${exercise.thumbnail})` }} />
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{exercise.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{exercise.arabicName}</p>
                  </div>
                  <Badge>{exercise.difficulty}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{exercise.muscleGroup}</Badge>
                  <Badge className="border-secondary/20 bg-secondary/10 text-secondary">{exercise.equipment}</Badge>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{exercise.instructions[0]}</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/exercise-library/${exercise.id}`}>Open exercise</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
