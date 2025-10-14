import { HeroCard } from '@/components/dashboard/HeroCard';
import { FeatureTile } from '@/components/dashboard/FeatureTile';
import { ImageIcon, VideoIcon, AudioWaveform, Bot, Sparkles, MessagesSquare, FileStack, LineChart, Plug } from 'lucide-react';

export default function Page() {
  return (
    <div className="space-y-8">
      <section className="grid md:grid-cols-3 gap-6">
        <HeroCard title="GPT-5 (Text)" subtitle="Next-generation text intelligence." gradientClass="grad-purple" tryHref="/structured-output" />
        <HeroCard title="Sora (Video)" subtitle="High fidelity video generation." gradientClass="grad-pink" tryHref="/video-gen" />
        <HeroCard title="Realtime (Voice)" subtitle="Low-latency multimodal sessions." gradientClass="grad-blue" tryHref="/realtime" />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Start building</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          <FeatureTile href="/image-gen" title="Image Generation" description="Create images from text prompts." icon={<ImageIcon className="h-5 w-5" />} />
          <FeatureTile href="/video-gen" title="Video Generation" description="Generate short videos from prompts." icon={<VideoIcon className="h-5 w-5" />} />
          <FeatureTile href="/realtime" title="Realtime Voice + Multimodal" description="Streaming speech + multimodal IO." icon={<AudioWaveform className="h-5 w-5" />} />
          <FeatureTile href="/knowledge-assistant" title="Knowledge Assistant" description="Ask questions with citations." icon={<Bot className="h-5 w-5" />} />
          <FeatureTile href="/embeddings-search" title="Embeddings Search" description="Semantic search with similarity scores." icon={<FileStack className="h-5 w-5" />} />
          <FeatureTile href="/structured-output" title="Structured Output / Function Calling" description="Constrain outputs with schemas." icon={<Sparkles className="h-5 w-5" />} />
          <FeatureTile href="/support-bot" title="Customer Support Chat" description="Tone presets and escalation toggle." icon={<MessagesSquare className="h-5 w-5" />} />
          <FeatureTile href="/forecasting" title="Sales Forecasting Agent" description="Charts and narratives." icon={<LineChart className="h-5 w-5" />} />
          <FeatureTile title="Connectors (MCP) — Coming soon" description="Coming soon" icon={<Plug className="h-5 w-5" />} disabled tooltip="MCP-based connectors coming soon." />
        </div>
      </section>
    </div>
  );
}


