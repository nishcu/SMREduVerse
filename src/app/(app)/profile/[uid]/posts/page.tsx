export default function UserPostsPage({ params }: { params: { uid: string } }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">
          User Posts
        </h1>
        <p className="text-muted-foreground">
          A full feed of posts from this user.
        </p>
      </div>
      <div className="text-center text-muted-foreground py-16">
        <p>Full post feed coming soon.</p>
      </div>
    </div>
  );
}
