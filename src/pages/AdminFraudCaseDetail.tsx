import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faDownload,
  faFileLines,
  faFlag,
  faPrint,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import toast from "react-hot-toast";

import api from "../lib/axios";
import { ENDPOINTS } from "../config";
import {
  AdminFraudCaseDetail,
  RegisterExtractEntry,
  RegisterExtractResponse,
} from "../types";

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—";

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString("en-GB") : "—";

const formatCurrency = (value?: number | null, fallback?: string | null) => {
  if (typeof value === "number") return `£${value.toLocaleString()}`;
  return fallback || "—";
};

const statusStyles: Record<string, string> = {
  suspicious: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed_fraud: "bg-red-100 text-red-700 border-red-200",
  not_fraud: "bg-emerald-100 text-emerald-700 border-emerald-200",
  error: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusLabels: Record<string, string> = {
  suspicious: "Flagged",
  confirmed_fraud: "Confirmed Fraud",
  not_fraud: "Cleared",
  error: "Under Review",
};

const EntryList = ({
  title,
  entries,
}: {
  title: string;
  entries: RegisterExtractEntry[];
}) => {
  if (!entries.length) return null;

  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" open>
      <summary className="cursor-pointer list-none text-lg font-semibold text-slate-900">
        {title}
      </summary>
      <div className="mt-4 space-y-3">
        {entries.map((entry, index) => (
          <div key={`${title}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
              {entry.entry_number || "Entry"}
            </div>
            <div className="mt-2 text-sm text-slate-700">{entry.entry_text || "—"}</div>
            {entry.registration_date && (
              <div className="mt-2 text-xs text-slate-500">
                Registered {entry.registration_date}
              </div>
            )}
          </div>
        ))}
      </div>
    </details>
  );
};

const AdminFraudCaseDetailPage = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [searchParams] = useSearchParams();
  const [extractVisible, setExtractVisible] = useState(false);
  const mockMode = searchParams.get("mock") === "true";
  const queryClient = useQueryClient();

  const caseQuery = useQuery<AdminFraudCaseDetail>({
    queryKey: ["admin-fraud-case", reportId],
    enabled: Boolean(reportId),
    queryFn: async () => {
      const response = await api.get(ENDPOINTS.ADMIN.FRAUD_REPORT(reportId!));
      return response.data;
    },
  });

  const extractQuery = useQuery<RegisterExtractResponse>({
    queryKey: ["admin-register-extract", reportId, mockMode],
    enabled: Boolean(reportId && extractVisible && !caseQuery.data?.register_extract),
    queryFn: async () => {
      const response = await api.get(ENDPOINTS.ADMIN.REGISTER_EXTRACT(reportId!), {
        params: mockMode ? { mock: true } : undefined,
      });
      return response.data;
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get<ArrayBuffer>(
        ENDPOINTS.ADMIN.REGISTER_EXTRACT_PDF(reportId!),
        {
          params: mockMode ? { mock: true } : undefined,
          responseType: "arraybuffer",
        }
      );
      return response;
    },
    onSuccess: (response) => {
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filename =
        response.headers["content-disposition"]?.match(/filename="(.+)"/)?.[1] ||
        `register-extract-${reportId}.pdf`;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (error: any) => {
      toast.error(
        "Download failed: " + (error.response?.data?.detail || error.message)
      );
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get<RegisterExtractResponse>(
        ENDPOINTS.ADMIN.REGISTER_EXTRACT(reportId!),
        {
          params: mockMode ? { mock: true, force_refresh: true } : { force_refresh: true },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["admin-register-extract", reportId, mockMode], data);
      queryClient.invalidateQueries({ queryKey: ["admin-fraud-case", reportId] });
      setExtractVisible(true);
    },
    onError: (error: any) => {
      toast.error(
        "Refresh failed: " + (error.response?.data?.detail || error.message)
      );
    },
  });

  const mismatchSummary = useMemo(() => {
    const currentCase = caseQuery.data;
    const extract = extractQuery.data;
    if (!currentCase || !extract?.proprietors.length) return null;
    return `Seller on listing: ${currentCase.vendor_name || "—"} | Registered owner(s): ${extract.proprietors
      .map((item) => item.name)
      .filter(Boolean)
      .join(", ") || "—"}${extract.proprietors.some((item) => item.mismatch) ? " — MISMATCH" : ""}`;
  }, [caseQuery.data, extractQuery.data]);

  const currentCase = caseQuery.data;
  const extract = extractQuery.data ?? currentCase?.register_extract ?? null;

  useEffect(() => {
    if (caseQuery.data?.register_extract) {
      setExtractVisible(true);
    }
  }, [caseQuery.data?.register_extract]);

  if (caseQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-primary-500" />
      </div>
    );
  }

  if (caseQuery.error || !currentCase) {
    return <div className="py-12 text-red-600">Failed to load this fraud case.</div>;
  }

  return (
    <div className="max-w-6xl print:max-w-none">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-report, .print-report * {
            visibility: visible;
          }
          .print-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
            background: white;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}</style>

      <div className="print-hide mb-6">
        <Link
          to="/admin/fraud-cases"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to cases
        </Link>
      </div>

      <div className="print-report">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
              <FontAwesomeIcon icon={faFlag} />
              Fraud case report
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{currentCase.property_address}</h1>
            <p className="mt-2 text-sm text-slate-500">
              Report ID {currentCase.id} · Agency {currentCase.agency_name}
            </p>
          </div>

          <div className="print-hide flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!extract && !extractVisible) {
                  setExtractVisible(true);
                }
              }}
              disabled={Boolean(!extract && extractVisible && extractQuery.isFetching)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon
                icon={!extract && extractVisible && extractQuery.isFetching ? faSpinner : faFileLines}
                spin={!extract && extractVisible && extractQuery.isFetching}
              />
              {currentCase.register_extract_status === "complete" || extract
                ? "View Register Data"
                : "Fetch Register Extract"}
            </button>

            <button
              type="button"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon
                icon={refreshMutation.isPending ? faSpinner : faFileLines}
                spin={refreshMutation.isPending}
              />
              Refresh Data
            </button>

            <button
              type="button"
              onClick={() => downloadMutation.mutate()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <FontAwesomeIcon
                icon={downloadMutation.isPending ? faSpinner : faDownload}
                spin={downloadMutation.isPending}
              />
              Download PDF
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              <FontAwesomeIcon icon={faPrint} />
              Print Report
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={clsx(
                  "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                  statusStyles[currentCase.verification_status]
                )}
              >
                {statusLabels[currentCase.verification_status]}
              </span>
              {currentCase.risk_level && (
                <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                  {currentCase.risk_level}
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Agency</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{currentCase.agency_name}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Title Number</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{currentCase.title_number || "—"}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Seller</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{currentCase.vendor_name || "—"}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Buyer / Client</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{currentCase.client_name || "—"}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Listing Price</div>
                <div className="mt-1 text-sm font-medium text-slate-900">
                  {formatCurrency(currentCase.ppd_price, currentCase.price)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Flagged</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{formatDateTime(currentCase.detected_at)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Withdrawn Date</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{formatDate(currentCase.withdrawn_date)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Latest Verified</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{formatDateTime(currentCase.verified_at)}</div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">OOV / mismatch context</div>
              <div className="mt-2 text-sm text-slate-700">
                Registered owner from prior verification: {currentCase.verified_owner_name || "—"}
              </div>
              <div className="mt-2 text-sm text-slate-700">
                Confidence {currentCase.confidence_score.toFixed(1)}% · Address similarity{" "}
                {currentCase.address_similarity.toFixed(1)}%
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Print metadata</div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div>PropertyEye case report</div>
              <div>Report ID: {currentCase.id}</div>
              <div>Agency: {currentCase.agency_name}</div>
              <div>Date printed: {new Date().toLocaleString("en-GB")}</div>
              {extract?.fetched_at && (
                <div>Register extract fetched: {formatDateTime(extract.fetched_at)}</div>
              )}
            </div>
            {mismatchSummary && (
              <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
                {mismatchSummary}
              </div>
            )}
          </aside>
        </div>

        {extractVisible && (
          <div className="mt-8 space-y-6">
            {!extract && (extractQuery.isLoading || extractQuery.isFetching) ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
                <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-primary-500" />
              </div>
            ) : extractQuery.error || !extract ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
                Failed to load register extract data.
              </div>
            ) : (
              <>
                {extract.error_message && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
                    {extract.error_message}
                  </div>
                )}

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Register Extract</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Source: HM Land Registry Register Extract Service
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {extract.status}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Address</div>
                      <div className="mt-1 text-sm font-medium text-slate-900">
                        {extract.property.address || currentCase.property_address}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Tenure</div>
                      <div className="mt-1 text-sm font-medium text-slate-900">
                        {extract.property.tenure || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Fetched</div>
                      <div className="mt-1 text-sm font-medium text-slate-900">
                        {formatDateTime(extract.fetched_at)}
                      </div>
                    </div>
                  </div>

                  {extract.property.description && (
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                      {extract.property.description}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-slate-900">Registered Proprietors</h2>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left text-sm">
                      <thead className="border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="pb-3 font-medium">Name</th>
                          <th className="pb-3 font-medium">Type</th>
                          <th className="pb-3 font-medium">Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {extract.proprietors.map((item, index) => (
                          <tr key={`${item.name}-${index}`}>
                            <td className="py-4">
                              <span
                                className={clsx(
                                  "font-medium",
                                  item.mismatch ? "text-red-700" : "text-slate-900"
                                )}
                              >
                                {item.name || "—"}
                              </span>
                            </td>
                            <td className="py-4 text-slate-600">{item.type || "—"}</td>
                            <td className="py-4 text-slate-600">{item.address || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {!!extract.quick_reference_flags.length && (
                  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900">Quick Reference Flags</h2>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {extract.quick_reference_flags.map((flag) => (
                        <span
                          key={flag}
                          className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <EntryList title="Charges & Mortgages" entries={extract.charges} />
                <EntryList title="Restrictions" entries={extract.restrictions} />
                <EntryList title="Leases" entries={extract.leases} />
                <EntryList title="Notices" entries={extract.notices} />

                <div className="pt-2 text-xs text-slate-400">
                  Source: HM Land Registry Register Extract Service | Fetched:{" "}
                  {formatDateTime(extract.fetched_at)}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFraudCaseDetailPage;
