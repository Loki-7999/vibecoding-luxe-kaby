import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <div className="mt-12 flex items-center justify-center gap-2">
      {/* Previous */}
      {prevPage ? (
        <Link
          href={`/?page=${prevPage}`}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white dark:bg-white/5 border border-nordic-dark/10 dark:border-white/10 text-nordic-dark dark:text-white text-sm font-medium hover:border-mosque hover:text-mosque transition-all hover:shadow-md"
        >
          <span className="material-icons text-sm">arrow_back</span>
          Anterior
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white/40 dark:bg-white/5 border border-nordic-dark/5 text-nordic-muted text-sm font-medium cursor-not-allowed opacity-50">
          <span className="material-icons text-sm">arrow_back</span>
          Anterior
        </span>
      )}

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page) => (
          <Link
            key={page}
            href={`/?page=${page}`}
            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
              page === currentPage
                ? 'bg-nordic-dark text-white shadow-lg shadow-nordic-dark/10'
                : 'bg-white dark:bg-white/5 border border-nordic-dark/10 dark:border-white/10 text-nordic-dark dark:text-white hover:border-mosque hover:text-mosque hover:shadow-md'
            }`}
          >
            {page}
          </Link>
        ))}
      </div>

      {/* Next */}
      {nextPage ? (
        <Link
          href={`/?page=${nextPage}`}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white dark:bg-white/5 border border-nordic-dark/10 dark:border-white/10 text-nordic-dark dark:text-white text-sm font-medium hover:border-mosque hover:text-mosque transition-all hover:shadow-md"
        >
          Siguiente
          <span className="material-icons text-sm">arrow_forward</span>
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white/40 dark:bg-white/5 border border-nordic-dark/5 text-nordic-muted text-sm font-medium cursor-not-allowed opacity-50">
          Siguiente
          <span className="material-icons text-sm">arrow_forward</span>
        </span>
      )}
    </div>
  );
}
