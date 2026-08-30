import { cn } from "@/lib/utils";
import { getCategoryChipTone } from "@/lib/category-colors";

interface CategoryChipProps {
  name: string;
  className?: string;
}

export function CategoryChip({ name, className }: CategoryChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm",
        getCategoryChipTone(name),
        className,
      )}
    >
      {name}
    </span>
  );
}
