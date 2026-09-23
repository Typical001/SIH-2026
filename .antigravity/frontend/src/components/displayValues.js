export function formatDuration(hours) {
  if (!Number.isFinite(hours) || hours < 0) return 'Unavailable';
  const rounded = Math.round(hours);
  return `${Math.floor(rounded / 24)}d ${rounded % 24}h`;
}

export function formatNumber(value, digits = 0) {
  return Number.isFinite(value) ? value.toFixed(digits) : 'Unavailable';
}

export function riskLabel(score) {
  return Number.isFinite(score) ? (score < 30 ? 'Low' : score < 60 ? 'Moderate' : 'High') : 'Unavailable';
}
