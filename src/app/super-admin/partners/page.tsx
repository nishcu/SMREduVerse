'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getPartnerApplicationsAction } from './actions';
import { PartnerManagementClient } from './client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPartnersAction } from "./actions";
import { useEffect, useState } from "react";
import type { Partner, PartnerApplication } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";


function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-1/2 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-1/2 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}


export default function AdminPartnersPage() {
  const [pendingApplications, setPendingApplications] = useState<PartnerApplication[]>([]);
  const [approvedApplications, setApprovedApplications] = useState<PartnerApplication[]>([]);
  const [rejectedApplications, setRejectedApplications] = useState<PartnerApplication[]>([]);
  const [activePartners, setActivePartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [
        pending, 
        approved, 
        rejected,
        partners
      ] = await Promise.all([
        getPartnerApplicationsAction('pending'),
        getPartnerApplicationsAction('approved'),
        getPartnerApplicationsAction('rejected'),
        getPartnersAction()
      ]);
      setPendingApplications(pending);
      setApprovedApplications(approved);
      setRejectedApplications(rejected);
      setActivePartners(partners);
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">
          Partner Management
        </h1>
        <p className="text-muted-foreground">
          Review applications, and manage all partner organizations.
        </p>
      </div>
      <PartnerManagementClient 
        initialPending={pendingApplications}
        initialApproved={approvedApplications}
        initialRejected={rejectedApplications}
        initialPartners={activePartners}
      />
    </div>
  );
}
