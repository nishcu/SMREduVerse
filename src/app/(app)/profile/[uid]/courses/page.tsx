
export default function UserCoursesPage({ params }: { params: { uid: string } }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">
          User Courses
        </h1>
        <p className="text-muted-foreground">
          All courses created by this user.
        </p>
      </div>
      <div className="text-center text-muted-foreground py-16">
        <p>User course list coming soon.</p>
      </div>
    </div>
  );
}
