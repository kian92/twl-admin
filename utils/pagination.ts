export type PaginationItem = number | "...";

export const getPagination = (
  currentPage: number,
  totalPages: number,
  delta: number = 1
): PaginationItem[] => {
  const range: number[] = [];
  const rangeWithDots: PaginationItem[] = [];
  let lastPage: number | undefined;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      range.push(i);
    }
  }

  for (const page of range) {
    if (lastPage !== undefined) {
      if (page - lastPage === 2) {
        rangeWithDots.push(lastPage + 1);
      } else if (page - lastPage > 2) {
        rangeWithDots.push("...");
      }
    }
    rangeWithDots.push(page);
    lastPage = page;
  }

  return rangeWithDots;
};

