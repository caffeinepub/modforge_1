import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Search, Zap } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";

export default function NavBar() {
  const { login, clear, identity, isLoggingIn } = useInternetIdentity();
  const { data: profile } = useUserProfile();
  const isLoggedIn = !!identity;

  const username =
    profile?.name ||
    (identity ? `${identity.getPrincipal().toString().slice(0, 8)}...` : null);
  const initials = username ? username.slice(0, 2).toUpperCase() : "??";

  const navLinks = [
    { href: "/explore", label: "Explore Mods" },
    { href: "/create", label: "Mod Creator" },
    { href: "/workshop", label: "My Workshop" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 flex-shrink-0"
          data-ocid="nav.link"
        >
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center glow-cyan">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="font-bold text-lg tracking-wider uppercase text-foreground">
            MOD<span className="gradient-primary-text">FORGE</span>
          </span>
        </Link>

        {/* Center nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
              activeProps={{ className: "text-primary bg-primary/10" }}
              data-ocid="nav.link"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex text-muted-foreground hover:text-foreground"
            data-ocid="nav.button"
          >
            <Search className="w-4 h-4" />
          </Button>

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border hover:border-primary/40 transition-all"
                  data-ocid="nav.button"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs gradient-primary text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground hidden sm:block">
                    {username}
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-card border-border"
              >
                <DropdownMenuItem asChild>
                  <Link to="/workshop" data-ocid="nav.link">
                    My Workshop
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={clear}
                  className="text-destructive focus:text-destructive"
                  data-ocid="nav.button"
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={login}
              disabled={isLoggingIn}
              size="sm"
              className="gradient-primary text-white border-0 hover:opacity-90 transition-opacity"
              data-ocid="nav.button"
            >
              {isLoggingIn ? "Connecting..." : "Sign In"}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
