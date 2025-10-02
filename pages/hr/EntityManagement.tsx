import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { api } from '../../services/api';
import type { OrganizationGroup, Entity, Company, RegistrationType, Organization, SiteConfiguration, UploadedFile } from '../../types';
import { Plus, Save, Edit, Trash2, Building, ChevronRight, Upload, Download, Eye, CheckCircle, AlertCircle, Search, ClipboardList, Settings, Calculator, Users, Badge, HeartPulse, Archive, Wrench, Shirt, FileText, CalendarDays, BarChart, Mail, Sun, UserX, IndianRupee, ChevronLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import EntityForm from '../../components/hr/EntityForm';
import SiteConfigurationForm from '../../components/hr/SiteConfigurationForm';
import Modal from '../../components/ui/Modal';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useUiSettingsStore } from '../../store/uiSettingsStore';

// Import all the new placeholder components
import CostingResourceConfig from '../../components/hr/CostingResourceConfig';
import BackofficeHeadsConfig from '../../components/hr/BackofficeHeadsConfig';
import StaffDesignationConfig from '../../components/hr/StaffDesignationConfig';
// FIX: Changed to a named import to resolve module export error.
import { GmcPolicyConfig } from '../../components/hr/GmcPolicyConfig';
import AssetConfig from '../../components/hr/AssetConfig';
import ToolsListConfig from '../../components/hr/ToolsListConfig';
import AttendanceFormatConfig from '../../components/hr/AttendanceFormatConfig';
import AttendanceOverviewConfig from '../../components/hr/AttendanceOverviewConfig';
import DailyAttendanceConfig from '../../components/hr/DailyAttendanceConfig';
import NotificationTemplateConfig from '../../components/hr/NotificationTemplateConfig';
import OnboardRejectReasonConfig from '../../components/hr/OnboardRejectReasonConfig';
import SalaryTemplateConfig from '../../components/hr/SalaryTemplateConfig';
import SalaryLineItemConfig from '../../components/hr/SalaryLineItemConfig';


// Helper to convert array of objects to CSV string
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

// Helper to parse CSV string into array of objects
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


const entityCsvColumns = [
    'GroupId', 'GroupName', 'CompanyId', 'CompanyName', 'EntityId', 'EntityName', 'organizationId', 'Location', 'RegisteredAddress', 
    'RegistrationType', 'RegistrationNumber', 'GSTNumber', 'PANNumber', 'Email', 'EShramNumber', 
    'ShopAndEstablishmentCode', 'EPFOCode', 'ESICCode', 'PSARALicenseNumber', 'PSARAValidTill'
];

const siteConfigCsvColumns = [
    'organizationId', 'organizationName', 'location', 'entityId', 'billingName', 'registeredAddress', 
    'gstNumber', 'panNumber', 'email1', 'email2', 'email3', 'eShramNumber', 'shopAndEstablishmentCode', 
    'keyAccountManager', 'siteAreaSqFt', 'projectType', 'apartmentCount', 'agreementDetails', 'siteOperations'
];

const triggerDownload = (data: BlobPart, fileName: string) => {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const NameInputModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  title: string;
  label: string;
  initialName?: string;
}> = ({ isOpen, onClose, onSave, title, label, initialName = '' }) => {
    const [name, setName] = useState(initialName);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) setName(initialName);
    }, [isOpen, initialName]);

    const handleSave = () => {
        if (!name.trim()) {
            setError('Name cannot be empty.');
            return;
        }
        onSave(name);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-card rounded-xl shadow-card p-6 w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold">{title}</h3>
                <div className="mt-4">
                    <Input label={label} id="name-input" value={name} onChange={e => { setName(e.target.value); setError(''); }} error={error} />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <Button onClick={onClose} variant="secondary">Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </div>
            </div>
        </div>
    );
};

