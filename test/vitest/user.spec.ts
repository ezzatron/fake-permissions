import {
  HandleAccessRequest,
  PermissionStore,
  User,
  createPermissionStore,
  createUser,
} from "fake-permissions";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

describe("User", () => {
  const permissionA: PermissionDescriptor = {
    name: "permission-a" as PermissionName,
  };
  const permissionB: PermissionDescriptor = {
    name: "permission-b" as PermissionName,
  };
  const permissionC: PermissionDescriptor = {
    name: "permission-c" as PermissionName,
  };

  let permissionStore: PermissionStore;
  let user: User;

  beforeEach(() => {
    permissionStore = createPermissionStore({
      initialStates: new Map([
        [permissionA, "prompt"],
        [permissionB, "granted"],
        [permissionC, "denied"],
      ]),
    });
  });

  describe("when no access request handler is configured", () => {
    beforeEach(() => {
      user = createUser({ permissionStore });
    });

    describe('when access is requested for a permission in the "prompt" state', () => {
      it("denies access and leaves the permission unchanged", async () => {
        expect(await user.requestAccess(permissionA)).toBe(false);
        expect(permissionStore.get(permissionA)).toBe("prompt");
      });
    });

    describe('when access is requested for a permission in the "granted" state', () => {
      it("allows access and leaves the permission unchanged", async () => {
        expect(await user.requestAccess(permissionB)).toBe(true);
        expect(permissionStore.get(permissionB)).toBe("granted");
      });
    });

    describe('when access is requested for a permission in the "denied" state', () => {
      it("denies access and leaves the permission unchanged", async () => {
        expect(await user.requestAccess(permissionC)).toBe(false);
        expect(permissionStore.get(permissionC)).toBe("denied");
      });
    });
  });

  describe("when an access request handler is configured", () => {
    let handleAccessRequest: Mock<HandleAccessRequest>;

    beforeEach(() => {
      handleAccessRequest = vi.fn(async (dialog) => {
        dialog.allow(true);
      });

      user = createUser({ permissionStore, handleAccessRequest });
    });

    it("can't dismiss the dialog after it's been dismissed", async () => {
      handleAccessRequest.mockImplementation(async (dialog) => {
        dialog.allow(true);
        dialog.deny(true);
      });

      await expect(user.requestAccess(permissionA)).rejects.toThrow(
        "Access dialog already dismissed",
      );
    });

    describe('when access is requested for a permission in the "prompt" state', () => {
      it("calls the callback with a dialog and the permission descriptor", async () => {
        await user.requestAccess(permissionA);

        expect(handleAccessRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            dismiss: expect.any(Function) as () => void,
            allow: expect.any(Function) as () => void,
            deny: expect.any(Function) as () => void,
          }),
          { name: "permission-a" },
        );
      });

      describe("when the dialog is dismissed", () => {
        beforeEach(() => {
          handleAccessRequest.mockImplementation(async (dialog) => {
            dialog.dismiss();
          });
        });

        it("denies access and leaves the permission unchanged", async () => {
          expect(await user.requestAccess(permissionA)).toBe(false);
          expect(permissionStore.get(permissionA)).toBe("prompt");
        });
      });

      describe("when access is allowed but the decision is not remembered", () => {
        beforeEach(() => {
          handleAccessRequest.mockImplementation(async (dialog) => {
            dialog.allow(false);
          });
        });

        it("allows access and leaves the permission unchanged", async () => {
          expect(await user.requestAccess(permissionA)).toBe(true);
          expect(permissionStore.get(permissionA)).toBe("prompt");
        });
      });

      describe("when access is allowed and the decision is remembered", () => {
        beforeEach(() => {
          handleAccessRequest.mockImplementation(async (dialog) => {
            dialog.allow(true);
          });
        });

        it("allows access and grants the permission", async () => {
          expect(await user.requestAccess(permissionA)).toBe(true);
          expect(permissionStore.get(permissionA)).toBe("granted");
        });
      });

      describe("when access is denied but the decision is not remembered", () => {
        beforeEach(() => {
          handleAccessRequest.mockImplementation(async (dialog) => {
            dialog.deny(false);
          });
        });

        it("denies access and leaves the permission unchanged", async () => {
          expect(await user.requestAccess(permissionA)).toBe(false);
          expect(permissionStore.get(permissionA)).toBe("prompt");
        });
      });

      describe("when access is denied and the decision is remembered", () => {
        beforeEach(() => {
          handleAccessRequest.mockImplementation(async (dialog) => {
            dialog.deny(true);
          });
        });

        it("denies access and denies the permission", async () => {
          expect(await user.requestAccess(permissionA)).toBe(false);
          expect(permissionStore.get(permissionA)).toBe("denied");
        });
      });
    });

    describe('when access is requested for a permission in the "granted" state', () => {
      it("does not call the callback", async () => {
        await user.requestAccess(permissionB);

        expect(handleAccessRequest).not.toHaveBeenCalled();
      });

      it("allows access and leaves the permission unchanged", async () => {
        expect(await user.requestAccess(permissionB)).toBe(true);
        expect(permissionStore.get(permissionB)).toBe("granted");
      });
    });

    describe('when access is requested for a permission in the "denied" state', () => {
      it("does not call the callback", async () => {
        await user.requestAccess(permissionC);

        expect(handleAccessRequest).not.toHaveBeenCalled();
      });

      it("denies access and leaves the permission unchanged", async () => {
        expect(await user.requestAccess(permissionC)).toBe(false);
        expect(permissionStore.get(permissionC)).toBe("denied");
      });
    });
  });
});
