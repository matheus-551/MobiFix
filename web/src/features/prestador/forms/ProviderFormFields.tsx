"use client";

import { useId, useRef, type ChangeEvent } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { formatFileSize } from "@/shared/utils/format";

interface CheckboxGroupProps {
  legend: string;
  options: readonly { id: string; name: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  error?: string;
}

export function CheckboxGroup({ legend, options, selected, onChange, error }: CheckboxGroupProps) {
  const errorId = useId();

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  }

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 text-xs font-semibold text-gray-700">
        {legend}
        <span aria-hidden className="ml-0.5 text-orange-500">*</span>
      </legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition focus-within:ring-2 focus-within:ring-orange-300 ${
                checked ? "border-orange-400 bg-orange-50 text-gray-900" : "border-gray-200 bg-white text-gray-700 hover:border-orange-200"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(option.id)}
                className="h-4 w-4 accent-orange-500"
              />
              {option.name}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}

interface FileFieldProps {
  label: string;
  description: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

export function FileField({ label, description, required, file, onChange, error }: FileFieldProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.files?.[0] ?? null);
  }

  function handleRemove() {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-gray-700">
        {label}
        {required && <span aria-hidden className="ml-0.5 text-orange-500">*</span>}
      </label>
      <p id={`${id}-desc`} className="mb-2 text-xs text-gray-500">
        {description}
      </p>

      {file ? (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
          <FileText aria-hidden className="h-5 w-5 shrink-0 text-orange-500" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            aria-label={`Remover ${file.name}`}
            className="rounded p-1.5 text-gray-400 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <Trash2 aria-hidden className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-5 text-sm text-gray-600 transition focus-within:ring-2 focus-within:ring-orange-300 hover:border-orange-400 hover:bg-orange-50 ${
            error ? "border-red-400" : "border-gray-300"
          }`}
        >
          <Upload aria-hidden className="h-4 w-4 text-orange-500" />
          Selecionar arquivo (PDF, JPG ou PNG, até 5 MB)
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        onChange={handleChange}
        aria-describedby={`${id}-desc${error ? ` ${id}-error` : ""}`}
        aria-invalid={error ? true : undefined}
        className="sr-only"
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
