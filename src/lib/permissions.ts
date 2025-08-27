// permissions.ts
export type Role = "admin" | "editor" | "viewer";

export const matrix = {
  fichas: {
    read:   ["admin", "editor", "viewer"],
    create: ["admin", "editor"],
    update: ["admin", "editor"],
    delete: ["admin"],
  },
  lookups: {
    read: ["admin", "editor", "viewer"],
  },
} as const;

type Matrix = typeof matrix;
export type Resource = keyof Matrix;
export type ActionsByResource = { [R in Resource]: keyof Matrix[R] };
export type ActionFor<R extends Resource> = ActionsByResource[R];

export function can<R extends Resource>(
  role: Role,
  resource: R,
  action: ActionFor<R>
): boolean {
  // matrix[resource][action] queda bien tipado con los genéricos
  const allowed = matrix[resource][action];
  return (allowed as readonly Role[]).includes(role);
}
