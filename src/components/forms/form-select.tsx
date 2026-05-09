import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FormSelectOption = {
  value: string;
  label: string;
};

type FormSelectProps<TValues extends FieldValues> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<TValues, any, any>;
  name: FieldPath<TValues>;
  label: string;
  options: FormSelectOption[];
  placeholder?: string;
  disabled?: boolean;
};

export function FormSelect<TValues extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  disabled,
}: FormSelectProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          <Label htmlFor={name}>{label}</Label>
          <Select
            value={field.value ?? ""}
            onValueChange={field.onChange}
            disabled={disabled}
            onOpenChange={(open) => {
              if (!open) field.onBlur();
            }}
          >
            <SelectTrigger
              id={name}
              aria-invalid={!!fieldState.error}
              className="w-full"
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.error && (
            <p className="text-destructive text-xs">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}
