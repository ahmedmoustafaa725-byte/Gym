"use client";

import { useMemo, useState } from "react";
import { Edit3, Plus, Save, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { includesSearch } from "@/utils/search";

type Row = { id: string };

export function ResourceManager<T extends Row>({
  title,
  description,
  rows,
  setRows,
  columns,
  createItem
}: {
  title: string;
  description: string;
  rows: T[];
  setRows: React.Dispatch<React.SetStateAction<T[]>>;
  columns: { key: keyof T; label: string }[];
  createItem: () => T;
}) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [jsonDraft, setJsonDraft] = useState("");

  const filtered = useMemo(
    () => rows.filter((row) => includesSearch(Object.values(row as Record<string, unknown>).map((value) => JSON.stringify(value)), query)),
    [query, rows]
  );

  function startEdit(row: T) {
    setEditingId(row.id);
    setJsonDraft(JSON.stringify(row, null, 2));
  }

  function saveEdit() {
    if (!editingId) return;
    try {
      const parsed = JSON.parse(jsonDraft) as T;
      setRows((current) => current.map((row) => (row.id === editingId ? parsed : row)));
      setEditingId(null);
      setJsonDraft("");
    } catch {
      alert("Invalid JSON. Please fix the record before saving.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button onClick={() => setRows((current) => [createItem(), ...current])}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="relative block">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${title.toLowerCase()} by name, email, muscle, cuisine, or key`} />
        </label>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                {columns.map((column) => (
                  <th key={String(column.key)} className="px-4 py-3">
                    {column.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t">
                  {columns.map((column) => (
                    <td key={String(column.key)} className="max-w-[260px] truncate px-4 py-3">
                      {String(row[column.key] ?? "")}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" aria-label="Edit" title="Edit" onClick={() => startEdit(row)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Delete"
                        title="Delete"
                        onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingId ? (
          <div className="rounded-lg border bg-background/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-semibold">Edit JSON record</p>
              <Button onClick={saveEdit}>
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
            <Textarea className="min-h-72 font-mono text-xs" value={jsonDraft} onChange={(event) => setJsonDraft(event.target.value)} placeholder="Edit the selected JSON record, then save. Keep required fields like id and name." />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
