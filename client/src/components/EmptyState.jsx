// Reusable empty state — replaces all inline empty state blocks across pages
const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center h-64
    bg-white rounded-xl border border-gray-100 shadow-sm px-6 text-center">

    {icon && (
      <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center
        justify-center mb-4">
        <span className="text-gray-300">{icon}</span>
      </div>
    )}

    <p className="text-sm font-semibold text-gray-700">{title}</p>

    {description && (
      <p className="text-xs text-gray-400 mt-1 max-w-xs">{description}</p>
    )}

    {action && (
      <button
        onClick={action.onClick}
        className="mt-4 text-sm text-blue-600 font-medium hover:underline
          transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);

export default EmptyState;