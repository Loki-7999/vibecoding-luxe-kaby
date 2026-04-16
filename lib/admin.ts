export const APP_ROLES = ["admin", "broker", "agent", "viewer"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export interface AdminUserRecord {
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  created_at: string;
  last_sign_in_at: string | null;
}

export function getRoleLabel(role: AppRole) {
  switch (role) {
    case "admin":
      return "Administrador";
    case "broker":
      return "Broker";
    case "agent":
      return "Agente";
    case "viewer":
      return "Visualizador";
    default:
      return role;
  }
}

export function getRoleBadgeClass(role: AppRole) {
  switch (role) {
    case "admin":
      return "bg-nordic-dark text-white";
    case "broker":
      return "bg-primary/10 text-primary";
    case "agent":
      return "bg-amber-100 text-amber-700";
    case "viewer":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}
