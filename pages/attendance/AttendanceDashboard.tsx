
import React, { useState, useEffect, useCallback, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { usePermissionsStore } from '../../store/permissionsStore';
import { useSettingsStore } from '../../store/settingsStore';
import type { AttendanceEvent, DailyAttendanceRecord, DailyAttendanceStatus, User, LeaveRequest, Holiday, AttendanceSettings, OnboardingData, Organization } from '../../types';
import { format, getDaysInMonth, addDays } from 'date-fns';
import { Loader2, Download, Users, UserCheck, UserX, Clock, BarChart3, TrendingUp, MapPin } from 'lucide-react';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import DatePicker from '../../components/ui/DatePicker';
import Toast from '../../components/ui/Toast';
import Input from '../../components/ui/Input';


// --- Date Helper Functions ---
const getEndOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

const getEachDayOfInterval = (interval: { start: Date; end: Date }): Date[] => {
    const dates = [];
    const currentDate = new Date(interval.start);
    const endDate = new Date(interval.end);
    currentDate.setHours(0, 0, 0, 0); // Normalize to start of day
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

const getStartOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

const getEndOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};


// --- Reusable Dashboard Components ---
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-page p-4 rounded-xl flex items-center col-span-1">
        <div className="p-3 rounded-full bg-accent-light mr-4">
            <Icon className="h-6 w-6 text-accent-dark" />
        </div>
        <div>
            <p className="text-sm text-muted font-medium">{title}</p>
            <p className="text-2xl font-bold text-primary-text">{value}</p>
        </div>
    </div>
);

const ChartContainer: React.FC<{ title: string, icon: React.ElementType, children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-card p-6 rounded-xl shadow-card col-span-1 md:col-span-2 lg:col-span-1">
        <div className="flex items-center mb-4">
            <Icon className="h-5 w-5 mr-3 text-muted" />
            <h3 className="font-semibold text-primary-text">{title}</h3>
        </div>
        <div className="h-60">{children}</div>
    </div>
);

const AttendanceTrendChart: React.FC<{ data: { date: string; present: number; absent: number }[] }> = ({ data }) => {
    const maxVal = Math.max(...data.map(d => Math.max(d.present, d.absent)), 1);
    return (
        <div className="flex h-full items-end justify-around gap-2 text-center">
            {data.map(d => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex-1 flex items-end w-full gap-1 justify-center">
                        <div className="w-1/2 bg-green-300 rounded-t-sm transition-all duration-300 hover:bg-green-400" style={{ height: `${(d.present / maxVal) * 100}%` }} title={`Present: ${d.present}`}></div>
                        <div className="w-1/2 bg-red-300 rounded-t-sm transition-all duration-300 hover:bg-red-400" style={{ height: `${(d.absent / maxVal) * 100}%` }} title={`Absent: ${d.absent}`}></div>
                    </div>
                    <span className="text-xs text-muted">{d.date}</span>
                </div>
            ))}
        </div>
    );
};

const ProductivityChart: React.FC<{ data: { date: string, hours: number }[] }> = ({ data }) => {
    const maxHours = Math.max(...data.map(d => d.hours), 1);
     return (
        <div className="flex h-full items-end justify-around gap-2 text-center">
            {data.map(d => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                     <span className="text-xs font-semibold">{d.hours.toFixed(1)}h</span>
                    <div className="w-4 bg-blue-200 rounded-t-md transition-all duration-300 hover:bg-blue-300" style={{ height: `${(d.hours / maxHours) * 100}%` }}></div>
                    <span className="text-xs text-muted">{d.date}</span>
                </div>
            ))}
        </div>
    );
};

