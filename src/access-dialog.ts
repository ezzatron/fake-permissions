/**
 * A virtual permission access dialog.
 */
export type AccessDialog = {
  /**
   * Set whether the dialog choice should be remembered.
   *
   * Actual persistence is out of scope for this library. But this _does_ affect
   * how the permission's {@link PermissionAccessStatus} is changed by the
   * dialog choice:
   *
   * - If `shouldRemember` is `true` and access is allowed, the permission's
   *   access status will change to {@link PermissionAccessStatusGranted}.
   * - If `shouldRemember` is `true` and access is denied, the permission's
   *   access status will change to {@link PermissionAccessStatusBlocked}.
   * - If `shouldRemember` is `false` and access is allowed, the permission's
   *   access status will change to {@link PermissionAccessStatusAllowed}.
   * - If `shouldRemember` is `false` and access is denied, the permission's
   *   access status will change to {@link PermissionAccessStatusDenied}.
   *
   * @param shouldRemember - Whether the choice should be remembered.
   *
   * @see {@link PermissionStoreParameters.dialogDefaultRemember} which sets the
   *   default behavior for all dialogs.
   */
  remember: (shouldRemember: boolean) => void;

  /**
   * Dismiss the dialog without making a choice.
   *
   * Dismissing the dialog will have no effect on the permission's access
   * status, until the number of dismissals reaches
   * {@link PermissionStoreParameters.dismissDenyThreshold}, at which point the
   * permission's access status will change to
   * {@link PermissionAccessStatusBlockedAutomatically}.
   */
  dismiss: () => void;

  /**
   * Allow access to the requested permission.
   *
   * Depending on whether the dialog choice should be remembered, this will
   * change the permission's access status:
   *
   * - If remembered, the permission's access status will change to
   *   {@link PermissionAccessStatusGranted}.
   * - If not remembered, the permission's access status will change to
   *   {@link PermissionAccessStatusAllowed}.
   */
  allow: () => void;

  /**
   * Deny access to the requested permission.
   *
   * Depending on whether the dialog choice should be remembered, this will
   * change the permission's access status:
   *
   * - If remembered, the permission's access status will change to
   *   {@link PermissionAccessStatusBlocked}.
   * - If not remembered, the permission's access status will change to
   *   {@link PermissionAccessStatusDenied}.
   */
  deny: () => void;

  /**
   * @internal
   */
  readonly result: AccessDialogResult | undefined;
};

/**
 * @internal
 */
export type AccessDialogResult = {
  readonly shouldAllow: boolean;
  readonly shouldRemember: boolean;
};

export function createAccessDialog(defaultRemember: boolean): AccessDialog {
  let isDismissed = false;
  let shouldRemember = defaultRemember;
  let result: AccessDialogResult | undefined;

  return {
    remember(nextShouldRemember) {
      shouldRemember = nextShouldRemember;
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
