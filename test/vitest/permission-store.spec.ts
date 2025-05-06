import {
  createPermissionStore,
  type HandleAccessRequest,
  type PermissionAccessState,
  type PermissionStore,
} from "fake-permissions";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

describe("PermissionStore()", () => {
  const geolocation: PermissionDescriptor = { name: "geolocation" };
  const geolocationWithExtra: PermissionDescriptor = {
    name: "geolocation",
    extra: true,
  } as PermissionDescriptor;
  const midi: PermissionDescriptor = { name: "midi" };
  const midiSysexFalse: PermissionDescriptor = {
    name: "midi",
    sysex: false,
  } as PermissionDescriptor;
  const midiSysexTrue: PermissionDescriptor = {
    name: "midi",
    sysex: true,
  } as PermissionDescriptor;
  const notifications: PermissionDescriptor = { name: "notifications" };
  const push: PermissionDescriptor = { name: "push" };
  const pushUserVisibleOnlyFalse: PermissionDescriptor = {
    name: "push",
    userVisibleOnly: false,
  } as PermissionDescriptor;
  const pushUserVisibleOnlyTrue: PermissionDescriptor = {
    name: "push",
    userVisibleOnly: true,
  } as PermissionDescriptor;

  let permissionStore: PermissionStore;

  beforeEach(() => {
    permissionStore = createPermissionStore({
      initialStates: new Map([
        [geolocation, "BLOCKED"],
        [midiSysexFalse, "GRANTED"],
        [midiSysexTrue, "PROMPT"],
        [pushUserVisibleOnlyFalse, { status: "GRANTED", dismissCount: 0 }],
        [pushUserVisibleOnlyTrue, { status: "PROMPT", dismissCount: 0 }],
      ] as [PermissionDescriptor, PermissionAccessState][]),

      isMatchingDescriptor(a, b) {
        if (a.name === "midi" && b.name === "midi") {
          // a.sysex is always present (comes from an initialStates key)
          return "sysex" in a && a.sysex === ("sysex" in b ? b.sysex : false);
        }

        if (a.name === "push" && b.name === "push") {
          // a.userVisibleOnly is always present (comes from an initialStates key)
          return (
            "userVisibleOnly" in a &&
            a.userVisibleOnly ===
              ("userVisibleOnly" in b ? b.userVisibleOnly : false)
          );
        }

        return a.name === b.name;
      },
    });
  });

  describe("isKnownDescriptor()", () => {
    describe("when called with an unknown descriptor", () => {
      it("returns false", () => {
        expect(permissionStore.isKnownDescriptor(notifications)).toBe(false);
      });
    });

    describe("when called with a known descriptor", () => {
      it("returns true", () => {
        expect(permissionStore.isKnownDescriptor(geolocation)).toBe(true);
        expect(permissionStore.isKnownDescriptor(push)).toBe(true);
        expect(
          permissionStore.isKnownDescriptor(pushUserVisibleOnlyFalse),
        ).toBe(true);
        expect(permissionStore.isKnownDescriptor(pushUserVisibleOnlyTrue)).toBe(
          true,
        );
      });
    });

    describe("when called with a known descriptor with extra properties", () => {
      it("returns true", () => {
        expect(permissionStore.isKnownDescriptor(geolocationWithExtra)).toBe(
          true,
        );
      });
    });
  });

  describe("isMatchingDescriptor()", () => {
    it("forwards the call to the configured isMatchingDescriptor option", () => {
      expect(permissionStore.isMatchingDescriptor(midiSysexFalse, midi)).toBe(
        true,
      );
      expect(permissionStore.isMatchingDescriptor(midi, midiSysexFalse)).toBe(
        false,
      );
      expect(permissionStore.isMatchingDescriptor(midiSysexTrue, midi)).toBe(
        false,
      );
      expect(permissionStore.isMatchingDescriptor(midi, midiSysexTrue)).toBe(
        false,
      );
    });
  });

  describe("getStatus()", () => {
    describe("when called with an unknown descriptor", () => {
      it("throws a TypeError", () => {
        const call = () => {
          permissionStore.getStatus(notifications);
        };

        expect(call).toThrow(TypeError);
        expect(call).toThrow(
          'No permission state for descriptor {"name":"notifications"}',
        );
      });
    });

    describe("when called with a known descriptor", () => {
      it("returns the status of the permission", () => {
        expect(permissionStore.getStatus(geolocation)).toBe("BLOCKED");
        expect(permissionStore.getStatus(push)).toBe("GRANTED");
        expect(permissionStore.getStatus(pushUserVisibleOnlyFalse)).toBe(
          "GRANTED",
        );
        expect(permissionStore.getStatus(pushUserVisibleOnlyTrue)).toBe(
          "PROMPT",
        );
      });
    });

    describe("when called with a known descriptor with extra properties", () => {
      it("returns the status of the permission", () => {
        expect(permissionStore.getStatus(geolocationWithExtra)).toBe("BLOCKED");
      });
    });
  });

  describe("setStatus()", () => {
    describe("when called with an unknown descriptor", () => {
      it("throws a TypeError", () => {
        const call = () => {
          permissionStore.setStatus(notifications, "PROMPT");
        };

        expect(call).toThrow(TypeError);
        expect(call).toThrow(
          'No permission state for descriptor {"name":"notifications"}',
        );
      });
    });

    describe("when called with a known descriptor", () => {
      it("sets the status of the permission", () => {
        permissionStore.setStatus(geolocation, "GRANTED");
        permissionStore.setStatus(pushUserVisibleOnlyFalse, "PROMPT");
        permissionStore.setStatus(pushUserVisibleOnlyTrue, "BLOCKED");

        expect(permissionStore.getStatus(geolocation)).toBe("GRANTED");
        expect(permissionStore.getStatus(push)).toBe("PROMPT");
        expect(permissionStore.getStatus(pushUserVisibleOnlyFalse)).toBe(
          "PROMPT",
        );
        expect(permissionStore.getStatus(pushUserVisibleOnlyTrue)).toBe(
          "BLOCKED",
        );
      });
    });

    describe("when called with a known descriptor with extra properties", () => {
      it("sets the status of the permission", () => {
        permissionStore.setStatus(geolocationWithExtra, "PROMPT");

        expect(permissionStore.getStatus(geolocation)).toBe("PROMPT");
      });
    });
  });

  describe("hasAccess()", () => {
    describe("when called with an unknown descriptor", () => {
      it("throws a TypeError", () => {
        const call = () => {
          permissionStore.hasAccess(notifications);
        };

        expect(call).toThrow(TypeError);
        expect(call).toThrow(
          'No permission state for descriptor {"name":"notifications"}',
        );
      });
    });

    describe("when called with a known descriptor", () => {
      it("returns true when access is allowed", () => {
        expect(permissionStore.hasAccess(push)).toBe(true);
        expect(permissionStore.hasAccess(pushUserVisibleOnlyFalse)).toBe(true);
        expect(permissionStore.hasAccess(midi)).toBe(true);
        expect(permissionStore.hasAccess(midiSysexFalse)).toBe(true);
      });

      it("returns false when access is not allowed", () => {
        expect(permissionStore.hasAccess(geolocation)).toBe(false);
        expect(permissionStore.hasAccess(pushUserVisibleOnlyTrue)).toBe(false);
        expect(permissionStore.hasAccess(midiSysexTrue)).toBe(false);
      });
    });

    describe("when called with a known descriptor with extra properties", () => {
      it("returns true when access is allowed", () => {
        permissionStore.setStatus(geolocationWithExtra, "GRANTED");

        expect(permissionStore.hasAccess(geolocationWithExtra)).toBe(true);
      });

      it("returns false when access is not allowed", () => {
        permissionStore.setStatus(geolocationWithExtra, "BLOCKED");

        expect(permissionStore.hasAccess(geolocationWithExtra)).toBe(false);
      });
    });
  });

  describe("requestAccess()", () => {
    describe("when called with an unknown descriptor", () => {
      it("throws a TypeError", async () => {
        const call = (async () => {
          await permissionStore.requestAccess(notifications);
        })();

        await expect(call).rejects.toThrow(TypeError);
        await expect(call).rejects.toThrow(
          'No permission state for descriptor {"name":"notifications"}',
        );
      });
    });

    describe("when no access request handler is configured", () => {
      describe('when access is requested for a permission in the "PROMPT" status', () => {
        it("denies access", async () => {
          expect(await permissionStore.requestAccess(midiSysexTrue)).toBe(
            false,
          );
          expect(permissionStore.getStatus(midiSysexTrue)).toBe("PROMPT");
        });

        describe("when the dialog is dismissed repeatedly", () => {
          beforeEach(async () => {
            await permissionStore.requestAccess(midiSysexTrue);
            await permissionStore.requestAccess(midiSysexTrue);
            await permissionStore.requestAccess(midiSysexTrue);
          });

          it("blocks the permission automatically", () => {
            expect(permissionStore.getStatus(midiSysexTrue)).toBe(
              "BLOCKED_AUTOMATICALLY",
            );
          });

          it("doesn't affect other permissions", async () => {
            expect(
              await permissionStore.requestAccess(pushUserVisibleOnlyTrue),
            ).toBe(false);
            expect(permissionStore.getStatus(pushUserVisibleOnlyTrue)).toBe(
              "PROMPT",
            );
          });

          describe("when the permission is reset", () => {
            beforeEach(() => {
              permissionStore.setStatus(midiSysexTrue, "PROMPT");
            });

            it("resets the dismissal count", async () => {
              await permissionStore.requestAccess(midiSysexTrue);
              await permissionStore.requestAccess(midiSysexTrue);

              expect(permissionStore.getStatus(midiSysexTrue)).toBe("PROMPT");
            });
          });
        });
      });

      describe('when access is requested for a permission in the "GRANTED" status', () => {
        it("allows access", async () => {
          expect(await permissionStore.requestAccess(midiSysexFalse)).toBe(
            true,
          );
          expect(permissionStore.getStatus(midiSysexFalse)).toBe("GRANTED");
        });
      });

      describe('when access is requested for a permission in the "ALLOWED" status', () => {
        it("allows access", async () => {
          permissionStore.setStatus(midiSysexFalse, "ALLOWED");

          expect(await permissionStore.requestAccess(midiSysexFalse)).toBe(
            true,
          );
          expect(permissionStore.getStatus(midiSysexFalse)).toBe("ALLOWED");
        });
      });

      describe('when access is requested for a permission in the "BLOCKED" status', () => {
        it("denies access", async () => {
          expect(await permissionStore.requestAccess(geolocation)).toBe(false);
          expect(permissionStore.getStatus(geolocation)).toBe("BLOCKED");
        });
      });

      describe('when access is requested for a permission in the "BLOCKED_AUTOMATICALLY" status', () => {
        beforeEach(() => {
          permissionStore.setStatus(geolocation, "BLOCKED_AUTOMATICALLY");
        });

        it("denies access", async () => {
          expect(await permissionStore.requestAccess(geolocation)).toBe(false);
          expect(permissionStore.getStatus(geolocation)).toBe(
            "BLOCKED_AUTOMATICALLY",
          );
        });
      });

      describe('when access is requested for a permission in the "DENIED" status', () => {
        it("denies access", async () => {
          permissionStore.setStatus(geolocation, "DENIED");

          expect(await permissionStore.requestAccess(geolocation)).toBe(false);
          expect(permissionStore.getStatus(geolocation)).toBe("DENIED");
        });
      });
    });

    describe("when an access request handler is configured", () => {
      let handleAccessRequest: Mock<HandleAccessRequest>;

      beforeEach(() => {
        handleAccessRequest = vi.fn(async (dialog) => {
          dialog.remember(true);
          dialog.allow();
        });

        permissionStore.setAccessRequestHandler(handleAccessRequest);
      });

      it("can't dismiss the dialog after it's been dismissed", async () => {
        handleAccessRequest.mockImplementation(async (dialog) => {
          dialog.allow();
          dialog.deny();
        });

        await expect(
          permissionStore.requestAccess(midiSysexTrue),
        ).rejects.toThrow("Access dialog already dismissed");
      });

      describe('when access is requested for a permission in the "PROMPT" status', () => {
        it("calls the callback with a dialog and the permission descriptor", async () => {
          await permissionStore.requestAccess(midiSysexTrue);

          expect(handleAccessRequest).toBeCalledWith(
            expect.objectContaining({
              dismiss: expect.any(Function) as () => void,
              allow: expect.any(Function) as () => void,
              deny: expect.any(Function) as () => void,
            }),
            midiSysexTrue,
          );
        });

        describe("when the dialog is dismissed", () => {
          beforeEach(() => {
            handleAccessRequest.mockImplementation(async (dialog) => {
              dialog.dismiss();
            });
          });

          it("denies access", async () => {
            expect(await permissionStore.requestAccess(midiSysexTrue)).toBe(
              false,
            );
            expect(permissionStore.getStatus(midiSysexTrue)).toBe("PROMPT");
          });
        });

        describe("when the dialog is dismissed repeatedly", () => {
          beforeEach(async () => {
            handleAccessRequest.mockImplementation(async (dialog) => {
              dialog.dismiss();
            });

            await permissionStore.requestAccess(midiSysexTrue);
            await permissionStore.requestAccess(midiSysexTrue);
            await permissionStore.requestAccess(midiSysexTrue);
          });

          it("blocks the permission automatically", () => {
            expect(permissionStore.getStatus(midiSysexTrue)).toBe(
              "BLOCKED_AUTOMATICALLY",
            );
          });

          it("doesn't affect other permissions", async () => {
            expect(
              await permissionStore.requestAccess(pushUserVisibleOnlyTrue),
            ).toBe(false);
            expect(permissionStore.getStatus(pushUserVisibleOnlyTrue)).toBe(
              "PROMPT",
            );
          });

          describe("when the permission is reset", () => {
            beforeEach(() => {
              permissionStore.setStatus(midiSysexTrue, "PROMPT");
            });

            it("resets the dismissal count", async () => {
              await permissionStore.requestAccess(midiSysexTrue);
              await permissionStore.requestAccess(midiSysexTrue);

              expect(permissionStore.getStatus(midiSysexTrue)).toBe("PROMPT");
            });
          });
        });

        describe("when access is allowed but the decision is not remembered", () => {
          beforeEach(() => {
            handleAccessRequest.mockImplementation(async (dialog) => {
              dialog.allow();
            });
          });

          it("allows access and permission", async () => {
            expect(await permissionStore.requestAccess(midiSysexTrue)).toBe(
              true,
            );
            expect(permissionStore.getStatus(midiSysexTrue)).toBe("ALLOWED");
          });
        });

        describe("when access is allowed and the decision is remembered", () => {
          beforeEach(() => {
            handleAccessRequest.mockImplementation(async (dialog) => {
              dialog.remember(true);
              dialog.allow();
            });
          });

          it("allows access and grants permission", async () => {
            expect(await permissionStore.requestAccess(midiSysexTrue)).toBe(
              true,
            );
            expect(permissionStore.getStatus(midiSysexTrue)).toBe("GRANTED");
          });
        });

        describe("when access is denied but the decision is not remembered", () => {
          beforeEach(() => {
            handleAccessRequest.mockImplementation(async (dialog) => {
              dialog.deny();
            });
          });

          it("denies access and permission", async () => {
            expect(await permissionStore.requestAccess(midiSysexTrue)).toBe(
              false,
            );
            expect(permissionStore.getStatus(midiSysexTrue)).toBe("DENIED");
          });
        });

        describe("when access is denied and the decision is remembered", () => {
          beforeEach(() => {
            handleAccessRequest.mockImplementation(async (dialog) => {
              dialog.remember(true);
              dialog.deny();
            });
          });

          it("denies access and blocks permission", async () => {
            expect(await permissionStore.requestAccess(midiSysexTrue)).toBe(
              false,
            );
            expect(permissionStore.getStatus(midiSysexTrue)).toBe("BLOCKED");
          });
        });
      });

      describe('when access is requested for a permission in the "GRANTED" status', () => {
        it("does not call the callback", async () => {
          await permissionStore.requestAccess(midiSysexFalse);

          expect(handleAccessRequest).not.toBeCalled();
        });

        it("allows access", async () => {
          expect(await permissionStore.requestAccess(midiSysexFalse)).toBe(
            true,
          );
          expect(permissionStore.getStatus(midiSysexFalse)).toBe("GRANTED");
        });
      });

      describe('when access is requested for a permission in the "ALLOWED" status', () => {
        beforeEach(() => {
          permissionStore.setStatus(midiSysexFalse, "ALLOWED");
        });

        it("does not call the callback", async () => {
          await permissionStore.requestAccess(midiSysexFalse);

          expect(handleAccessRequest).not.toBeCalled();
        });

        it("allows access", async () => {
          expect(await permissionStore.requestAccess(midiSysexFalse)).toBe(
            true,
          );
          expect(permissionStore.getStatus(midiSysexFalse)).toBe("ALLOWED");
        });
      });

      describe('when access is requested for a permission in the "BLOCKED" status', () => {
        it("does not call the callback", async () => {
          await permissionStore.requestAccess(geolocation);

          expect(handleAccessRequest).not.toBeCalled();
        });

        it("denies access", async () => {
          expect(await permissionStore.requestAccess(geolocation)).toBe(false);
          expect(permissionStore.getStatus(geolocation)).toBe("BLOCKED");
        });
      });

      describe('when access is requested for a permission in the "BLOCKED_AUTOMATICALLY" status', () => {
        beforeEach(() => {
          permissionStore.setStatus(geolocation, "BLOCKED_AUTOMATICALLY");
        });

        it("does not call the callback", async () => {
          await permissionStore.requestAccess(geolocation);

          expect(handleAccessRequest).not.toBeCalled();
        });

        it("denies access", async () => {
          expect(await permissionStore.requestAccess(geolocation)).toBe(false);
          expect(permissionStore.getStatus(geolocation)).toBe(
            "BLOCKED_AUTOMATICALLY",
          );
        });
      });

      describe('when access is requested for a permission in the "DENIED" status', () => {
        beforeEach(() => {
          permissionStore.setStatus(geolocation, "DENIED");
        });

        it("does not call the callback", async () => {
          await permissionStore.requestAccess(geolocation);

          expect(handleAccessRequest).not.toBeCalled();
        });

        it("denies access", async () => {
          expect(await permissionStore.requestAccess(geolocation)).toBe(false);
          expect(permissionStore.getStatus(geolocation)).toBe("DENIED");
        });
      });
    });

    describe("when a custom dismissal deny threshold is configured", () => {
      beforeEach(() => {
        permissionStore = createPermissionStore({
          dismissDenyThreshold: 2,
          initialStates: new Map([[midiSysexTrue, "PROMPT"]]),
        });
      });

      it("affects how many dismissed dialogs will cause an automatic permission block", async () => {
        await permissionStore.requestAccess(midiSysexTrue);

        expect(permissionStore.getStatus(midiSysexTrue)).toBe("PROMPT");

        await permissionStore.requestAccess(midiSysexTrue);

        expect(permissionStore.getStatus(midiSysexTrue)).toBe(
          "BLOCKED_AUTOMATICALLY",
        );
      });
    });

    describe("when a starting dismissal count is configured", () => {
      beforeEach(() => {
        permissionStore = createPermissionStore({
          initialStates: new Map([
            [midiSysexTrue, { status: "PROMPT", dismissCount: 1 }],
          ]),
        });
      });

      it("affects how many dismissed dialogs will cause an automatic permission block", async () => {
        await permissionStore.requestAccess(midiSysexTrue);

        expect(permissionStore.getStatus(midiSysexTrue)).toBe("PROMPT");

        await permissionStore.requestAccess(midiSysexTrue);

        expect(permissionStore.getStatus(midiSysexTrue)).toBe(
          "BLOCKED_AUTOMATICALLY",
        );
      });
    });
  });

  describe("subscribe()", () => {
    let subscriber: Mock;
    let unsubscribe: () => void;

    beforeEach(() => {
      unsubscribe = permissionStore.subscribe((subscriber = vi.fn()));
    });

    afterEach(() => {
      unsubscribe();
    });

    describe("when a permission status changes", () => {
      beforeEach(() => {
        permissionStore.setStatus(pushUserVisibleOnlyFalse, "BLOCKED");
      });

      it("calls the subscriber", () => {
        expect(subscriber).toBeCalledTimes(1);
        expect(subscriber).toBeCalledWith(pushUserVisibleOnlyFalse, {
          hasAccess: false,
          hadAccess: true,
          toStatus: "BLOCKED",
          fromStatus: "GRANTED",
        });
      });
    });

    describe("when a permission status is updated to the same status", () => {
      beforeEach(() => {
        permissionStore.setStatus(pushUserVisibleOnlyFalse, "GRANTED");
      });

      it("does not call the subscriber", () => {
        expect(subscriber).toBeCalledTimes(0);
      });
    });
  });

  describe("when created with default options", () => {
    beforeEach(() => {
      permissionStore = createPermissionStore();
    });

    it("doesn't remember access dialog decisions by default", async () => {
      permissionStore.setAccessRequestHandler(async (dialog) => {
        dialog.allow();
      });

      expect(await permissionStore.requestAccess(midiSysexTrue)).toBe(true);
      expect(permissionStore.getStatus(midiSysexTrue)).toBe("ALLOWED");
    });

    it.each([
      ["geolocation"],
      ["midi"],
      ["notifications"],
      ["persistent-storage"],
      ["push"],
      ["screen-wake-lock"],
      ["storage-access"],
    ] as const)(
      "creates a permission store with the standard permissions (%s)",
      (name) => {
        expect(permissionStore.isKnownDescriptor({ name })).toBe(true);
      },
    );

    it("creates a permission store that understands midi descriptors with the sysex property", () => {
      expect(permissionStore.getStatus(midi)).toBe("PROMPT");
      expect(permissionStore.getStatus(midiSysexFalse)).toBe("PROMPT");
      expect(permissionStore.getStatus(midiSysexTrue)).toBe("PROMPT");

      permissionStore.setStatus(midiSysexTrue, "BLOCKED");
      permissionStore.setStatus(midiSysexFalse, "GRANTED");

      expect(permissionStore.getStatus(midi)).toBe("GRANTED");
      expect(permissionStore.getStatus(midiSysexFalse)).toBe("GRANTED");
      expect(permissionStore.getStatus(midiSysexTrue)).toBe("BLOCKED");
    });

    it("creates a permission store that understands push descriptors with the userVisibleOnly property", () => {
      expect(permissionStore.getStatus(push)).toBe("PROMPT");
      expect(permissionStore.getStatus(pushUserVisibleOnlyFalse)).toBe(
        "PROMPT",
      );
      expect(permissionStore.getStatus(pushUserVisibleOnlyTrue)).toBe("PROMPT");

      permissionStore.setStatus(pushUserVisibleOnlyTrue, "BLOCKED");
      permissionStore.setStatus(pushUserVisibleOnlyFalse, "GRANTED");

      expect(permissionStore.getStatus(push)).toBe("GRANTED");
      expect(permissionStore.getStatus(pushUserVisibleOnlyFalse)).toBe(
        "GRANTED",
      );
      expect(permissionStore.getStatus(pushUserVisibleOnlyTrue)).toBe(
        "BLOCKED",
      );
    });

    describe("isMatchingDescriptor()", () => {
      it("returns true for matching descriptors", () => {
        expect(permissionStore.isMatchingDescriptor(midiSysexFalse, midi)).toBe(
          true,
        );
        expect(permissionStore.isMatchingDescriptor(midi, midiSysexFalse)).toBe(
          true,
        );
      });

      it("returns false for non-matching descriptors", () => {
        expect(permissionStore.isMatchingDescriptor(midiSysexTrue, midi)).toBe(
          false,
        );
        expect(permissionStore.isMatchingDescriptor(midi, midiSysexTrue)).toBe(
          false,
        );
      });
    });
  });

  describe("when created with a custom initialStates option", () => {
    beforeEach(() => {
      permissionStore = createPermissionStore({
        initialStates: new Map([
          [push, "GRANTED"],
          [pushUserVisibleOnlyTrue, "PROMPT"],
          [midi, "GRANTED"],
          [midiSysexTrue, "PROMPT"],
        ]),
      });
    });

    it("creates a permission store that understands non-normalized midi descriptors in the initial states", () => {
      expect(permissionStore.getStatus(midi)).toBe("GRANTED");
      expect(permissionStore.getStatus(midiSysexFalse)).toBe("GRANTED");
      expect(permissionStore.getStatus(midiSysexTrue)).toBe("PROMPT");

      permissionStore.setStatus(midiSysexFalse, "PROMPT");
      permissionStore.setStatus(midiSysexTrue, "BLOCKED");

      expect(permissionStore.getStatus(midi)).toBe("PROMPT");
      expect(permissionStore.getStatus(midiSysexFalse)).toBe("PROMPT");
      expect(permissionStore.getStatus(midiSysexTrue)).toBe("BLOCKED");
    });

    it("creates a permission store that understands non-normalized push descriptors in the initial states", () => {
      expect(permissionStore.getStatus(push)).toBe("GRANTED");
      expect(permissionStore.getStatus(pushUserVisibleOnlyFalse)).toBe(
        "GRANTED",
      );
      expect(permissionStore.getStatus(pushUserVisibleOnlyTrue)).toBe("PROMPT");

      permissionStore.setStatus(pushUserVisibleOnlyFalse, "PROMPT");
      permissionStore.setStatus(pushUserVisibleOnlyTrue, "BLOCKED");

      expect(permissionStore.getStatus(push)).toBe("PROMPT");
      expect(permissionStore.getStatus(pushUserVisibleOnlyFalse)).toBe(
        "PROMPT",
      );
      expect(permissionStore.getStatus(pushUserVisibleOnlyTrue)).toBe(
        "BLOCKED",
      );
    });
  });

  describe("when created with dialogDefaultRemember set to true", () => {
    beforeEach(() => {
      permissionStore = createPermissionStore({
        dialogDefaultRemember: true,
      });
    });

    it("remembers access dialog decisions by default", async () => {
      permissionStore.setAccessRequestHandler(async (dialog) => {
        dialog.allow();
      });

      expect(await permissionStore.requestAccess(midiSysexTrue)).toBe(true);
      expect(permissionStore.getStatus(midiSysexTrue)).toBe("GRANTED");
    });
  });
});
