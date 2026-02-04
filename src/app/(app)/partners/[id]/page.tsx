
'use client';
import { use, useEffect, useState, useTransition } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { getPartnerDataAction } from '../actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PartnerCourseCard } from '@/components/partner-course-card';
import { ProductCard } from '@/components/product-card';
import { ContestCard } from '@/components/contest-card';
import { ArrowUpRight, BookOpen, Mail, Users, Award, MessageSquare, Edit, Shield, PlusCircle, MapPin, Phone, Calendar, GraduationCap, Building2, CheckCircle2, Facebook, Twitter, Linkedin, Instagram, Youtube, ExternalLink, Clock, School, FileText } from 'lucide-react';
import { getOrCreateChatAction } from '@/app/(app)/chats/actions';
import { useAuth } from '@/hooks/use-auth';
import type { Partner, PartnerCourse, PartnerProduct, Contest } from '@/lib/types';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { PartnerDialog } from '@/app/super-admin/partners/dialog';
import Link from 'next/link';
import { CreateProductDialog } from '@/components/create-product-dialog';


function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-secondary p-4">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}

function PageSkeleton() {
    return (
        <div className="space-y-8">
            <div>
                <Skeleton className="h-48 w-full rounded-xl" />
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 ml-8">
                    <Skeleton className="h-24 w-24 shrink-0 rounded-full border-4 border-background" />
                    <div className="flex-grow pb-2 space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="flex gap-2 pb-2 pr-4">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </div>
    )
}

