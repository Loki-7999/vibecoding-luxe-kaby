import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import FeaturedPropertyCard from "@/components/FeaturedPropertyCard";
import PropertyCard from "@/components/PropertyCard";
import Pagination from "@/components/Pagination";
import SearchAndFilters from "@/components/SearchAndFilters";
import { getFeaturedProperties, getPaginatedProperties } from "@/lib/queries";

interface HomePageProps {
  searchParams: Promise<{ page?: string; query?: string; type?: string }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10));
  const searchQuery = params.query || "";
  const propertyType = params.type || "All";

  const [featured, paginated] = await Promise.all([
    getFeaturedProperties(),
    getPaginatedProperties(currentPage, searchQuery, propertyType),
  ]);

  const { properties, totalPages } = paginated;

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <section className="py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-nordic-dark dark:text-white leading-tight">
              Find your{" "}
              <span className="relative inline-block">
                <span className="relative z-10 font-medium">sanctuary</span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-mosque/20 -rotate-1 z-0"></span>
              </span>
              .
            </h1>
            <Suspense fallback={<div className="h-[60px]" />}>
              <SearchAndFilters />
            </Suspense>
          </div>
        </section>

        {/* Featured Collections (Hidden when searching or filtering) */}
        {!searchQuery && propertyType === "All" && featured.length > 0 && (
          <section className="mb-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-light text-nordic-dark dark:text-white">
                  Featured Collections
                </h2>
                <p className="text-nordic-muted mt-1 text-sm">
                  Curated properties for the discerning eye.
                </p>
              </div>
              <a
                href="#"
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-mosque hover:opacity-70 transition-opacity"
              >
                View all <span className="material-icons text-sm">arrow_forward</span>
              </a>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featured.map((property) => (
                <FeaturedPropertyCard key={property.id} property={property} />
              ))}
            </div>
          </section>
        )}

        {/* Properties Grid */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-light text-nordic-dark dark:text-white">
                {searchQuery ? "Search Results" : "New in Market"}
              </h2>
              <p className="text-nordic-muted mt-1 text-sm">
                {searchQuery ? `Showing properties matching "${searchQuery}"` : "Fresh opportunities added this week."}
              </p>
            </div>
            <div className="hidden md:flex bg-white dark:bg-white/5 p-1 rounded-lg">
              <button className="px-4 py-1.5 rounded-md text-sm font-medium bg-nordic-dark text-white shadow-sm">
                All
              </button>
              <button className="px-4 py-1.5 rounded-md text-sm font-medium text-nordic-muted hover:text-nordic-dark dark:hover:text-white">
                Buy
              </button>
              <button className="px-4 py-1.5 rounded-md text-sm font-medium text-nordic-muted hover:text-nordic-dark dark:hover:text-white">
                Rent
              </button>
            </div>
          </div>

          {properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-nordic-muted">
              <span className="material-icons text-5xl mb-4 block">search_off</span>
              <p>No properties found.</p>
            </div>
          )}

          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </section>
      </main>
    </>
  );
}
