import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faCheckCircle,
  faSpinner,
  faEye,
  faTimes,
  faPencilAlt,
  faCheck,
  faShield,
  faExclamationTriangle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import { ENDPOINTS } from "../config";
import { FraudReport, VerificationSummary, VerificationResult } from "../types";
import api from "../lib/axios";

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    suspicious: "bg-amber-100 text-amber-700 border-amber-200",
    confirmed_fraud: "bg-red-100 text-red-700 border-red-200",
    not_fraud: "bg-green-100 text-green-700 border-green-200",
    error: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const labels: Record<string, string> = {
    suspicious: "Suspicious",
    confirmed_fraud: "Confirmed Fraud",
    not_fraud: "Cleared",
    error: "Error",
  };

  return (
    <span
      className={clsx(
        "px-2.5 py-0.5 rounded-full text-xs font-medium border",
        styles[status] || styles.error
      )}
    >
      {labels[status] || status}
    </span>
  );
};

const RiskBadge = ({ level }: { level?: string }) => {
  const styles: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-800 border-red-200 font-bold",
    HIGH: "bg-orange-100 text-orange-800 border-orange-200 font-semibold",
    MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
    LOW: "bg-blue-100 text-blue-800 border-blue-200",
  };

  if (!level) return <span className="text-slate-400">-</span>;

  return (
    <span
      className={clsx(
        "px-2.5 py-0.5 rounded-full text-xs border",
        styles[level] || "bg-slate-100"
      )}
    >
      {level}
    </span>
  );
};

