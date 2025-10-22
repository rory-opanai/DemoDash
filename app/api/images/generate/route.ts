"use server";
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { byokGuard, okJson } from '@/lib/api';

const DEFAULT_SIZE = '1024x1024';
const DEFAULT_QUALITY = 'auto';
const MAX_REFERENCE_IMAGES = 3;

type GenerateBody = {
  prompt: string;
  size?: string;
  versions?: number | string;
  model?: string;
  quality?: string;
  background?: string;
  outputFormat?: string;
};

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return undefined;
  return trimmed;
}

function buildReferencePrompt(prompt: string, files: File[]): string {
  const summary = files.map((file, index) => {
    const role = index === 0 ? 'Model photo' : `Garment reference ${index}`;
    const name = file.name || 'unnamed file';
    const type = file.type || 'unknown/unknown';
    return `- ${role}: ${name} (${type})`;
  });
  return `${prompt}\n\nREFERENCE MATERIAL (internal):\n${summary.join('\n')}\nRespect the subject's facial identity, pose, and proportions while faithfully applying garment textures, colors, and materials from the references. Do not mention this section in your response.`;
}

export async function POST(req: NextRequest) {
  const guard = byokGuard(req);
  if (guard) return guard;
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'missing_api_key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const contentType = req.headers.get('content-type') || '';
  let promptValue: string | undefined;
  let size = DEFAULT_SIZE;
  let versions: number | string | undefined = 1;
  let quality = DEFAULT_QUALITY;
  let background: string | undefined;
  let outputFormat: string | undefined;
  let referenceFiles: File[] = [];

  if (contentType.includes('application/json')) {
    let body: GenerateBody;
    try {
      body = await req.json();
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'invalid_json', message: 'Request body must be valid JSON.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    promptValue = typeof body?.prompt === 'string' ? body.prompt : undefined;
    const sizeValue = normalizeString(body?.size);
    if (sizeValue) size = sizeValue;
    if (typeof body?.versions === 'number' || typeof body?.versions === 'string') {
      versions = body.versions;
    }
    const qualityValue = normalizeString(body?.quality);
    if (qualityValue) quality = qualityValue;
    background = normalizeString(body?.background);
    outputFormat = normalizeString(body?.outputFormat);
  } else {
    let form: FormData;
    try {
      form = await req.formData();
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'invalid_form_data', message: 'Request body must be sent as multipart/form-data.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const promptEntry = form.get('prompt');
    promptValue = typeof promptEntry === 'string' ? promptEntry : undefined;
    const sizeEntry = normalizeString(form.get('size'));
    if (sizeEntry) size = sizeEntry;
    const versionsEntry = normalizeString(form.get('versions'));
    if (versionsEntry) versions = versionsEntry;
    const qualityEntry = normalizeString(form.get('quality'));
    if (qualityEntry) quality = qualityEntry;
    background = normalizeString(form.get('background'));
    outputFormat = normalizeString(form.get('outputFormat'));
    referenceFiles = form
      .getAll('references')
      .filter((item): item is File => item instanceof File && item.size > 0)
      .slice(0, MAX_REFERENCE_IMAGES);
  }

  if (!promptValue || typeof promptValue !== 'string' || !promptValue.trim()) {
    return new Response(
      JSON.stringify({ error: 'invalid_prompt', message: 'Provide a non-empty prompt string.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const prompt = promptValue.trim();
  const n = Math.min(Math.max(Number(versions) || 1, 1), 4);
  const model = 'gpt-image-1';
  const client = new OpenAI({ apiKey });

  const hasReferences = referenceFiles.length > 0;
  const finalPrompt = hasReferences ? buildReferencePrompt(prompt, referenceFiles) : prompt;

  try {
    const now = new Date().toISOString();
    if (hasReferences) {
      const editRequest: Record<string, unknown> = {
        model,
        prompt: finalPrompt,
        image: referenceFiles,
        n,
        size,
        quality,
        input_fidelity: 'high'
      };
      if (background) {
        editRequest['background'] = background;
      }
      if (outputFormat) {
        editRequest['output_format'] = outputFormat;
      }
      editRequest['response_format'] = 'url';
      const response = await client.images.edit(editRequest as any);
      const items = (response.data || []).map((item, index) => {
        const id = `img_${index}_${Math.random().toString(36).slice(2)}`;
        if (item.b64_json) {
          const mime = outputFormat ? `image/${outputFormat}` : 'image/png';
          return {
            id,
            previewUrl: `data:${mime};base64,${item.b64_json}`,
            createdAt: now,
            model
          };
        }
        return {
          id,
          previewUrl: item.url,
          createdAt: now,
          model
        };
      });
      return okJson({ items, model });
    }

    const generateRequest: Record<string, unknown> = {
      prompt: finalPrompt,
      size,
      n,
      model,
      quality
    };
    if (background) {
      generateRequest['background'] = background;
    }
    if (outputFormat) {
      generateRequest['output_format'] = outputFormat;
    }
    generateRequest['response_format'] = 'url';
    const response = await client.images.generate(generateRequest as any);
    const items = (response.data || []).map((item, index) => {
      const id = `img_${index}_${Math.random().toString(36).slice(2)}`;
      if (item.b64_json) {
        const mime = outputFormat ? `image/${outputFormat}` : 'image/png';
        return {
          id,
          previewUrl: `data:${mime};base64,${item.b64_json}`,
          createdAt: now,
          model
        };
      }
      return {
        id,
        previewUrl: item.url,
        createdAt: now,
        model
      };
    });
    return okJson({ items, model });
  } catch (err: unknown) {
    console.error('Image generation failed', err);
    const message = err instanceof Error ? err.message : 'Unknown error generating image';
    const status = (err as any)?.status ?? 500;
    return new Response(
      JSON.stringify({ error: 'image_generation_failed', message }),
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
