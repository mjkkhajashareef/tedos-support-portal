import React, { useState } from 'react';
import { UserCreate } from '../../types';

export const UserForm = ({ onSubmit, onCancel, initialData }: { onSubmit: (data: UserCreate) => void;  onCancel: () => void; 
  initialData?: UserCreate 
}) => {
  const [formData, setFormData] = useState<UserCreate>(initialData || {
    employeeId: '', name: '', designation: '', email: '', mobile: '', role: 'Support Executive', department: '', reportingManager: '', assignedRegion: '', joiningDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold">{initialData ? 'Edit User' : 'Add User'}</h2>
      <div className="grid grid-cols-2 gap-4">
        <input placeholder="Name" className="border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        <input placeholder="Email" className="border p-2 rounded" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        <input placeholder="Employee ID" className="border p-2 rounded" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} />
        <input placeholder="Designation" className="border p-2 rounded" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
      </div>
      <div className="flex gap-4 mt-4">
        <button type="submit" disabled={loading} className={`px-4 py-2 rounded text-white ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}>{loading ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
      </div>
    </form>
  );
};
