import React from "react";
import { cn } from "@/utils/cn";

type ColumnProps = React.HTMLAttributes<HTMLDivElement>;

export const Column: React.FC<ColumnProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {children}
    </div>
  );
};
