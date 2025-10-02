
import React, { useRef, useState, useEffect } from 'react';
// FIX: Corrected named imports from react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import Button from '../../components/ui/Button';
import type { OnboardingData, FamilyMember } from '../../types';
import { api } from '../../services/api';
import { Download, ShieldCheck } from 'lucide-react';
import { useOnboardingStore } from '../../store/onboardingStore';

const InsurancePdfOutput: React.FC = () => {
    const { id } = ReactRouterDOM.useParams<{ id: string }>();
    const [employeeData, setEmployeeData] = useState<OnboardingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAccepted, setIsAccepted] = useState(false);
    const pdfRef = useRef<HTMLDivElement>(null);
    const { data: storeData } = useOnboardingStore();

    useEffect(() => {
        const fetchData = async () => {
            if (id && !id.startsWith('draft_')) {
                setIsLoading(true);
                const data = await api.getOnboardingDataById(id);
                setEmployeeData(data || null);
                setIsLoading(false);
            } else {
                // Use data from the store for drafts
                setEmployeeData(storeData);
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, storeData]);
    
    const handleExport = () => {
        const element = pdfRef.current;
        if (element) {
            const opt = {
                margin: 0.5,
                filename: `Insurance_Card_${employeeData?.personal.employeeId}.pdf`,
                // FIX: Cast image type to const to satisfy html2pdf.js options type.
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2 },
                // FIX: Cast orientation to const to satisfy html2pdf.js options type.
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
            };
            html2pdf().from(element).set(opt).save();
        }
    };

    if (isLoading) return <div className="text-center p-10">Loading employee data...</div>;
    if (!employeeData) return <div className="text-center p-10 text-red-500">Could not find employee data.</div>;

    const { personal, family, gmc } = employeeData;
    const dependents = family.filter(f => f.dependent);

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
             <div ref={pdfRef} className="bg-card p-8 rounded-xl border border-border">
                <header className="flex justify-between items-center border-b pb-4 mb-6">
                    <div><h1 className="text-2xl font-bold text-accent-dark">Paradigm Inc.</h1><p className="text-muted">Group Medical Insurance Plan</p></div>
                    <ShieldCheck className="h-12 w-12 text-accent" />
                </header>

                <section className="mb-6">
                    <h2 className="text-lg font-semibold border-b pb-2 mb-4">Employee Details</h2>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                        <div><strong>Name:</strong> {personal.firstName} {personal.lastName}</div>
                        <div><strong>Employee ID:</strong> {personal.employeeId}</div>
                        <div><strong>DOB:</strong> {personal.dob}</div>
                        <div><strong>Gender:</strong> {personal.gender}</div>
                    </div>
                </section>
                
                {gmc.isOptedIn && (
                <section className="mb-6">
                    <h2 className="text-lg font-semibold border-b pb-2 mb-4">Nominee Details</h2>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                        <div><strong>Nominee:</strong> {gmc.nomineeName}</div><div><strong>Relationship:</strong> {gmc.nomineeRelation}</div>
                    </div>
                </section>
                )}

                {gmc.isOptedIn && dependents.length > 0 && (
                    <section className="mb-6">
                        <h2 className="text-lg font-semibold border-b pb-2 mb-4">Covered Dependents</h2>
                         <table className="w-full text-sm text-left"><thead className="bg-page"><tr><th className="p-2">Name</th><th className="p-2">Relationship</th><th className="p-2">DOB</th></tr></thead>
                            <tbody>{dependents.map((d: FamilyMember) => (<tr key={d.id} className="border-b"><td className="p-2">{d.name}</td><td className="p-2">{d.relation}</td><td className="p-2">{d.dob}</td></tr>))}</tbody>
                        </table>
                    </section>
                )}
                
                 {isAccepted && (<footer className="mt-10 pt-6 border-t text-center text-xs text-gray-500">
                    <p>This document confirms your enrollment in the Paradigm Inc. Group Medical Insurance plan. This is a system-generated document and does not require a signature.</p>
                    <p className="mt-2 font-semibold">Digitally accepted by {personal.firstName} {personal.lastName} on {new Date().toLocaleDateString()}</p>
                </footer>)}
            </div>
            <div className="text-center mt-8 p-4 bg-accent-light rounded-lg">
                 <div className="flex items-start justify-center">
                    <input id="acceptance" name="acceptance" type="checkbox" checked={isAccepted} onChange={(e) => setIsAccepted(e.target.checked)} className="focus:ring-accent h-4 w-4 text-accent border-gray-300 rounded mt-1"/>
                    <label htmlFor="acceptance" className="ml-3 text-sm text-primary-text">I hereby declare that the dependents and nominee details provided are correct to the best of my knowledge.</label>
                </div>
                <Button onClick={handleExport} disabled={!isAccepted} className="mt-4">
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
            </div>
        </div>
    );
};

export default InsurancePdfOutput;