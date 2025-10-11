import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { readFile } from 'fs/promises';
import { resolve } from 'path';

async function getFileContent(filePath: string): Promise<string> {
    try {
        const fullPath = resolve(process.cwd(), filePath);
        const content = await readFile(fullPath, 'utf-8');
        return content;
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return `Error: Could not load file content from ${filePath}.`;
    }
}

export default async function AdminAiPage() {
    const genkitConfigContent = await getFileContent('src/ai/genkit.ts');
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">
          AI Configuration
        </h1>
        <p className="text-muted-foreground">
          View AI model configurations and prompt settings.
        </p>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Genkit Configuration</CardTitle>
            <CardDescription>
                This file (`src/ai/genkit.ts`) configures the core AI models and plugins used throughout the application.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <pre className="p-4 rounded-lg bg-secondary text-secondary-foreground overflow-auto">
                <code>
                    {genkitConfigContent}
                </code>
            </pre>
        </CardContent>
      </Card>
    </div>
  );
}
