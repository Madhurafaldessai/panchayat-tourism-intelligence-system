const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'heatmap', label: 'Heatmap' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'issues-solved', label: 'Solved Issues' },
  ];

  return (
    <aside className="z-50 flex w-full shrink-0 flex-col border-b-2 border-black bg-white py-4 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:w-60 lg:border-b-0 lg:border-r-2 lg:py-8">
      <div className="mb-4 px-6 lg:mb-16 lg:px-8">
        <div className="flex h-10 w-45 items-center justify-center border-2 border-black font-serif text-xl font-bold">
          AdminPortal
        </div>
      </div>

      <nav className="flex w-full overflow-x-auto lg:flex-col" aria-label="Dashboard navigation">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`shrink-0 px-6 py-3 text-left text-base transition-all lg:w-full lg:px-8 lg:py-4 lg:text-xl ${
                isActive ? 'bg-gray-200 font-bold' : 'text-gray-800 hover:bg-gray-50 hover:text-black'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-4 px-6 lg:mt-auto lg:px-8">
        <button
          type="button"
          onClick={onLogout}
          className="w-full border-2 border-black bg-[#111] py-3 text-md font-bold text-white transition-colors hover:bg-white hover:text-black"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
