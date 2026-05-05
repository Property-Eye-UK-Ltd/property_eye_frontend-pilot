import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCheckCircle,
  faChevronDown,
  faChevronRight,
  faEye,
  faFilter,
  faPencilAlt,
  faShield,
  faSpinner,
  faTimes,
  faTimesCircle,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import { ENDPOINTS } from "../config";
import {
  FraudReport,
  FraudReportGroup,
  VerificationResult,
  VerificationSummary,
} from "../types";
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

const RiskBadge = ({ level }: { level?: string | null }) => {
  const styles: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-800 border-red-200 font-bold",
    HIGH: "bg-orange-100 text-orange-800 border-orange-200 font-semibold",
    MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
    LOW: "bg-amber-100 text-amber-800 border-amber-200",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
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
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-slate-50 p-4">
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
                <span className="italic text-slate-400">not returned</span>
              )}
            </span>
            <span className="text-slate-500">Verified At</span>
            <span className="text-slate-600">
              {new Date(result.verified_at).toLocaleString("en-GB")}
            </span>
          </div>

          {result.error_message && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
              {result.error_message}
            </div>
          )}

          {result.verification_status === "confirmed_fraud" && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-800">
              The name registered at HMLR matches the agency client — this sale
              likely bypassed the agency.
            </div>
          )}

          {result.verification_status === "not_fraud" && (
            <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-xs font-medium text-green-800">
              The registered owner name does not match the agency client — no
              fraud evidence found.
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-slate-100 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—";

const formatCurrency = (value?: number) =>
  value ? `£${value.toLocaleString()}` : "—";

const GroupSummary = ({ group }: { group: FraudReportGroup }) => (
  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
    <span>{group.total_matches} resale match{group.total_matches === 1 ? "" : "es"}</span>
    {group.suspicious_count > 0 && <span>{group.suspicious_count} suspicious</span>}
    {group.confirmed_fraud_count > 0 && (
      <span>{group.confirmed_fraud_count} confirmed</span>
    )}
    {group.cleared_count > 0 && <span>{group.cleared_count} cleared</span>}
    {group.error_count > 0 && <span>{group.error_count} error</span>}
    {group.latest_transfer_date && (
      <span>Latest sale {formatDate(group.latest_transfer_date)}</span>
    )}
  </div>
);

const getInitialExpanded = (
  groupKey: string,
  index: number,
  expandedGroups: Record<string, boolean>
) => {
  if (Object.prototype.hasOwnProperty.call(expandedGroups, groupKey)) {
    return expandedGroups[groupKey];
  }
  return index === 0;
};

const Reports = () => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [minConfidence, setMinConfidence] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [detailResult, setDetailResult] = useState<VerificationResult | null>(
    null
  );
  const [verifiedResults, setVerifiedResults] = useState<
    Record<string, VerificationResult>
  >({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

  const queryClient = useQueryClient();

  const {
    data: reportGroups,
    isLoading,
    error,
  } = useQuery<FraudReportGroup[]>({
    queryKey: ["fraud-report-groups", filterStatus, minConfidence],
    queryFn: async () => {
      const params: Record<string, any> = { limit: 100 };
      if (filterStatus !== "all") params.verification_status = filterStatus;
      if (minConfidence > 0) params.min_confidence = minConfidence;
      const response = await api.get(ENDPOINTS.FRAUD.GROUPED_REPORTS, { params });
      return response.data;
    },
  });

  const flatReports = useMemo(
    () => reportGroups?.flatMap((group) => group.items) ?? [],
    [reportGroups]
  );

  const verifyMutation = useMutation({
    mutationFn: async (matchIds: string[]) => {
      const response = await api.post<VerificationSummary>(
        ENDPOINTS.VERIFICATION.VERIFY,
        { match_ids: matchIds }
      );
      return response.data;
    },
    onSuccess: (data) => {
      const byId: Record<string, VerificationResult> = {};
      data.results.forEach((result) => {
        byId[result.match_id] = result;
      });
      setVerifiedResults((prev) => ({ ...prev, ...byId }));

      const parts: string[] = [];
      if (data.confirmed_fraud_count > 0) {
        parts.push(`${data.confirmed_fraud_count} confirmed fraud`);
      }
      if (data.not_fraud_count > 0) {
        parts.push(`${data.not_fraud_count} cleared`);
      }
      if (data.error_count > 0) {
        parts.push(`${data.error_count} error(s)`);
      }

      if (data.confirmed_fraud_count > 0) {
        toast.error(`Verification complete: ${parts.join(", ")}.`);
      } else {
        toast.success(`Verification complete: ${parts.join(", ")}.`);
      }

      queryClient.invalidateQueries({ queryKey: ["fraud-report-groups"] });
    },
    onError: (mutationError: any) => {
      toast.error(
        "Verification failed: " +
          (mutationError.response?.data?.detail || mutationError.message)
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.patch(ENDPOINTS.FRAUD.UPDATE_REPORT(id), data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Report updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["fraud-report-groups"] });
      setEditingId(null);
      setEditData({});
    },
    onError: (mutationError: any) => {
      toast.error(
        "Update failed: " +
          (mutationError.response?.data?.detail || mutationError.message)
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(ENDPOINTS.FRAUD.DELETE_REPORT(id));
    },
    onSuccess: () => {
      toast.success("Report deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["fraud-report-groups"] });
    },
    onError: (mutationError: any) => {
      toast.error(
        "Delete failed: " +
          (mutationError.response?.data?.detail || mutationError.message)
      );
    },
  });

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  };

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
    const ids = flatReports
      .filter(
        (report) =>
          report.confidence_score >= 85 &&
          report.verification_status === "suspicious"
      )
      .map((report) => report.id);

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

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          className="text-4xl text-primary-500"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-500">Error loading reports: {error.message}</div>
    );
  }

  return (
    <div>
      {detailResult && (
        <VerificationDetailModal
          result={detailResult}
          onClose={() => setDetailResult(null)}
        />
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fraud Reports</h1>
        <button
          onClick={handleVerifyAllHighConfidence}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
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

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <FontAwesomeIcon icon={faFilter} />
          <span>Filters:</span>
        </div>

        <select
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-primary-500"
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
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-primary-500"
          value={minConfidence}
          onChange={(e) => setMinConfidence(Number(e.target.value))}
        >
          <option value={0}>All Confidence</option>
          <option value={70}>Medium ({">"}70%)</option>
          <option value={85}>High ({">"}85%)</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {!reportGroups?.length ? (
          <div className="px-6 py-8 text-center text-slate-500">
            No reports found matching your filters.
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {reportGroups.map((group, index) => {
              const expanded = getInitialExpanded(
                group.group_key,
                index,
                expandedGroups
              );

              return (
                <section
                  key={group.group_key}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.group_key)}
                    className="flex w-full cursor-pointer items-start gap-3 px-6 py-4 text-left transition-colors hover:bg-slate-50"
                  >
                    <span
                      className={clsx(
                        "pt-1 text-slate-400 transition-transform duration-200 ease-out",
                        expanded ? "rotate-0" : "-rotate-90"
                      )}
                    >
                      <FontAwesomeIcon
                        icon={faChevronDown}
                      />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-base font-semibold text-slate-900">
                          {group.property_address}
                        </h2>
                        <StatusBadge
                          status={
                            group.confirmed_fraud_count > 0
                              ? "confirmed_fraud"
                              : group.suspicious_count > 0
                              ? "suspicious"
                              : group.error_count > 0
                              ? "error"
                              : "not_fraud"
                          }
                        />
                        <RiskBadge level={group.risk_level} />
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        {group.postcode && <span>{group.postcode}</span>}
                        {group.property_number && (
                          <span>No. {group.property_number}</span>
                        )}
                        <span>
                          Top match {group.highest_confidence_score.toFixed(1)}%
                        </span>
                      </div>

                      <div className="mt-2">
                        <GroupSummary group={group} />
                      </div>
                    </div>
                  </button>

                  <div
                    className={clsx(
                      "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                      expanded
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6">
                      <div className="space-y-3">
                        {group.items.map((report) => {
                          const isEditing = editingId === report.id;
                          const latestResult = verifiedResults[report.id];

                          return (
                            <div
                              key={report.id}
                              className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto]"
                            >
                              <div className="min-w-0">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <StatusBadge
                                    status={
                                      latestResult?.verification_status ??
                                      report.verification_status
                                    }
                                  />
                                  <RiskBadge level={report.risk_level} />
                                  <span className="text-xs text-slate-400">
                                    {report.confidence_score.toFixed(1)}% match
                                  </span>
                                </div>

                                {isEditing ? (
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      value={editData.property_address || ""}
                                      onChange={(e) =>
                                        setEditData({
                                          ...editData,
                                          property_address: e.target.value,
                                        })
                                      }
                                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
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
                                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                                      placeholder="Postcode"
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-medium text-slate-900">
                                      {report.ppd_full_address || report.property_address}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                      Transfer date {formatDate(report.ppd_transfer_date)}
                                      {" · "}
                                      Official price {formatCurrency(report.ppd_price)}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                  Parties
                                </div>
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
                                    className="mt-2 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                                    placeholder="Buyer (client) name"
                                  />
                                ) : (
                                  <div className="mt-2 space-y-1 text-sm text-slate-600">
                                    <div>
                                      <span className="text-slate-400">Buyer:</span>{" "}
                                      {report.client_name ?? "—"}
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Vendor:</span>{" "}
                                      {report.vendor_name ?? "—"}
                                    </div>
                                    {(latestResult?.verified_owner_name ||
                                      report.verified_owner_name) && (
                                      <div className="text-xs text-slate-500">
                                        Registered owner:{" "}
                                        {latestResult?.verified_owner_name ??
                                          report.verified_owner_name}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                  Timing
                                </div>
                                <div className="mt-2 space-y-1 text-sm text-slate-600">
                                  <div>
                                    <span className="text-slate-400">Withdrawn:</span>{" "}
                                    {formatDate(report.withdrawn_date)}
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Detected:</span>{" "}
                                    {formatDate(report.detected_at)}
                                  </div>
                                  {(latestResult?.verified_at || report.verified_at) && (
                                    <div className="text-xs text-slate-500">
                                      Verified{" "}
                                      {formatDate(
                                        latestResult?.verified_at ?? report.verified_at
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-start justify-end">
                                <div className="flex gap-2">
                                  {isEditing ? (
                                    <>
                                      <button
                                        onClick={() => handleSave(report.id)}
                                        className="p-1 text-green-600 hover:text-green-700"
                                        title="Save"
                                        disabled={updateMutation.isPending}
                                      >
                                        <FontAwesomeIcon icon={faCheck} />
                                      </button>
                                      <button
                                        onClick={handleCancel}
                                        className="p-1 text-slate-400 hover:text-slate-600"
                                        title="Cancel"
                                      >
                                        <FontAwesomeIcon icon={faTimes} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {report.verification_status === "suspicious" && (
                                        <button
                                          onClick={() => handleVerify(report.id)}
                                          className="flex items-center gap-1 rounded border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-100"
                                          title="Verify with Land Registry"
                                          disabled={verifyMutation.isPending}
                                        >
                                          <FontAwesomeIcon icon={faShield} />
                                          Verify
                                        </button>
                                      )}

                                      {(latestResult ||
                                        (report.verification_status !==
                                          "suspicious" &&
                                          report.verified_at)) && (
                                        <button
                                          onClick={() =>
                                            setDetailResult(
                                              latestResult ?? {
                                                match_id: report.id,
                                                property_address:
                                                  report.property_address,
                                                client_name: report.client_name,
                                                vendor_name:
                                                  report.vendor_name ?? null,
                                                verification_status:
                                                  report.verification_status as
                                                    | "confirmed_fraud"
                                                    | "not_fraud"
                                                    | "error",
                                                verified_owner_name:
                                                  report.verified_owner_name ??
                                                  null,
                                                is_confirmed_fraud:
                                                  report.is_confirmed_fraud,
                                                verified_at: report.verified_at!,
                                                error_message: null,
                                              }
                                            )
                                          }
                                          className="p-1 text-slate-400 hover:text-primary-600"
                                          title="View Verification Details"
                                        >
                                          <FontAwesomeIcon icon={faEye} />
                                        </button>
                                      )}

                                      <button
                                        onClick={() => handleEdit(report)}
                                        className="p-1 text-primary-600 hover:text-primary-800"
                                        title="Edit"
                                      >
                                        <FontAwesomeIcon icon={faPencilAlt} />
                                      </button>

                                      <button
                                        onClick={() => handleDelete(report.id)}
                                        className="p-1 text-red-500 hover:text-red-700"
                                        title="Delete"
                                        disabled={deleteMutation.isPending}
                                      >
                                        <FontAwesomeIcon icon={faTimes} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
