
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Download } from 'lucide-react';
import { PartnerDialog } from './dialog';
import type { Partner, PartnerApplication } from '@/lib/types';
import { deletePartnerAction, approvePartnerApplicationAction, rejectPartnerApplicationAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

function ApplicationsTable({ 
    applications, 
    onApprove,
    onReject
}: { 
    applications: PartnerApplication[], 
    onApprove: (app: PartnerApplication) => void,
    onReject: (app: PartnerApplication) => void,
}) {
    if (applications.length === 0) {
        return <div className="h-24 text-center flex items-center justify-center text-muted-foreground">No applications in this category.</div>
    }

    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Entity Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Expertise</TableHead>
                        <TableHead>Applied On</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {applications.map((app) => (
                        <TableRow key={app.id}>
                            <TableCell className="font-medium">{app.entityName}</TableCell>
                            <TableCell>
                                <div>{app.contactName}</div>
                                <div className="text-xs text-muted-foreground">{app.contactEmail}</div>
                            </TableCell>
                            <TableCell>{app.areaOfExpertise}</TableCell>
                            <TableCell>{format(new Date(app.createdAt), 'PP')}</TableCell>
                            <TableCell className="text-right">
                                {app.status === 'pending' && (
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="destructive" size="sm" onClick={() => onReject(app)}>Reject</Button>
                                        <Button variant="outline" size="sm" onClick={() => onApprove(app)}>Approve</Button>
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}


export function PartnerManagementClient({ 
    initialPending, 
    initialApproved,
    initialRejected,
    initialPartners
}: { 
    initialPending: PartnerApplication[], 
    initialApproved: PartnerApplication[], 
    initialRejected: PartnerApplication[], 
    initialPartners: Partner[] 
}) {
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [pendingApplications, setPendingApplications] = useState<PartnerApplication[]>(initialPending);
  const [approvedApplications, setApprovedApplications] = useState<PartnerApplication[]>(initialApproved);
  const [rejectedApplications, setRejectedApplications] = useState<PartnerApplication[]>(initialRejected);

  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();


  const handleCreateNew = () => {
    setSelectedPartner(null);
    setDialogOpen(true);
  };

  const handleEdit = (partner: Partner) => {
    setSelectedPartner(partner);
    setDialogOpen(true);
  };
  
  const handleDeleteAttempt = (id: string) => {
    setPartnerToDelete(id);
    setAlertOpen(true);
  };

  const handleApprove = async (application: PartnerApplication) => {
    if (!application.userId) {
        toast({ variant: 'destructive', title: 'Error', description: 'User ID is missing from the application.' });
        return;
    }
    const result = await approvePartnerApplicationAction(application.id, application.userId);
    if(result.success) {
        toast({ title: 'Success', description: 'Partner application approved and profile created.' });
        setPendingApplications(pendingApplications.filter(app => app.id !== application.id));
        setApprovedApplications(prev => [{...application, status: 'approved'}, ...prev]);
        if(result.data) {
            setPartners(prev => [result.data as Partner, ...prev]);
        }
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }

  const handleReject = async (application: PartnerApplication) => {
      const result = await rejectPartnerApplicationAction(application.id);
      if(result.success) {
          toast({ title: 'Application Rejected', description: 'The partner application has been marked as rejected.'});
          setPendingApplications(pendingApplications.filter(app => app.id !== application.id));
          setRejectedApplications(prev => [{...application, status: 'rejected'}, ...prev]);
      } else {
          toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
  }

  const handleDeleteConfirm = async () => {
    if (!partnerToDelete) return;
    const result = await deletePartnerAction(partnerToDelete);
    if (result.success) {
      setPartners(partners.filter((p) => p.id !== partnerToDelete));
      toast({ title: 'Success', description: 'Partner deleted successfully.' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setAlertOpen(false);
    setPartnerToDelete(null);
  };

  const onPartnerSaved = (savedPartner: Partner) => {
     if (selectedPartner) {
      setPartners(partners.map((p) => (p.id === savedPartner.id ? savedPartner : p)));
    } else {
      setPartners([savedPartner, ...partners]);
    }
  }
  
  const downloadCSV = (type: 'partners' | 'applications', data: any[]) => {
        let headers: string[];
        let rows: string[][];
        let filename: string;

        if (type === 'partners') {
            headers = ['ID', 'Name', 'Tagline', 'Website', 'Contact Email'];
            rows = data.map(p => [
                p.id,
                `"${p.name}"`,
                `"${p.tagline}"`,
                p.websiteUrl,
                p.contactEmail
            ]);
            filename = 'partners.csv';
        } else {
            headers = ['ID', 'Entity Name', 'Entity Type', 'Contact Name', 'Contact Email', 'Contact Mobile', 'Applied At', 'Status'];
            rows = data.map(app => [
                app.id,
                `"${app.entityName}"`,
                app.entityType,
                `"${app.contactName}"`,
                app.contactEmail,
                app.contactMobile,
                format(new Date(app.createdAt), 'yyyy-MM-dd HH:mm:ss'),
                app.status
            ]);
            filename = 'partner-applications.csv';
        }
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
  };

  return (
    <>
      <Card>
        <CardHeader>
            <CardTitle>Partner Applications</CardTitle>
            <CardDescription>Review and approve new partner applications.</CardDescription>
        </CardHeader>
        <CardContent>
           <Tabs defaultValue="pending">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                    <ApplicationsTable applications={pendingApplications} onApprove={handleApprove} onReject={handleReject} />
                </TabsContent>
                 <TabsContent value="approved" className="mt-4">
                    <ApplicationsTable applications={approvedApplications} onApprove={handleApprove} onReject={handleReject}/>
                </TabsContent>
                 <TabsContent value="rejected" className="mt-4">
                    <ApplicationsTable applications={rejectedApplications} onApprove={handleApprove} onReject={handleReject}/>
                </TabsContent>
           </Tabs>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Active Partners</CardTitle>
              <CardDescription>A list of all approved partners on the platform.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => downloadCSV('partners', partners)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                </Button>
                {user?.isSuperAdmin && <Button onClick={handleCreateNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Partner
                </Button>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tagline</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium flex items-center gap-3">
                        <Image src={partner.logoUrl} alt={partner.name} width={32} height={32} className="rounded-md" />
                         <Link href={`/partners/${partner.id}`} className="hover:underline">{partner.name}</Link>
                    </TableCell>
                    <TableCell>{partner.tagline}</TableCell>
                    <TableCell>
                        <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {partner.websiteUrl}
                        </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleEdit(partner)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteAttempt(partner.id)} className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PartnerDialog
        isOpen={isDialogOpen}
        setOpen={setDialogOpen}
        partner={selectedPartner}
        onPartnerSaved={onPartnerSaved}
      />
       <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the partner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
