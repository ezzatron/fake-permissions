import { DENIED, GRANTED, PROMPT } from "./constants/permission-state.js";
import { PermissionStore } from "./permission-store.js";

export class User<Names extends string> {
  constructor({
    permissionStore,
  }: {
    permissionStore: PermissionStore<Names>;
  }) {
    this.#permissionStore = permissionStore;
  }

  grantPermission(name: Names): void {
    this.#permissionStore.set(name, GRANTED);
  }

  denyPermission(name: Names): void {
    this.#permissionStore.set(name, DENIED);
  }

  resetPermission(name: Names): void {
    this.#permissionStore.set(name, PROMPT);
  }

  readonly #permissionStore: PermissionStore<Names>;
}
