import { ChangeEvent } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  name: string;
  options: Option[];
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export function SelectField({
  label,
  name,
  options,
  value,
  onChange,
  error,
  required,
  placeholder,
}: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`
          w-full px-4 py-2.5 bg-white border rounded-lg text-sm
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
          transition-colors appearance-none
          bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] 
          bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10
          ${error ? "border-red-300 focus:ring-red-500" : "border-gray-200"}
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
