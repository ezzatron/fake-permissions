import {
  PermissionStore,
  createPermissionStore,
  type HandleAccessRequest,
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
        [geolocation, "denied"],
        [midiSysexFalse, "granted"],
        [midiSysexTrue, "prompt"],
        [pushUserVisibleOnlyFalse, "granted"],
        [pushUserVisibleOnlyTrue, "prompt"],
      ]),

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

  describe("selectByDescriptor()", () => {
    it("selects from any iterable keyed on permission descriptors", () => {
      const iterable = new Map([
        [structuredClone(geolocation), "a"],
        [structuredClone(midiSysexFalse), "b"],
        [structuredClone(midiSysexTrue), "c"],
      ]);

      expect(
        permissionStore.selectByDescriptor(
          iterable,
          structuredClone(geolocation),
        ),
      ).toBe("a");
      expect(
        permissionStore.selectByDescriptor(
          iterable,
          structuredClone(midiSysexFalse),
        ),
      ).toBe("b");
      expect(
        permissionStore.selectByDescriptor(
          iterable,
          structuredClone(midiSysexTrue),
        ),
      ).toBe("c");
    });
  });

  describe("getState()", () => {
    describe("when called with an unknown descriptor", () => {
      it("throws a TypeError", () => {
        const call = () => {
          permissionStore.getState(notifications);
        };

        expect(call).toThrow(TypeError);
        expect(call).toThrow(
          'No permission state for descriptor {"name":"notifications"}',
        );
      });
    });

    describe("when called with a known descriptor", () => {
      it("returns the state of the permission", () => {
        expect(permissionStore.getState(geolocation)).toBe("denied");
        expect(permissionStore.getState(push)).toBe("granted");
        expect(permissionStore.getState(pushUserVisibleOnlyFalse)).toBe(
          "granted",
        );
        expect(permissionStore.getState(pushUserVisibleOnlyTrue)).toBe(
          "prompt",
        );
      });
    });

    describe("when called with a known descriptor with extra properties", () => {
      it("returns the state of the permission", () => {
        expect(permissionStore.getState(geolocationWithExtra)).toBe("denied");
      });
    });
  });

  describe("setState()", () => {
    describe("when called with an unknown descriptor", () => {
      it("throws a TypeError", () => {
        const call = () => {
          permissionStore.setState(notifications, "prompt");
        };

        expect(call).toThrow(TypeError);
        expect(call).toThrow(
          'No permission state for descriptor {"name":"notifications"}',
        );
      });
    });

    describe("when called with a known descriptor", () => {
      it("sets the state of the permission", () => {
        permissionStore.setState(geolocation, "granted");
        permissionStore.setState(pushUserVisibleOnlyFalse, "prompt");
        permissionStore.setState(pushUserVisibleOnlyTrue, "denied");

        expect(permissionStore.getState(geolocation)).toBe("granted");
        expect(permissionStore.getState(push)).toBe("prompt");
        expect(permissionStore.getState(pushUserVisibleOnlyFalse)).toBe(
          "prompt",
        );
        expect(permissionStore.getState(pushUserVisibleOnlyTrue)).toBe(
          "denied",
        );
      });
    });

    describe("when called with a known descriptor with extra properties", () => {
      it("sets the state of the permission", () => {
        permissionStore.setState(geolocationWithExtra, "prompt");

        expect(permissionStore.getState(geolocation)).toBe("prompt");
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
      describe('when access is requested for a permission in the "prompt" state', () => {
        it("denies access and leaves the permission unchanged", async () => {
          expect(await permissionStore.requestAccess(midiSysexTrue)).toBe(
            false,
          );
          expect(permissionStore.getState(midiSysexTrue)).toBe("prompt");
        });

        describe("when the dialog is dismissed repeatedly", () => {
          beforeEach(async () => {
            await permissionStore.requestAccess(midiSysexTrue);
            await permissionStore.requestAccess(midiSysexTrue);
            await permissionStore.requestAccess(midiSysexTrue);
          });

          it("denies the permission automatically", () => {
            expect(permissionStore.getState(midiSysexTrue)).toBe("denied");
          });

          it("doesn't affect other permissions", async () => {
            expect(
              await permissionStore.requestAccess(pushUserVisibleOnlyTrue),
            ).toBe(false);
            expect(permissionStore.getState(pushUserVisibleOnlyTrue)).toBe(
              "prompt",
            );
          });

          describe("when the permission is reset", () => {
            beforeEach(() => {
              permissionStore.setState(midiSysexTrue, "prompt");
            });

            it("resets the dismissal count", async () => {
              await permissionStore.requestAccess(midiSysexTrue);
              await permissionStore.requestAccess(midiSysexTrue);

              expect(permissionStore.getState(midiSysexTrue)).toBe("prompt");
            });
          });
        });
      });

      describe('when access is requested for a permission in the "granted" state', () => {
        it("allows access and leaves the permission unchanged", async () => {
          expect(await permissionStore.requestAccess(midiSysexFalse)).toBe(
            true,
          );
          expect(permissionStore.getState(midiSysexFalse)).toBe("granted");
        });
      });

      describe('when access is requested for a permission in the "denied" state', () => {
        it("denies access and leaves the permission unchanged", async () => {
          expect(await permissionStore.requestAccess(geolocation)).toBe(false);
          expect(permissionStore.getState(geolocation)).toBe("denied");
        });
      });
    });

    describe("when an access request handler is configured", () => {
      let handleAccessRequest: Mock<HandleAccessRequest>;

      beforeEach(() => {
        handleAccessRequest = vi.fn(async (dialog) => {
          dialog.allow(true);
        });

        permissionStore.setAccessRequestHandler(handleAccessRequest);
      });

      it("can't dismiss the dialog after it's been dismissed", async () => {
        handleAccessRequest.mockImplementation(async (dialog) => {
          dialog.allow(true);
          dialog.deny(true);
        });

        await expect(
          permissionStore.requestAccess(midiSysexTrue),
        ).rejects.toThrow("Access dialog already dismissed");
      });

      describe('when access is requested for a permission in the "prompt" state', () => {
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

          it("denies access and leaves the permission unchanged", async () => {
            expect(await permissionStore.requestAccess(midiSysexTrue)).toBe(
              false,
            );
            expect(permissionStore.getState(midiSysexTrue)).toBe("prompt");
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

          it("denies the permission automatically", () => {
            expect(permissionStore.getState(midiSysexTrue)).toBe("denied");
          });

          it("doesn't affect other permissions", async () => {
            expect(
              await permissionStore.requestAccess(pushUserVisibleOnlyTrue),
            ).toBe(false);
            expect(permissionStore.getState(pushUserVisibleOnlyTrue)).toBe(
              "prompt",
            );
          });

          describe("when the permission is reset", () => {
            beforeEach(() => {
              permissionStore.setState(midiSysexTrue, "prompt");
            });

            it("resets the dismissal count", async () => {
              await permissionStore.requestAccess(midiSysexTrue);
              await permissionStore.requestAccess(midiSysexTrue);

              expect(permissionStore.getState(midiSysexTrue)).toBe("prompt");
            });
          });
        });

        describe("when access is allowed but the decision is not remembered", () => {
          beforeEach(() => {
            handleAccessRequest.mockImplementation(async (dialog) => {
              dialog.allow(false);
            });
          });

          it("allows access and leaves the permission unchanged", async () => {
            expect(await permissionStore.requestAccess(midiSysexTrue)).toBe(
              true,
            );
            expect(permissionStore.getState(midiSysexTrue)).toBe("prompt");
          });
        });

        describe("when access is allowed and the decision is remembered", () => {
          beforeEach(() => {
            handleAccessRequest.mockImplementation(async (dialog) => {
              dialog.allow(true);
            });
          });

          it("allows access and grants the permission", async () => {
            expect(await permissionStore.requestAccess(midiSysexTrue)).toBe(
              true,
            );
            expect(permissionStore.getState(midiSysexTrue)).toBe("granted");
          });
        });

        describe("when access is denied but the decision is not remembered", () => {
          beforeEach(() => {
            handleAccessRequest.mockImplementation(async (dialog) => {
              dialog.deny(false);
            });
          });

          it("denies access and leaves the permission unchanged", async () => {
            expect(await permissionStore.requestAccess(midiSysexTrue)).toBe(
              false,
            );
            expect(permissionStore.getState(midiSysexTrue)).toBe("prompt");
          });
        });

        describe("when access is denied and the decision is remembered", () => {
          beforeEach(() => {
            handleAccessRequest.mockImplementation(async (dialog) => {
              dialog.deny(true);
            });
          });

          it("denies access and denies the permission", async () => {
            expect(await permissionStore.requestAccess(midiSysexTrue)).toBe(
              false,
            );
            expect(permissionStore.getState(midiSysexTrue)).toBe("denied");
          });
        });
      });

      describe('when access is requested for a permission in the "granted" state', () => {
        it("does not call the callback", async () => {
          await permissionStore.requestAccess(midiSysexFalse);

          expect(handleAccessRequest).not.toBeCalled();
        });

        it("allows access and leaves the permission unchanged", async () => {
          expect(await permissionStore.requestAccess(midiSysexFalse)).toBe(
            true,
          );
          expect(permissionStore.getState(midiSysexFalse)).toBe("granted");
        });
      });

      describe('when access is requested for a permission in the "denied" state', () => {
        it("does not call the callback", async () => {
          await permissionStore.requestAccess(geolocation);

          expect(handleAccessRequest).not.toBeCalled();
        });

        it("denies access and leaves the permission unchanged", async () => {
          expect(await permissionStore.requestAccess(geolocation)).toBe(false);
          expect(permissionStore.getState(geolocation)).toBe("denied");
        });
      });
    });

    describe("when a custom dismissal deny threshold is configured", () => {
      beforeEach(() => {
        permissionStore = createPermissionStore({
          dismissDenyThreshold: 2,
          initialStates: new Map([[midiSysexTrue, "prompt"]]),
        });
      });

      it("affects how many dismissed dialogs will cause permission denial", async () => {
        await permissionStore.requestAccess(midiSysexTrue);

        expect(permissionStore.getState(midiSysexTrue)).toBe("prompt");

        await permissionStore.requestAccess(midiSysexTrue);

        expect(permissionStore.getState(midiSysexTrue)).toBe("denied");
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

    describe("when a permission state changes", () => {
      beforeEach(() => {
        permissionStore.setState(pushUserVisibleOnlyFalse, "denied");
      });

      it("calls the subscriber", () => {
        expect(subscriber).toBeCalledTimes(1);
        expect(subscriber).toBeCalledWith(
          pushUserVisibleOnlyFalse,
          "denied",
          "granted",
        );
      });
    });

    describe("when a permission state is updated to the same state", () => {
      beforeEach(() => {
        permissionStore.setState(pushUserVisibleOnlyFalse, "granted");
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

    it.each([
      ["geolocation"],
      ["midi"],
      ["notifications"],
      ["persistent-storage"],
      ["push"],
      ["screen-wake-lock"],
      ["storage-access"],
    ] as const)(
      "should create a permission store with the standard permissions (%s)",
      (name) => {
        expect(permissionStore.isKnownDescriptor({ name })).toBe(true);
      },
    );

    it("should create a permission store that understands midi descriptors with the sysex property", () => {
      expect(permissionStore.getState(midi)).toBe("prompt");
      expect(permissionStore.getState(midiSysexFalse)).toBe("prompt");
      expect(permissionStore.getState(midiSysexTrue)).toBe("prompt");

      permissionStore.setState(midiSysexTrue, "denied");
      permissionStore.setState(midiSysexFalse, "granted");

      expect(permissionStore.getState(midi)).toBe("granted");
      expect(permissionStore.getState(midiSysexFalse)).toBe("granted");
      expect(permissionStore.getState(midiSysexTrue)).toBe("denied");
    });

    it("should create a permission store that understands push descriptors with the userVisibleOnly property", () => {
      expect(permissionStore.getState(push)).toBe("prompt");
      expect(permissionStore.getState(pushUserVisibleOnlyFalse)).toBe("prompt");
      expect(permissionStore.getState(pushUserVisibleOnlyTrue)).toBe("prompt");

      permissionStore.setState(pushUserVisibleOnlyTrue, "denied");
      permissionStore.setState(pushUserVisibleOnlyFalse, "granted");

      expect(permissionStore.getState(push)).toBe("granted");
      expect(permissionStore.getState(pushUserVisibleOnlyFalse)).toBe(
        "granted",
      );
      expect(permissionStore.getState(pushUserVisibleOnlyTrue)).toBe("denied");
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
          [push, "granted"],
          [pushUserVisibleOnlyTrue, "prompt"],
          [midi, "granted"],
          [midiSysexTrue, "prompt"],
        ]),
      });
    });

    it("should create a permission store that understands non-normalized midi descriptors in the initial states", () => {
      expect(permissionStore.getState(midi)).toBe("granted");
      expect(permissionStore.getState(midiSysexFalse)).toBe("granted");
      expect(permissionStore.getState(midiSysexTrue)).toBe("prompt");

      permissionStore.setState(midiSysexFalse, "prompt");
      permissionStore.setState(midiSysexTrue, "denied");

      expect(permissionStore.getState(midi)).toBe("prompt");
      expect(permissionStore.getState(midiSysexFalse)).toBe("prompt");
      expect(permissionStore.getState(midiSysexTrue)).toBe("denied");
    });

    it("should create a permission store that understands non-normalized push descriptors in the initial states", () => {
      expect(permissionStore.getState(push)).toBe("granted");
      expect(permissionStore.getState(pushUserVisibleOnlyFalse)).toBe(
        "granted",
      );
      expect(permissionStore.getState(pushUserVisibleOnlyTrue)).toBe("prompt");

      permissionStore.setState(pushUserVisibleOnlyFalse, "prompt");
      permissionStore.setState(pushUserVisibleOnlyTrue, "denied");

      expect(permissionStore.getState(push)).toBe("prompt");
      expect(permissionStore.getState(pushUserVisibleOnlyFalse)).toBe("prompt");
      expect(permissionStore.getState(pushUserVisibleOnlyTrue)).toBe("denied");
    });
  });
});
