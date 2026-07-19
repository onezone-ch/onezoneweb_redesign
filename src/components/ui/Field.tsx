"use client";

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import clsx from "clsx";

/* Stili condivisi dei controlli form (design system: h-48, radius 12, focus ring tint) */

const boxBase =
  "w-full rounded-12 border bg-white text-[15px] text-ink outline-none transition-[border-color,box-shadow]";
const boxIdle = "border-border";
const boxFocus = "focus:border-brand focus:shadow-[0_0_0_3px_var(--color-tint)]";
const boxError = "border-danger";

export function FieldLabel({
  htmlFor,
  error,
  children,
}: {
  htmlFor?: string;
  error?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={clsx(
        "mb-[7px] block text-[12.5px] font-medium tracking-[0.1px]",
        error ? "text-danger" : "text-muted",
      )}
    >
      {children}
    </label>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="mt-[6px] text-[12.5px] font-medium text-danger">{children}</p>;
}

interface FieldWrapperProps {
  label?: ReactNode;
  error?: ReactNode;
  className?: string;
}

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    FieldWrapperProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, type, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  const input = (
    <input
      ref={ref}
      id={inputId}
      type={isPassword && showPassword ? "text" : type}
      className={clsx(
        boxBase,
        "h-12 px-[14px]",
        isPassword && "pr-11",
        error ? boxError : clsx(boxIdle, boxFocus),
      )}
      {...rest}
    />
  );

  return (
    <div className={className}>
      {label && (
        <FieldLabel htmlFor={inputId} error={!!error}>
          {label}
        </FieldLabel>
      )}
      {isPassword ? (
        <div className="relative">
          {input}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff size={18} strokeWidth={1.6} />
            ) : (
              <Eye size={18} strokeWidth={1.6} />
            )}
          </button>
        </div>
      ) : (
        input
      )}
      <FieldError>{error}</FieldError>
    </div>
  );
});

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement>,
    FieldWrapperProps {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className, id, children, ...rest },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className={className}>
      {label && (
        <FieldLabel htmlFor={selectId} error={!!error}>
          {label}
        </FieldLabel>
      )}
      <select
        ref={ref}
        id={selectId}
        className={clsx(
          boxBase,
          "h-12 appearance-none bg-no-repeat px-[14px] pr-10",
          "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%237D8499%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')]",
          "bg-[position:right_14px_center]",
          error ? boxError : clsx(boxIdle, boxFocus),
        )}
        {...rest}
      >
        {children}
      </select>
      <FieldError>{error}</FieldError>
    </div>
  );
});

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    FieldWrapperProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, className, id, rows = 4, ...rest }, ref) {
    const autoId = useId();
    const textareaId = id ?? autoId;
    return (
      <div className={className}>
        {label && (
          <FieldLabel htmlFor={textareaId} error={!!error}>
            {label}
          </FieldLabel>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={clsx(
            boxBase,
            "px-[14px] py-3",
            error ? boxError : clsx(boxIdle, boxFocus),
          )}
          {...rest}
        />
        <FieldError>{error}</FieldError>
      </div>
    );
  },
);
