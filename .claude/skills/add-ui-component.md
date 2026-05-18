# Skill: Add a UI Component

The `shadcn` CLI is **broken** for this project (`colors/green.json was not found`). All `components/ui/` files must be written manually.

## Pattern

Every component follows this structure:

```typescript
"use client"

import * as React from "react"
import * as <Primitive>Primitive from "@radix-ui/react-<primitive>"
import { cn } from "@/lib/utils"

const ComponentName = React.forwardRef<
  React.ElementRef<typeof <Primitive>Primitive.Root>,
  React.ComponentPropsWithoutRef<typeof <Primitive>Primitive.Root>
>(({ className, ...props }, ref) => (
  <Primitive>Primitive.Root
    ref={ref}
    className={cn("base-tailwind-classes", className)}
    {...props}
  />
))
ComponentName.displayName = <Primitive>Primitive.Root.displayName

export { ComponentName }
```

Key rules:
- Always `"use client"` at the top
- Use `React.forwardRef` with proper generic types from the Radix primitive
- Spread `...props` so consumers can pass all native attributes
- Use `cn()` from `@/lib/utils` for className merging
- Set `.displayName` to match the Radix primitive for React DevTools

## Radix packages already installed

Check `package.json` before adding a new dependency — these are already available:
`@radix-ui/react-dialog`, `react-dropdown-menu`, `react-label`, `react-progress`,
`react-select`, `react-separator`, `react-slider`, `react-slot`, `react-tabs`, `react-tooltip`

## Adding a new component checklist

1. Check if the Radix primitive is already in `package.json`
2. If not: `pnpm add @radix-ui/react-<name>`
3. Write `components/ui/<name>.tsx` following the pattern above
4. Reference existing files like `components/ui/tabs.tsx` or `components/ui/slider.tsx` as templates

## Theme alignment

New components should use CSS variable tokens, not hard-coded colors:
- `bg-card shadow-card` for surfaces (not `border`)
- `text-muted-foreground` for secondary text
- `rounded-2xl` for card-like containers, `rounded-xl` for inner containers
- `text-primary` for the teal accent
