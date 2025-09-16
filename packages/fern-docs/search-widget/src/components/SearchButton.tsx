"use client";

import { Search } from "lucide-react";
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const searchButtonVariants = cva(
  "fixed bottom-6 right-6 z-50 rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        dark: "bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-500",
        minimal: "bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-300 border border-gray-200",
      },
      size: {
        default: "h-14 w-14",
        sm: "h-12 w-12 p-3",
        lg: "h-16 w-16 p-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface SearchButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof searchButtonVariants> {
  icon?: React.ReactNode;
}

const SearchButton = forwardRef<HTMLButtonElement, SearchButtonProps>(
  ({ className, variant, size, icon, ...props }, ref) => {
    return (
      <button
        className={searchButtonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      >
        {icon || <Search className="h-6 w-6" />}
      </button>
    );
  }
);
SearchButton.displayName = "SearchButton";

export { SearchButton, searchButtonVariants };