export default function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<{ partner: Partner; courses: PartnerCourse[]; products: PartnerProduct[]; contests: Contest[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isProductDialogOpen, setProductDialogOpen] = useState(false);


  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      const result = await getPartnerDataAction(id);
      if (result.success) {
        setData(result.data || null);
      } else {
        setError(result.error || 'Failed to load partner data.');
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleStartChat = () => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'You must be logged in to start a chat.',
        });
        return;
    }
    startTransition(async () => {
        // NOTE: We are using the partner's ID as if it were a user ID.
        // In a real application, a partner might have a dedicated user account
        // or a different system for handling communications.
        const result = await getOrCreateChatAction(user.id, id);
        if (result.success && result.chatId) {
            router.push(`/chats/${result.chatId}`);
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.error || 'Could not start chat session.',
            });
        }
    });
  }
  
  const handlePartnerSaved = (savedPartner: Partner) => {
    setData(prevData => prevData ? { ...prevData, partner: savedPartner } : null);
  }

   const handleProductCreated = (newProduct: PartnerProduct) => {
    setData(prevData => prevData ? { ...prevData, products: [...prevData.products, { ...newProduct, id: `prod_${Date.now()}` }] } : null);
  }

  if (loading) {
    return <PageSkeleton />;
  }
  
  if (error || !data) {
    notFound();
  }

  const { partner, courses, products, contests } = data;
  
  const canEdit = user?.partnerId === partner.id || user?.isSuperAdmin;

  return (
    <>
    <div className="space-y-8">
      {/* Banner and Header */}
      <div>
        <div className="relative h-48 w-full overflow-hidden rounded-xl bg-muted">
          {partner.bannerUrl && <Image src={partner.bannerUrl} alt={`${partner.name} banner`} fill className="object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 px-4 -mt-12">
            <div className="relative h-24 w-24 md:h-32 md:w-32 shrink-0 rounded-full border-4 border-background bg-background">
                {partner.logoUrl && <Image src={partner.logoUrl} alt={`${partner.name} logo`} fill className="rounded-full object-contain p-2" />}
            </div>
            <div className="flex-grow">
                <h1 className="font-headline text-3xl font-bold">{partner.name}</h1>
                <p className="text-muted-foreground">{partner.tagline}</p>
            </div>
            <div className="flex gap-2 flex-wrap pb-2">
                {partner.verified && (
                    <Badge variant="default" className="mb-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified Institution
                    </Badge>
                )}
                {partner.institutionType && (
                    <Badge variant="outline" className="mb-2">
                        {partner.institutionType === 'school' && <School className="h-3 w-3 mr-1" />}
                        {partner.institutionType === 'college' && <GraduationCap className="h-3 w-3 mr-1" />}
                        {partner.institutionType === 'university' && <Building2 className="h-3 w-3 mr-1" />}
                        {partner.institutionType === 'academy' && <Award className="h-3 w-3 mr-1" />}
                        {partner.institutionType.charAt(0).toUpperCase() + partner.institutionType.slice(1)}
                    </Badge>
                )}
                {partner.websiteUrl && <Button asChild size="sm"><a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer">Visit Website <ArrowUpRight className="ml-2 h-4 w-4" /></a></Button>}
                {partner.contactEmail && <Button variant="outline" size="sm" asChild><a href={`mailto:${partner.contactEmail}`}><Mail className="mr-2 h-4 w-4" /> Contact</a></Button>}
                <Button variant="outline" size="sm" onClick={handleStartChat} disabled={isPending}><MessageSquare className="mr-2 h-4 w-4" />{isPending ? 'Starting...' : 'Message'}</Button>
            </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About {partner.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{partner.description}</p>
              
              {/* Institution Details */}
              {(partner.establishedYear || partner.location || partner.contactInfo) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  {partner.establishedYear && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Established:</span>
                      <span className="font-semibold">{partner.establishedYear}</span>
                    </div>
                  )}
                  {partner.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-semibold">{partner.location.city}, {partner.location.state}</span>
                    </div>
                  )}
                  {partner.contactInfo?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone:</span>
                      <a href={`tel:${partner.contactInfo.phone}`} className="font-semibold hover:underline">{partner.contactInfo.phone}</a>
                    </div>
                  )}
                  {partner.facultyCount && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Faculty:</span>
                      <span className="font-semibold">{partner.facultyCount}+</span>
                    </div>
                  )}
                </div>
              )}

              {/* Accreditation */}
              {partner.accreditation && partner.accreditation.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-2">Accreditations & Affiliations:</p>
                  <div className="flex flex-wrap gap-2">
                    {partner.accreditation.map((acc, idx) => (
                      <Badge key={idx} variant="secondary">{acc}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Media */}
              {partner.socialMedia && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-2">Connect With Us:</p>
                  <div className="flex gap-2">
                    {partner.socialMedia.facebook && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={partner.socialMedia.facebook} target="_blank" rel="noopener noreferrer">
                          <Facebook className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {partner.socialMedia.twitter && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={partner.socialMedia.twitter} target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {partner.socialMedia.linkedin && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={partner.socialMedia.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {partner.socialMedia.instagram && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={partner.socialMedia.instagram} target="_blank" rel="noopener noreferrer">
                          <Instagram className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {partner.socialMedia.youtube && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={partner.socialMedia.youtube} target="_blank" rel="noopener noreferrer">
                          <Youtube className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Programs Offered */}
          {partner.programs && partner.programs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Programs & Degrees Offered</CardTitle>
                <CardDescription>Explore our comprehensive educational programs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partner.programs.map((program, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{program.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {program.level}
                        </Badge>
                      </div>
                      {program.duration && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Clock className="h-3 w-3" />
                          <span>{program.duration}</span>
                        </div>
                      )}
                      {program.description && (
                        <p className="text-sm text-muted-foreground">{program.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admissions Information */}
          {partner.admissionInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Admissions Information</CardTitle>
                <CardDescription>
                  {partner.admissionInfo.open ? (
                    <Badge variant="default" className="mt-2">Admissions Open</Badge>
                  ) : (
                    <Badge variant="outline" className="mt-2">Admissions Closed</Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {partner.admissionInfo.process && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Admission Process:</p>
                    <p className="text-sm text-muted-foreground">{partner.admissionInfo.process}</p>
                  </div>
                )}
                {partner.admissionInfo.requirements && partner.admissionInfo.requirements.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Requirements:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {partner.admissionInfo.requirements.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {partner.admissionInfo.feeStructure && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Fee Structure:</p>
                    <p className="text-sm text-muted-foreground">{partner.admissionInfo.feeStructure}</p>
                  </div>
                )}
                {partner.admissionInfo.scholarshipInfo && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Scholarship Information:</p>
                    <p className="text-sm text-muted-foreground">{partner.admissionInfo.scholarshipInfo}</p>
                  </div>
                )}
                <Button className="w-full" asChild>
                  <a href={`mailto:${partner.contactEmail}?subject=Admission Inquiry`}>
                    Inquire About Admissions
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Facilities */}
          {partner.facilities && partner.facilities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Facilities & Infrastructure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {partner.facilities.map((facility, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm border rounded-lg p-3">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>{facility}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          {partner.achievements && partner.achievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Achievements & Recognition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {partner.achievements.map((achievement, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm">{achievement}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div>
             <div className="flex justify-between items-center mb-4">
                <h2 className="font-headline text-2xl font-semibold">Courses Offered</h2>
                {canEdit && (
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/courses/create"><PlusCircle className="mr-2 h-4 w-4"/>Add Course</Link>
                    </Button>
                )}
            </div>
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <PartnerCourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <Card className="flex items-center justify-center p-8 text-center text-muted-foreground">
                <p>This partner has not published any courses yet.</p>
              </Card>
            )}
          </div>

          <div>
             <div className="flex justify-between items-center mb-4">
                <h2 className="font-headline text-2xl font-semibold">Products & Services</h2>
                 {canEdit && (
                    <Button variant="outline" size="sm" onClick={() => setProductDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4"/>Add Product
                    </Button>
                )}
            </div>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <Card className="flex items-center justify-center p-8 text-center text-muted-foreground">
                <p>No special products or services available.</p>
              </Card>
            )}
          </div>

          <div>
             <div className="flex justify-between items-center mb-4">
                <h2 className="font-headline text-2xl font-semibold">Hosted Contests</h2>
                {canEdit && (
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/super-admin/contests"><PlusCircle className="mr-2 h-4 w-4"/>Add Contest</Link>
                    </Button>
                )}
            </div>
            {contests.length > 0 ? (
              <div className="space-y-4">
                {contests.map((contest) => (
                  <ContestCard key={contest.id} contest={contest} />
                ))}
              </div>
            ) : (
              <Card className="flex items-center justify-center p-8 text-center text-muted-foreground">
                <p>No contests are currently hosted by this partner.</p>
              </Card>
            )}
          </div>
        </div>
        <div className="space-y-6">
          {canEdit && (
             <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary"/>Admin Actions</CardTitle>
              </CardHeader>
              <CardContent>
                  <Button className="w-full" onClick={() => setEditDialogOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Our Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {partner.stats.studentsTaught > 0 && <StatCard title="Students Taught" value={partner.stats.studentsTaught} icon={<Users />} />}
              {partner.stats.coursesOffered > 0 && <StatCard title="Courses Offered" value={partner.stats.coursesOffered} icon={<BookOpen />} />}
              {partner.stats.expertTutors > 0 && <StatCard title="Expert Tutors" value={partner.stats.expertTutors} icon={<Award />} />}
              {partner.facultyCount && <StatCard title="Faculty Members" value={partner.facultyCount} icon={<Users />} />}
              {partner.studentCapacity && <StatCard title="Student Capacity" value={partner.studentCapacity} icon={<GraduationCap />} />}
            </CardContent>
          </Card>
          
          {/* Location Card */}
          {partner.location && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{partner.location.address}</p>
                <p className="text-sm text-muted-foreground">
                  {partner.location.city}, {partner.location.state}
                  {partner.location.pincode && ` - ${partner.location.pincode}`}
                </p>
                <p className="text-sm text-muted-foreground">{partner.location.country}</p>
              </CardContent>
            </Card>
          )}
          <Card className="bg-primary/10 border-primary/50 sticky top-20">
            <CardHeader>
              <CardTitle>Start Your Journey</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Ready to learn with {partner.name}? Explore their courses and enroll today, or contact them for admission details.
              </p>
              <Button className="w-full" asChild>
                <a href={`mailto:${partner.contactEmail}?subject=Admissions Inquiry`}>Contact for Admissions</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    {canEdit && (
        <PartnerDialog
            isOpen={isEditDialogOpen}
            setOpen={setEditDialogOpen}
            partner={partner}
            onPartnerSaved={handlePartnerSaved}
        />
    )}
     <CreateProductDialog 
        isOpen={isProductDialogOpen} 
        onOpenChange={setProductDialogOpen} 
        onProductCreated={handleProductCreated as (product: any) => void} 
      />
    </>
  );
}
