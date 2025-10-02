import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import type { User } from '../../types';
import { ShieldCheck, Plus, Edit, Trash2, Info } from 'lucide-react';
import Button from '../../components/ui/Button';
import UserForm from '../../components/admin/UserForm';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [isUserFormOpen, setIsUserFormOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (error) {
            setToast({ message: 'Failed to fetch users.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const handleAdd = () => {
        setCurrentUser(null);
        setIsUserFormOpen(true);
    };

    const handleEdit = (user: User) => {
        setCurrentUser(user);
        setIsUserFormOpen(true);
    };

    const handleDelete = (user: User) => {
        setCurrentUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleSaveUser = async (data: Partial<User>) => {
        setIsSaving(true);
        try {
            if (currentUser) {
                await api.updateUser(currentUser.id, data);
                setToast({ message: 'User updated successfully!', type: 'success' });
            } else {
                await api.createUser(data as User);
                setToast({ message: 'User role defined. Please create their login in Firebase.', type: 'success' });
            }
            setIsUserFormOpen(false);
            fetchUsers();
        } catch (error) {
            setToast({ message: 'Failed to save user.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleConfirmDelete = async () => {
        if (currentUser) {
            try {
                await api.deleteUser(currentUser.id);
                setToast({ message: 'User deleted. Remember to also remove them from Firebase.', type: 'success' });
                setIsDeleteModalOpen(false);
                fetchUsers();
            } catch (error) {
                setToast({ message: 'Failed to delete user.', type: 'error' });
            }
        }
    };

    const getRoleName = (role: string) => {
        return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    return (
        <div className="bg-card p-6 sm:p-8 rounded-xl shadow-card">
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            
            <UserForm
                isOpen={isUserFormOpen}
                onClose={() => setIsUserFormOpen(false)}
                onSave={handleSaveUser}
                initialData={currentUser}
                isSaving={isSaving}
            />

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
            >
                Are you sure you want to delete the user "{currentUser?.name}"? This action cannot be undone.
            </Modal>
            
            <AdminPageHeader title="User Management">
                 <Button onClick={handleAdd}><Plus className="mr-2 h-4 w-4" /> Add User</Button>
            </AdminPageHeader>

             <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg text-sm">
                <div className="flex items-start">
                    <Info className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold">Important: Two-Step User Creation</h4>
                        <p className="mt-1">
                            To add a new user who can log in, you must complete both steps:
                        </p>
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                            <li><strong>Add User Here:</strong> Use the "Add User" button to define the user's role and details within this application.</li>
                            <li><strong>Create Login in Firebase:</strong> Go to your Firebase project's Authentication console and create a new user with the <strong>exact same email address</strong> and a password.</li>
                        </ol>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-page">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {isLoading ? (
                            <tr><td colSpan={4} className="text-center py-10 text-muted">Loading users...</td></tr>
                        ) : users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 font-medium">{user.name}</td>
                                <td className="px-6 py-4 text-sm text-muted">{user.email}</td>
                                <td className="px-6 py-4 text-sm text-muted">
                                    <div className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-accent" />{getRoleName(user.role)}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Button variant="icon" size="sm" onClick={() => handleEdit(user)} aria-label={`Edit user ${user.name}`} title={`Edit user ${user.name}`}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="icon" size="sm" onClick={() => handleDelete(user)} aria-label={`Delete user ${user.name}`} title={`Delete user ${user.name}`}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;