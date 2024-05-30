import { Mock, vi } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Procedure = (...args: any[]) => void;
export type Mocked<T extends Procedure = Procedure> = Mock<
  Parameters<T>,
  ReturnType<T>
>;

export function mockFn<T extends Procedure = Procedure>(): Mocked<T>;
export function mockFn<T extends Procedure = Procedure>(
  implementation: T,
): Mocked<T>;
export function mockFn<T extends Procedure = Procedure>(
  implementation?: T,
): Mocked<T> {
  return vi.fn(implementation as T) as unknown as Mocked<T>;
}
