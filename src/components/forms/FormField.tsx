import { ChangeEvent } from "react";

interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "number" | "email" | "tel" | "date" | "textarea";
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  step?: number;
}

export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  required,
  placeholder,
  min,
  step,
}: FormFieldProps) {
  const inputClasses = `
    w-full px-4 py-2.5 bg-white border rounded-lg text-sm
    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
    transition-colors
    ${error ? "border-red-300 focus:ring-red-500" : "border-gray-200"}
  `;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={3}
          className={`${inputClasses} resize-none`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          step={step}
          className={inputClasses}
        />
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
