import { useEffect, useState } from 'react';
import { Save, Database, Download, Upload, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    business_name: '',
    phone: '',
    address: '',
    currency: 'PKR',
    tax_percentage: '0',
    invoice_footer: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/settings');
      setSettings(response.data.data);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.put('/settings', settings);
      toast.success('Settings updated successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackupExport = async () => {
    try {
      const response = await api.get('/backup/export');
      const backupData = response.data.data;
      
      // Create a downloadable blob
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_autoerp_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Backup exported successfully!');
    } catch (error) {
      toast.error('Failed to export backup');
    }
  };

  const handleRestoreImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('WARNING: Restoring will overwrite all current system data. Are you sure you want to continue?')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsRestoring(true);
        const backupJson = JSON.parse(event.target?.result as string);
        
        await api.post('/backup/restore', { backup: backupJson });
        
        toast.success('System successfully restored! Reloading...');
        setTimeout(() => window.location.reload(), 2000);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Restore failed. Invalid file format.');
      } finally {
        setIsRestoring(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleCleanSystemData = async () => {
    if (!window.confirm('CRITICAL WARNING: This will permanently wipe all system sales, purchases, product catalogs, brands, suppliers, and customers, and reset categories to defaults. Are you sure you want to proceed?')) {
      return;
    }
    
    try {
      setIsCleaning(true);
      await api.post('/system/cleanup');
      toast.success('System successfully cleared and default categories seeded! Reloading...');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to wipe system data');
    } finally {
      setIsCleaning(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure company profiles, invoice tax settings, and backups</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left column: Business settings */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Business Profile</h2>
          
          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Business Name</label>
                <input
                  type="text"
                  value={settings.business_name || ''}
                  onChange={e => handleChange('business_name', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={settings.phone || ''}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Address</label>
              <textarea
                value={settings.address || ''}
                onChange={e => handleChange('address', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-slate-900 dark:text-white text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">VAT/Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.tax_percentage || '0'}
                  onChange={e => handleChange('tax_percentage', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Currency Code</label>
                <input
                  type="text"
                  value={settings.currency || 'PKR'}
                  onChange={e => handleChange('currency', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Invoice Footer Note</label>
              <input
                type="text"
                value={settings.invoice_footer || ''}
                onChange={e => handleChange('invoice_footer', e.target.value)}
                placeholder="e.g. Thanks for shopping with us!"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-slate-900 dark:text-white text-sm"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Right column: Backup and maintenance */}
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" /> Database Backup
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Export all system inventory, records, sales, and purchases into a JSON backup file.
            </p>
            <button
              onClick={handleBackupExport}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg font-medium text-sm transition-colors"
            >
              <Download className="w-4 h-4" /> Export Backup File
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-500" /> Restore System
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Restore the database from an exported JSON backup file.
            </p>
            
            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-3 rounded-lg flex items-start gap-2 border border-amber-500/20 text-[11px] leading-relaxed">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Restoring will permanently overwrite the current system data. Please back up first.</span>
            </div>

            <label className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer text-center">
              <Upload className="w-4 h-4" /> 
              {isRestoring ? 'Restoring...' : 'Upload & Restore'}
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreImport}
                disabled={isRestoring}
                className="hidden"
              />
            </label>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" /> System Cleanup
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Permanently wipe all dummy transactions, products, purchases, sales, customers, brands, and suppliers. Seeding default categories automatically.
            </p>
            
            <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-start gap-2 border border-red-500/20 text-[11px] leading-relaxed">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>WARNING: Wiping system records is permanent and cannot be undone.</span>
            </div>

            <button
              onClick={handleCleanSystemData}
              disabled={isCleaning}
              className="w-full flex items-center justify-center gap-2 bg-red-650 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer"
            >
              {isCleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isCleaning ? 'Cleaning...' : 'Clean System Data'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
