


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import type { Organization, SiteConfiguration, Entity, ManpowerDetail } from '../../types';
import Button from '../../components/ui/Button';
import { Plus, Edit, Trash2, Eye, Loader2, Upload, Download } from 'lucide-react';
import AddSiteFromClientForm from '../../components/admin/AddSiteFromClientForm';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import SiteConfigurationForm from '../../components/hr/SiteConfigurationForm';
import ManpowerDetailsModal from '../../components/admin/ManpowerDetailsModal';

const siteCsvColumns = ['id', 'shortName', 'fullName', 'address', 'manpowerApprovedCount'];

const toCSV = (data: Record<string, any>[], columns: string[]): string => {
    const header = columns.join(',');
    const rows = data.map(row => 
        columns.map(col => {
            const val = row[col] === null || row[col] === undefined ? '' : String(row[col]);
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }).join(',')
    );
    return [header, ...rows].join('\n');
};

const fromCSV = (csvText: string): Record<string, string>[] => {
    const lines = csvText.trim().replace(/\r/g, '').split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const row: Record<string, string> = {};
        // Regex for CSV parsing, handles quoted fields containing commas.
        const values = lines[i].match(/(?<=,|^)(?:"(?:[^"]|"")*"|[^,]*)/g) || [];
        
        headers.forEach((header, index) => {
            let value = (values[index] || '').trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1).replace(/""/g, '"');
            }
            row[header] = value;
        });
        rows.push(row);
    }
    return rows;
};


