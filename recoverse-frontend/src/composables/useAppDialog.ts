import { reactive } from "vue";

type DialogKind = "confirm" | "alert" | "prompt";

interface DialogState {
  visible: boolean;
  kind: DialogKind;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
  inputValue: string;
  inputPlaceholder: string;
  readonly: boolean;
}

export const dialogState = reactive<DialogState>({
  visible: false,
  kind: "alert",
  title: "",
  message: "",
  confirmLabel: "확인",
  cancelLabel: "취소",
  danger: false,
  inputValue: "",
  inputPlaceholder: "",
  readonly: false,
});

let activeResolve: ((value: any) => void) | null = null;

function open<T>(kind: DialogKind, message: string, opts: Record<string, any>): Promise<T> {
  return new Promise((resolve) => {
    dialogState.visible = true;
    dialogState.kind = kind;
    dialogState.message = message;
    dialogState.title = opts.title ?? "";
    dialogState.confirmLabel = opts.confirmLabel ?? "확인";
    dialogState.cancelLabel = opts.cancelLabel ?? "취소";
    dialogState.danger = Boolean(opts.danger);
    dialogState.inputValue = opts.defaultValue ?? "";
    dialogState.inputPlaceholder = opts.placeholder ?? "";
    dialogState.readonly = Boolean(opts.readonly);
    activeResolve = resolve as (value: any) => void;
  });
}

export function confirmDialog(
  message: string,
  opts: { title?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean } = {}
): Promise<boolean> {
  return open<boolean>("confirm", message, opts);
}

export function alertDialog(
  message: string,
  opts: { title?: string; confirmLabel?: string } = {}
): Promise<void> {
  return open<void>("alert", message, opts);
}

export function promptDialog(
  message: string,
  opts: {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    placeholder?: string;
    defaultValue?: string;
    readonly?: boolean;
  } = {}
): Promise<string | null> {
  return open<string | null>("prompt", message, opts);
}

export function resolveDialogAccept(): void {
  const resolve = activeResolve;
  activeResolve = null;
  dialogState.visible = false;

  if (dialogState.kind === "prompt") {
    resolve?.(dialogState.inputValue);
  } else if (dialogState.kind === "confirm") {
    resolve?.(true);
  } else {
    resolve?.(undefined);
  }
}

export function resolveDialogCancel(): void {
  const resolve = activeResolve;
  activeResolve = null;
  dialogState.visible = false;

  if (dialogState.kind === "prompt") {
    resolve?.(null);
  } else if (dialogState.kind === "confirm") {
    resolve?.(false);
  } else {
    resolve?.(undefined);
  }
}