// Modal showing full verification result for a single match
const VerificationDetailModal = ({
  result,
  onClose,
}: {
  result: VerificationResult;
  onClose: () => void;
}) => {
  const statusIcon = {
    confirmed_fraud: (
      <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />
    ),
    not_fraud: (
      <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
    ),
    error: <FontAwesomeIcon icon={faTimesCircle} className="text-slate-400" />,
  }[result.verification_status];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            {statusIcon}
            Land Registry Verification
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-slate-50 rounded-xl p-4">
            <span className="text-slate-500">Property</span>
            <span className="font-medium">{result.property_address}</span>
            <span className="text-slate-500">Buyer (client)</span>
            <span className="font-medium">{result.client_name ?? "—"}</span>
            <span className="text-slate-500">Vendor</span>
            <span className="font-medium">{result.vendor_name ?? "—"}</span>
            <span className="text-slate-500">Outcome</span>
            <span>
              <StatusBadge status={result.verification_status} />
            </span>
            <span className="text-slate-500">Registered Owner</span>
            <span className="font-medium">
              {result.verified_owner_name ?? (
                <span className="text-slate-400 italic">not returned</span>
              )}
            </span>
            <span className="text-slate-500">Verified At</span>
            <span className="text-slate-600">
              {new Date(result.verified_at).toLocaleString("en-GB")}
            </span>
          </div>

          {result.error_message && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-700 text-xs">
              {result.error_message}
            </div>
          )}

          {result.verification_status === "confirmed_fraud" && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-800 text-xs font-medium">
              The name registered at HMLR matches the agency client — this sale
              likely bypassed the agency.
            </div>
          )}

          {result.verification_status === "not_fraud" && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-green-800 text-xs font-medium">
              The registered owner name does not match the agency client — no
              fraud evidence found.
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-xl text-sm transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const Reports = () => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [minConfidence, setMinConfidence] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [detailResult, setDetailResult] = useState<VerificationResult | null>(
    null
  );
  // Keep latest verification results keyed by match_id for inline display
  const [verifiedResults, setVerifiedResults] = useState<
    Record<string, VerificationResult>
  >({});

  const queryClient = useQueryClient();

  const {
    data: reports,
    isLoading,
    error,
  } = useQuery<FraudReport[]>({
    queryKey: ["fraud-reports", filterStatus, minConfidence],
    queryFn: async () => {
      const params: any = { limit: 100 };
      if (filterStatus !== "all") params.verification_status = filterStatus;
      if (minConfidence > 0) params.min_confidence = minConfidence;
      const response = await api.get(ENDPOINTS.FRAUD.REPORTS, { params });
      return response.data;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (matchIds: string[]) => {
      const response = await api.post<VerificationSummary>(
        ENDPOINTS.VERIFICATION.VERIFY,
        { match_ids: matchIds }
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Index results by match_id for inline display
      const byId: Record<string, VerificationResult> = {};
      data.results.forEach((r) => {
        byId[r.match_id] = r;
      });
      setVerifiedResults((prev) => ({ ...prev, ...byId }));

      const { confirmed_fraud_count, not_fraud_count, error_count } = data;
      const parts: string[] = [];
      if (confirmed_fraud_count > 0)
        parts.push(`${confirmed_fraud_count} confirmed fraud`);
      if (not_fraud_count > 0) parts.push(`${not_fraud_count} cleared`);
      if (error_count > 0) parts.push(`${error_count} error(s)`);

      if (confirmed_fraud_count > 0) {
        toast.error(`Verification complete: ${parts.join(", ")}.`);
      } else {
        toast.success(`Verification complete: ${parts.join(", ")}.`);
      }

      queryClient.invalidateQueries({ queryKey: ["fraud-reports"] });
    },
    onError: (error: any) => {
      toast.error(
        "Verification failed: " +
          (error.response?.data?.detail || error.message)
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.patch(ENDPOINTS.FRAUD.UPDATE_REPORT(id), data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Report updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["fraud-reports"] });
      setEditingId(null);
      setEditData({});
    },
    onError: (error: any) => {
      toast.error(
        "Update failed: " + (error.response?.data?.detail || error.message)
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(ENDPOINTS.FRAUD.DELETE_REPORT(id));
    },
    onSuccess: () => {
      toast.success("Report deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["fraud-reports"] });
    },
    onError: (error: any) => {
      toast.error(
        "Delete failed: " + (error.response?.data?.detail || error.message)
      );
    },
  });

  const handleVerify = (id: string) => {
    verifyMutation.mutate([id]);
  };

  const handleEdit = (report: FraudReport) => {
    setEditingId(report.id);
    setEditData({
      property_address: report.property_address,
      client_name: report.client_name,
      ppd_postcode: report.ppd_postcode,
    });
  };

  const handleSave = (id: string) => {
    updateMutation.mutate({ id, data: editData });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this fraud report?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleVerifyAllHighConfidence = () => {
    if (!reports) return;
    const ids = reports
      .filter(
        (r) => r.confidence_score >= 85 && r.verification_status === "suspicious"
      )
      .map((r) => r.id);

    if (ids.length === 0) {
      toast("No high confidence suspicious matches to verify.", { icon: "ℹ️" });
      return;
    }
    if (
      confirm(
        `Verify ${ids.length} high confidence matches? This will check Land Registry records.`
      )
    ) {
      verifyMutation.mutate(ids);
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center p-12">
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          className="text-4xl text-primary-500"
        />
      </div>
    );
  if (error)
    return (
      <div className="text-red-500 p-8">
        Error loading reports: {error.message}
      </div>
    );

  return (
    <div>
      {detailResult && (
        <VerificationDetailModal
          result={detailResult}
          onClose={() => setDetailResult(null)}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fraud Reports</h1>
        <button
          onClick={handleVerifyAllHighConfidence}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          disabled={verifyMutation.isPending}
        >
          {verifyMutation.isPending ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : (
            <FontAwesomeIcon icon={faCheckCircle} />
          )}
          Verify High Confidence
        </button>
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
          <option value="error">Error</option>
        </select>

        <select
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-500"
          value={minConfidence}
          onChange={(e) => setMinConfidence(Number(e.target.value))}
        >
          <option value={0}>All Confidence</option>
          <option value={70}>Medium ({">"}70%)</option>
          <option value={85}>High ({">"}85%)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Property Address</th>
                <th className="px-6 py-4">Buyer (client)</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4">Official Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports?.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    No reports found matching your filters.
                  </td>
                </tr>
              ) : (
                reports?.map((report) => {
                  const isEditing = editingId === report.id;
                  const latestResult = verifiedResults[report.id];

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={editData.property_address || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  property_address: e.target.value,
                                })
                              }
                              className="w-full border border-slate-300 rounded px-2 py-1 text-sm mb-1"
                              placeholder="Property Address"
                            />
                            <input
                              type="text"
                              value={editData.ppd_postcode || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  ppd_postcode: e.target.value,
                                })
                              }
                              className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                              placeholder="Postcode"
                            />
                          </>
                        ) : (
                          <>
                            {report.property_address}
                            <div className="text-xs text-slate-400 font-normal mt-0.5">
                              {report.ppd_postcode}
                            </div>
                          </>
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.client_name || ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                client_name: e.target.value,
                              })
                            }
                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                            placeholder="Buyer (client) name"
                          />
                        ) : (
                          <>
                            {report.client_name ?? "—"}
                            {/* Show verified owner name if verification ran */}
                            {(latestResult?.verified_owner_name ||
                              report.verified_owner_name) && (
                              <div className="text-xs text-slate-400 font-normal mt-0.5">
                                Registered:{" "}
                                {latestResult?.verified_owner_name ??
                                  report.verified_owner_name}
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        <span className="text-slate-800">{report.vendor_name ?? "—"}</span>
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge
                          status={
                            latestResult?.verification_status ??
                            report.verification_status
                          }
                        />
                        {/* Show verified_at timestamp if present */}
                        {(latestResult?.verified_at || report.verified_at) && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            {new Date(
                              latestResult?.verified_at ?? report.verified_at!
                            ).toLocaleDateString("en-GB")}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <RiskBadge level={report.risk_level} />
                          <span className="text-xs text-slate-400">
                            {report.confidence_score.toFixed(1)}% Match
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {report.ppd_price
                          ? `£${report.ppd_price.toLocaleString()}`
                          : "-"}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSave(report.id)}
                                className="text-green-600 hover:text-green-700 p-1"
                                title="Save"
                                disabled={updateMutation.isPending}
                              >
                                <FontAwesomeIcon icon={faCheck} />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="text-slate-400 hover:text-slate-600 p-1"
                                title="Cancel"
                              >
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Verify button — shown for any suspicious match */}
                              {report.verification_status === "suspicious" && (
                                <button
                                  onClick={() => handleVerify(report.id)}
                                  className="bg-primary-50 text-primary-600 hover:bg-primary-100 px-3 py-1 rounded text-xs font-medium transition-colors border border-primary-200 flex items-center gap-1"
                                  title="Verify with Land Registry"
                                  disabled={verifyMutation.isPending}
                                >
                                  <FontAwesomeIcon icon={faShield} />
                                  Verify
                                </button>
                              )}

                              {/* Eye — open detail modal for already-verified matches */}
                              {(latestResult ||
                                (report.verification_status !== "suspicious" &&
                                  report.verified_at)) && (
                                <button
                                  onClick={() =>
                                    setDetailResult(
                                      latestResult ?? {
                                        match_id: report.id,
                                        property_address:
                                          report.property_address,
                                        client_name: report.client_name,
                                        vendor_name: report.vendor_name ?? null,
                                        verification_status:
                                          report.verification_status as any,
                                        verified_owner_name:
                                          report.verified_owner_name ?? null,
                                        is_confirmed_fraud:
                                          report.is_confirmed_fraud,
                                        verified_at: report.verified_at!,
                                        error_message: null,
                                      }
                                    )
                                  }
                                  className="text-slate-400 hover:text-primary-600 p-1"
                                  title="View Verification Details"
                                >
                                  <FontAwesomeIcon icon={faEye} />
                                </button>
                              )}

                              <button
                                onClick={() => handleEdit(report)}
                                className="text-blue-500 hover:text-blue-700 p-1"
                                title="Edit"
                              >
                                <FontAwesomeIcon icon={faPencilAlt} />
                              </button>
                              <button
                                onClick={() => handleDelete(report.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Delete"
                                disabled={deleteMutation.isPending}
                              >
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
