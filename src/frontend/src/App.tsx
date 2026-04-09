import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import Footer from "./components/Footer";
import NavBar from "./components/NavBar";
import CreateModPage from "./pages/CreateModPage";
import EditModPage from "./pages/EditModPage";
import ExplorePage from "./pages/ExplorePage";
import HomePage from "./pages/HomePage";
import ModDetailPage from "./pages/ModDetailPage";
import WorkshopPage from "./pages/WorkshopPage";

const rootRoute = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore",
  component: ExplorePage,
});

const createRoute_ = createRoute({
  getParentRoute: () => rootRoute,
  path: "/create",
  component: CreateModPage,
});

const workshopRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workshop",
  component: WorkshopPage,
});

const editRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/edit/$id",
  component: EditModPage,
});

const modDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mod/$modId",
  component: ModDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  exploreRoute,
  createRoute_,
  workshopRoute,
  editRoute,
  modDetailRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