const SiteManagement: React.FC = () => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [siteConfigs, setSiteConfigs] = useState<SiteConfiguration[]>([]);
    const [allClients, setAllClients] = useState<(Entity & { companyName: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isAddSiteModalOpen, setIsAddSiteModalOpen] = useState(false);
    const [isSiteConfigFormOpen, setIsSiteConfigFormOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    
    const [editingOrgForConfig, setEditingOrgForConfig] = useState<Organization | null>(null);
    const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [manpowerDetails, setManpowerDetails] = useState<ManpowerDetail[]>([]);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const importRef = useRef<HTMLInputElement>(null);


    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [orgsResult, structureResult, sitesResult] = await Promise.all([
                api.getOrganizations(),
                api.getOrganizationStructure(),
                api.getSiteConfigurations()
            ]);
            setOrganizations(orgsResult);
            setSiteConfigs(sitesResult);
            const clients = structureResult.flatMap(group => 
                group.companies.flatMap(company => 
                    company.entities.map(entity => ({...entity, companyName: company.name}))
                )
            );
            setAllClients(clients);
        } catch (error) {
            setToast({ message: 'Failed to fetch data.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEdit = (org: Organization) => {
        setEditingOrgForConfig(org);
        setIsSiteConfigFormOpen(true);
    };

    const handleDelete = (org: Organization) => {
        setCurrentOrg(org);
        setIsDeleteModalOpen(true);
    };
    
    const handleAddSite = (client: Entity, manpowerCount: number) => {
        if (organizations.some(org => org.id === client.organizationId)) {
            setToast({ message: 'A site for this client already exists.', type: 'error' });
            return;
        }
        
        const newSite: Organization = {
            id: client.organizationId || `site_${Date.now()}`,
            shortName: client.name,
            fullName: client.name,
            address: client.location || client.registeredAddress || '',
            manpowerApprovedCount: manpowerCount,
        };
    
        setOrganizations(prev => [newSite, ...prev].sort((a, b) => a.shortName.localeCompare(b.shortName)));
        setIsAddSiteModalOpen(false);
        setToast({ message: 'Site added successfully. You can now configure it.', type: 'success' });
    };
    
    const handleSaveSiteConfig = (orgId: string, configData: SiteConfiguration) => {
        setSiteConfigs(prev => {
            const newConfigs = [...prev];
            const index = newConfigs.findIndex(c => c.organizationId === orgId);
            if (index > -1) newConfigs[index] = configData;
            else newConfigs.push(configData);
            return newConfigs;
        });
        setToast({ message: 'Site configuration saved.', type: 'success' });
        setIsSiteConfigFormOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (currentOrg) {
            setOrganizations(prev => prev.filter(o => o.id !== currentOrg.id));
            setSiteConfigs(prev => prev.filter(sc => sc.organizationId !== currentOrg.id));
            setToast({ message: 'Site deleted.', type: 'success' });
            setIsDeleteModalOpen(false);
        }
    };
    
    const handleViewDetails = async (org: Organization) => {
        setCurrentOrg(org);
        setIsDetailsLoading(true);
        setIsDetailsModalOpen(true);
        try {
            const details = await api.getManpowerDetails(org.id);
            setManpowerDetails(details);
        } catch (e) {
            setToast({ message: 'Could not load manpower details.', type: 'error' });
        } finally {
            setIsDetailsLoading(false);
        }
    };

    const handleSaveManpowerDetails = async (details: ManpowerDetail[]) => {
        if (!currentOrg) return;
        try {
            await api.updateManpowerDetails(currentOrg.id, details);
            
            const newTotal = details.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
            setOrganizations(prevOrgs => 
                prevOrgs.map(org => 
                    org.id === currentOrg.id ? { ...org, manpowerApprovedCount: newTotal } : org
                )
            );

            setIsDetailsModalOpen(false);
            setToast({ message: 'Manpower details updated successfully.', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to save manpower details.', type: 'error' });
        }
    };

    const handleExport = () => {
        const csvData = toCSV(organizations, siteCsvColumns);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'sites_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToast({ message: 'Sites exported successfully.', type: 'success' });
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                if (!text) throw new Error("File is empty or could not be read.");

                const parsedData = fromCSV(text);
                if (parsedData.length === 0) throw new Error("No data rows found in the CSV file.");

                const fileHeaders = Object.keys(parsedData[0]);
                const hasAllHeaders = siteCsvColumns.every(h => fileHeaders.includes(h));
                if (!hasAllHeaders) {
                    throw new Error(`CSV is missing headers. Required: ${siteCsvColumns.join(', ')}`);
                }

                const newOrgs: Organization[] = parsedData.map(row => ({
                    id: row.id,
                    shortName: row.shortName,
                    fullName: row.fullName,
                    address: row.address,
                    manpowerApprovedCount: parseFloat(row.manpowerApprovedCount) || 0,
                }));

                const { count } = await api.bulkUploadOrganizations(newOrgs);
                setToast({ message: `${count} sites imported/updated successfully.`, type: 'success' });
                fetchData();

            } catch (error: any) {
                setToast({ message: error.message || 'Failed to import CSV.', type: 'error' });
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="bg-card p-6 sm:p-8 rounded-xl shadow-card">
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            
            <input type="file" ref={importRef} className="hidden" accept=".csv" onChange={handleImport} />

            <AddSiteFromClientForm 
                isOpen={isAddSiteModalOpen}
                onClose={() => setIsAddSiteModalOpen(false)}
                onSave={handleAddSite}
            />
            
            {isSiteConfigFormOpen && editingOrgForConfig && (
                <SiteConfigurationForm 
                    isOpen={isSiteConfigFormOpen}
                    onClose={() => setIsSiteConfigFormOpen(false)}
                    onSave={handleSaveSiteConfig}
                    organization={editingOrgForConfig}
                    allClients={allClients}
                    initialData={siteConfigs.find(c => c.organizationId === editingOrgForConfig.id)}
                />
            )}

            {currentOrg && (
                <ManpowerDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                    siteName={currentOrg.shortName}
                    details={manpowerDetails}
                    isLoading={isDetailsLoading}
                    onSave={handleSaveManpowerDetails}
                />
            )}

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
            >
                Are you sure you want to delete the site "{currentOrg?.shortName}"? This action cannot be undone.
            </Modal>

            <AdminPageHeader title="Site Management">
                 <Button variant="outline" onClick={() => importRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Import Sites</Button>
                 <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export Sites</Button>
                 <Button onClick={() => setIsAddSiteModalOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Site</Button>
            </AdminPageHeader>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-page">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Short Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Linked Client</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Site ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Manpower Count</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-10 text-muted">Loading sites...</td></tr>
                        ) : organizations.map((org) => {
                            const config = siteConfigs.find(c => c.organizationId === org.id);
                            const linkedClient = config?.entityId ? allClients.find(c => c.id === config.entityId) : null;
                            return (
                                <tr key={org.id}>
                                    <td className="px-6 py-4 font-medium">{org.shortName}</td>
                                    <td className="px-6 py-4 text-sm">
                                      {linkedClient ? (
                                        <div>
                                          <p className="font-medium text-primary-text">{linkedClient.name}</p>
                                          <p className="text-xs text-muted">{linkedClient.companyName}</p>
                                        </div>
                                      ) : (
                                        <span className="text-muted">N/A</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted">{org.id}</td>
                                    <td className="px-6 py-4 text-sm text-muted">{org.manpowerApprovedCount || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Button variant="icon" size="sm" onClick={() => handleViewDetails(org)} title="View Manpower Details"><Eye className="h-4 w-4" /></Button>
                                            <Button variant="icon" size="sm" onClick={() => handleEdit(org)} title="Configure Site"><Edit className="h-4 w-4" /></Button>
                                            <Button variant="icon" size="sm" onClick={() => handleDelete(org)} title="Delete Site"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SiteManagement;
