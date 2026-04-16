import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen bg-background-light px-4 py-16 text-nordic-dark dark:bg-background-dark dark:text-white">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-nordic-dark/10 bg-white p-10 text-center shadow-soft dark:border-white/10 dark:bg-white/5">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <span className="material-icons">gpp_bad</span>
        </span>
        <h1 className="mt-6 text-3xl font-bold">Acceso restringido</h1>
        <p className="mt-3 text-sm text-nordic-muted">
          Esta seccion solo esta disponible para usuarios con rol de administrador.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
            href="/"
          >
            Volver al inicio
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-full border border-nordic-dark/10 px-5 py-3 text-sm font-semibold text-nordic-dark transition hover:border-primary hover:text-primary dark:border-white/10 dark:text-white"
            href="/login"
          >
            Iniciar sesion
          </Link>
        </div>
      </div>
    </main>
  );
}
