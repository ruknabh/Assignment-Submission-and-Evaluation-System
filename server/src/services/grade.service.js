// Only logic — no DB access
// Calculates letter grade and percentage from marks

export const calculateLetterGrade = (marksObtained, maxMarks) => {
  if (maxMarks <= 0) return 'F';
  const percentage = (marksObtained / maxMarks) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  return 'F';
};

export const calculatePercentage = (marksObtained, maxMarks) => {
  if (maxMarks <= 0) return 0;
  return parseFloat(((marksObtained / maxMarks) * 100).toFixed(2));
};