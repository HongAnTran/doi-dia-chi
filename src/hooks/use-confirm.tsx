// src/hooks/use-confirm.tsx
"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmContextValue = {
  confirm: (options?: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = React.createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null);

  function confirm(nextOptions: ConfirmOptions = {}) {
    setOptions(nextOptions);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }

  function handleClose(value: boolean) {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <AlertDialog
        open={Boolean(options)}
        onOpenChange={() => handleClose(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {options?.title ?? "Are you sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {options?.description ?? "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleClose(false)}>
              {options?.cancelText ?? "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleClose(true)}>
              {options?.confirmText ?? "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = React.useContext(ConfirmContext);

  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }

  return context.confirm;
}
