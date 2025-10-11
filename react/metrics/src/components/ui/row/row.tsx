import React from 'react';
import { cn } from "@/utils/cn";

type RowProps = React.HTMLAttributes<HTMLDivElement>;

export const Row: React.FC<RowProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn("flex flex-row", className)} {...props}>
      {children}
    </div>
  );
};
