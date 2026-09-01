import { cn } from "@/utilidades/clases";

interface CheckboxProps {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  "aria-label"?: string;
}

export function Checkbox({ checked, disabled, onCheckedChange, "aria-label": ariaLabel }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      aria-label={ariaLabel}
      className={cn(
        "size-4 appearance-none rounded border border-input bg-background",
        "checked:border-primary checked:bg-primary",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors",
        "bg-[length:100%_100%] bg-center bg-no-repeat",
        "checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%2F%3E%3C%2Fsvg%3E')]"
      )}
    />
  );
}