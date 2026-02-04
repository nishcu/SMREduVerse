
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
        return `Error: Could not load file content from ${filePath}. Make sure the file exists.`;
    }
}


export default async function AdminSecurityRulesPage() {
    const rulesContent = await getFileContent('firestore.rules');
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-headline text-3xl font-semibold md:text-4xl">
            Security Rules
          </h1>
          <p className="text-muted-foreground">
            View and manage Firebase Security Rules.
          </p>
        </div>
         <Card>
            <CardHeader>
                <CardTitle>firestore.rules</CardTitle>
                <CardDescription>
                    These rules define who can read and write data to your Firestore database.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <pre className="p-4 rounded-lg bg-secondary text-secondary-foreground overflow-auto">
                    <code>
                        {rulesContent}
                    </code>
                </pre>
            </CardContent>
        </Card>
      </div>
    );
  }
