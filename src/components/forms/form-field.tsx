import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps<TValues extends FieldValues> = {
  control: Control<TValues>;
  name: FieldPath<TValues>;
  label: string;
} & Omit<
  React.ComponentProps<typeof Input>,
  "name" | "defaultValue" | "id" | "aria-invalid"
>;

export function FormField<TValues extends FieldValues>({
  control,
  name,
  label,
  ...inputProps
}: FormFieldProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            aria-invalid={!!fieldState.error}
            {...inputProps}
            {...field}
          />
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
