import { useForm }     from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z }           from 'zod';

const buildSchema = (maxMarks) =>
  z.object({
    marks_obtained: z
      .number({ invalid_type_error: 'Enter a valid number' })
      .int('Must be a whole number')
      .min(0, 'Cannot be negative')
      .max(maxMarks, `Cannot exceed max marks (${maxMarks})`),

    plagiarism_score: z
      .number({ invalid_type_error: 'Enter a valid number' })
      .int('Must be a whole number')
      .min(0)
      .max(100, 'Cannot exceed 100'),

    comment: z
      .string()
      .max(2000, 'Comment too long')
      .optional(),
  });

const GradeForm = ({ maxMarks, defaultValues = {}, onSubmit, isSubmitting, isUpdate = false }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buildSchema(maxMarks)),
    defaultValues: {
      marks_obtained:   defaultValues.marks_obtained   ?? '',
      plagiarism_score: defaultValues.plagiarism_score ?? 0,
      comment:          defaultValues.comment          ?? '',
    },
  });

  const inputClass = (hasError) =>
    `w-full border rounded-lg px-3 py-2.5 text-sm text-gray-950
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    transition-colors bg-white
    ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* Marks obtained */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Marks obtained
          <span className="text-gray-400 font-normal ml-1">/ {maxMarks}</span>
        </label>
        <input
          {...register('marks_obtained', { valueAsNumber: true })}
          type="number"
          min={0}
          max={maxMarks}
          placeholder={`0 – ${maxMarks}`}
          className={inputClass(errors.marks_obtained)}
        />
        {errors.marks_obtained && (
          <p className="mt-1.5 text-xs text-red-600">{errors.marks_obtained.message}</p>
        )}
      </div>

      {/* Plagiarism score */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Plagiarism score
          <span className="text-gray-400 font-normal ml-1">(0 – 100%)</span>
        </label>
        <input
          {...register('plagiarism_score', { valueAsNumber: true })}
          type="number"
          min={0}
          max={100}
          placeholder="0"
          className={inputClass(errors.plagiarism_score)}
        />
        {errors.plagiarism_score && (
          <p className="mt-1.5 text-xs text-red-600">{errors.plagiarism_score.message}</p>
        )}
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Feedback <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          {...register('comment')}
          rows={4}
          placeholder="Write your feedback for the student..."
          className={`${inputClass(errors.comment)} resize-none`}
        />
        {errors.comment && (
          <p className="mt-1.5 text-xs text-red-600">{errors.comment.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
          text-white text-sm font-medium rounded-lg px-4 py-2.5
          transition-colors disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {isSubmitting
          ? 'Saving...'
          : isUpdate
            ? 'Update Evaluation'
            : 'Submit Evaluation'}
      </button>
    </form>
  );
};

export default GradeForm;