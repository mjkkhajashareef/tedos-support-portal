import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreateClientRequest } from '../../utils/apiGateway';
import { ModuleId } from '../../types';

export const ClientActivationWizard = () => {
  const { addClient, clients, setSelectedClientId, setCurrentModule } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const loadingRef = React.useRef(false); // Track loading state synchronously
  const [error, setError] = useState<string | null>(null);
  const [clientData, setClientData] = useState<CreateClientRequest>({
    name: '',
    company: '',
    basicInfo: { phone: '', email: '', address: '' },
    products: [],
    assignments: { executiveId: '', managerId: '' },
    dltInfo: { registered: false, entityId: '' },
  });

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!clientData.name || !clientData.company || !clientData.basicInfo?.email) return 'Name, Company, and Email are required';
        if (clients.some(c => c.name.toLowerCase() === clientData.name.toLowerCase() || c.email === clientData.basicInfo?.email)) return 'Client already exists';
        break;
      // Add validation for other steps
    }
    return null;
  };

  const next = () => {
    const error = validateStep();
    if (error) {
      setError(error);
      return;
    }
    setError(null);
    setStep(s => Math.min(s + 1, 7));
  };

  const prev = () => setStep(s => Math.max(s - 1, 1));

  const onActivate = async () => {
    if (loadingRef.current) return; // Prevent rapid clicking
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const newClient = await addClient(clientData);
      if (newClient) {
        setSelectedClientId(newClient.id);
        setCurrentModule(ModuleId.CLIENT_WORKSPACE);
      } else {
        alert('Client Activated Successfully');
      }
      // Should redirect to Dashboard or ClientsView
    } catch (err) {
      setError('Failed to activate client: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <div className="space-y-4">
        <input placeholder="Client Name" className="border p-2 w-full rounded" value={clientData.name || ''} onChange={e => setClientData({...clientData, name: e.target.value})} />
        <input placeholder="Company Name" className="border p-2 w-full rounded" value={clientData.company || ''} onChange={e => setClientData({...clientData, company: e.target.value})} />
        <input placeholder="Email" className="border p-2 w-full rounded" value={clientData.basicInfo?.email || ''} onChange={e => setClientData({...clientData, basicInfo: {...clientData.basicInfo!, email: e.target.value}})} />
        <input placeholder="Phone" className="border p-2 w-full rounded" value={clientData.basicInfo?.phone || ''} onChange={e => setClientData({...clientData, basicInfo: {...clientData.basicInfo!, phone: e.target.value}})} />
        <input placeholder="Address" className="border p-2 w-full rounded" value={clientData.basicInfo?.address || ''} onChange={e => setClientData({...clientData, basicInfo: {...clientData.basicInfo!, address: e.target.value}})} />
      </div>;
      case 2: return <div className="space-y-4">
        <label>Products:</label>
        <input placeholder="Products (comma separated)" className="border p-2 w-full rounded" onChange={e => setClientData({...clientData, products: e.target.value.split(',')})} />
      </div>;
      case 3: return <div className="space-y-4">
        <label>Financial Docs (Mock):</label>
        <input type="file" className="border p-2 w-full rounded" />
      </div>;
      case 4: return <div className="space-y-4">
        <label>Training Config:</label>
        <input placeholder="Training Needs" className="border p-2 w-full rounded" />
      </div>;
      case 5: return <div className="space-y-4">
        <label>Assign Support Executive:</label>
        <select className="border p-2 w-full rounded" onChange={e => setClientData({...clientData, assignments: { ...clientData.assignments!, executiveId: e.target.value, managerId: 'MGR-001' }})}>
          <option value="">Select Executive</option>
          <option value="TE-101">Rahul Sharma</option>
          <option value="TE-102">Sneha Patel</option>
          <option value="TE-103">Amit Verma</option>
        </select>
      </div>;
      case 6: return <div className="space-y-4">
        <label>Support Config:</label>
        <input placeholder="DLT Entity ID" className="border p-2 w-full rounded" onChange={e => setClientData({...clientData, dltInfo: { registered: true, entityId: e.target.value }})} />
      </div>;
      case 7: return <div className="space-y-4">
        <h2 className="text-xl font-semibold">Review Activation</h2>
        <pre className="p-4 bg-gray-100 rounded text-xs">{JSON.stringify(clientData, null, 2)}</pre>
      </div>;
      default: return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Client Activation Wizard - Step {step}</h1>
      {error && <div className="text-red-500">{error}</div>}
      {renderStep()}
      <div className="flex gap-4">
        {step > 1 && <button onClick={prev} className="px-4 py-2 bg-gray-200 rounded">Back</button>}
        {step < 7 ? <button onClick={next} className="px-4 py-2 bg-indigo-600 text-white rounded">Next</button>
                  : <button onClick={onActivate} disabled={loading} className={`px-4 py-2 text-white rounded ${loading ? 'bg-gray-400' : 'bg-green-600'}`}>{loading ? 'Activating...' : 'Activate Client'}</button>}
      </div>
    </div>
  );
};
