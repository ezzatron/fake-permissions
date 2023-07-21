import {
  DENIED,
  GRANTED,
  PROMPT,
} from "../../src/constants/permission-state.js";
import {
  PermissionStatus,
  Permissions,
  User,
  createPermissionStore,
  createPermissions,
  createUser,
} from "../../src/index.js";

type Names = "permission-a" | "permission-b" | "permission-c";

describe("PermissionStatus", () => {
  let user: User<Names>;
  let permissions: Permissions<Names>;
  let statusA: PermissionStatus<"permission-a">;
  let statusB: PermissionStatus<"permission-b">;
  let statusC: PermissionStatus<"permission-c">;

  beforeEach(async () => {
    const permissionStore = createPermissionStore({
      initialStates: {
        "permission-a": PROMPT,
        "permission-b": GRANTED,
        "permission-c": DENIED,
      },
    });

    user = createUser({ permissionStore });
    permissions = createPermissions({ permissionStore });

    statusA = await permissions.query({ name: "permission-a" });
    statusB = await permissions.query({ name: "permission-b" });
    statusC = await permissions.query({ name: "permission-c" });
  });

  it("has a name that matches the queried permission name", async () => {
    expect(statusA.name).toBe("permission-a");
    expect(statusB.name).toBe("permission-b");
  });

  it("has an initial state that matches the permission set", async () => {
    expect(statusA.state).toBe(PROMPT);
    expect(statusB.state).toBe(GRANTED);
  });

  describe("when the user changes the permission state", () => {
    beforeEach(async () => {
      user.grantPermission("permission-a");
      user.denyPermission("permission-b");
      user.resetPermission("permission-c");
    });

    it("has a state that matches the new state", () => {
      expect(statusA.state).toBe(GRANTED);
      expect(statusB.state).toBe(DENIED);
      expect(statusC.state).toBe(PROMPT);
    });
  });
});
