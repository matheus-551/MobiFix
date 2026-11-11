"use client";

import { useId } from "react";

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
