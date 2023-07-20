import { Permissions, PermissionStatus } from "../../src/index.js";

describe("PermissionStatus", () => {
  let status: PermissionStatus<"permission-a">;

  beforeEach(async () => {
    const permissions = new Permissions({
      permissionNames: new Set(["permission-a"]),
    });

    status = await permissions.query({ name: "permission-a" });
  });

  it("has a name that matches the queried permission name", () => {
    expect(status.name).toBe("permission-a");
  });
});
