import Link from "next/link";
import { HeroCard } from '@/components/dashboard/HeroCard';
import { FeatureTile } from '@/components/dashboard/FeatureTile';
import { Button } from "@/components/ui/button";
import { ImageIcon, VideoIcon, AudioWaveform, Bot, Sparkles, MessagesSquare, FileStack, LineChart, Plug } from 'lucide-react';

export default function Page() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-2xl font-semibold text-neutral-900">Deliver the NovaMind story</h1>
            <p className="text-sm text-neutral-600">
              Launch Story Mode to weave image generation, structured outputs, knowledge search, realtime voice, and support chat into a single, cohesive demo narrative.
            </p>
          </div>
          <Button size="lg" asChild>
            <Link href="/demo/story-mode">Start demo</Link>
          </Button>
        </div>
      </section>
      <section className="grid md:grid-cols-3 gap-6">
        <HeroCard title="GPT-5 (Text)" subtitle="Next-generation text intelligence." gradientClass="grad-purple" tryHref="/structured-output" />
        <HeroCard title="Sora (Video)" subtitle="High fidelity video generation." gradientClass="grad-pink" tryHref="/video-gen" />
        <HeroCard title="Realtime (Voice)" subtitle="Low-latency multimodal sessions." gradientClass="grad-blue" tryHref="/realtime" />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Start Demoing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          <FeatureTile href="/image-gen" title="Image Generation" description="Create images from text prompts." icon={<ImageIcon className="h-5 w-5" />} />
          <FeatureTile href="/video-gen" title="Video Generation" description="Generate short videos from prompts." icon={<VideoIcon className="h-5 w-5" />} />
          <FeatureTile href="/realtime" title="Realtime Voice + Multimodal" description="Streaming speech + multimodal IO." icon={<AudioWaveform className="h-5 w-5" />} />
          <FeatureTile href="/knowledge-assistant" title="Knowledge Assistant" description="Ask questions with citations." icon={<Bot className="h-5 w-5" />} />
          <FeatureTile href="/embeddings-search" title="Embeddings Search" description="Semantic search with similarity scores." icon={<FileStack className="h-5 w-5" />} />
          <FeatureTile href="/structured-output" title="Structured Output / Function Calling" description="Constrain outputs with schemas." icon={<Sparkles className="h-5 w-5" />} />
          <FeatureTile href="/support-bot" title="Customer Support Chat" description="Tone presets and escalation toggle." icon={<MessagesSquare className="h-5 w-5" />} />
          <FeatureTile href="/forecasting" title="Sales Forecasting Agent" description="Charts and narratives." icon={<LineChart className="h-5 w-5" />} />
          <FeatureTile href="/connectors" title="Connectors (MCP)" description="Integrate Salesforce and more via MCP." icon={<Plug className="h-5 w-5" />} />
        </div>
      </section>
    </div>
  );
}
