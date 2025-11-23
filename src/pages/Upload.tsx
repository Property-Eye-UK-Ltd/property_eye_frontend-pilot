import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faFileCsv, faCheckCircle, faSpinner, faSearch } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../config';
import { UploadStats } from '../types';
import api from '../lib/axios';

const REQUIRED_FIELDS = [
  { key: 'address', label: 'Property Address' },
  { key: 'postcode', label: 'Postcode' },
  { key: 'client_name', label: 'Client Name' },
  { key: 'status', label: 'Listing Status' },
  { key: 'withdrawn_date', label: 'Withdrawn Date' },
];

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'mapping' | 'uploading' | 'success'>('upload');
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseHeaders(selectedFile);
    }
  }, []);

  const parseHeaders = (file: File) => {
    Papa.parse(file, {
      header: true,
      preview: 1,
      complete: (results) => {
        if (results.meta.fields) {
          setHeaders(results.meta.fields);
          // Auto-map if headers match exactly
          const initialMapping: Record<string, string> = {};
          REQUIRED_FIELDS.forEach(field => {
            const match = results.meta.fields!.find(h => h.toLowerCase() === field.key.toLowerCase() || h.toLowerCase().includes(field.key));
            if (match) initialMapping[field.key] = match;
          });
          setMapping(initialMapping);
          setStep('mapping');
        } else {
          toast.error('Could not parse CSV headers');
        }
      },
      error: (error) => {
        toast.error('Error parsing CSV: ' + error.message);
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls', '.xlsx']
    },
    multiple: false
  });

  const handleMappingChange = (systemField: string, csvHeader: string) => {
    setMapping(prev => ({ ...prev, [systemField]: csvHeader }));
  };

  const handleUpload = async () => {
    if (!file) return;

    // Validate mapping
    const missingFields = REQUIRED_FIELDS.filter(f => !mapping[f.key]);
    if (missingFields.length > 0) {
      toast.error(`Please map all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setStep('uploading');
    const formData = new FormData();
    formData.append('file', file);
    // agency_id is now handled by backend via token
    formData.append('field_mapping', JSON.stringify(mapping));

    try {
      const response = await api.post(ENDPOINTS.DOCUMENTS.UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadStats(response.data);
      setStep('success');
      toast.success('File uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload file');
      setStep('mapping');
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await api.post(ENDPOINTS.FRAUD.SCAN);
      toast.success('Fraud scan completed successfully!');
      navigate('/reports');
    } catch (error: any) {
      console.error('Scan error:', error);
      toast.error(error.response?.data?.detail || 'Failed to run fraud scan');
    } finally {
      setIsScanning(false);
    }
  };

  const reset = () => {
    setFile(null);
    setHeaders([]);
    setMapping({});
    setStep('upload');
    setUploadStats(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Upload Listings</h1>
      <p className="text-slate-500 mb-8">Upload your agency's property listings to check for potential fraud.</p>

      {step === 'upload' && (
        <div 
          {...getRootProps()} 
          className={clsx(
            "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors",
            isDragActive ? "border-primary-500 bg-primary-50" : "border-slate-300 hover:border-primary-400 hover:bg-slate-50"
          )}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faCloudUploadAlt} className="text-2xl" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Click to upload or drag and drop</h3>
          <p className="text-slate-500 text-sm">CSV or Excel files (max 10MB)</p>
        </div>
      )}

      {step === 'mapping' && file && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faFileCsv} />
              </div>
              <div>
                <h3 className="font-semibold">{file.name}</h3>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button onClick={reset} className="text-sm text-red-500 hover:text-red-700">Cancel</button>
          </div>
          
          <div className="p-6">
            <h4 className="font-medium mb-4">Map Columns</h4>
            <div className="space-y-4">
              {REQUIRED_FIELDS.map((field) => (
                <div key={field.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm font-medium text-slate-700">
                    {field.label} <span className="text-red-500">*</span>
                  </label>
                  <div className="md:col-span-2">
                    <select
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      value={mapping[field.key] || ''}
                      onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    >
                      <option value="">Select column...</option>
                      {headers.map((header) => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleUpload}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Process File
            </button>
          </div>
        </div>
      )}

      {step === 'uploading' && (
        <div className="text-center py-12">
          <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-primary-500 mb-4" />
          <h3 className="text-xl font-semibold">Processing File...</h3>
          <p className="text-slate-500">This may take a few moments.</p>
        </div>
      )}

      {step === 'success' && uploadStats && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faCheckCircle} className="text-3xl" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Upload Complete!</h2>
          <p className="text-slate-500 mb-6">Your file has been processed successfully.</p>
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-500">Processed</p>
              <p className="text-xl font-bold text-slate-900">{uploadStats.records_processed}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-500">Skipped</p>
              <p className="text-xl font-bold text-slate-900">{uploadStats.records_skipped}</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={reset}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Upload Another File
            </button>
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isScanning ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSearch} />}
              Run Fraud Scan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
