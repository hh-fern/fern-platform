"use client";

import { useState, useCallback } from "react";
import { CheckCircleIcon, ExclamationCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/utils/utils";
import { DocsUrl } from "@/utils/types";

import { DomainStatus, AddDomainResult } from "@/types/vercel";

export declare namespace DomainSetupCard {
  export interface Props {
    docsUrl: DocsUrl;
  }
}

interface DNSRecord {
  type: string;
  name: string;
  value: string;
}

export function DomainSetupCard({ docsUrl }: DomainSetupCard.Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [domainStatus, setDomainStatus] = useState<DomainStatus | null>(null);
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);

  const addDomain = useCallback(async (domainName: string): Promise<AddDomainResult> => {
    try {
      const response = await fetch("/api/vercel/add-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainName }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        if (result.error?.code === "domain_already_in_use") {
          return { 
            success: true, 
            domain: result.error.domain, 
            isNew: false 
          };
        }
        throw new Error(result.error?.message || "Failed to add domain");
      }

      return { success: true, domain: result, isNew: true };
    } catch (error: any) {
      console.error("Error adding domain:", error);
      return { success: false, isNew: false };
    }
  }, []);

  const checkDomainStatus = useCallback(async (domainName: string): Promise<DomainStatus> => {
    try {
      const response = await fetch(`/api/vercel/domain-status?domain=${encodeURIComponent(domainName)}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to check domain status");
      }

      return result;
    } catch (error: any) {
      console.error("Error checking domain status:", error);
      return { 
        status: 'error', 
        message: error.message || 'Failed to check domain status' 
      };
    }
  }, []);

  const handleAddDomain = useCallback(async () => {
    if (!domain || !domain.includes('.')) {
      toast.error("Please enter a valid domain name");
      return;
    }

    setIsLoading(true);
    setDomainStatus(null);
    setDnsRecords([]);

    try {
      const result = await addDomain(domain);
      
      if (!result.success) {
        toast.error("Failed to configure domain. Please try again later.");
        return;
      }

      setCurrentDomain(domain);
      
      // Wait a moment for the domain to be processed
      await new Promise(resolve => setTimeout(resolve, result.isNew ? 5000 : 1000));
      
      // Check domain status
      await handleCheckStatus(domain);
      
    } catch (error: any) {
      console.error("Error in handleAddDomain:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [domain, addDomain]);

  const handleCheckStatus = useCallback(async (domainName?: string) => {
    const targetDomain = domainName || currentDomain;
    if (!targetDomain) return;

    setIsChecking(true);
    
    try {
      const status = await checkDomainStatus(targetDomain);
      setDomainStatus(status);
      
      if (status.status === 'ready') {
        toast.success("Domain is ready to use! Run `fern generate --docs` to update your documentation.");
        setDnsRecords([]);
      } else if (status.status === 'needs_dns' && status.instructions) {
        // Parse instructions into DNS records
        const records: DNSRecord[] = status.instructions.map(instruction => {
          if (instruction.includes('TXT record')) {
            const match = instruction.match(/Add TXT record for (.+) with value: (.+)/);
            return {
              type: 'TXT',
              name: match?.[1] || '_vercel',
              value: match?.[2] || ''
            };
          } else if (instruction.includes('CNAME record')) {
            const match = instruction.match(/Add CNAME record for (.+) with value: (.+)/);
            return {
              type: 'CNAME',
              name: match?.[1] || 'docs',
              value: match?.[2] || 'cname.vercel-dns.com.'
            };
          }
          return { type: 'TXT', name: '', value: instruction };
        });
        
        setDnsRecords(records);
      } else if (status.status === 'error') {
        toast.error(status.message);
      }
    } catch (error: any) {
      console.error("Error checking status:", error);
      toast.error("Failed to check domain status");
    } finally {
      setIsChecking(false);
    }
  }, [currentDomain, checkDomainStatus]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    // Reset state when modal closes
    setTimeout(() => {
      setDomain("");
      setCurrentDomain(null);
      setDomainStatus(null);
      setDnsRecords([]);
      setIsLoading(false);
      setIsChecking(false);
    }, 300);
  }, []);

  const handleStartOver = useCallback(() => {
    setDomain("");
    setCurrentDomain(null);
    setDomainStatus(null);
    setDnsRecords([]);
  }, []);

  const shouldShowDNSTable = domainStatus?.status === 'needs_dns' && dnsRecords.length > 0;

  return (
    <>
      {/* Domain Setup Card */}
      <div className="border-border mt-6 flex max-w-[750px] flex-1 flex-col rounded-xl border bg-gray-100 p-4 sm:mt-8 md:mt-10">
        <div className="flex flex-col gap-1">
          <div className="font-bold">Custom Domain</div>
          <div className="text-gray-900">
            Configure a custom domain for your documentation site.
          </div>
        </div>
        
        <div className="mt-5 flex justify-center md:justify-end">
          <Button 
            onClick={() => setIsModalOpen(true)}
            style={{ backgroundColor: '#008700' }}
            className="text-white hover:opacity-90"
          >
            Add domain
          </Button>
        </div>
      </div>

      {/* Domain Setup Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-8">
          <DialogHeader>
            <DialogTitle>
              {currentDomain ? `${currentDomain}` : "Add a custom subdomain"}
            </DialogTitle>
            {!currentDomain && (
              <p className="text-sm text-gray-600">
                This subdomain will be assigned to your production docs site.
              </p>
            )}
          </DialogHeader>

          <div className="space-y-8">
            {/* Domain Input Section */}
            {!currentDomain && (
              <div className="space-y-4">
                <div className="flex items-center bg-white border border-input rounded-md overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-r border-input text-sm text-gray-600">
                    https://
                  </div>
                  <Input
                    type="text"
                    placeholder="docs.fluxcapacitor.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="border-0 rounded-none flex-1"
                    disabled={isLoading}
                  />
                </div>

                                 <div className="flex justify-end">
                   <Button 
                     onClick={handleAddDomain}
                     disabled={isLoading || !domain}
                     loading={isLoading}
                     style={{ backgroundColor: '#008700' }}
                     className="text-white hover:opacity-90"
                   >
                     Add domain
                   </Button>
                 </div>
              </div>
            )}

            {/* Verification Status */}
            {currentDomain && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="font-medium">{currentDomain}</span>
                  {domainStatus?.status !== 'ready' && (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckStatus()}
                      disabled={isChecking}
                      loading={isChecking}
                    >
                      Verify domain
                    </Button>
                  )}
                </div>

                {domainStatus && (
                  <div className="text-sm text-gray-600 space-y-2">
                    {domainStatus.status === 'needs_dns' && (
                      <>
                        <p>
                          Verification required. Visit the admin console of your domain registrar (the 
                          website you bought your domain from) and create the DNS Records shown 
                          below. Note that it may take up to a few hours for the DNS changes to 
                          propagate.
                        </p>
                        <p>
                          Once the records have propagated, complete the verification process by 
                          clicking the 'Verify domain' button above.
                        </p>
                      </>
                    )}
                    {domainStatus.status === 'ready' && (
                      <p className="text-green-600">Domain is ready to use!</p>
                    )}
                    {domainStatus.status === 'error' && (
                      <p className="text-red-600">{domainStatus.message}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* DNS Configuration Table */}
            {shouldShowDNSTable && (
              <div className="space-y-4">
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dnsRecords.map((record, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">{record.type}</TableCell>
                          <TableCell className="font-mono text-sm">{record.name}</TableCell>
                          <TableCell className="font-mono text-sm">
                            <code className="bg-gray-50 px-2 py-1 rounded text-xs">
                              {record.value}
                            </code>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="text-sm text-gray-600">
                  <p>Setting up a custom domain? <a href="#" className="text-blue-600 underline">Book a call</a>.</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-6 border-t mt-8">
              {currentDomain && (
                <Button 
                  variant="outline" 
                  onClick={handleStartOver}
                  disabled={isLoading || isChecking}
                >
                  Start Over
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleCloseModal}
              >
                {domainStatus?.status === 'ready' ? 'Done' : 'Cancel'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 