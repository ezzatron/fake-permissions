export type AccessDialog = {
  dismiss: () => void;
  allow: (shouldPersist: boolean) => void;
  deny: (shouldPersist: boolean) => void;
  readonly result: AccessDialogResult | undefined;
};

export type AccessDialogResult = {
  shouldAllow: boolean;
  shouldPersist: boolean;
};

export function createAccessDialog(): AccessDialog {
  let isDismissed = false;
  let result: AccessDialogResult | undefined;

  return {
    dismiss() {
      isDismissed = true;
    },

    allow(shouldPersist) {
      setResult(true, shouldPersist);
    },

    deny(shouldPersist) {
      setResult(false, shouldPersist);
    },

    get result() {
      return result;
    },
  };

  function setResult(shouldAllow: boolean, shouldPersist: boolean) {
    if (isDismissed) throw new Error("Access dialog already dismissed");

    isDismissed = true;
    result = { shouldAllow, shouldPersist };
  }
}

export type HandleAccessRequest = (
  dialog: AccessDialog,
  descriptor: PermissionDescriptor,
) => Promise<void>;
