import { Permissions } from "../../src/permissions.js";

describe("Permissions", () => {
  let permissions: Permissions;

  beforeEach(() => {
    permissions = new Permissions();
  });

  describe("query()", () => {
    describe("when called without arguments", () => {
      it("throws a TypeError", () => {
        const call = () => {
          permissions.query();
        };

        expect(call).toThrow(TypeError);
        expect(call).toThrow(
          "Failed to execute 'query' on 'Permissions': 1 argument required, but only 0 present.",
        );
      });
    });
  });
});
