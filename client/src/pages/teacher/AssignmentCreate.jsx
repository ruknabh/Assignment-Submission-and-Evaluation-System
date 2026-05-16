import { useEffect, useState }    from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm }                from 'react-hook-form';
import { zodResolver }            from '@hookform/resolvers/zod';
import { z }                      from 'zod';
import toast                      from 'react-hot-toast';
import {
  getAssignmentByIdApi,
  createAssignmentApi,
  updateAssignmentApi,
} from '../../api/assignment.api.js';

const buildSchema = (isEdit) =>
  z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200).trim(),
    description: z.string().max(5000).trim().optional(),
    max_marks: z
      .number({ invalid_type_error: 'Enter a valid number' })
      .int().positive('Must be greater than 0'),
    due_date: z
      .string()
      .min(1, 'Due date is required')
      .refine(
        (val) => isEdit || new Date(val) > new Date(),
        { message: 'Due date must be in the future' }
      ),
    max_file_size_mb: z
      .number({ invalid_type_error: 'Enter a valid number' })
      .int().positive().max(100),
  });

// Allowed file types managed as a tag list
const COMMON_TYPES = ['pdf', 'docx', 'zip', 'py', 'java', 'txt', 'png', 'jpg'];

const AssignmentCreate = () => {
  const { courseId, assignmentId } = useParams();
  const navigate  = useNavigate();
  const isEdit    = !!assignmentId;

  const [fileTypes,      setFileTypes]      = useState(['pdf']);
  const [typeInput,      setTypeInput]      = useState('');
  const [typeError,      setTypeError]      = useState('');
  const [loading,        setLoading]        = useState(isEdit);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(buildSchema(isEdit)),
    defaultValues: { max_file_size_mb: 10, max_marks: 100 },
  });

  // Pre-fill on edit
  useEffect(() => {
    if (!isEdit) return;
    const fetch = async () => {
      try {
        const res = await getAssignmentByIdApi(assignmentId);
        const a   = res.assignment;
        reset({
          title:            a.title,
          description:      a.description || '',
          max_marks:        a.max_marks,
          due_date:         new Date(a.due_date).toISOString().slice(0, 16),
          max_file_size_mb: a.max_file_size_mb,
        });
        setFileTypes(
          Array.isArray(a.allowed_file_types) ? a.allowed_file_types : ['pdf']
        );
      } catch {
        toast.error('Failed to load assignment');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [assignmentId, isEdit, reset, navigate]);

  const addFileType = (type) => {
    const clean = type.trim().toLowerCase().replace(/^\./, '');
    if (!clean) return;
    if (!/^[a-z0-9]+$/.test(clean)) {
      setTypeError('Only lowercase letters and numbers allowed');
      return;
    }
    if (fileTypes.includes(clean)) {
      setTypeError('Already added');
      return;
    }
    if (fileTypes.length >= 10) {
      setTypeError('Maximum 10 file types');
      return;
    }
    setFileTypes((prev) => [...prev, clean]);
    setTypeInput('');
    setTypeError('');
  };

  const removeFileType = (type) => {
    if (fileTypes.length === 1) {
      setTypeError('At least one file type required');
      return;
    }
    setFileTypes((prev) => prev.filter((t) => t !== type));
    setTypeError('');
  };

  const onSubmit = async (data) => {
    if (fileTypes.length === 0) {
      setTypeError('At least one file type required');
      return;
    }
    const payload = { ...data, allowed_file_types: fileTypes };

    try {
      if (isEdit) {
        await updateAssignmentApi(assignmentId, payload);
        toast.success('Assignment updated successfully!');
      } else {
        await createAssignmentApi(courseId, payload);
        toast.success('Assignment created successfully!');
      }
      navigate(`/teacher/courses/${courseId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save assignment');
    }
  };

  const inputClass = (hasError) =>
    `w-full border rounded-lg px-3 py-2.5 text-sm text-gray-950
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    transition-colors bg-white
    ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span className="text-sm">Loading assignment...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Course
      </button>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h1 className="text-xl font-semibold text-gray-950 mb-6">
          {isEdit ? 'Edit assignment' : 'Create new assignment'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input {...register('title')} placeholder="Assignment title"
              className={inputClass(errors.title)} />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea {...register('description')} rows={4} placeholder="Instructions for students..."
              className={`${inputClass(errors.description)} resize-none`} />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
          </div>

          {/* Max marks + Due date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Max marks</label>
              <input {...register('max_marks', { valueAsNumber: true })}
                type="number" min={1} placeholder="100"
                className={inputClass(errors.max_marks)} />
              {errors.max_marks && <p className="mt-1 text-xs text-red-600">{errors.max_marks.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due date & time</label>
              <input {...register('due_date')} type="datetime-local"
                className={inputClass(errors.due_date)} />
              {errors.due_date && <p className="mt-1 text-xs text-red-600">{errors.due_date.message}</p>}
            </div>
          </div>

          {/* Max file size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Max file size (MB)
            </label>
            <input {...register('max_file_size_mb', { valueAsNumber: true })}
              type="number" min={1} max={100} placeholder="10"
              className={inputClass(errors.max_file_size_mb)} />
            {errors.max_file_size_mb && (
              <p className="mt-1 text-xs text-red-600">{errors.max_file_size_mb.message}</p>
            )}
          </div>

          {/* Allowed file types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Allowed file types
            </label>

            {/* Tag pills */}
            <div className="flex flex-wrap gap-2 mb-2">
              {fileTypes.map((type) => (
                <span key={type}
                  className="inline-flex items-center gap-1 bg-blue-50 text-blue-700
                    text-xs font-medium px-2.5 py-1 rounded-full">
                  .{type}
                  <button type="button" onClick={() => removeFileType(type)}
                    className="text-blue-400 hover:text-blue-700 transition-colors ml-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </span>
              ))}
            </div>

            {/* Quick add common types */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_TYPES.filter((t) => !fileTypes.includes(t)).map((type) => (
                <button key={type} type="button" onClick={() => addFileType(type)}
                  className="text-xs border border-gray-200 text-gray-500 rounded-md
                    px-2 py-1 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600
                    transition-colors">
                  + .{type}
                </button>
              ))}
            </div>

            {/* Custom type input */}
            <div className="flex gap-2">
              <input
                value={typeInput}
                onChange={(e) => setTypeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addFileType(typeInput); }
                }}
                placeholder="Add custom type e.g. cpp"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button type="button" onClick={() => addFileType(typeInput)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                  text-gray-600 hover:bg-gray-50 transition-colors">
                Add
              </button>
            </div>
            {typeError && <p className="mt-1 text-xs text-red-600">{typeError}</p>}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium
                rounded-lg px-4 py-2.5 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                text-white text-sm font-medium rounded-lg px-4 py-2.5
                transition-colors disabled:cursor-not-allowed">
              {isSubmitting
                ? (isEdit ? 'Saving...' : 'Creating...')
                : (isEdit ? 'Save changes' : 'Create assignment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentCreate;