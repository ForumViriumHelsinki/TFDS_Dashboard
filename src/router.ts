import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { z } from 'zod'
import App from './App'

// Validate and normalize query params once per route
const searchSchema = z.object({
  dataPanelOpen: z.coerce.boolean().optional(),
  segment: z.string().optional(),
  sources: z.union([z.array(z.string()), z.string()]).optional(),
}).transform((s) => ({
  ...s,
  sources: Array.isArray(s.sources)
    ? s.sources
    : s.sources
    ? s.sources.split(',').filter(Boolean)
    : [],
}))

const rootRoute = createRootRoute()

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: App,
  validateSearch: (search) => searchSchema.parse(search),
})

export const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute]),
})

export type Router = typeof router

declare module '@tanstack/react-router' {
  interface Register {
    router: Router
  }
}


