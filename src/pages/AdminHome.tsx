import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faDatabase,
  faBuilding,
  faFlag,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";

const AdminHome = () => {
  const cards = [
    {
      title: "Official Records",
      description: "Manage PPD uploads and review processing history.",
      to: "/admin/records",
      icon: faDatabase,
    },
    {
      title: "Fraud Cases",
      description: "Review flagged cases across all agencies and fetch register extracts.",
      to: "/admin/fraud-cases",
      icon: faFlag,
    },
    {
      title: "Alto Integration",
      description: "Configure production AgencyRef settings for Alto.",
      to: "/admin/alto",
      icon: faBuilding,
    },
  ];

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-slate-100">
          <FontAwesomeIcon icon={faShieldAlt} />
          Admin only
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Restricted tools for records management and Alto setup live here. Client
          users stay on the public dashboard.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <FontAwesomeIcon icon={card.icon} className="text-lg" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{card.description}</p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary-700">
              Open
              <FontAwesomeIcon
                icon={faArrowRight}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminHome;
