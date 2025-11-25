import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilter, 
  faCheckCircle, 
  faSpinner,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { ENDPOINTS } from '../config';
import { FraudReport, VerificationResponse } from '../types';
import api from '../lib/axios';

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    suspicious: 'bg-amber-100 text-amber-700 border-amber-200',
    confirmed_fraud: 'bg-red-100 text-red-700 border-red-200',
    not_fraud: 'bg-green-100 text-green-700 border-green-200',
    error: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const labels: Record<string, string> = {
    suspicious: 'Suspicious',
    confirmed_fraud: 'Confirmed Fraud',
    not_fraud: 'Cleared',
    error: 'Error',
  };

  return (
    <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-medium border", styles[status] || styles.error)}>
      {labels[status] || status}
    </span>
  );
};

const ConfidenceBadge = ({ score }: { score: number }) => {
  let colorClass = 'bg-slate-100 text-slate-700';
  if (score >= 0.85) colorClass = 'bg-red-100 text-red-700 font-bold';
  else if (score >= 0.7) colorClass = 'bg-amber-100 text-amber-700';
  
  return (
    <span className={clsx("px-2 py-1 rounded text-xs", colorClass)}>
      {(score * 100).toFixed(0)}%
    </span>
  );
};

const RiskBadge = ({ level }: { level?: string }) => {
  const styles: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-200 font-bold',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200 font-semibold',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    LOW: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  
  if (!level) return <span className="text-slate-400">-</span>;

  return (
    <span className={clsx("px-2.5 py-0.5 rounded-full text-xs border", styles[level] || 'bg-slate-100')}>
      {level}
    </span>
  );
};

const Reports = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [minConfidence, setMinConfidence] = useState(0);
  const queryClient = useQueryClient();

  // Fetch reports
  const { data: reports, isLoading, error } = useQuery<FraudReport[]>({
    queryKey: ['fraud-reports', filterStatus, minConfidence],
    queryFn: async () => {
      const params: any = {
        limit: 100
      };
      if (filterStatus !== 'all') params.verification_status = filterStatus;
      if (minConfidence > 0) params.min_confidence = minConfidence;

      const response = await api.get(ENDPOINTS.FRAUD.REPORTS, { params });
      return response.data;
    }
  });

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: async (matchIds: string[]) => {
      const response = await api.post<VerificationResponse>(ENDPOINTS.VERIFICATION.VERIFY, {
        match_ids: matchIds
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Verification complete: ${data.confirmed_fraud} confirmed fraud, ${data.not_fraud} cleared.`);
      queryClient.invalidateQueries({ queryKey: ['fraud-reports'] });
    },
    onError: (error: any) => {
      toast.error('Verification failed: ' + (error.response?.data?.detail || error.message));
    }
  });

  const handleVerify = (id: string) => {
    verifyMutation.mutate([id]);
  };

  const handleVerifyAllHighConfidence = () => {
    if (!reports) return;
    
    const highConfidenceIds = reports
      .filter(r => r.confidence_score >= 0.85 && r.verification_status === 'suspicious')
      .map(r => r.id);
    
    if (highConfidenceIds.length === 0) {
      toast('No high confidence suspicious matches to verify.', { icon: 'ℹ️' });
      return;
    }

    if (confirm(`Verify ${highConfidenceIds.length} high confidence matches? This will check Land Registry records.`)) {
      verifyMutation.mutate(highConfidenceIds);
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-primary-500" /></div>;
  if (error) return <div className="text-red-500 p-8">Error loading reports: {error.message}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fraud Reports</h1>
        <div className="flex gap-2">
          <button 
            onClick={handleVerifyAllHighConfidence}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            disabled={verifyMutation.isPending}
          >
            {verifyMutation.isPending ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheckCircle} />}
            Verify High Confidence
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <FontAwesomeIcon icon={faFilter} />
          <span>Filters:</span>
        </div>
        
        <select 
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="suspicious">Suspicious</option>
          <option value="confirmed_fraud">Confirmed Fraud</option>
          <option value="not_fraud">Cleared</option>
        </select>

        <select 
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-500"
          value={minConfidence}
          onChange={(e) => setMinConfidence(Number(e.target.value))}
        >
          <option value={0}>All Confidence</option>
          <option value={0.7}>Medium ({'>'}70%)</option>
          <option value={0.85}>High ({'>'}85%)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Property Address</th>
                <th className="px-6 py-4">Client Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4">Official Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No reports found matching your filters.
                  </td>
                </tr>
              ) : (
                reports?.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {report.property_address}
                      <div className="text-xs text-slate-400 font-normal mt-0.5">{report.ppd_postcode}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{report.client_name}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={report.verification_status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <RiskBadge level={report.risk_level} />
                        <span className="text-xs text-slate-400">{(report.confidence_score * 100).toFixed(0)}% Match</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {report.ppd_price ? `£${report.ppd_price.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {report.verification_status === 'suspicious' && (
                          <>
                            {(report.risk_level === 'CRITICAL' || report.risk_level === 'HIGH') ? (
                               <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded border border-green-100 flex items-center gap-1">
                                 <FontAwesomeIcon icon={faCheckCircle} /> Verified
                               </span>
                            ) : (
                              <button 
                                onClick={() => handleVerify(report.id)}
                                className="bg-primary-50 text-primary-600 hover:bg-primary-100 px-3 py-1 rounded text-xs font-medium transition-colors border border-primary-200"
                                title="Verify with Land Registry"
                                disabled={verifyMutation.isPending}
                              >
                                Dig Deeper
                              </button>
                            )}
                          </>
                        )}
                        <button className="text-slate-400 hover:text-slate-600 p-1" title="View Details">
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;