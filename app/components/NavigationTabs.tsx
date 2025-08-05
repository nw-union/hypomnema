import { Link, useLocation } from "react-router";

export default function NavigationTabs() {
  const location = useLocation();

  const tabs = [
    { name: "マイページ", href: "/", key: "home" },
    { name: "共有", href: "/share", key: "share" },
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive =
            (tab.key === "home" && location.pathname === "/") ||
            (tab.key === "share" && location.pathname === "/share");

          return (
            <Link
              key={tab.key}
              to={tab.href}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                isActive
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
