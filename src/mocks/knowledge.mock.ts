import { sleep } from "@/lib/utils";

export interface Citation { id: string; title: string; page: number; snippet: string }

export async function askWithCitations(question: string, files: string[]) {
  await sleep(700);
  const citations: Citation[] = [
    { id: 'c1', title: 'Sample.pdf', page: 3, snippet: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { id: 'c2', title: 'Notes.txt', page: 1, snippet: 'Curabitur blandit tempus porttitor. Integer posuere erat a ante.' }
  ];
  return { answer: `Here is a mocked answer to: ${question}`, citations };
}


