import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/utils/cn";

import { Spinner } from "../spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-secondary shadow-sm hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-muted-foreground/10",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        brand:
          "bg-brand-foreground text-white shadow-sm hover:bg-brand-foreground/90",
        "pill-primary":
          "w-full py-3 px-6 rounded-full font-medium text-sm transition-all duration-200 bg-white text-black hover:bg-zinc-300",
        "pill-secondary":
          "w-full py-3 px-6 rounded-full font-medium text-sm transition-all duration-200 bg-secondary text-white border border-gray-600 hover:border-gray-500 hover:bg-zinc-900",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 px-3 py-2 rounded-md text-sm font-semibold",
        xl: "h-12 rounded-md px-10",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isLoading?: boolean;
    icon?: React.ReactNode;
    childrenClassName?: string;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      children,
      childrenClassName,
      isLoading,
      icon,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        disabled={isLoading || props.disabled}
      >
        {!isLoading && icon && <span className="mr-2">{icon}</span>}
        <span
          className={cn(childrenClassName, {
            "relative flex justify-center items-center": isLoading,
          })}
        >
          {isLoading && (
            <Spinner size="smd" className="text-current absolute" />
          )}
          <span className={isLoading ? "opacity-0" : ""}>{children}</span>
        </span>
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
