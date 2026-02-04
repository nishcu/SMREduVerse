
export default async function UserVideosPage({ params }: { params: Promise<{ uid: string }> }) {
  await params; // unwrap for Next.js 15 (uid not used in this page yet)
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">
          User Videos
        </h1>
        <p className="text-muted-foreground">
          A collection of this user's contributions to the Talent Hub.
        </p>
      </div>
      <div className="text-center text-muted-foreground py-16">
        <p>User video gallery coming soon.</p>
      </div>
    </div>
  );
}
