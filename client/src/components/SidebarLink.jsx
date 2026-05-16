import { NavLink } from 'react-router-dom';

const SidebarLink = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-600 font-medium'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-normal'
        }`
      }
    >
      <span className="w-5 h-5 shrink-0">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
};

export default SidebarLink;