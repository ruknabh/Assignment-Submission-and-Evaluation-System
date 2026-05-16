// Color-coded plagiarism score badge
// 0-30 → green (low), 31-60 → amber (medium), 61-100 → red (high)

const PlagiarismBadge = ({ score }) => {
  if (score === null || score === undefined) return null;

  const getConfig = (s) => {
    if (s <= 30) return { label: `${s}% Similar`, class: 'bg-green-100 text-green-700' };
    if (s <= 60) return { label: `${s}% Similar`, class: 'bg-amber-100 text-amber-700' };
    return       { label: `${s}% Similar`, class: 'bg-red-100 text-red-700' };
  };

  const cfg = getConfig(score);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.class}`}>
      {cfg.label}
    </span>
  );
};

export default PlagiarismBadge;