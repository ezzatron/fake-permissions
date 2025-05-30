import type {
  PermissionAccessStatus,
  PermissionAccessStatusAllowed,
  PermissionAccessStatusBlocked,
  PermissionAccessStatusBlockedAutomatically,
  PermissionAccessStatusDenied,
  PermissionAccessStatusGranted,
  PermissionAccessStatusPrompt,
  PermissionStoreParameters,
} from "./permission-store.js";
import type { User } from "./user.js";

export type _DocsTypes =
  | PermissionAccessStatus
  | PermissionAccessStatusAllowed
  | PermissionAccessStatusBlocked
  | PermissionAccessStatusBlockedAutomatically
  | PermissionAccessStatusDenied
  | PermissionAccessStatusGranted
  | PermissionAccessStatusPrompt
  | PermissionStoreParameters
  | User;

/**
 * A virtual permission access dialog.
 */
export interface AccessDialog {
  /**
   * Set whether the dialog choice should be remembered.
   *
   * Actual persistence is out of scope for this library. But this _does_ affect
   * how the permission's {@link PermissionAccessStatus} is changed by the
   * dialog choice:
   *
   * - If `shouldRemember` is `true` and access is allowed, the permission's
   *   access status will change to
   *   {@link PermissionAccessStatusGranted | `"GRANTED"`}.
   * - If `shouldRemember` is `true` and access is denied, the permission's
   *   access status will change to
   *   {@link PermissionAccessStatusBlocked | `"BLOCKED"`}.
   * - If `shouldRemember` is `false` and access is allowed, the permission's
   *   access status will change to
   *   {@link PermissionAccessStatusAllowed | `"ALLOWED"`}.
   * - If `shouldRemember` is `false` and access is denied, the permission's
   *   access status will change to
   *   {@link PermissionAccessStatusDenied | `"DENIED"`}.
   *
   * @param shouldRemember - Whether the choice should be remembered.
   *
   * @throws An {@link Error} if the dialog is already closed.
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
   * {@link PermissionAccessStatusBlockedAutomatically | `"BLOCKED_AUTOMATICALLY"`}.
   *
   * @throws An {@link Error} if the dialog is already closed.
   */
  dismiss: () => void;

  /**
   * Allow access to the requested permission.
   *
   * Depending on whether the dialog choice should be remembered, this will
   * change the permission's access status:
   *
   * - If remembered, the permission's access status will change to
   *   {@link PermissionAccessStatusGranted | `"GRANTED"`}.
   * - If not remembered, the permission's access status will change to
   *   {@link PermissionAccessStatusAllowed | `"ALLOWED"`}.
   *
   * @throws An {@link Error} if the dialog is already closed.
   */
  allow: () => void;

  /**
   * Deny access to the requested permission.
   *
   * Depending on whether the dialog choice should be remembered, this will
   * change the permission's access status:
   *
   * - If remembered, the permission's access status will change to
   *   {@link PermissionAccessStatusBlocked | `"BLOCKED"`}.
   * - If not remembered, the permission's access status will change to
   *   {@link PermissionAccessStatusDenied | `"DENIED"`}.
   *
   * @throws An {@link Error} if the dialog is already closed.
   */
  deny: () => void;
}

/**
 * The result of an access dialog interaction that wasn't dismissed.
 */
export interface AccessDialogResult {
  /**
   * Whether access should be allowed.
   */
  readonly shouldAllow: boolean;

  /**
   * Whether the choice should be remembered.
   */
  readonly shouldRemember: boolean;
}

export function createAccessDialog(
  defaultRemember: boolean,
): [AccessDialog, () => AccessDialogResult | undefined] {
  let isClosed = false;
  let shouldRemember = defaultRemember;
  let result: AccessDialogResult | undefined;

  return [
    {
      remember(nextShouldRemember) {
        if (isClosed) throw new Error("Access dialog already closed");
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
    },
    () => result,
  ];

  function setResult(toResult: AccessDialogResult | undefined) {
    if (isClosed) throw new Error("Access dialog already closed");

    isClosed = true;
    result = toResult;
  }
}

/**
 * Emulate a user's interaction with a permission access dialog.
 *
 * This callback is called when access to a permission is requested, and the
 * permission's access status is
 * {@link PermissionAccessStatusPrompt | `"PROMPT"`}. Any other status will not
 * result in a call to this callback.
 *
 * To emulate a user interaction, the callback can inspect the `descriptor` if
 * desired, and call methods on `dialog` to make a choice about permission
 * access. If the callback ends without calling any of the `dialog` methods,
 * it's equivalent to calling {@link AccessDialog.dismiss}.
 *
 * Delayed interactions can also be emulated by waiting asynchronously before
 * interacting with the dialog. Real users never respond instantly, so this can
 * be used to emulate a more realistic user interaction.
 *
 * @param dialog - The access dialog to show.
 * @param descriptor - The descriptor of the requested permission.
 *
 * @returns An optional callback that will be called with the result of the
 *   access dialog interaction.
 *
 * @see {@link User.setAccessRequestHandler} to update the access request
 *   handler for a user.
 */
export type HandleAccessRequest = (
  dialog: AccessDialog,
  descriptor: PermissionDescriptor,
) => Promise<HandleAccessRequestComplete | void>;

/**
 * A callback that is called with the result of an access dialog interaction.
 *
 * This is called when {@link HandleAccessRequest} completes, regardless of
 * whether the dialog was dismissed or not.
 *
 * @param result - The result of the access dialog interaction, or `undefined`
 *   if the dialog was dismissed.
 */
export type HandleAccessRequestComplete = (
  result: AccessDialogResult | undefined,
) => void;
