export type AccessDialog = {
  remember: (isChecked: boolean) => void;
  dismiss: () => void;
  allow: () => void;
  deny: () => void;
  readonly result: AccessDialogResult | undefined;
};

export type AccessDialogResult = {
  shouldAllow: boolean;
  shouldRemember: boolean;
};

export function createAccessDialog(defaultRemember: boolean): AccessDialog {
  let isDismissed = false;
  let shouldRemember = defaultRemember;
  let result: AccessDialogResult | undefined;

  return {
    remember(isChecked) {
      shouldRemember = isChecked;
    },

    dismiss() {
      setResult(undefined);
    },

    allow() {
      setResult({ shouldAllow: true, shouldRemember });
    },

    deny() {
      setResult({ shouldAllow: false, shouldRemember });
    },

    get result() {
      return result;
    },
  };

  function setResult(toResult: AccessDialogResult | undefined) {
    if (isDismissed) throw new Error("Access dialog already dismissed");

    isDismissed = true;
    result = toResult;
  }
}

export type HandleAccessRequest = (
  dialog: AccessDialog,
  descriptor: PermissionDescriptor,
) => Promise<void>;