const subcategories = [
    { key: 'client_structure', label: 'Client Structure', icon: ClipboardList },
    { key: 'site_configuration', label: 'Site Configuration', icon: Settings },
    { key: 'costing_resource', label: 'Costing & Resource', icon: Calculator },
    { key: 'backoffice_heads', label: 'Back Office & ID Series', icon: Users },
    { key: 'staff_designation', label: 'Site Staff Designation', icon: Badge },
    { key: 'gmc_policy', label: 'GMC Policy', icon: HeartPulse },
    { key: 'asset', label: 'Asset Management', icon: Archive },
    { key: 'tools_list', label: 'Tools List', icon: Wrench },
    { key: 'attendance_format', label: 'Attendance Format', icon: CalendarDays },
    { key: 'attendance_overview', label: 'Attendance Overview', icon: BarChart },
    { key: 'notification_template', label: 'Notification & Mail', icon: Mail },
    { key: 'onboard_reject_reason', label: 'Onboarding Rejection Reasons', icon: UserX },
    { key: 'salary_template', label: 'Salary Breakup', icon: IndianRupee },
    { key: 'salary_line_item', label: 'Salary Line Item', icon: IndianRupee },
];

const PlaceholderView: React.FC<{ title: string }> = ({ title }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-page rounded-lg min-h-[400px]">
        <h3 className="text-xl font-semibold text-primary-text mb-2">{title}</h3>
        <p className="text-muted max-w-sm">
            Configuration for this section will be available here. The form details will be provided in a future update.
        </p>
    </div>
);


const validationSchema = yup.object({
  // No form fields at the top level to validate here
}).defined();

