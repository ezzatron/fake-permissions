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
   * The result of the dialog interaction, or `undefined` if the dialog was
   * dismissed.
   */
  readonly result: AccessDialogResult | undefined;
};

/**
 * The result of an access dialog interaction that wasn't dismissed.
 */
export type AccessDialogResult = {
  /**
   * Whether access should be allowed.
   */
  readonly shouldAllow: boolean;

  /**
   * Whether the choice should be remembered.
   */
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

/**
 * Emulate a user's interaction with a permission access dialog.
 *
 * This callback is called when access to a permission is requested, and the
 * permission's access status is {@link PermissionAccessStatusPrompt}. Any other
 * status will not result in a call to this callback.
 *
 * To emulate a user interaction, the callback can inspect the `descriptor` if
 * desired, and call methods on `dialog` to make a choice about permission
 * access. If the callback ends without calling any of the `dialog` methods,
 * it's equivalent to calling {@link AccessDialog.dismiss | `dialog.dismiss()`}.
 *
 * Delayed interactions can also be emulated by waiting asynchronously before
 * interacting with the dialog. Real users never respond instantly, so this can
 * be used to emulate a more realistic user interaction.
 *
 * @param dialog - The access dialog to show.
 * @param descriptor - The descriptor of the requested permission.
 */
export type HandleAccessRequest = (
  dialog: AccessDialog,
  descriptor: PermissionDescriptor,
) => Promise<void>;
