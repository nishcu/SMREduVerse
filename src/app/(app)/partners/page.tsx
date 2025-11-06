
'use client';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Handshake, Search, Filter, School, GraduationCap, Building2, Award, CheckCircle2, MapPin } from 'lucide-react';
import { PartnerCard } from '@/components/partner-card';
import { getAllPartnersAction } from './actions';
import { useEffect, useState, useMemo } from 'react';
import { Partner } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { BecomeAPartnerDialog } from '@/components/become-a-partner-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function PartnerCardSkeleton() {
    return (
        <Card className="h-full">
            <CardHeader className="flex items-center gap-4">
                 <Skeleton className="h-16 w-16 shrink-0" />
                 <div className="flex-1">
                    <Skeleton className="h-6 w-3/4" />
                 </div>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-4 w-full" />
            </CardContent>
        </Card>
    )
}


export default function PartnersPage() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPartnerDialogOpen, setPartnerDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [institutionType, setInstitutionType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('name');
    const [activeTab, setActiveTab] = useState<string>('all');

    useEffect(() => {
        const loadPartners = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await getAllPartnersAction();
                if (result.success) {
                    setPartners(result.data || []);
                } else {
                    setError(result.error || 'Failed to load partners.');
                }
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadPartners();
    }, []);

    const filteredAndSortedPartners = useMemo(() => {
        if (!partners) return [];

        let filtered = partners.filter((partner) => {
            const nameMatch = partner.name.toLowerCase().includes(searchTerm.toLowerCase());
            const taglineMatch = partner.tagline?.toLowerCase().includes(searchTerm.toLowerCase());
            const descriptionMatch = partner.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const searchMatch = nameMatch || taglineMatch || descriptionMatch;

            const typeMatch = institutionType === 'all' || partner.institutionType === institutionType;

            return searchMatch && typeMatch;
        });

        // Sort partners
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'students':
                    return (b.stats?.studentsTaught || 0) - (a.stats?.studentsTaught || 0);
                case 'courses':
                    return (b.stats?.coursesOffered || 0) - (a.stats?.coursesOffered || 0);
                case 'verified':
                    return (b.verified ? 1 : 0) - (a.verified ? 1 : 0);
                default:
                    return 0;
            }
        });

        // Filter by active tab
        if (activeTab === 'verified') {
            filtered = filtered.filter(p => p.verified);
        } else if (activeTab === 'schools') {
            filtered = filtered.filter(p => p.institutionType === 'school');
        } else if (activeTab === 'colleges') {
            filtered = filtered.filter(p => p.institutionType === 'college');
        } else if (activeTab === 'universities') {
            filtered = filtered.filter(p => p.institutionType === 'university');
        } else if (activeTab === 'academies') {
            filtered = filtered.filter(p => p.institutionType === 'academy');
        }

        return filtered;
    }, [partners, searchTerm, institutionType, sortBy, activeTab]);

    const stats = useMemo(() => {
        const total = partners.length;
        const verified = partners.filter(p => p.verified).length;
        const schools = partners.filter(p => p.institutionType === 'school').length;
        const colleges = partners.filter(p => p.institutionType === 'college').length;
        const universities = partners.filter(p => p.institutionType === 'university').length;
        const academies = partners.filter(p => p.institutionType === 'academy').length;
        return { total, verified, schools, colleges, universities, academies };
    }, [partners]);

    return (
        <>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Handshake className="h-10 w-10 text-primary" />
                        <div>
                            <h1 className="font-headline text-3xl font-semibold md:text-4xl">
                                Our Partners
                            </h1>
                            <p className="text-muted-foreground">
                                Discover schools, colleges, universities, and academies partnering with us.
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => setPartnerDialogOpen(true)}>Become a Partner</Button>
                </div>

                {/* Stats Overview */}
                {!isLoading && partners.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{stats.total}</div>
                                    <p className="text-xs text-muted-foreground">Total Partners</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold flex items-center justify-center gap-1">
                                        {stats.verified}
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Verified</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold flex items-center justify-center gap-1">
                                        {stats.schools}
                                        <School className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Schools</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold flex items-center justify-center gap-1">
                                        {stats.colleges}
                                        <GraduationCap className="h-4 w-4 text-green-500" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Colleges</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold flex items-center justify-center gap-1">
                                        {stats.universities}
                                        <Building2 className="h-4 w-4 text-purple-500" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Universities</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold flex items-center justify-center gap-1">
                                        {stats.academies}
                                        <Award className="h-4 w-4 text-orange-500" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Academies</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters and Search */}
                {!isLoading && partners.length > 0 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search partners by name, location, or description..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={institutionType} onValueChange={setInstitutionType}>
                                    <SelectTrigger className="w-full md:w-[200px]">
                                        <Filter className="mr-2 h-4 w-4" />
                                        <SelectValue placeholder="Institution Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="school">Schools</SelectItem>
                                        <SelectItem value="college">Colleges</SelectItem>
                                        <SelectItem value="university">Universities</SelectItem>
                                        <SelectItem value="academy">Academies</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-full md:w-[180px]">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name">Name (A-Z)</SelectItem>
                                        <SelectItem value="students">Most Students</SelectItem>
                                        <SelectItem value="courses">Most Courses</SelectItem>
                                        <SelectItem value="verified">Verified First</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Partners List with Tabs */}
                {isLoading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => <PartnerCardSkeleton key={i} />)}
                    </div>
                ) : error ? (
                    <div className="text-center text-destructive py-16">{error}</div>
                ) : partners.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Handshake className="h-16 w-16 text-muted-foreground mb-4" />
                            <p className="text-lg font-semibold mb-2">No partners yet</p>
                            <p className="text-sm text-muted-foreground mb-4">Be the first to partner with us!</p>
                            <Button onClick={() => setPartnerDialogOpen(true)}>Become a Partner</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="all">All ({partners.length})</TabsTrigger>
                            <TabsTrigger value="verified">Verified ({stats.verified})</TabsTrigger>
                            <TabsTrigger value="schools">Schools ({stats.schools})</TabsTrigger>
                            <TabsTrigger value="colleges">Colleges ({stats.colleges})</TabsTrigger>
                            <TabsTrigger value="universities">Universities ({stats.universities})</TabsTrigger>
                        </TabsList>
                        <TabsContent value={activeTab} className="mt-6">
                            {filteredAndSortedPartners.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {filteredAndSortedPartners.map((partner) => (
                                        <PartnerCard key={partner.id} partner={partner} />
                                    ))}
                                </div>
                            ) : (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-16">
                                        <p className="text-muted-foreground">No partners found matching your criteria.</p>
                                        <Button variant="outline" className="mt-4" onClick={() => {
                                            setSearchTerm('');
                                            setInstitutionType('all');
                                            setActiveTab('all');
                                        }}>Clear Filters</Button>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>
            <BecomeAPartnerDialog isOpen={isPartnerDialogOpen} onOpenChange={setPartnerDialogOpen} />
        </>
    );
}
