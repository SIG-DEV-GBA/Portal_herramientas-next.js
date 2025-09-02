// permissions.ts
export type Role = "ADMIN" | "EDITOR" | "VIEWER";

export const matrix = {
  fichas: {
    read:   ["ADMIN", "EDITOR", "VIEWER"],
    create: ["ADMIN", "EDITOR", "VIEWER"],
    update: ["ADMIN", "EDITOR", "VIEWER"],
    delete: ["ADMIN", "EDITOR", "VIEWER"],
  },
  lookups: {
    read: ["ADMIN", "EDITOR", "VIEWER"],
  },
  portales: {
    read:   ["ADMIN", "EDITOR", "VIEWER"],
    create: ["ADMIN", "EDITOR"],
    update: ["ADMIN", "EDITOR"],
    delete: ["ADMIN", "EDITOR"],
  },
  tematicas: {
    read:   ["ADMIN", "EDITOR", "VIEWER"],
    create: ["ADMIN", "EDITOR"],
    update: ["ADMIN", "EDITOR"],
    delete: ["ADMIN", "EDITOR"],
  },
  trabajadores: {
    read:   ["ADMIN", "EDITOR", "VIEWER"],
    create: ["ADMIN", "EDITOR"],
    update: ["ADMIN", "EDITOR"],
    delete: ["ADMIN", "EDITOR"],
  },
  users: {
    read:   ["ADMIN"],
    create: ["ADMIN"],
    update: ["ADMIN"],
    delete: ["ADMIN"],
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