const SiteAttendanceChart: React.FC<{ data: { name: string, rate: number }[] }> = ({ data }) => {
    return (
        <div className="h-full flex flex-col justify-end gap-2">
            {data.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                    <span className="text-xs text-muted w-20 text-right truncate">{d.name}</span>
                    <div className="flex-1 bg-page rounded-full h-4">
                         <div className="bg-accent rounded-full h-4 text-right pr-2 text-white text-xs flex items-center justify-end transition-all duration-500" style={{ width: `${d.rate}%` }}>
                            {d.rate.toFixed(0)}%
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Data Processing Logic ---
const generateAttendanceRecords = (
    startDate: Date,
    endDate: Date,
    events: AttendanceEvent[],
    approvedLeaves: LeaveRequest[],
    holidays: Holiday[],
    attendanceSettings: AttendanceSettings
): DailyAttendanceRecord[] => {
    const interval = { start: startDate, end: endDate };
    const dateRange = getEachDayOfInterval(interval);
    
    return dateRange.map(date => {
        const dateString = format(date, 'yyyy-MM-dd');
        const dayOfWeek = date.getDay();

        const approvedLeave = approvedLeaves.find(leave => {
            const leaveStart = new Date(leave.startDate.replace(/-/g, '/'));
            const leaveEnd = getEndOfDay(new Date(leave.endDate.replace(/-/g, '/')));
            const currentDate = new Date(date);
            currentDate.setHours(0,0,0,0);
            leaveStart.setHours(0,0,0,0);
            return currentDate >= leaveStart && currentDate <= leaveEnd;
        });
        if (approvedLeave) {
            const status = approvedLeave.dayOption === 'half' ? 'On Leave (Half)' : 'On Leave (Full)';
            return { date: dateString, day: format(date, 'EEEE'), checkIn: null, checkOut: null, duration: null, status };
        }

        const isHoliday = holidays.find(h => h.date === dateString);
        if (isHoliday) return { date: dateString, day: format(date, 'EEEE'), checkIn: null, checkOut: null, duration: null, status: 'Holiday' };
        if (dayOfWeek === 0) return { date: dateString, day: format(date, 'EEEE'), checkIn: null, checkOut: null, duration: null, status: 'Weekend' };
        
        const dayEvents = events.filter(e => format(new Date(e.timestamp), 'yyyy-MM-dd') === dateString);
        const checkIns = dayEvents.filter(e => e.type === 'check-in').sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const checkOuts = dayEvents.filter(e => e.type === 'check-out').sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        if (checkIns.length === 0) return { date: dateString, day: format(date, 'EEEE'), checkIn: null, checkOut: null, duration: null, status: 'Absent' };

        const firstCheckIn = new Date(checkIns[0].timestamp);
        const lastCheckOut = checkOuts.length > 0 ? new Date(checkOuts[checkOuts.length - 1].timestamp) : null;
        
        if (!lastCheckOut) return { date: dateString, day: format(date, 'EEEE'), checkIn: format(firstCheckIn, 'HH:mm'), checkOut: null, duration: null, status: 'Incomplete' };

        const durationMs = lastCheckOut.getTime() - firstCheckIn.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        
        let status: DailyAttendanceStatus = 'Absent';
        if (durationHours >= attendanceSettings.minimumHoursFullDay) status = 'Present';
        else if (durationHours >= attendanceSettings.minimumHoursHalfDay) status = 'Half Day';
        
        return {
            date: dateString, day: format(date, 'EEEE'),
            checkIn: format(firstCheckIn, 'HH:mm'), checkOut: format(lastCheckOut, 'HH:mm'),
            duration: `${durationHours.toFixed(2)}`, status,
        };
    });
};

interface DashboardData {
    totalEmployees: number;
    presentToday: number;
    absentToday: number;
    onLeaveToday: number;
    attendanceTrend: { date: string; present: number; absent: number }[];
    productivityTrend: { date: string; hours: number }[];
    attendanceBySite: { name: string; rate: number }[];
}

const AttendanceDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const { permissions } = usePermissionsStore();
    const { attendance: attendanceSettings, holidays } = useSettingsStore();

    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    
    const canDownloadReport = user && permissions[user.role]?.includes('download_attendance_report');
    
    useEffect(() => {
        if (canDownloadReport) {
            api.getUsers().then(setAllUsers);
        }
    }, [canDownloadReport]);
    
    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const today = new Date();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(today.getDate() - 6);
                const aMonthAgo = new Date();
                aMonthAgo.setMonth(today.getMonth() - 1);

                // FIX: Fetch users first, then fetch their events based on the retrieved user list.
                const users = await api.getUsers();

                const [submissions, organizations, allApprovedLeaves, allEvents] = await Promise.all([
                    api.getVerificationSubmissions(),
                    api.getOrganizations(),
                    api.getLeaveRequests({ status: 'approved' }),
                    Promise.all(users.map(u => api.getAttendanceEvents(u.id, aMonthAgo.toISOString(), getEndOfDay(today).toISOString()))).then(res => res.flat())
                ]);
                
                let presentCount = 0, absentCount = 0, onLeaveCount = 0;
                
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                for (const u of users) {
                    const leavesForUser = allApprovedLeaves.filter(l => l.userId === u.id);
                    const eventsForUser = allEvents.filter(e => e.userId === u.id);
                    const todayRecord = generateAttendanceRecords(todayStart, getEndOfDay(today), eventsForUser, leavesForUser, holidays, attendanceSettings)[0];
                    
                    if (todayRecord.status.startsWith('On Leave')) onLeaveCount++;
                    else if (todayRecord.status === 'Present' || todayRecord.status === 'Half Day') presentCount++;
                    // FIX: Removed redundant and erroneous conditional check. The 'generateAttendanceRecords' function already ensures 'Absent' status is only for workdays.
                    else if (todayRecord.status === 'Absent') {
                        absentCount++;
                    }
                }

                const dateInterval = getEachDayOfInterval({ start: sevenDaysAgo, end: today });
                
                const attendanceTrend = dateInterval.map(day => {
                    let dailyPresent = 0, dailyAbsent = 0;
                    for (const u of users) {
                         const rec = generateAttendanceRecords(day, getEndOfDay(day), allEvents.filter(e=>e.userId === u.id), allApprovedLeaves.filter(l=>l.userId === u.id), holidays, attendanceSettings)[0];
                        if (rec.status === 'Present' || rec.status === 'Half Day') dailyPresent++;
                        else if (rec.status === 'Absent') dailyAbsent++;
                    }
                    return { date: format(day, 'MMM d'), present: dailyPresent, absent: dailyAbsent };
                });

                const productivityTrend = dateInterval.map(day => {
                    let totalHours = 0, presentUsers = 0;
                    for (const u of users) {
                         const rec = generateAttendanceRecords(day, getEndOfDay(day), allEvents.filter(e=>e.userId === u.id), allApprovedLeaves.filter(l=>l.userId === u.id), holidays, attendanceSettings)[0];
                         if (rec.status === 'Present' || rec.status === 'Half Day') {
                             totalHours += parseFloat(rec.duration || '0');
                             presentUsers++;
                         }
                    }
                    return { date: format(day, 'MMM d'), hours: presentUsers > 0 ? totalHours / presentUsers : 0 };
                });
                
                const siteData: Record<string, {name: string, presentDays: number, workDays: number}> = {};
                organizations.forEach(org => {
                    siteData[org.id] = { name: org.shortName, presentDays: 0, workDays: 0 };
                });
                
                const fullDateInterval = getEachDayOfInterval({start: aMonthAgo, end: today});
                for(const day of fullDateInterval) {
                     const isWorkday = day.getDay() !== 0 && !holidays.find(h => h.date === format(day, 'yyyy-MM-dd'));
                     if (isWorkday) {
                         for (const u of users) {
                             const orgId = u.organizationId || submissions.find(s => s.personal.email === u.email)?.organization?.organizationId;
                             if (orgId && siteData[orgId]) {
                                 siteData[orgId].workDays++;
                                 const rec = generateAttendanceRecords(day, getEndOfDay(day), allEvents.filter(e=>e.userId === u.id), allApprovedLeaves.filter(l=>l.userId === u.id), holidays, attendanceSettings)[0];
                                 if (rec.status === 'Present') siteData[orgId].presentDays++;
                                 else if (rec.status === 'Half Day') siteData[orgId].presentDays += 0.5;
                             }
                         }
                     }
                }
                
                const attendanceBySite = Object.values(siteData)
                    .map(site => ({ name: site.name, rate: site.workDays > 0 ? (site.presentDays / site.workDays) * 100 : 0 }))
                    .filter(site => site.rate > 0)
                    .sort((a, b) => b.rate - a.rate);

                setDashboardData({ totalEmployees: users.length, presentToday: presentCount, absentToday: absentCount, onLeaveToday: onLeaveCount, attendanceTrend, productivityTrend, attendanceBySite });

            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, [holidays, attendanceSettings]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
    }

    return (
        <div className="space-y-6">
            {isReportModalOpen && <ReportModal allUsers={allUsers} onClose={() => setIsReportModalOpen(false)} />}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-primary-text">Attendance Dashboard</h2>
                {canDownloadReport && <Button variant="outline" onClick={() => setIsReportModalOpen(true)}><Download className="mr-2 h-4 w-4" /> Download Report</Button>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Employees" value={dashboardData?.totalEmployees || 0} icon={Users} />
                <StatCard title="Present Today" value={dashboardData?.presentToday || 0} icon={UserCheck} />
                <StatCard title="Absent Today" value={dashboardData?.absentToday || 0} icon={UserX} />
                <StatCard title="On Leave Today" value={dashboardData?.onLeaveToday || 0} icon={Clock} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ChartContainer title="7-Day Attendance Trend" icon={BarChart3}>
                    {dashboardData && <AttendanceTrendChart data={dashboardData.attendanceTrend} />}
                </ChartContainer>
                <ChartContainer title="Productivity Trend (Avg. Hours)" icon={TrendingUp}>
                    {dashboardData && <ProductivityChart data={dashboardData.productivityTrend} />}
                </ChartContainer>
                 <ChartContainer title="Attendance Rate by Site" icon={MapPin}>
                    {dashboardData && <SiteAttendanceChart data={dashboardData.attendanceBySite} />}
                </ChartContainer>
            </div>
        </div>
    );
};

// --- Report Modal Component ---
type ReportFormat = 'monthlyMuster' | 'customLog';
type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';
type ReportRecord = DailyAttendanceRecord & { userName: string; userId: string };

interface MonthlyReportRow {
    slNo: number;
    refNo: string;
    staffName: string;
    dayGrid: { [day: number]: string };
    present: number;
    weekOff: number;
    leaves: number;
    absent: number;
    halfDay: number;
    holidays: number;
    totalPayable: number;
}

const processDataForMonthlyReport = (
    slNo: number,
    user: User,
    submission: OnboardingData | undefined,
    dailyRecords: DailyAttendanceRecord[]
): MonthlyReportRow => {
    const summary = { present: 0, weekOff: 0, leaves: 0, absent: 0, halfDay: 0, holidays: 0 };
    const dayGrid: { [day: number]: string } = {};

    dailyRecords.forEach(record => {
        const dayOfMonth = new Date(record.date.replace(/-/g, '/')).getDate();
        let statusChar = '';
        switch (record.status) {
            case 'Present': summary.present++; statusChar = 'P'; break;
            case 'Absent': summary.absent++; statusChar = 'A'; break;
            case 'Half Day': summary.halfDay++; statusChar = 'HD'; break;
            case 'On Leave (Full)':
            case 'On Leave (Half)': summary.leaves++; statusChar = 'L'; break;
            case 'Weekend': summary.weekOff++; statusChar = 'WO'; break;
            case 'Holiday': summary.holidays++; statusChar = 'H'; break;
            default: statusChar = '-';
        }
        dayGrid[dayOfMonth] = statusChar;
    });

    const totalPayable = summary.present + (summary.halfDay * 0.5) + summary.leaves + summary.holidays + summary.weekOff;

    return {
        slNo,
        refNo: submission?.personal.employeeId || user.id,
        staffName: user.name,
        dayGrid,
        ...summary,
        totalPayable,
    };
};

const convertToMonthlyCSV = (data: MonthlyReportRow[], monthDate: Date): string => {
    const daysInMonth = getDaysInMonth(monthDate);
    const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
    
    const headers = [
        'SL.No', 'Ref No', 'Staff Name',
        ...dayHeaders,
        'Present', 'Half Day', 'Absent', 'Leaves', 'Week Off', 'Holidays', 'Total Payable Days'
    ].join(',');
    
    const rows = data.map(row => {
        const dayCells = Array.from({ length: daysInMonth }, (_, i) => row.dayGrid[i + 1] || '');
        const rowData = [
            row.slNo,
            `"${row.refNo}"`,
            `"${row.staffName}"`,
            ...dayCells,
            row.present,
            row.halfDay,
            row.absent,
            row.leaves,
            row.weekOff,
            row.holidays,
            row.totalPayable.toFixed(1)
        ];
        return rowData.join(',');
    });

    return [headers, ...rows].join('\n');
};

const ReportModal: React.FC<{ allUsers: User[]; onClose: () => void }> = ({ allUsers, onClose }) => {
    const [reportUser, setReportUser] = useState<string>('all');
    const [reportFormat, setReportFormat] = useState<ReportFormat>('monthlyMuster');
    const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('monthly');
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [day, setDay] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [week, setWeek] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [customStart, setCustomStart] = useState<string>(format(getStartOfMonth(new Date()), 'yyyy-MM-dd'));
    const [customEnd, setCustomEnd] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStatus, setGenerationStatus] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [reportError, setReportError] = useState('');
    const [pdfContent, setPdfContent] = useState<React.ReactElement | null>(null);
    const pdfRef = useRef<HTMLDivElement>(null);

    const { attendance: attendanceSettings, holidays } = useSettingsStore();
    
    useEffect(() => {
        let interval: number;
        if (isGenerating) {
            const statuses = ["Fetching data...", "Processing records...", "Compiling report...", "Almost there..."];
            let statusIndex = 0;
            setGenerationStatus(statuses[statusIndex]);
            interval = window.setInterval(() => {
                statusIndex = (statusIndex + 1) % statuses.length;
                setGenerationStatus(statuses[statusIndex]);
            }, 1500);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isGenerating]);

    useEffect(() => {
        if (pdfContent && pdfRef.current) {
            const element = pdfRef.current;
            const isMuster = reportFormat === 'monthlyMuster';
            const opt = {
                margin: 0.5,
                filename: `Attendance_Report_${Date.now()}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: isMuster ? 'legal' : 'a4', orientation: isMuster ? 'landscape' as const : 'portrait' as const }
            };
            html2pdf().from(element).set(opt).save().then(() => {
                setPdfContent(null);
                setIsGenerating(false);
                setToast({ message: 'PDF generated successfully!', type: 'success' });
                onClose();
            }).catch(err => {
                 setToast({ message: 'Failed to generate PDF.', type: 'error' });
                 setIsGenerating(false);
                 setPdfContent(null);
            });
        }
    }, [pdfContent, reportFormat, onClose]);


    const convertToDailyCSV = (data: ReportRecord[]) => {
        const headers = ['Date', 'Day', 'Employee ID', 'Employee Name', 'Check-In', 'Check-Out', 'Duration', 'Status'];
        const rows = data.map(rec => [rec.date, rec.day, `"${rec.userId}"`, `"${rec.userName}"`, rec.checkIn || '', rec.checkOut || '', rec.duration || '', rec.status].join(','));
        return [headers.join(','), ...rows].join('\n');
    };
    
    const getReportDates = (): { startDate: Date; endDate: Date } | null => {
        let startDate: Date;
        let endDate: Date;
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (reportFormat === 'monthlyMuster') {
            startDate = new Date(month.replace(/-/g, '/') + '/01');
            endDate = getEndOfMonth(startDate);
        } else { // customLog
             switch(reportPeriod) {
                case 'daily':
                    startDate = new Date(day.replace(/-/g, '/'));
                    endDate = new Date(day.replace(/-/g, '/'));
                    break;
                case 'weekly':
                    const weekDate = new Date(week.replace(/-/g, '/'));
                    const dayOfWeek = weekDate.getDay();
                    const diff = weekDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                    startDate = new Date(weekDate.setDate(diff));
                    endDate = addDays(startDate, 6);
                    break;
                case 'monthly':
                    startDate = new Date(month.replace(/-/g, '/') + '/01');
                    endDate = getEndOfMonth(startDate);
                    break;
                case 'custom':
                default:
                    startDate = new Date(customStart.replace(/-/g, '/'));
                    endDate = new Date(customEnd.replace(/-/g, '/'));
                    break;
            }
        }
        
        if (endDate > today) {
            setReportError("End date cannot be in the future.");
            return null;
        }
        if (startDate > endDate) {
            setReportError("Start date cannot be after the end date.");
            return null;
        }
        setReportError('');
        return { startDate, endDate };
    };


    const handleGenerate = async (formatType: 'csv' | 'pdf') => {
        setIsGenerating(true);
        const dates = getReportDates();
        if (!dates) {
            setIsGenerating(false);
            return;
        }
        const { startDate, endDate } = dates;
        
        try {
            const usersToProcess = reportUser === 'all' ? allUsers : allUsers.filter(u => u.id === reportUser);
            if (usersToProcess.length === 0) throw new Error("No users selected for report.");
            
            if (reportFormat === 'monthlyMuster') {
                const allSubmissions = await api.getVerificationSubmissions();
                const monthlyReportData = await Promise.all(usersToProcess.map(async (user, index) => {
                    const userSubmission = allSubmissions.find(s => s.personal.email === user.email);
                    const [events, leaves] = await Promise.all([
                        api.getAttendanceEvents(user.id, startDate.toISOString(), endDate.toISOString()),
                        api.getLeaveRequests({ userId: user.id, status: 'approved' })
                    ]);
                    const dailyRecords = generateAttendanceRecords(startDate, endDate, events, leaves, holidays, attendanceSettings);
                    return processDataForMonthlyReport(index + 1, user, userSubmission, dailyRecords);
                }));

                if (formatType === 'csv') {
                    const csvData = convertToMonthlyCSV(monthlyReportData, startDate);
                    const fileName = `Monthly_Report_Attendance_${format(startDate, 'MMM_yyyy')}.csv`;
                    triggerDownload(csvData, fileName);
                } else {
                    setPdfContent(<PdfMusterReport data={monthlyReportData} monthDate={startDate} />);
                }
            } else { // 'customLog'
                let allRecords: ReportRecord[] = [];
                for (const user of usersToProcess) {
                    const [events, leaves] = await Promise.all([
                      api.getAttendanceEvents(user.id, startDate.toISOString(), endDate.toISOString()),
                      api.getLeaveRequests({ userId: user.id, status: 'approved' })
                    ]);
                    const userRecords = generateAttendanceRecords(startDate, endDate, events, leaves, holidays, attendanceSettings);
                    allRecords.push(...userRecords.map(rec => ({ ...rec, userId: user.id, userName: user.name })));
                }
                if (allRecords.length === 0) throw new Error('No data found for the selected criteria.');

                if (formatType === 'csv') {
                    const csvData = convertToDailyCSV(allRecords);
                    const fileName = `attendance_log_${reportUser}_${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.csv`;
                    triggerDownload(csvData, fileName);
                } else {
                    setPdfContent(<PdfDailyLogReport data={allRecords} startDate={startDate} endDate={endDate} />);
                }
            }

        } catch (error: any) {
            setToast({ message: error.message || 'Failed to generate report.', type: 'error' });
            setIsGenerating(false);
        }
    };
    
    const triggerDownload = (csvData: string, fileName: string) => {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToast({ message: 'Report generated successfully!', type: 'success' });
        setIsGenerating(false);
        onClose();
    };

    const handleGenerateCsv = () => handleGenerate('csv');
    const handleGeneratePdf = () => handleGenerate('pdf');

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '11in' }}><div ref={pdfRef}>{pdfContent}</div></div>
        
        <div className="bg-card rounded-xl shadow-card p-6 w-full max-w-lg m-4 animate-fade-in-scale" onClick={e => e.stopPropagation()}>
            {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="p-4 rounded-full bg-accent-light animate-pulse-bg">
                        <Loader2 className="h-10 w-10 animate-spin text-accent" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-primary-text">Generating Report</p>
                    <p className="text-muted">{generationStatus}</p>
                </div>
            ) : (
            <>
                <h3 className="text-lg font-bold text-primary-text mb-4">Generate Attendance Report</h3>
                <div className="space-y-4">
                    <Select label="Employee" id="report-user" value={reportUser} onChange={e => setReportUser(e.target.value)}>
                        <option value="all">All Employees</option>
                        {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </Select>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">Report Format</label>
                        <div className="flex gap-2 p-1 bg-page rounded-lg">
                            {(['monthlyMuster', 'customLog'] as ReportFormat[]).map(type => (
                                <button key={type} onClick={() => setReportFormat(type)} className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${reportFormat === type ? 'bg-card shadow-sm' : 'hover:bg-card/50'}`}>
                                    {type === 'monthlyMuster' ? 'Monthly Report Attendance' : 'Custom Attendance Log'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {reportFormat === 'monthlyMuster' && (
                        <Input label="Select Month" id="month-select" type="month" value={month} onChange={e => setMonth(e.target.value)} max={format(new Date(), 'yyyy-MM')} />
                    )}

                    {reportFormat === 'customLog' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1">Period</label>
                                <div className="flex gap-2 p-1 bg-page rounded-lg">
                                    {(['daily', 'weekly', 'monthly', 'custom'] as ReportPeriod[]).map(type => (
                                        <button key={type} onClick={() => setReportPeriod(type)} className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${reportPeriod === type ? 'bg-card shadow-sm' : 'hover:bg-card/50'}`}>{type}</button>
                                    ))}
                                </div>
                            </div>
                            {reportPeriod === 'daily' && <DatePicker label="Select Day" id="day-select" value={day} onChange={setDay} maxDate={new Date()} />}
                            {reportPeriod === 'weekly' && <DatePicker label="Select any day in week" id="week-select" value={week} onChange={setWeek} maxDate={new Date()} />}
                            {reportPeriod === 'monthly' && <Input label="Select Month" id="month-select-log" type="month" value={month} onChange={e => setMonth(e.target.value)} max={format(new Date(), 'yyyy-MM')} />}
                            {reportPeriod === 'custom' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <DatePicker label="Start Date" id="custom-start" value={customStart} onChange={setCustomStart} maxDate={new Date()} />
                                    <DatePicker label="End Date" id="custom-end" value={customEnd} onChange={setCustomEnd} maxDate={new Date()} />
                                </div>
                            )}
                        </>
                    )}
                    {reportError && <p className="text-sm text-red-600">{reportError}</p>}
                </div>
                <div className="flex justify-end gap-3 pt-6 mt-4 border-t">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleGenerateCsv}>Generate CSV</Button>
                    <Button onClick={handleGeneratePdf}>Generate PDF</Button>
                </div>
            </>
            )}
        </div>
      </div>
    );
};

// --- PDF Content Components ---
const PdfMusterReport: React.FC<{ data: MonthlyReportRow[], monthDate: Date }> = ({ data, monthDate }) => {
    const daysInMonth = getDaysInMonth(monthDate);
    return (
        <div className="p-4 font-sans text-xs">
            <h2 className="text-lg font-bold text-center mb-2">Attendance Muster Roll - {format(monthDate, 'MMMM yyyy')}</h2>
            <table className="w-full border-collapse border border-gray-400">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border p-1">SL</th>
                        <th className="border p-1">Ref No</th>
                        <th className="border p-1">Name</th>
                        {Array.from({ length: daysInMonth }, (_, i) => <th key={i} className="border p-1 w-6">{i + 1}</th>)}
                        <th className="border p-1">P</th>
                        <th className="border p-1">HD</th>
                        <th className="border p-1">A</th>
                        <th className="border p-1">L</th>
                        <th className="border p-1">WO</th>
                        <th className="border p-1">H</th>
                        <th className="border p-1">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(row => (
                        <tr key={row.slNo}>
                            <td className="border p-1">{row.slNo}</td>
                            <td className="border p-1">{row.refNo}</td>
                            <td className="border p-1">{row.staffName}</td>
                            {Array.from({ length: daysInMonth }, (_, i) => <td key={i} className="border p-1 text-center">{row.dayGrid[i + 1] || ''}</td>)}
                            <td className="border p-1 text-center">{row.present}</td>
                            <td className="border p-1 text-center">{row.halfDay}</td>
                            <td className="border p-1 text-center">{row.absent}</td>
                            <td className="border p-1 text-center">{row.leaves}</td>
                            <td className="border p-1 text-center">{row.weekOff}</td>
                            <td className="border p-1 text-center">{row.holidays}</td>
                            <td className="border p-1 text-center font-bold">{row.totalPayable.toFixed(1)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const PdfDailyLogReport: React.FC<{ data: ReportRecord[], startDate: Date, endDate: Date }> = ({ data, startDate, endDate }) => (
    <div className="p-4 font-sans text-xs">
        <h2 className="text-lg font-bold text-center mb-2">Attendance Log</h2>
        <p className="text-center text-sm mb-4">{format(startDate, 'dd MMM, yyyy')} - {format(endDate, 'dd MMM, yyyy')}</p>
        <table className="w-full border-collapse border border-gray-400">
            <thead className="bg-gray-200">
                <tr>
                    <th className="border p-1">Date</th>
                    <th className="border p-1">Employee</th>
                    <th className="border p-1">Check-In</th>
                    <th className="border p-1">Check-Out</th>
                    <th className="border p-1">Duration</th>
                    <th className="border p-1">Status</th>
                </tr>
            </thead>
            <tbody>
                {data.map((rec, i) => (
                    <tr key={i}>
                        <td className="border p-1">{rec.date}</td>
                        <td className="border p-1">{rec.userName}</td>
                        <td className="border p-1">{rec.checkIn || '--'}</td>
                        <td className="border p-1">{rec.checkOut || '--'}</td>
                        <td className="border p-1">{rec.duration || '--'}</td>
                        <td className="border p-1">{rec.status}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default AttendanceDashboard;