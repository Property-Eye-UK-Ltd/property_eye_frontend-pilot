import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faUpload, faSpinner } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { ENDPOINTS } from '../config';
import { PPDJob } from '../types';
import api from '../lib/axios';

const Admin = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  // Fetch uploads
  const { data: uploads, isLoading } = useQuery<PPDJob[]>({
    queryKey: ['ppd-uploads'],
    queryFn: async () => {
      const response = await api.get(ENDPOINTS.PPD.UPLOADS);
      return response.data;
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post(ENDPOINTS.PPD.UPLOAD, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Official Records file uploaded and processing started.');
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['ppd-uploads'] });
    },
    onError: (error: any) => {
      toast.error('Upload failed: ' + (error.response?.data?.detail || error.message));
    }
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('year', year.toString());
    formData.append('month', month.toString());
    formData.append('file', file);

    uploadMutation.mutate(formData);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin / Official Records</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faUpload} className="text-primary-500" />
              Upload Official Records
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                <input 
                  type="number" 
                  min="1995" 
                  max="2030" 
                  value={year} 
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                <select 
                  value={month} 
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-primary-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CSV File</label>
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
              <button 
                type="submit" 
                disabled={!file || uploadMutation.isPending}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {uploadMutation.isPending ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Upload Data'}
              </button>
            </form>
          </div>
        </div>

        {/* Upload History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FontAwesomeIcon icon={faDatabase} className="text-slate-500" />
                Upload History
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">File</th>
                    <th className="px-6 py-3">Period</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center"><FontAwesomeIcon icon={faSpinner} spin /></td></tr>
                  ) : uploads?.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No uploads found.</td></tr>
                  ) : (
                    uploads?.map((job) => (
                      <tr key={job.upload_id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-slate-600">
                          {new Date(job.uploaded_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-900">{job.filename}</td>
                        <td className="px-6 py-3 text-slate-600">{job.month}/{job.year}</td>
                        <td className="px-6 py-3">
                          <span className={clsx(
                            "px-2 py-1 rounded-full text-xs font-medium capitalize",
                            job.status === 'completed' ? "bg-green-100 text-green-700" :
                            job.status === 'failed' ? "bg-red-100 text-red-700" :
                            "bg-blue-100 text-blue-700"
                          )}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right text-slate-600">
                          {job.records_processed?.toLocaleString() || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;