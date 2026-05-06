import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faFilter,
  faFlag,
  faMagnifyingGlass,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";

import api from "../lib/axios";
import { ENDPOINTS } from "../config";
import {
  AdminAgencyFilter,
  AdminFraudCase,
  AdminFraudCaseListResponse,
} from "../types";

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—";

const StatusBadge = ({ status }: { status: AdminFraudCase["verification_status"] }) => {
  const styles: Record<string, string> = {
    suspicious: "bg-amber-100 text-amber-800 border-amber-200",
    confirmed_fraud: "bg-red-100 text-red-700 border-red-200",
    not_fraud: "bg-emerald-100 text-emerald-700 border-emerald-200",
    error: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const labels: Record<string, string> = {
    suspicious: "Flagged",
    confirmed_fraud: "Resolved",
    not_fraud: "Resolved",
    error: "Under Review",
  };

  return (
    <span
      className={clsx(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
};

const AdminFraudCases = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [agencyId, setAgencyId] = useState("all");
  const pageSize = 15;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const { data: agencies } = useQuery<AdminAgencyFilter[]>({
    queryKey: ["admin-fraud-case-agencies"],
    queryFn: async () => {
      const response = await api.get(ENDPOINTS.ADMIN.FRAUD_REPORT_AGENCIES);
      return response.data;
    },
  });

  const { data, isLoading, error } = useQuery<AdminFraudCaseListResponse>({
    queryKey: ["admin-fraud-cases", page, pageSize, search, status, agencyId],
    queryFn: async () => {
      const response = await api.get(ENDPOINTS.ADMIN.FRAUD_REPORTS, {
        params: {
          page,
          page_size: pageSize,
          search: search || undefined,
          status: status !== "all" ? status : undefined,
          agency_id: agencyId !== "all" ? agencyId : undefined,
        },
      });
      return response.data;
    },
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="max-w-7xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
            <FontAwesomeIcon icon={faFlag} />
            Cross-agency review
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Fraud Cases</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Review fraud cases across every agency and open a disclosure-ready detail
            view when register data is needed.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Total cases
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {data?.total ?? "—"}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1.8fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-slate-400" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="Search address, agency, or seller"
          />
        </label>

        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500">
          <FontAwesomeIcon icon={faFilter} className="text-slate-400" />
          <select
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            className="w-full bg-transparent text-slate-900 outline-none"
          >
            <option value="all">All statuses</option>
            <option value="suspicious">Flagged</option>
            <option value="confirmed_fraud">Confirmed fraud</option>
            <option value="not_fraud">Cleared</option>
            <option value="error">Under review</option>
          </select>
        </label>

        <select
          value={agencyId}
          onChange={(event) => {
            setPage(1);
            setAgencyId(event.target.value);
          }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none"
        >
          <option value="all">All agencies</option>
          {agencies?.map((agency) => (
            <option key={agency.id} value={agency.id}>
              {agency.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Agency</th>
                <th className="px-6 py-4 font-medium">Property</th>
                <th className="px-6 py-4 font-medium">Seller</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Flagged</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-slate-500">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-primary-500" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-red-600">
                    Failed to load fraud cases.
                  </td>
                </tr>
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-slate-500">
                    No fraud cases match the current filters.
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/admin/fraud-cases/${item.id}`)}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{item.agency_name}</div>
                      <div className="mt-1 text-xs text-slate-400">{item.postcode || "—"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{item.property_address}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.title_number ? `Title ${item.title_number}` : "No title number"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{item.vendor_name || "—"}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.verification_status} />
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(item.detected_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/admin/fraud-cases/${item.id}`);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                      >
                        Open case
                        <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-sm">
          <div className="text-slate-500">
            Page {data?.page ?? page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              className="rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFraudCases;
