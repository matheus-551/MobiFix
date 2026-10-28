import Link from "next/link";
import { routes } from "@/routes";

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export function TermsCheckbox({ checked, onChange, error }: TermsCheckboxProps) {
  return (
    <div>
      <label className="flex items-start gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "terms-error" : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
        />
        <span>
          Li e concordo com os{" "}
          <Link href={routes.terms} target="_blank" className="text-orange-500 underline">
            Termos de Serviço
          </Link>{" "}
          e a{" "}
          <Link href={routes.privacy} target="_blank" className="text-orange-500 underline">
            Política de Privacidade
          </Link>
          .
        </span>
      </label>
      {error && (
        <p id="terms-error" role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}