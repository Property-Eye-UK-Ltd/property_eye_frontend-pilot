import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faEdit,
  faSpinner,
  faCheckCircle,
  faTimesCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import api from "../lib/axios";
import { ENDPOINTS } from "../config";

interface AgencyAltoDetail {
  id: string;
  name: string;
  username: string;
  alto_agency_ref: string | null;
  alto_env: string;
  alto_status: string;
}

interface UpdateAltoSettings {
  alto_agency_ref: string | null;
  enable_production: boolean;
}

const AdminAlto = () => {
  const [editingAgency, setEditingAgency] = useState<AgencyAltoDetail | null>(
    null
  );
  const [editForm, setEditForm] = useState<UpdateAltoSettings>({
    alto_agency_ref: "",
    enable_production: false,
  });
  const queryClient = useQueryClient();

  // Fetch Agencies
  const { data, isLoading } = useQuery<{
    items: AgencyAltoDetail[];
    total: number;
  }>({
    queryKey: ["admin-alto-agencies"],
    queryFn: async () => {
      const response = await api.get(ENDPOINTS.ADMIN.ALTO_AGENCIES);
      return response.data;
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (vars: { id: string; data: UpdateAltoSettings }) => {
      const response = await api.patch(
        `${ENDPOINTS.ADMIN.ALTO_AGENCIES}/${vars.id}/settings`,
        vars.data
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Agency Alto settings updated");
      setEditingAgency(null);
      queryClient.invalidateQueries({ queryKey: ["admin-alto-agencies"] });
    },
    onError: (error: any) => {
      toast.error(
        "Update failed: " + (error.response?.data?.detail || error.message)
      );
    },
  });

  const handleEditClick = (agency: AgencyAltoDetail) => {
    setEditingAgency(agency);
    // Determine enabled state: if ref is present, we assume enabled (or just fill the form)
    // The requirement implies simplified logic: Toggle ON means we want to use prod.
    const isProductionEnv = agency.alto_env === "production";
    const hasRef = !!agency.alto_agency_ref;

    // We default toggle to true if they have a ref, or if they are in prod mode environment and want to enable it.
    // If global env is sandbox, toggle might be meaningless or disabled?
    // Doc: "Toggle/checkbox: Enable Alto in production for this agency".
    // Even if global env is Sandbox, we might want to configure them for Production readiness?
    // "In sandbox env: Ignore the alto_agency_ref ... Sandbox works differently: your sandbox Alto UI tenant is already linked"
    // So this setting is purely for storing the Production Ref.

    setEditForm({
      alto_agency_ref: agency.alto_agency_ref || "",
      enable_production: hasRef, // Pre-fill based on whether they have a ref
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (updateMutation.isPending || !editingAgency) return;

    updateMutation.mutate({
      id: editingAgency.id,
      data: {
        alto_agency_ref: editForm.enable_production
          ? editForm.alto_agency_ref
          : null,
        enable_production: editForm.enable_production,
      },
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Admin / Alto Integration
        </h1>
        <p className="text-slate-500 mt-1">
          Manage AgencyRef settings for Alto Production environment.
        </p>
        {data?.items[0]?.alto_env === "sandbox" && (
          <div className="mt-2 text-sm bg-yellow-50 text-yellow-800 px-3 py-1 rounded inline-block border border-yellow-200">
            System is currently in <strong>Sandbox Mode</strong>. These settings
            will prepare agencies for Production.
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Agency Name</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Alto Status</th>
                <th className="px-6 py-4">Agency Ref (Prod)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                      className="text-2xl text-primary-500"
                    />
                  </td>
                </tr>
              ) : (
                data?.items.map((agency) => (
                  <tr
                    key={agency.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {agency.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {agency.username}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={clsx(
                          "px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5",
                          agency.alto_status.includes("Production Connected")
                            ? "bg-green-100 text-green-700"
                            : agency.alto_status.includes("Sandbox")
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {agency.alto_status.includes("Production") ? (
                          <FontAwesomeIcon icon={faCheckCircle} />
                        ) : null}
                        {agency.alto_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {agency.alto_agency_ref || (
                        <span className="text-slate-300 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEditClick(agency)}
                        className="text-primary-600 hover:text-primary-800 font-medium hover:underline flex items-center gap-1 justify-end ml-auto"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingAgency && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">Edit Alto Settings</h2>
              <button
                onClick={() => setEditingAgency(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FontAwesomeIcon icon={faTimes} className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <h3 className="font-medium text-slate-900 mb-1">
                  {editingAgency.name}
                </h3>
                <p className="text-xs text-slate-500">ID: {editingAgency.id}</p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="enableProd"
                  checked={editForm.enable_production}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      enable_production: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label
                  htmlFor="enableProd"
                  className="text-sm font-medium text-slate-700 cursor-pointer select-none"
                >
                  Enable Alto in Production
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Alto AgencyRef
                  {editForm.enable_production && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <input
                  type="text"
                  value={editForm.alto_agency_ref}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      alto_agency_ref: e.target.value,
                    })
                  }
                  placeholder="e.g. A1234..."
                  disabled={!editForm.enable_production}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 disabled:bg-slate-100 disabled:text-slate-400 transition-all font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Found in the activation email from Alto/Zoopla.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingAgency(null)}
                  className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAlto;
