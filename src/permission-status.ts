export class PermissionStatus {
  readonly name: PermissionName;
  state: PermissionState;

  constructor() {
    this.name = "" as PermissionName;
    this.state = "" as PermissionState;
  }

  addEventListener() {
    throw new Error("Not implemented");
  }

  removeEventListener() {
    throw new Error("Not implemented");
  }

  dispatchEvent(): boolean {
    throw new Error("Not implemented");
  }

  onchange() {
    throw new Error("Not implemented");
  }
}
