import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudUploadAlt,
  faFileCsv,
  faCheckCircle,
  faSpinner,
  faSearch,
  faPlus,
  faTimes,
  faTable,
  faPencilAlt,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ENDPOINTS } from "../config";
import { UploadStats, PropertyListing } from "../types";
import api from "../lib/axios";

const REQUIRED_FIELDS = [
  { key: "address", label: "Property Address" },
  { key: "postcode", label: "Postcode" },
  { key: "client_name", label: "Client Name" },
  { key: "status", label: "Listing Status" },
  { key: "withdrawn_date", label: "Withdrawn Date" },
];

const Upload = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<
    "upload" | "mapping" | "uploading" | "success"
  >("upload");
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch listings
  const { data: listings, isLoading } = useQuery<PropertyListing[]>({
    queryKey: ["listings"],
    queryFn: async () => {
      const response = await api.get(ENDPOINTS.DOCUMENTS.LISTINGS);
      return response.data;
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.patch(
        ENDPOINTS.DOCUMENTS.UPDATE_LISTING(id),
        data
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Listing updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      setEditingId(null);
      setEditData({});
    },
    onError: (error: any) => {
      toast.error(
        "Update failed: " + (error.response?.data?.detail || error.message)
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(ENDPOINTS.DOCUMENTS.DELETE_LISTING(id));
    },
    onSuccess: () => {
      toast.success("Listing deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: (error: any) => {
      toast.error(
        "Delete failed: " + (error.response?.data?.detail || error.message)
      );
    },
  });

  const handleEdit = (listing: PropertyListing) => {
    setEditingId(listing.id);
    setEditData({
      address: listing.address,
      postcode: listing.postcode,
      client_name: listing.client_name,
      status: listing.status,
      withdrawn_date: listing.withdrawn_date,
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
    if (confirm("Are you sure you want to delete this listing?")) {
      deleteMutation.mutate(id);
    }
  };

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
          REQUIRED_FIELDS.forEach((field) => {
            const match = results.meta.fields!.find(
              (h) =>
                h.toLowerCase() === field.key.toLowerCase() ||
                h.toLowerCase().includes(field.key)
            );
            if (match) initialMapping[field.key] = match;
          });
          setMapping(initialMapping);
          setStep("mapping");
        } else {
          toast.error("Could not parse CSV headers");
        }
      },
      error: (error) => {
        toast.error("Error parsing CSV: " + error.message);
      },
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls", ".xlsx"],
    },
    multiple: false,
  });

  const handleMappingChange = (systemField: string, csvHeader: string) => {
    setMapping((prev) => ({ ...prev, [systemField]: csvHeader }));
  };

  const handleUpload = async () => {
    if (!file) return;

    // Validate mapping
    const missingFields = REQUIRED_FIELDS.filter((f) => !mapping[f.key]);
    if (missingFields.length > 0) {
      toast.error(
        `Please map all required fields: ${missingFields
          .map((f) => f.label)
          .join(", ")}`
      );
      return;
    }

    setStep("uploading");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("field_mapping", JSON.stringify(mapping));

    try {
      const response = await api.post(ENDPOINTS.DOCUMENTS.UPLOAD, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadStats(response.data);
      setStep("success");
      toast.success("File uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.detail || "Failed to upload file");
      setStep("mapping");
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await api.post(ENDPOINTS.FRAUD.SCAN);
      toast.success("Fraud scan completed successfully!");
      navigate("/reports");
    } catch (error: any) {
      console.error("Scan error:", error);
      toast.error(error.response?.data?.detail || "Failed to run fraud scan");
    } finally {
      setIsScanning(false);
    }
  };

  const reset = () => {
    setFile(null);
    setHeaders([]);
    setMapping({});
    setStep("upload");
    setUploadStats(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Uploaded Listings</h1>
          <p className="text-slate-500">
            Manage your agency's property listings.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          Add New Listing
        </button>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Postcode</th>
                <th className="px-6 py-4">Client Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Withdrawn Date</th>
                <th className="px-6 py-4">Uploaded At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                      className="text-primary-500 text-xl"
                    />
                  </td>
                </tr>
              ) : listings?.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <FontAwesomeIcon icon={faTable} className="text-xl" />
                      </div>
                      <p>No listings uploaded yet.</p>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Upload your first file
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                listings?.map((listing) => (
                  <tr
                    key={listing.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {listing.address}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {listing.postcode}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {listing.client_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {listing.withdrawn_date
                        ? new Date(listing.withdrawn_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(listing.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">Upload Listings</h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-lg" />
              </button>
            </div>

            <div className="p-6">
              {step === "upload" && (
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
                    <FontAwesomeIcon
                      icon={faCloudUploadAlt}
                      className="text-2xl"
                    />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Click to upload or drag and drop
                  </h3>
                  <p className="text-slate-500 text-sm">
                    CSV or Excel files (max 10MB)
                  </p>
                </div>
              )}

              {step === "mapping" && file && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faFileCsv} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{file.name}</h3>
                        <p className="text-xs text-slate-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={reset}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Change File
                    </button>
                  </div>

                  <div className="p-4">
                    <h4 className="font-medium mb-4 text-sm text-slate-700">
                      Map Columns
                    </h4>
                    <div className="space-y-3">
                      {REQUIRED_FIELDS.map((field) => (
                        <div
                          key={field.key}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center"
                        >
                          <label className="text-sm font-medium text-slate-700">
                            {field.label}{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="md:col-span-2">
                            <select
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                              value={mapping[field.key] || ""}
                              onChange={(e) =>
                                handleMappingChange(field.key, e.target.value)
                              }
                            >
                              <option value="">Select column...</option>
                              {headers.map((header) => (
                                <option key={header} value={header}>
                                  {header}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
                    <button
                      onClick={handleUpload}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      Process File
                    </button>
                  </div>
                </div>
              )}

              {step === "uploading" && (
                <div className="text-center py-12">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    className="text-4xl text-primary-500 mb-4"
                  />
                  <h3 className="text-xl font-semibold">Processing File...</h3>
                  <p className="text-slate-500">This may take a few moments.</p>
                </div>
              )}

              {step === "success" && uploadStats && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className="text-3xl"
                    />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Upload Complete!</h2>
                  <p className="text-slate-500 mb-6">
                    Your file has been processed successfully.
                  </p>

                  <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">Processed</p>
                      <p className="text-lg font-bold text-slate-900">
                        {uploadStats.records_processed}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">Skipped</p>
                      <p className="text-lg font-bold text-slate-900">
                        {uploadStats.records_skipped}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center gap-3">
                    <button
                      onClick={reset}
                      className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      Upload Another
                    </button>
                    <button
                      onClick={handleScan}
                      disabled={isScanning}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                    >
                      {isScanning ? (
                        <FontAwesomeIcon icon={faSpinner} spin />
                      ) : (
                        <FontAwesomeIcon icon={faSearch} />
                      )}
                      Run Fraud Scan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
