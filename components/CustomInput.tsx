import type { ChangeEventHandler, HTMLInputTypeAttribute } from "react";

type CustomInputProps = {
  type?: HTMLInputTypeAttribute;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  className?: string;
  value?: string | number;
  onChange: ChangeEventHandler<HTMLInputElement>;
  error?: boolean;
  errorMessage?: string;
};

const CustomInput = ({
  type = "text",
  inputMode,
  placeholder = "Enter information",
  className = "",
  value = "",
  onChange,
  error = false,
  errorMessage,
}: CustomInputProps) => {
  return (
    <div className="space-y-1">
      <input
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        className={`w-full rounded-2xl border border-primary p-2 text-white outline-none focus:border-primary ${className}`}
        value={value}
        onChange={onChange}
      />

      {error && errorMessage && (
        <p className="text-sm text-red-400">{errorMessage}</p>
      )}
    </div>
  );
};

export default CustomInput;
