import { Button } from "../ui/button";
import type { PaginationDto } from "../../types";

interface PaginationProps {
  pagination: PaginationDto;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);

  // Don't show pagination if only one page
  if (totalPages <= 1) {
    return null;
  }

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Calculate page numbers to show (max 7: first, prev, ...current-1, current, current+1..., next, last)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      {/* Info */}
      <div className="text-sm text-muted-foreground">
        Wyświetlane <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> z{" "}
        <span className="font-medium">{total}</span>
      </div>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Poprzednia strona"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Button>

        {/* Page numbers */}
        {pageNumbers.map((pageNum, index) => {
          if (pageNum === "...") {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">
                ...
              </span>
            );
          }

          const pageNumber = pageNum as number;
          const isActive = pageNumber === page;

          return (
            <Button
              key={pageNumber}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNumber)}
              aria-label={`Strona ${pageNumber}`}
              aria-current={isActive ? "page" : undefined}
              className="min-w-[2.5rem]"
            >
              {pageNumber}
            </Button>
          );
        })}

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Następna strona"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
