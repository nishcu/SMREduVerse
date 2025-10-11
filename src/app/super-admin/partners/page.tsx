
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getPartnerApplicationsAction } from './actions';
import { PartnerManagementClient } from './client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPartnersAction } from "./actions";

export default async function AdminPartnersPage() {
  const [
    pendingApplications, 
    approvedApplications, 
    rejectedApplications,
    activePartners
  ] = await Promise.all([
    getPartnerApplicationsAction('pending'),
    getPartnerApplicationsAction('approved'),
    getPartnerApplicationsAction('rejected'),
    getPartnersAction()
  ]);

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
