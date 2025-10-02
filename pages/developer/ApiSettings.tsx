import React, { useState } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Server, Download, ShieldCheck, Settings, Mail, Image, Phone } from 'lucide-react';
import { api } from '../../services/api';
import Toast from '../../components/ui/Toast';
import { useSettingsStore } from '../../store/settingsStore';
import Checkbox from '../../components/ui/Checkbox';
import PageInterfaceSettingsModal from '../../components/developer/PageInterfaceSettingsModal';

const SettingsCard: React.FC<{ title: string; icon: React.ElementType, children: React.ReactNode, className?: string }> = ({ title, icon: Icon, children, className }) => (
    <div className={`bg-card p-6 rounded-xl shadow-card ${className || ''}`}>
        <div className="flex items-center mb-6">
            <div className="p-3 rounded-full bg-accent-light mr-4">
                <Icon className="h-6 w-6 text-accent-dark" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-primary-text">{title}</h3>
            </div>
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);


export const ApiSettings: React.FC = () => {
    const store = useSettingsStore();
    
    const [isExporting, setIsExporting] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [isTestingPerfios, setIsTestingPerfios] = useState(false);
    const [isTestingSurepass, setIsTestingSurepass] = useState(false);
    const [isTestingAuthbridge, setIsTestingAuthbridge] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isInterfaceModalOpen, setIsInterfaceModalOpen] = useState(false);

    const handleTestConnection = async () => {
        setIsTestingConnection(true);
        const response = await api.testEmailConnection({ smtpServer: 'smtp.example.com', port: 587, username: 'user', senderEmail: 'test@test.com' });
        setToast({ message: response.message, type: response.success ? 'success' : 'error' });
        setIsTestingConnection(false);
    };

    const handleTestPerfios = async () => {
        setIsTestingPerfios(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        const success = Math.random() > 0.25;
        setToast({ message: success ? 'Perfios API connection successful!' : 'Perfios API connection failed. Check credentials.', type: success ? 'success' : 'error' });
        setIsTestingPerfios(false);
    };
    
    const handleTestSurepass = async () => {
        setIsTestingSurepass(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        const success = Math.random() > 0.25;
        setToast({ message: success ? 'Surepass API connection successful!' : 'Surepass API connection failed. Check credentials.', type: success ? 'success' : 'error' });
        setIsTestingSurepass(false);
    };

    const handleTestAuthbridge = async () => {
        setIsTestingAuthbridge(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        const success = Math.random() > 0.25;
        setToast({ message: success ? 'Authbridge API connection successful!' : 'Authbridge API connection failed. Check credentials.', type: success ? 'success' : 'error' });
        setIsTestingAuthbridge(false);
    };

    const handleExport = async () => {
        setIsExporting(true);
        setToast(null);
        try {
            const data = await api.exportAllData();
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `paradigm_backup_${new Date().toISOString()}.json`;
            link.click();
            setToast({ message: 'Data exported successfully!', type: 'success'});
        } catch (error) {
            setToast({ message: 'Failed to export data.', type: 'error'});
        } finally {
            setIsExporting(false);
        }
    };

  return (
    <div className="space-y-8">
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        <PageInterfaceSettingsModal isOpen={isInterfaceModalOpen} onClose={() => setIsInterfaceModalOpen(false)} />
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-primary-text">System Settings</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* --- COLUMN 1: INTERFACE & INTEGRATIONS --- */}
            <div className="space-y-8">
                 <SettingsCard title="Page Interface" icon={Image}>
                    <p className="text-sm text-muted -mt-2">Customize the application's branding, login screen, and user interaction settings.</p>
                    <div className="pt-4">
                        <Button type="button" onClick={() => setIsInterfaceModalOpen(true)}>Open Interface Settings</Button>
                    </div>
                </SettingsCard>
                
                 <SettingsCard title="Verification APIs" icon={ShieldCheck}>
                    <p className="text-sm text-muted -mt-2">Configure third-party services for employee verification.</p>
                    <div className="space-y-6 pt-4">
                        {/* Perfios */}
                        <div className="p-4 border rounded-lg bg-page/50">
                            <Checkbox id="perfios-enabled" label="Enable Perfios Verification" checked={store.perfiosApi.enabled} onChange={val => store.updatePerfiosApiSettings({ enabled: val })} />
                            <div className={`space-y-4 pt-4 mt-4 border-t transition-opacity ${!store.perfiosApi.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Input label="API Endpoint" value={store.perfiosApi.endpoint} onChange={e => store.updatePerfiosApiSettings({ endpoint: e.target.value })} />
                                <Input label="API Key" type="password" value={store.perfiosApi.apiKey} onChange={e => store.updatePerfiosApiSettings({ apiKey: e.target.value })} />
                                <Input label="Client Secret" type="password" value={store.perfiosApi.clientSecret} onChange={e => store.updatePerfiosApiSettings({ clientSecret: e.target.value })} />
                                <Button type="button" variant="outline" onClick={handleTestPerfios} isLoading={isTestingPerfios}>Test Connection</Button>
                            </div>
                        </div>
                        {/* Surepass */}
                        <div className="p-4 border rounded-lg bg-page/50">
                            <Checkbox id="surepass-enabled" label="Enable Surepass Verification" checked={store.surepassApi.enabled} onChange={val => store.updateSurepassApiSettings({ enabled: val })} />
                            <div className={`space-y-4 pt-4 mt-4 border-t transition-opacity ${!store.surepassApi.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Input label="API Endpoint" value={store.surepassApi.endpoint} onChange={e => store.updateSurepassApiSettings({ endpoint: e.target.value })} />
                                <Input label="API Key" type="password" value={store.surepassApi.apiKey} onChange={e => store.updateSurepassApiSettings({ apiKey: e.target.value })} />
                                <Input label="Token" type="password" value={store.surepassApi.token} onChange={e => store.updateSurepassApiSettings({ token: e.target.value })} />
                                <Button type="button" variant="outline" onClick={handleTestSurepass} isLoading={isTestingSurepass}>Test Connection</Button>
                            </div>
                        </div>
                        {/* Authbridge */}
                        <div className="p-4 border rounded-lg bg-page/50">
                             <Checkbox id="authbridge-enabled" label="Enable Authbridge Verification" checked={store.authbridgeApi.enabled} onChange={val => store.updateAuthbridgeApiSettings({ enabled: val })} />
                             <div className={`space-y-4 pt-4 mt-4 border-t transition-opacity ${!store.authbridgeApi.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                 <Input label="API Endpoint" value={store.authbridgeApi.endpoint} onChange={e => store.updateAuthbridgeApiSettings({ endpoint: e.target.value })} />
                                 <Input label="Username" value={store.authbridgeApi.username} onChange={e => store.updateAuthbridgeApiSettings({ username: e.target.value })} />
                                 <Input label="Password" type="password" value={store.authbridgeApi.password} onChange={e => store.updateAuthbridgeApiSettings({ password: e.target.value })} />
                                <Button type="button" variant="outline" onClick={handleTestAuthbridge} isLoading={isTestingAuthbridge}>Test Connection</Button>
                             </div>
                        </div>
                    </div>
                </SettingsCard>

                 <SettingsCard title="Authentication Settings" icon={Phone}>
                    <p className="text-sm text-muted -mt-2">Manage how users sign in to the application.</p>
                    <div className="space-y-6 pt-4">
                        <Checkbox
                            id="otp-enabled"
                            label="Enable OTP Phone Sign-In"
                            description="Allow users to sign in using a one-time password sent via SMS."
                            checked={store.otp.enabled}
                            onChange={val => store.updateOtpSettings({ enabled: val })}
                        />
                    </div>
                </SettingsCard>
            </div>

            {/* --- COLUMN 2: SYSTEM & DATA --- */}
            <div className="space-y-8">
                 <SettingsCard title="System & Data" icon={Settings}>
                    <p className="text-sm text-muted -mt-2">Manage core system settings and data operations.</p>
                     <div className="space-y-6 pt-4">
                         <Checkbox id="demo-mode" label="Enable Demo Mode" description="Use built-in mock data instead of a live database." checked={store.demoMode} onChange={store.toggleDemoMode} />
                         <Checkbox id="pincode-verification" label="Enable Pincode API Verification" description="Auto-fill City/State from pincode during onboarding." checked={store.address.enablePincodeVerification} onChange={val => store.updateAddressSettings({ enablePincodeVerification: val })} />
                         
                         <div className="pt-4 border-t">
                            <h4 className="font-semibold text-primary-text mb-2">Backup & Export</h4>
                            <p className="text-sm text-muted mb-4">Download all data from the active data source ({store.demoMode ? 'Mock Data' : 'Live Database'}).</p>
                            <Button variant="outline" onClick={handleExport} isLoading={isExporting}>
                                <Download className="mr-2 h-4 w-4" /> Export All Data
                            </Button>
                        </div>
                     </div>
                </SettingsCard>

                <SettingsCard title="Notification Settings" icon={Mail}>
                    <p className="text-sm text-muted -mt-2">Configure how the system sends notifications.</p>
                    <div className="space-y-6 pt-4">
                        <Checkbox
                            id="email-notif-enabled"
                            label="Enable Email Notifications"
                            description="Send emails for important events like task assignments."
                            checked={store.notifications.email.enabled}
                            onChange={val => store.updateNotificationSettings({ email: { enabled: val } })}
                        />
                        <div className="pt-4 border-t">
                             <h4 className="font-semibold text-primary-text mb-2">Email Integration (SMTP)</h4>
                             <p className="text-sm text-muted mb-4">Configure SMTP settings for sending system emails. (Mocked)</p>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="SMTP Server" defaultValue="smtp.example.com" />
                                <Input label="Port" type="number" defaultValue="587" />
                             </div>
                             <Button type="button" variant="outline" onClick={handleTestConnection} isLoading={isTestingConnection} className="mt-4">Test Connection</Button>
                         </div>
                    </div>
                </SettingsCard>
            </div>
        </div>
    </div>
  );
};