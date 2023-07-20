import { DENIED, GRANTED } from "../../src/constants/permission-state.js";
import { Permissions } from "../../src/index.js";

describe("PermissionStatus", () => {
  let permissions: Permissions<"permission-a" | "permission-b">;

  beforeEach(async () => {
    permissions = new Permissions({
      permissionSet: {
        "permission-a": DENIED,
        "permission-b": GRANTED,
      },
    });
  });

  it("has a name that matches the queried permission name", async () => {
    const statusA = await permissions.query({ name: "permission-a" });
    const statusB = await permissions.query({ name: "permission-b" });

    expect(statusA.name).toBe("permission-a");
    expect(statusB.name).toBe("permission-b");
  });

  it("is has an initial state that matches the permission set", async () => {
    const statusA = await permissions.query({ name: "permission-a" });
    const statusB = await permissions.query({ name: "permission-b" });

    expect(statusA.state).toBe(DENIED);
    expect(statusB.state).toBe(GRANTED);
  });
});
