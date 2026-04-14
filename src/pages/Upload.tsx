import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faCheck,
  faCheckCircle,
  faCloudUploadAlt,
  faEye,
  faExclamationTriangle,
  faKeyboard,
  faPencilAlt,
  faPlus,
  faSearch,
  faShield,
  faSpinner,
  faTable,
  faTimes,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ENDPOINTS } from "../config";
import api from "../lib/axios";
import { PropertyListing, UploadStats, VerificationSummary, VerificationResult } from "../types";

type UploadStep = "upload" | "uploading" | "success";

const Upload = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<UploadStep>("upload");
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  // Manual HMLR verification state
  const [verifyListingId, setVerifyListingId] = useState<string | null>(null);
  const [verifyListingAddress, setVerifyListingAddress] = useState<string>("");
  const [verifyResult, setVerifyResult] = useState<VerificationSummary | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [manualData, setManualData] = useState<Record<string, string>>({
    address: "",
    postcode: "",
    region: "",
    county: "",
    property_number: "",
    title_number: "",
    client_name: "",
    status: "withdrawn",
    withdrawn_date: "",
    price: "",
    commission: "",
    contract_duration: "",
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: listings, isLoading } = useQuery<PropertyListing[]>({
    queryKey: ["listings"],
    queryFn: async () => {
      const response = await api.get(ENDPOINTS.DOCUMENTS.LISTINGS);
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.patch(ENDPOINTS.DOCUMENTS.UPDATE_LISTING(id), data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Listing updated");
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      setEditingId(null);
      setEditData({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update listing");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(ENDPOINTS.DOCUMENTS.DELETE_LISTING(id));
    },
    onSuccess: () => {
      toast.success("Listing deleted");
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete listing");
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selected = acceptedFiles[0];
    if (selected) {
      setFile(selected);
      setStep("upload");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  const resetUploadState = () => {
    setFile(null);
    setUploadStats(null);
    setStep("upload");
  };

  // Upload CSV/PDF and let backend extractor map fields automatically.
  const handleFileUpload = async () => {
    if (!file) return;
    setStep("uploading");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await api.post(ENDPOINTS.DOCUMENTS.UPLOAD, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadStats(response.data);
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      toast.success("File uploaded successfully");
    } catch (error: any) {
      setStep("upload");
      toast.error(error.response?.data?.detail || "Failed to upload file");
    }
  };

  // Submit manual dictionary payload to the ingest endpoint.
  const handleManualSubmit = async () => {
    if (!manualData.address.trim()) {
      toast.error("Address is required");
      return;
    }
    try {
      const response = await api.post(ENDPOINTS.DOCUMENTS.INGEST, {
        record: manualData,
      });
      setUploadStats(response.data);
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      setIsManualModalOpen(false);
      toast.success("Manual listing added");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to add listing");
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await api.post(ENDPOINTS.FRAUD.SCAN);
      toast.success("Fraud scan completed");
      navigate("/reports");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to run fraud scan");
    } finally {
      setIsScanning(false);
    }
  };

  const handleEdit = (listing: PropertyListing) => {
    setEditingId(listing.id);
    setEditData({
      address: listing.address,
      postcode: listing.postcode,
      region: listing.region,
      county: listing.county,
      property_number: listing.property_number,
      title_number: listing.title_number,
      client_name: listing.client_name,
      status: listing.status,
      withdrawn_date: listing.withdrawn_date,
      price: listing.price,
      commission: listing.commission,
      contract_duration: listing.contract_duration,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const renderCellInput = (key: string, type: "text" | "date" = "text") => (
    <input
      type={type}
      value={editData[key] || ""}
      onChange={(e) => setEditData((prev: any) => ({ ...prev, [key]: e.target.value }))}
      className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
    />
  );

  const handleVerifyClick = (listing: PropertyListing) => {
    setVerifyListingId(listing.id);
    setVerifyListingAddress(listing.address);
    setVerifyResult(null);
  };

  const handleVerifyConfirm = async () => {
    if (!verifyListingId) return;
    setIsVerifying(true);
    try {
      const response = await api.post<VerificationSummary>(
        ENDPOINTS.VERIFICATION.VERIFY_LISTING(verifyListingId)
      );
      setVerifyResult(response.data);
      setVerifyListingId(null);
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Verification failed");
      setVerifyListingId(null);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Uploaded Listings</h1>
          <p className="text-slate-500">Upload CSV/PDF, or add listings manually.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={isScanning ? faSpinner : faSearch} spin={isScanning} />
            {isScanning ? "Scanning..." : "Rescan Listings"}
          </button>
          <button
            onClick={() => setIsIntegrationsModalOpen(true)}
            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faBuilding} />
            Integrations
          </button>
          <button
            onClick={() => {
              resetUploadState();
              setIsUploadModalOpen(true);
            }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faCloudUploadAlt} />
            Upload File
          </button>
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faKeyboard} />
            Manual Entry
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Postcode</th>
                <th className="px-4 py-3">Region/County</th>
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Price/Commission</th>
                <th className="px-4 py-3">Withdrawn</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-primary-500 text-xl" />
                  </td>
                </tr>
              ) : listings?.length ? (
                listings.map((listing) => {
                  const editing = editingId === listing.id;
                  return (
                    <tr key={listing.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{editing ? renderCellInput("address") : listing.address}</td>
                      <td className="px-4 py-3">{editing ? renderCellInput("postcode") : listing.postcode || "-"}</td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <div className="space-y-1">
                            {renderCellInput("region")}
                            {renderCellInput("county")}
                          </div>
                        ) : (
                          <>
                            <div>{listing.region || "-"}</div>
                            <div className="text-xs text-slate-500">{listing.county || "-"}</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <div className="space-y-1">
                            {renderCellInput("property_number")}
                            {renderCellInput("title_number")}
                          </div>
                        ) : (
                          <>
                            <div>{listing.property_number || "-"}</div>
                            <div className="text-xs text-slate-500">{listing.title_number || "-"}</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">{editing ? renderCellInput("client_name") : listing.client_name || "-"}</td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <div className="space-y-1">
                            {renderCellInput("price")}
                            {renderCellInput("commission")}
                          </div>
                        ) : (
                          <>
                            <div>{listing.price || "-"}</div>
                            <div className="text-xs text-slate-500">{listing.commission || "-"}</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editing
                          ? renderCellInput("withdrawn_date", "date")
                          : listing.withdrawn_date
                          ? new Date(listing.withdrawn_date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {editing ? (
                            <>
                              <button
                                onClick={() => updateMutation.mutate({ id: listing.id, data: editData })}
                                className="text-green-600 hover:text-green-700 p-1"
                              >
                                <FontAwesomeIcon icon={faCheck} />
                              </button>
                              <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600 p-1">
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* HMLR Verify button */}
                              <button
                                onClick={() => handleVerifyClick(listing)}
                                className="text-indigo-500 hover:text-indigo-700 p-1 transition-colors"
                                title="Verify via HMLR (HM Flow)"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              <button
                                onClick={() => handleEdit(listing)}
                                className="text-blue-500 hover:text-blue-700 p-1"
                              >
                                <FontAwesomeIcon icon={faPencilAlt} />
                              </button>
                              <button
                                onClick={() => deleteMutation.mutate(listing.id)}
                                className="text-red-500 hover:text-red-700 p-1"
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
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <FontAwesomeIcon icon={faTable} className="text-xl" />
                      </div>
                      <p>No listings uploaded yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">Upload Listings (CSV/PDF)</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="p-6">
              {step === "upload" && (
                <div className="space-y-4">
                  <div
                    {...getRootProps()}
                    className={clsx(
                      "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors",
                      isDragActive
                        ? "border-primary-500 bg-primary-50"
                        : "border-slate-300 hover:border-primary-400 hover:bg-slate-50"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FontAwesomeIcon icon={faCloudUploadAlt} className="text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Drop CSV or PDF</h3>
                    <p className="text-slate-500 text-sm">The backend extractor handles mapping automatically.</p>
                  </div>
                  {file && (
                    <div className="flex items-center justify-between border border-slate-200 rounded-lg p-3">
                      <span className="text-sm">{file.name}</span>
                      <button className="text-xs text-red-500" onClick={() => setFile(null)}>
                        Remove
                      </button>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={handleFileUpload}
                      disabled={!file}
                      className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Upload and Process
                    </button>
                  </div>
                </div>
              )}
              {step === "uploading" && (
                <div className="text-center py-10">
                  <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-primary-500 mb-3" />
                  <p>Processing listing data...</p>
                </div>
              )}
              {step === "success" && uploadStats && (
                <div className="text-center py-4">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-600 mb-3" />
                  <p className="font-semibold">Upload Complete</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Processed: {uploadStats.records_processed} · Skipped: {uploadStats.records_skipped}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">Manual Listing Entry</h2>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(manualData).map(([key, val]) => (
                <div key={key}>
                  <label className="block text-xs text-slate-500 mb-1 capitalize">
                    {key.replaceAll("_", " ")}
                  </label>
                  <input
                    type={key === "withdrawn_date" ? "date" : "text"}
                    value={val}
                    onChange={(e) =>
                      setManualData((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleManualSubmit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
              >
                Save Listing
              </button>
            </div>
          </div>
        </div>
      )}

      {isIntegrationsModalOpen && (
        <IntegrationsModal
          isOpen={isIntegrationsModalOpen}
          onClose={() => setIsIntegrationsModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["listings"] });
            setIsIntegrationsModalOpen(false);
          }}
        />
      )}

      {/* HMLR Verification — Confirmation Modal */}
      {verifyListingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faShield} className="text-3xl" />
              </div>
              <h2 className="text-xl font-bold mb-2">HMLR Verification</h2>
              <p className="text-slate-500 text-sm mb-2">
                This will run the full HM Flow for:
              </p>
              <p className="font-medium text-slate-800 text-sm bg-slate-50 rounded-lg px-3 py-2 mb-4 break-words">
                {verifyListingAddress}
              </p>
              <p className="text-slate-500 text-xs mb-6">
                The system will scan for suspicious PPD matches and then verify
                ownership directly via HM Land Registry. This may take a moment.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setVerifyListingId(null)}
                  disabled={isVerifying}
                  className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyConfirm}
                  disabled={isVerifying}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {isVerifying ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faShield} />
                      Run HM Flow
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HMLR Verification — Result Modal */}
      {verifyResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2 text-lg font-semibold">
                {verifyResult.confirmed_fraud_count > 0 ? (
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />
                ) : verifyResult.total_verified === 0 ? (
                  <FontAwesomeIcon icon={faTimesCircle} className="text-slate-400" />
                ) : (
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                )}
                HMLR Verification Result
              </div>
              <button
                onClick={() => setVerifyResult(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {verifyResult.total_verified === 0 ? (
                <div className="bg-slate-50 rounded-xl p-4 text-center text-slate-500 text-sm">
                  {verifyResult.message}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                      <p className="text-2xl font-bold text-red-600">{verifyResult.confirmed_fraud_count}</p>
                      <p className="text-xs text-red-500 mt-1">Confirmed Fraud</p>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                      <p className="text-2xl font-bold text-green-600">{verifyResult.not_fraud_count}</p>
                      <p className="text-xs text-green-500 mt-1">Cleared</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <p className="text-2xl font-bold text-slate-500">{verifyResult.error_count}</p>
                      <p className="text-xs text-slate-400 mt-1">Errors</p>
                    </div>
                  </div>

                  {verifyResult.results.map((r: VerificationResult, i: number) => (
                    <div
                      key={i}
                      className={clsx(
                        "rounded-xl border p-3 text-sm",
                        r.verification_status === "confirmed_fraud"
                          ? "bg-red-50 border-red-200"
                          : r.verification_status === "not_fraud"
                          ? "bg-green-50 border-green-200"
                          : "bg-slate-50 border-slate-200"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-900">{r.property_address}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Client: {r.client_name}</p>
                          {r.verified_owner_name && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              Registered owner: <span className="font-medium">{r.verified_owner_name}</span>
                            </p>
                          )}
                        </div>
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ml-2",
                            r.verification_status === "confirmed_fraud"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : r.verification_status === "not_fraud"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {r.verification_status === "confirmed_fraud"
                            ? "Fraud"
                            : r.verification_status === "not_fraud"
                            ? "Cleared"
                            : "Error"}
                        </span>
                      </div>
                      {r.error_message && (
                        <p className="text-xs text-red-600 mt-1">{r.error_message}</p>
                      )}
                    </div>
                  ))}

                  <p className="text-xs text-slate-400 text-center">{verifyResult.message}</p>
                </>
              )}
            </div>
            <div className="p-4 pt-0">
              <button
                onClick={() => setVerifyResult(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-xl text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const IntegrationsModal = ({ isOpen, onClose, onSuccess }: IntegrationsModalProps) => {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const integrations = [
    {
      id: "alto",
      name: "Alto (Zoopla)",
      description: "Import properties from your Alto/Zoopla account",
      icon: faBuilding,
      available: true,
    },
  ];

  const handleImport = async () => {
    if (!selectedIntegration) {
      toast.error("Please select an integration");
      return;
    }
    if (selectedIntegration !== "alto") return;
    setIsImporting(true);
    try {
      const response = await api.post(ENDPOINTS.INTEGRATIONS.ALTO_IMPORT);
      const data = response.data;
      toast.success(data.message || `Imported ${data.properties_imported} properties`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to import from Alto");
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold">Import from Integrations</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {integrations.map((integration) => (
              <button
                key={integration.id}
                onClick={() => setSelectedIntegration(integration.id)}
                className={clsx(
                  "w-full text-left p-4 rounded-lg border-2 transition-all",
                  selectedIntegration === integration.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600">
                    <FontAwesomeIcon icon={integration.icon} className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{integration.name}</h3>
                    <p className="text-xs text-slate-500">{integration.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-50 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedIntegration || isImporting}
              className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin /> Importing...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPlus} /> Import Properties
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
