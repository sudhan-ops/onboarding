
import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { Plus, Edit, Trash2, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Modal from '../../components/ui/Modal';
import TaskForm from '../../components/tasks/TaskForm';
import CompleteTaskForm from '../../components/tasks/CompleteTaskForm';
import type { Task, EscalationStatus } from '../../types';
import { api } from '../../services/api';
import { format, addDays } from 'date-fns';

const getNextDueDateInfo = (task: Task): { date: string | null; isOverdue: boolean } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseDate = (dateStr: string | null | undefined) => dateStr ? new Date(dateStr) : null;

    if (task.status === 'Done' || !task.dueDate) {
        return { date: task.dueDate ? format(parseDate(task.dueDate)!, 'dd MMM, yyyy') : '-', isOverdue: false };
    }

    let nextDueDate: Date | null = null;
    const baseDueDate = parseDate(task.dueDate)!;

    switch (task.escalationStatus) {
        case 'None':
            nextDueDate = task.escalationLevel1DurationDays ? addDays(baseDueDate, task.escalationLevel1DurationDays) : baseDueDate;
            break;
        case 'Level 1':
            if (task.escalationLevel1DurationDays && task.escalationLevel2DurationDays) {
                const l1Date = addDays(baseDueDate, task.escalationLevel1DurationDays);
                nextDueDate = addDays(l1Date, task.escalationLevel2DurationDays);
            }
            break;
        case 'Level 2':
            if (task.escalationLevel1DurationDays && task.escalationLevel2DurationDays && task.escalationEmailDurationDays) {
                const l1Date = addDays(baseDueDate, task.escalationLevel1DurationDays);
                const l2Date = addDays(l1Date, task.escalationLevel2DurationDays);
                nextDueDate = addDays(l2Date, task.escalationEmailDurationDays);
            }
            break;
        case 'Email Sent':
            // No further due dates
            break;
    }
    
    // If no escalation path, the only due date is the base one.
    if (!nextDueDate) nextDueDate = baseDueDate;

    const isOverdue = nextDueDate ? nextDueDate < today : false;

    return { date: format(nextDueDate, 'dd MMM, yyyy'), isOverdue };
};


const TaskManagement: React.FC = () => {
    const { user } = useAuthStore();
    const { tasks, isLoading, error, fetchTasks, deleteTask, runAutomaticEscalations } = useTaskStore();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isCompleteFormOpen, setIsCompleteFormOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const init = async () => {
            await fetchTasks();
            await runAutomaticEscalations();
        }
        init();
    }, [fetchTasks, runAutomaticEscalations]);

    const handleAdd = () => {
        setCurrentTask(null);
        setIsFormOpen(true);
    };

    const handleEdit = (task: Task) => {
        setCurrentTask(task);
        setIsFormOpen(true);
    };
    
    const handleComplete = (task: Task) => {
        setCurrentTask(task);
        setIsCompleteFormOpen(true);
    };

    const handleDelete = (task: Task) => {
        setCurrentTask(task);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (currentTask) {
            try {
                await deleteTask(currentTask.id);
                setToast({ message: 'Task deleted.', type: 'success' });
                setIsDeleteModalOpen(false);
            } catch (error) {
                setToast({ message: 'Failed to delete task.', type: 'error' });
            }
        }
    };

    const getPriorityChip = (priority: Task['priority']) => {
        const styles = {
            High: 'bg-red-100 text-red-800',
            Medium: 'bg-yellow-100 text-yellow-800',
            Low: 'bg-blue-100 text-blue-800',
        };
        return <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[priority]}`}>{priority}</span>;
    };
    
    const getStatusChip = (status: Task['status']) => {
         const styles = {
            'To Do': 'bg-gray-100 text-gray-800',
            'In Progress': 'bg-indigo-100 text-indigo-800',
            'Done': 'bg-green-100 text-green-800',
        };
        return <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>{status}</span>;
    };
    
    const getEscalationChip = (status: EscalationStatus) => {
        if (status === 'None') return null;
        const styles: Record<EscalationStatus, string> = {
            'None': '',
            'Level 1': 'bg-orange-100 text-orange-800',
            'Level 2': 'bg-amber-100 text-amber-800',
            'Email Sent': 'bg-purple-100 text-purple-800',
        };
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status]}`}>{status}</span>;
    };

    return (
        <div className="bg-card p-6 sm:p-8 rounded-xl shadow-card">
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            
            {isFormOpen && (
                <TaskForm
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    initialData={currentTask}
                    setToast={setToast}
                />
            )}
            
            {isCompleteFormOpen && currentTask && (
                <CompleteTaskForm
                    isOpen={isCompleteFormOpen}
                    onClose={() => setIsCompleteFormOpen(false)}
                    task={currentTask}
                    setToast={setToast}
                />
            )}

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
            >
                Are you sure you want to delete the task "{currentTask?.name}"?
            </Modal>
            
            <AdminPageHeader title="Task Management">
                 <Button onClick={handleAdd}><Plus className="mr-2 h-4 w-4" /> Add Task</Button>
            </AdminPageHeader>
            
            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-page">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Task Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Priority</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Next Due Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Assigned To</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Escalation</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {isLoading ? (
                            <tr><td colSpan={7} className="text-center py-10 text-muted"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></td></tr>
                        ) : tasks.map((task) => {
                            const { date: nextDueDate, isOverdue } = getNextDueDateInfo(task);
                            return (
                                <tr key={task.id} className={isOverdue ? 'bg-red-50' : ''}>
                                    <td className="px-6 py-4 font-medium">{task.name}</td>
                                    <td className="px-6 py-4">{getPriorityChip(task.priority)}</td>
                                    <td className={`px-6 py-4 text-sm ${isOverdue ? 'font-bold text-red-600' : 'text-muted'}`}>{nextDueDate || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-muted">{task.assignedToName || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-muted">{getStatusChip(task.status)}</td>
                                    <td className="px-6 py-4 text-sm text-muted">{getEscalationChip(task.escalationStatus)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Button variant="icon" size="sm" onClick={() => handleEdit(task)} title="Edit Task"><Edit className="h-4 w-4" /></Button>
                                            <Button variant="icon" size="sm" onClick={() => handleDelete(task)} title="Delete Task"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                            {task.assignedToId === user?.id && task.status !== 'Done' && (
                                                <Button variant="outline" size="sm" onClick={() => handleComplete(task)}>
                                                    <CheckCircle className="h-4 w-4 mr-2" /> Complete
                                                </Button>
                                            )}
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

export default TaskManagement;