const EntityManagement: React.FC = () => {
    const [groups, setGroups] = useState<OrganizationGroup[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [siteConfigs, setSiteConfigs] = useState<SiteConfiguration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [activeSubcategory, setActiveSubcategory] = useState<string>('client_structure');
    const importRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingClients, setViewingClients] = useState<{ companyName: string; clients: Entity[] } | null>(null);

    // Modals state
    const [entityFormState, setEntityFormState] = useState<{ isOpen: boolean; initialData: Entity | null; companyName: string }>({ isOpen: false, initialData: null, companyName: '' });
    const [nameModalState, setNameModalState] = useState<{ isOpen: boolean; type: 'group' | 'company'; id?: string; initialName?: string; title: string; label: string }>({ isOpen: false, type: 'group', title: '', label: '' });
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; type: 'group' | 'company' | 'client'; id: string; name: string }>({ isOpen: false, type: 'group', id: '', name: '' });
    const [siteConfigForm, setSiteConfigForm] = useState<{ isOpen: boolean; org: Organization | null }>({ isOpen: false, org: null });
    const { autoClickOnHover } = useUiSettingsStore();
    
    // State for paginated tabs
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 4;
    const totalPages = Math.ceil(subcategories.length / itemsPerPage);
    const scrollIntervalRef = useRef<number | null>(null);

    const visibleSubcategories = subcategories.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    );

    const handleNextPage = useCallback(() => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
    }, [totalPages]);

    const handlePrevPage = useCallback(() => {
        setCurrentPage(prev => Math.max(prev - 1, 0));
    }, []);

    const stopScrolling = useCallback(() => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    }, []);

    const startScrolling = useCallback((direction: 'next' | 'prev') => {
        stopScrolling();
        const handler = direction === 'next' ? handleNextPage : handlePrevPage;
        handler(); // Trigger once immediately
        scrollIntervalRef.current = window.setInterval(handler, 500);
    }, [handleNextPage, handlePrevPage, stopScrolling]);

    useEffect(() => {
        return () => stopScrolling();
    }, [stopScrolling]);

    const handleTabClick = (key: string) => {
        setActiveSubcategory(key);
    };


    const allClients = useMemo(() => {
        return groups.flatMap(g => g.companies.flatMap(c => c.entities.map(e => ({...e, companyName: c.name}))));
    }, [groups]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [structure, orgs, configs] = await Promise.all([
                    api.getOrganizationStructure(),
                    api.getOrganizations(),
                    api.getSiteConfigurations()
                ]);
                setGroups(structure);
                setOrganizations(orgs);
                setSiteConfigs(configs);
            } catch (error) {
                setToast({ message: "Failed to load data.", type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredGroups = useMemo(() => {
        if (!searchTerm.trim()) {
            return groups;
        }
        const lower = searchTerm.toLowerCase();

        return groups.map(group => {
            if (group.name.toLowerCase().includes(lower)) {
                return group; // Group name matches, include whole group
            }

            const matchingCompanies = group.companies.map(company => {
                if (company.name.toLowerCase().includes(lower)) {
                    return company; // Company name matches, include whole company
                }

                const matchingEntities = company.entities.filter(entity =>
                    entity.name.toLowerCase().includes(lower)
                );

                if (matchingEntities.length > 0) {
                    return { ...company, entities: matchingEntities };
                }
                return null;
            }).filter(Boolean) as Company[];

            if (matchingCompanies.length > 0) {
                return { ...group, companies: matchingCompanies };
            }
            return null;
        }).filter(Boolean) as OrganizationGroup[];
    }, [groups, searchTerm]);

    const filteredOrganizations = useMemo(() => {
        if (!searchTerm.trim()) {
            return organizations;
        }
        const lower = searchTerm.toLowerCase();
        return organizations.filter(org => org.shortName.toLowerCase().includes(lower));
    }, [organizations, searchTerm]);


    const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const handleSaveAll = () => {
        // In a real app, this would be a single API call. Here we just show a success message.
        setToast({ message: 'All changes saved successfully (mocked).', type: 'success' });
    };

    // Client/Entity handlers
    const handleAddClient = (companyName: string) => setEntityFormState({ isOpen: true, initialData: null, companyName });
    const handleEditClient = (entity: Entity, companyName: string) => setEntityFormState({ isOpen: true, initialData: entity, companyName });
    const handleSaveClient = (clientData: Entity) => {
        // Logic to find the correct company and add/update the client
        setToast({ message: clientData.id.startsWith('new_') ? 'Client added.' : 'Client updated.', type: 'success' });
        setEntityFormState({ isOpen: false, initialData: null, companyName: '' });
    };

    const handleDeleteClick = (type: 'group' | 'company' | 'client', id: string, name: string) => setDeleteModalState({ isOpen: true, type, id, name });
    const handleConfirmDelete = () => {
        // Logic to delete item based on type and id
        setToast({ message: `${deleteModalState.type} deleted.`, type: 'success' });
        setDeleteModalState({ isOpen: false, type: 'group', id: '', name: '' });
    };

    const handleAddOrEditGroup = (name: string) => {
        setToast({ message: `Group saved: ${name}`, type: 'success' });
        setNameModalState({ isOpen: false, type: 'group', title: '', label: '' });
    };
    const handleAddOrEditCompany = (name: string) => {
         setToast({ message: `Company saved: ${name}`, type: 'success' });
        setNameModalState({ isOpen: false, type: 'group', title: '', label: '' });
    };

    const handleExport = () => {
        if (activeSubcategory === 'client_structure') {
            const flatData = groups.flatMap(group =>
                group.companies.flatMap(company =>
                    company.entities.map(entity => ({
                        GroupId: group.id,
                        GroupName: group.name,
                        CompanyId: company.id,
                        CompanyName: company.name,
                        EntityId: entity.id,
                        EntityName: entity.name,
                        organizationId: entity.organizationId || '',
                        Location: entity.location || '',
                        RegisteredAddress: entity.registeredAddress || '',
                        RegistrationType: entity.registrationType || '',
                        RegistrationNumber: entity.registrationNumber || '',
                        GSTNumber: entity.gstNumber || '',
                        PANNumber: entity.panNumber || '',
                        Email: entity.email || '',
                        EShramNumber: entity.eShramNumber || '',
                        ShopAndEstablishmentCode: entity.shopAndEstablishmentCode || '',
                        EPFOCode: entity.epfoCode || '',
                        ESICCode: entity.esicCode || '',
                        PSARALicenseNumber: entity.psaraLicenseNumber || '',
                        PSARAValidTill: entity.psaraValidTill || '',
                    }))
                )
            );
            const csvData = toCSV(flatData, entityCsvColumns);
            triggerDownload(csvData, 'client_structure_export.csv');
            setToast({ message: 'Client structure exported.', type: 'success' });
        } else {
            setToast({ message: `Export not implemented for this view.`, type: 'error' });
        }
    };
    
    const handleDownloadTemplate = () => {
        if (activeSubcategory === 'client_structure') {
            triggerDownload(entityCsvColumns.join(','), 'client_structure_template.csv');
        } else {
            setToast({ message: `Template not available for this view.`, type: 'error' });
        }
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                if (!text) throw new Error("File is empty.");
                
                if (activeSubcategory === 'client_structure') {
                    const parsedData = fromCSV(text);
                    if (parsedData.length === 0) throw new Error("No data rows found.");
    
                    const fileHeaders = Object.keys(parsedData[0]);
                    const hasAllHeaders = entityCsvColumns.every(h => fileHeaders.includes(h));
                    if (!hasAllHeaders) {
                        throw new Error(`CSV is missing required headers for Client Structure.`);
                    }
    
                    const newGroupsMap = new Map<string, { group: OrganizationGroup, companiesMap: Map<string, Company> }>();
    
                    for (const row of parsedData) {
                        if (!newGroupsMap.has(row.GroupId)) {
                            newGroupsMap.set(row.GroupId, {
                                group: { id: row.GroupId, name: row.GroupName, locations: [], companies: [] },
                                companiesMap: new Map<string, Company>()
                            });
                        }
    
                        const groupData = newGroupsMap.get(row.GroupId)!;
    
                        if (!groupData.companiesMap.has(row.CompanyId)) {
                            groupData.companiesMap.set(row.CompanyId, { id: row.CompanyId, name: row.CompanyName, entities: [] });
                        }
                        
                        const companyData = groupData.companiesMap.get(row.CompanyId)!;
    
                        const entity: Entity = {
                            id: row.EntityId,
                            name: row.EntityName,
                            organizationId: row.organizationId,
                            location: row.Location,
                            registeredAddress: row.RegisteredAddress,
                            registrationType: row.RegistrationType as RegistrationType || '',
                            registrationNumber: row.RegistrationNumber,
                            gstNumber: row.GSTNumber,
                            panNumber: row.PANNumber,
                            email: row.Email,
                            eShramNumber: row.EShramNumber,
                            shopAndEstablishmentCode: row.ShopAndEstablishmentCode,
                            epfoCode: row.EPFOCode,
                            esicCode: row.ESICCode,
                            psaraLicenseNumber: row.PSARALicenseNumber,
                            psaraValidTill: row.PSARAValidTill,
                        };
    
                        companyData.entities.push(entity);
                    }
    
                    const newGroups: OrganizationGroup[] = Array.from(newGroupsMap.values()).map(gData => {
                        gData.group.companies = Array.from(gData.companiesMap.values());
                        return gData.group;
                    });
                    
                    setGroups(newGroups);
                    setToast({ message: `Successfully imported ${parsedData.length} client records.`, type: 'success' });
                } else {
                    setToast({ message: `Import not implemented for this view.`, type: 'error' });
                }
            } catch (error: any) {
                setToast({ message: error.message || 'Failed to import CSV.', type: 'error' });
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
      };


    const renderContent = () => {
        switch (activeSubcategory) {
            case 'client_structure':
                return (
                    <div className="bg-card p-6 rounded-xl shadow-card">
                        <div className="flex items-center gap-4 mb-4">
                            <Button onClick={() => setNameModalState({ isOpen: true, type: 'group', title: 'Add New Group', label: 'Group Name' })}><Plus className="mr-2 h-4" />Add Group</Button>
                        </div>
                        <div className="space-y-2">
                            {filteredGroups.map(group => (
                                <div key={group.id} className="border border-border rounded-lg">
                                    <div className="p-3 flex items-center justify-between bg-page">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => toggleExpand(group.id)}><ChevronRight className={`h-5 w-5 transition-transform ${expanded[group.id] ? 'rotate-90' : ''}`} /></button>
                                            <Building className="h-5 w-5 text-muted" />
                                            <span className="font-semibold">{group.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" onClick={() => setNameModalState({ isOpen: true, type: 'company', title: 'Add New Company', label: 'Company Name' })}>+ Add Company</Button>
                                        </div>
                                    </div>
                                    {expanded[group.id] && (
                                        <div className="p-3 space-y-2">
                                            {group.companies.map(company => (
                                                <div key={company.id} className="border border-border rounded-lg">
                                                    <div className="p-2 flex items-center justify-between bg-card">
                                                        <div className="flex items-center gap-2">
                                                             <button onClick={() => toggleExpand(company.id)}><ChevronRight className={`h-5 w-5 transition-transform ${expanded[company.id] ? 'rotate-90' : ''}`} /></button>
                                                             <span>{company.name} ({company.entities.length} clients)</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button variant="icon" size="sm" title={`View ${company.entities.length} clients`} onClick={() => setViewingClients({ companyName: company.name, clients: company.entities })}><Eye className="h-4 w-4"/></Button>
                                                            <Button variant="icon" size="sm" onClick={() => handleAddClient(company.name)}><Plus className="h-4 w-4"/></Button>
                                                        </div>
                                                    </div>
                                                    {expanded[company.id] && (
                                                        <div className="p-2">
                                                            {company.entities.map(client => (
                                                                <div key={client.id} className="p-2 flex items-center justify-between hover:bg-page rounded">
                                                                    <span>{client.name}</span>
                                                                    <div className="flex items-center gap-1">
                                                                        <Button variant="icon" size="sm" onClick={() => handleEditClient(client, company.name)}><Edit className="h-4 w-4"/></Button>
                                                                        <Button variant="icon" size="sm" onClick={() => handleDeleteClick('client', client.id, client.name)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'site_configuration':
                return (
                     <div className="bg-card p-6 rounded-xl shadow-card">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-page">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Site Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Configuration Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredOrganizations.map(org => {
                                        const config = siteConfigs.find(c => c.organizationId === org.id);
                                        const isConfigured = !!config && (!!config.billingName || !!config.keyAccountManager);
                                        return (
                                            <tr key={org.id}>
                                                <td className="px-4 py-3 font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <Building className="h-5 w-5 text-muted" />
                                                        <span>{org.shortName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isConfigured ? 
                                                        <span className="flex items-center text-green-600"><CheckCircle className="h-4 w-4 mr-1"/> Complete</span> : 
                                                        <span className="flex items-center text-yellow-600"><AlertCircle className="h-4 w-4 mr-1"/> Incomplete</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Button size="sm" variant="outline" onClick={() => setSiteConfigForm({ isOpen: true, org })}>
                                                        <Eye className="mr-2 h-4 w-4"/> View / Edit
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'costing_resource': return <CostingResourceConfig />;
            case 'backoffice_heads': return <BackofficeHeadsConfig />;
            case 'staff_designation': return <StaffDesignationConfig />;
            case 'gmc_policy': return <GmcPolicyConfig />;
            case 'asset': return <AssetConfig />;
            case 'tools_list': return <ToolsListConfig />;
            case 'attendance_format': return <AttendanceFormatConfig />;
            case 'attendance_overview': return <AttendanceOverviewConfig />;
            case 'daily_attendance': return <DailyAttendanceConfig />;
            case 'notification_template': return <NotificationTemplateConfig />;
            case 'onboard_reject_reason': return <OnboardRejectReasonConfig />;
            case 'salary_template': return <SalaryTemplateConfig />;
            case 'salary_line_item': return <SalaryLineItemConfig />;
            default:
                 const activeItem = subcategories.find(sc => sc.key === activeSubcategory);
                return <PlaceholderView title={activeItem?.label || 'Configuration'} />;
        }
    };


    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            {entityFormState.isOpen && <EntityForm {...entityFormState} onClose={() => setEntityFormState(p => ({ ...p, isOpen: false }))} onSave={handleSaveClient} />}
            <NameInputModal {...nameModalState} onClose={() => setNameModalState({ isOpen: false, type: 'group', title: '', label: '' })} onSave={nameModalState.type === 'group' ? handleAddOrEditGroup : handleAddOrEditCompany} />
            <Modal isOpen={deleteModalState.isOpen} onClose={() => setDeleteModalState(p => ({ ...p, isOpen: false }))} onConfirm={handleConfirmDelete} title="Confirm Deletion">
                Are you sure you want to delete the {deleteModalState.type} "{deleteModalState.name}"?
            </Modal>
            {siteConfigForm.isOpen && siteConfigForm.org && <SiteConfigurationForm isOpen={siteConfigForm.isOpen} onClose={() => setSiteConfigForm({ isOpen: false, org: null })} onSave={() => {}} organization={siteConfigForm.org} allClients={allClients} initialData={siteConfigs.find(c => c.organizationId === siteConfigForm.org?.id)} />}
            {viewingClients && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setViewingClients(null)}>
                    <div className="bg-card rounded-xl shadow-card p-6 w-full max-w-md m-4 animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-primary-text mb-4">Clients in {viewingClients.companyName}</h3>
                        {viewingClients.clients.length > 0 ? (
                            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {viewingClients.clients.map(client => (
                                    <li key={client.id} className="text-sm p-2 bg-page rounded-md">{client.name}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted text-center py-4">No clients found for this company.</p>
                        )}
                        <div className="mt-6 text-right">
                            <Button onClick={() => setViewingClients(null)} variant="secondary">Close</Button>
                        </div>
                    </div>
                </div>
            )}


             <AdminPageHeader title="Client Management">
                <div className="flex items-center gap-2 flex-wrap">
                    <input type="file" ref={importRef} className="hidden" accept=".csv" onChange={handleImport} />
                    <Button variant="outline" onClick={() => importRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Import</Button>
                    <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
                     <Button variant="outline" onClick={handleDownloadTemplate}><FileText className="mr-2 h-4 w-4" /> Download Template</Button>
                    <Button onClick={handleSaveAll}><Save className="mr-2 h-4 w-4" /> Save All Changes</Button>
                </div>
            </AdminPageHeader>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
                <input
                    type="text"
                    placeholder="Search across all clients and sites..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="form-input pl-10 w-full"
                />
            </div>
            
            <div>
                 <div className="relative border-b border-border flex items-center px-2">
                    <Button
                        type="button"
                        variant="icon"
                        className="!rounded-full disabled:opacity-50"
                        onClick={handlePrevPage}
                        onMouseEnter={autoClickOnHover ? () => startScrolling('prev') : undefined}
                        onMouseLeave={stopScrolling}
                        disabled={currentPage === 0}
                        aria-label="Previous subcategories"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    
                    <div className="flex-1 flex items-center justify-around gap-2 px-1 py-3 overflow-hidden">
                        {visibleSubcategories.map(sc => (
                            <button
                                key={sc.key}
                                role="tab"
                                aria-selected={activeSubcategory === sc.key}
                                onClick={() => handleTabClick(sc.key)}
                                onMouseEnter={autoClickOnHover ? () => handleTabClick(sc.key) : undefined}
                                className={`flex items-center justify-center text-center gap-2 px-3 py-2 text-sm font-medium rounded-full transition-all duration-200 flex-shrink min-w-0 ${
                                    activeSubcategory === sc.key
                                        ? 'bg-accent text-white shadow-sm'
                                        : 'bg-page text-muted hover:bg-accent-light hover:text-accent-dark hover:shadow-sm'
                                }`}
                                title={sc.label}
                            >
                                <sc.icon className="h-5 w-5 flex-shrink-0" />
                                <span className="hidden md:inline">{sc.label}</span>
                            </button>
                        ))}
                    </div>

                    <Button
                        type="button"
                        variant="icon"
                        className="!rounded-full disabled:opacity-50"
                        onClick={handleNextPage}
                        onMouseEnter={autoClickOnHover ? () => startScrolling('next') : undefined}
                        onMouseLeave={stopScrolling}
                        disabled={currentPage >= totalPages - 1}
                        aria-label="Next subcategories"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
                <div className="mt-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default EntityManagement;
