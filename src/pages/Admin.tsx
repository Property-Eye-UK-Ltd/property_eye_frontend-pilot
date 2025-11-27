import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDatabase, 
  faUpload, 
  faSpinner, 
  faCloudUploadAlt, 
  faTimes, 
  faFileCsv, 
  faTrash,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { ENDPOINTS } from '../config';
import { PPDJob } from '../types';
import api from '../lib/axios';

const Admin = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [file, setFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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
      handleCloseModal();
      queryClient.invalidateQueries({ queryKey: ['ppd-uploads'] });
    },
    onError: (error: any) => {
      toast.error('Upload failed: ' + (error.response?.data?.detail || error.message));
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${ENDPOINTS.PPD.UPLOAD}/${id}`);
    },
    onSuccess: () => {
      toast.success('Record deleted successfully');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['ppd-uploads'] });
    },
    onError: (error: any) => {
      toast.error('Delete failed: ' + (error.response?.data?.detail || error.message));
      setDeleteId(null);
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('year', year.toString());
    formData.append('file', file);

    uploadMutation.mutate(formData);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFile(null);
    uploadMutation.reset();
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin / Official Records</h1>
          <p className="text-slate-500 mt-1">Manage Price Paid Data (PPD) uploads for fraud detection.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <FontAwesomeIcon icon={faUpload} />
          Upload Official Records
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Upload History */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
              <FontAwesomeIcon icon={faDatabase} className="text-primary-500" />
              Upload History
            </h2>
            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {uploads?.length || 0} Records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Date Uploaded</th>
                  <th className="px-6 py-4">Filename</th>
                  <th className="px-6 py-4">Year</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Records Processed</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center"><FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-primary-500" /></td></tr>
                ) : uploads?.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No uploads found. Upload a CSV file to get started.</td></tr>
                ) : (
                  uploads?.map((job) => (
                    <tr key={job.upload_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(job.uploaded_at).toLocaleDateString()} <span className="text-xs text-slate-400 ml-1">{new Date(job.uploaded_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">{job.filename}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{job.year}</td>
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "px-2.5 py-1 rounded-full text-xs font-medium capitalize inline-flex items-center gap-1.5",
                          job.status === 'completed' ? "bg-green-100 text-green-700 border border-green-200" :
                          job.status === 'failed' ? "bg-red-100 text-red-700 border border-red-200" :
                          "bg-blue-100 text-blue-700 border border-blue-200"
                        )}>
                          <span className={clsx("w-1.5 h-1.5 rounded-full", 
                            job.status === 'completed' ? "bg-green-500" :
                            job.status === 'failed' ? "bg-red-500" :
                            "bg-blue-500"
                          )}></span>
                          {job.status}
                        </span>
                        {job.error_message && (
                          <div className="text-xs text-red-500 mt-1 max-w-xs truncate" title={job.error_message}>
                            {job.error_message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 font-mono">
                        {job.records_processed?.toLocaleString() || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteClick(job.upload_id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                          title="Delete Record"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">Upload Official Records</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                <FontAwesomeIcon icon={faTimes} className="text-lg" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleUpload} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                  <input 
                    type="number" 
                    min="1995" 
                    max="2030" 
                    value={year} 
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">Specify the year this data belongs to.</p>
                </div>

                {!file ? (
                  <div 
                    {...getRootProps()} 
                    className={clsx(
                      "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                      isDragActive ? "border-primary-500 bg-primary-50" : "border-slate-300 hover:border-primary-400 hover:bg-slate-50"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FontAwesomeIcon icon={faCloudUploadAlt} className="text-xl" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Click to upload or drag and drop</h3>
                    <p className="text-slate-500 text-sm">CSV files only</p>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faFileCsv} className="text-lg" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-slate-900">{file.name}</h3>
                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={!file || uploadMutation.isPending}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Uploading...
                    </>
                  ) : (
                    'Upload Data'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl" />
              </div>
              <h2 className="text-xl font-bold mb-2">Delete Official Record?</h2>
              <p className="text-slate-500 mb-6">
                Are you sure you want to delete this record? This will remove the CSV file and any processed data. This action cannot be undone.
              </p>
              
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {deleteMutation.isPending && <FontAwesomeIcon icon={faSpinner} spin />}
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;