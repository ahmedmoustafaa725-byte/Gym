import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, Dumbbell, ExternalLink } from "lucide-react";
import { exercises } from "@/data/exercises";
import { exerciseVideoProviders } from "@/services/database/exerciseVideoSource";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";

function isYoutubeEmbed(url: string) {
  return url.includes("youtube.com/embed/");
}

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exercise = exercises.find((item) => item.id === id);
  if (!exercise) notFound();

  return (
    <PageShell
      title={exercise.name}
      description={`${exercise.muscleGroup} - ${exercise.equipment} - ${exercise.difficulty}`}
      action={
        <Button asChild variant="outline">
          <Link href="/exercise-library">
            <ArrowLeft className="h-4 w-4" />
            Library
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="overflow-hidden">
          <div className="aspect-video bg-black">
            {isYoutubeEmbed(exercise.videoUrl) ? (
              <iframe
                className="h-full w-full"
                src={exercise.videoUrl}
                title={`${exercise.name} video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video className="h-full w-full" controls poster={exercise.thumbnail} src={exercise.videoUrl} />
            )}
          </div>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge>{exercise.muscleGroup}</Badge>
              <Badge className="border-secondary/20 bg-secondary/10 text-secondary">{exercise.equipment}</Badge>
              <Badge className="border-accent/20 bg-accent/10 text-accent">{exercise.videoSource}</Badge>
            </div>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3">
              {exercise.instructions.map((instruction) => (
                <div key={instruction} className="flex gap-3 rounded-md border bg-background/60 p-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{instruction}</span>
                </div>
              ))}
            </div>
            <div>
              <h3 className="font-semibold">Common mistakes</h3>
              <div className="mt-3 grid gap-2">
                {exercise.commonMistakes.map((mistake) => (
                  <div key={mistake} className="flex gap-3 rounded-md border bg-background/60 p-3 text-sm text-muted-foreground">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-accent" />
                    <span>{mistake}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Dumbbell className="mb-3 h-7 w-7 text-primary" />
              <CardTitle>Alternatives</CardTitle>
              <CardDescription>Use these if equipment, pain, or setup blocks the main movement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {exercise.alternatives.map((item) => (
                <div key={item} className="rounded-md border bg-background/60 p-3 text-sm">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Video source</CardTitle>
              <CardDescription>{exercise.licenseNote}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full">
                <a href={exercise.videoUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open primary video
                </a>
              </Button>
              {exercise.videoLinks?.length ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">More training videos</p>
                  {exercise.videoLinks.map((link) => (
                    <Button key={`${link.source}-${link.url}`} asChild variant="outline" className="w-full justify-start">
                      <a href={link.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        {link.title}
                      </a>
                    </Button>
                  ))}
                </div>
              ) : null}
              <div className="space-y-2">
                {exerciseVideoProviders.map((provider) => (
                  <div key={provider.name} className="rounded-md border bg-background/60 p-3 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">{provider.name}</p>
                    <p className="mt-1">{provider.licenseGuidance}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
