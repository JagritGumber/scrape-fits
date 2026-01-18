"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const fieldVariants = cva("flex gap-2", {
  variants: {
    orientation: {
      vertical: "flex-col",
      horizontal: "flex-row items-center justify-between",
      responsive:
        "flex-col @container/field-group:flex-row @container/field-group:items-center @container/field-group:justify-between",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

export interface FieldProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof fieldVariants> {}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ className, orientation, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  ),
);
Field.displayName = "Field";

const FieldContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props} />
));
FieldContent.displayName = "FieldContent";

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-muted-foreground", className)}
    {...props}
  />
));
FieldDescription.displayName = "FieldDescription";

type FieldErrorItem =
  | string
  | {
      message?: string;
    };

export interface FieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  errors?: FieldErrorItem[];
}

const FieldError = React.forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({ className, children, errors, ...props }, ref) => {
    const messages =
      errors
        ?.map((error) => (typeof error === "string" ? error : error?.message))
        .filter(Boolean) ?? [];

    return (
      <p
        ref={ref}
        className={cn("text-xs font-medium text-destructive", className)}
        {...props}
      >
        {children ?? messages.join("\n")}
      </p>
    );
  },
);
FieldError.displayName = "FieldError";

const FieldSet = React.forwardRef<
  HTMLFieldSetElement,
  React.FieldsetHTMLAttributes<HTMLFieldSetElement>
>(({ className, ...props }, ref) => (
  <fieldset ref={ref} className={cn("space-y-3", className)} {...props} />
));
FieldSet.displayName = "FieldSet";

const fieldLegendVariants = cva("block text-sm font-semibold leading-none", {
  variants: {
    variant: {
      legend: "mb-1",
      label: "mb-2 text-xs uppercase tracking-wide text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "legend",
  },
});

export interface FieldLegendProps
  extends
    React.HTMLAttributes<HTMLLegendElement>,
    VariantProps<typeof fieldLegendVariants> {}

const FieldLegend = React.forwardRef<HTMLLegendElement, FieldLegendProps>(
  ({ className, variant, ...props }, ref) => (
    <legend
      ref={ref}
      className={cn(fieldLegendVariants({ variant }), className)}
      {...props}
    />
  ),
);
FieldLegend.displayName = "FieldLegend";

const FieldGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("@container/field-group flex flex-col gap-4", className)}
    {...props}
  />
));
FieldGroup.displayName = "FieldGroup";

const FieldSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("h-px w-full bg-border", className)}
    aria-hidden="true"
    {...props}
  />
));
FieldSeparator.displayName = "FieldSeparator";

const FieldTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm font-medium leading-none", className)}
    {...props}
  />
));
FieldTitle.displayName = "FieldTitle";

const FieldLabel = Label;

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
};
