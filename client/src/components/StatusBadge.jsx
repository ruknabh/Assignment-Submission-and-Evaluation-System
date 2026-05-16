// Maps submission status to a colored pill badge
const config = {
  submitted: {
    label: 'Submitted',
    class: 'bg-blue-100 text-blue-700',
  },
  evaluated: {
    label: 'Evaluated',
    class: 'bg-amber-100 text-amber-700',
  },
  returned: {
    label: 'Returned',
    class: 'bg-green-100 text-green-700',
  },
  pending: {
    label: 'Pending',
    class: 'bg-gray-100 text-gray-600',
  },
  late: {
    label: 'Late',
    class: 'bg-red-100 text-red-600',
  },
};

const StatusBadge = ({ status }) => {
  const cfg = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.class}`}>
      {cfg.label}
    </span>
  );
};

export default StatusBadge;