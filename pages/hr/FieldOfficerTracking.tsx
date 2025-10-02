
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../services/api';
import type { AttendanceEvent, User } from '../../types';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { Loader2, MapPin } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import DatePicker from '../../components/ui/DatePicker';
import Select from '../../components/ui/Select';

const FieldOfficerTracking: React.FC = () => {
    const [events, setEvents] = useState<AttendanceEvent[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [selectedOfficer, setSelectedOfficer] = useState('all');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [eventsData, usersData] = await Promise.all([
                api.getAllAttendanceEvents(startDate, endDate),
                api.getFieldOfficers()
            ]);
            setEvents(eventsData);
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to fetch tracking data", error);
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredEvents = useMemo(() => {
        let results = events;
        if (selectedOfficer !== 'all') {
            results = results.filter(e => e.userId === selectedOfficer);
        }
        const userMap = new Map(users.map(u => [u.id, u.name]));
        return results
            .map(event => ({ ...event, userName: userMap.get(event.userId) || 'Unknown Officer' }))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [events, users, selectedOfficer]);

    return (
        <div className="bg-card p-6 sm:p-8 rounded-xl shadow-card">
            <AdminPageHeader title="Field Officer Tracking">
                <div className="flex flex-wrap gap-2">
                    <div className="w-48"><DatePicker label="" id="start-date" value={startDate} onChange={setStartDate} /></div>
                    <div className="w-48"><DatePicker label="" id="end-date" value={endDate} onChange={setEndDate} /></div>
                    <div className="w-56">
                        <Select label="" id="officer-select" value={selectedOfficer} onChange={e => setSelectedOfficer(e.target.value)}>
                            <option value="all">All Field Officers</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </Select>
                    </div>
                </div>
            </AdminPageHeader>

            <div className="overflow-x-auto border border-border rounded-lg">
                <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-page">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-muted">Field Officer</th>
                            <th className="px-4 py-3 text-left font-medium text-muted">Date & Time</th>
                            <th className="px-4 py-3 text-left font-medium text-muted">Event</th>
                            <th className="px-4 py-3 text-left font-medium text-muted">Location</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            <tr><td colSpan={4} className="text-center py-16"><Loader2 className="h-8 w-8 animate-spin mx-auto text-accent"/></td></tr>
                        ) : filteredEvents.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-16 text-muted">No attendance records found for the selected criteria.</td></tr>
                        ) : (
                            filteredEvents.map(event => (
                                <tr key={event.id}>
                                    <td className="px-4 py-3 font-medium">{event.userName}</td>
                                    <td className="px-4 py-3 text-muted">{format(new Date(event.timestamp), 'dd MMM, yyyy - hh:mm a')}</td>
                                    <td className="px-4 py-3 text-muted capitalize">{event.type}</td>
                                    <td className="px-4 py-3 text-muted">
                                        {event.latitude && event.longitude ? (
                                            <a 
                                                href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center text-accent hover:underline"
                                            >
                                                <MapPin className="h-4 w-4 mr-1.5" />
                                                View on Map
                                            </a>
                                        ) : (
                                            <span>N/A</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FieldOfficerTracking;