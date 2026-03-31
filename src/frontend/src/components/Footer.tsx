import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { SiDiscord, SiGithub, SiX } from "react-icons/si";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);

  return (
    <footer className="border-t border-border bg-background mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md gradient-primary flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" fill="white" />
              </div>
              <span className="font-bold text-base tracking-wider uppercase">
                MOD<span className="gradient-primary-text">FORGE</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              The ultimate platform for creating, sharing, and managing mods for
              your favorite open world games.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <SiGithub className="w-4 h-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <SiX className="w-4 h-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <SiDiscord className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Nav */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/explore"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Explore Mods
                </Link>
              </li>
              <li>
                <Link
                  to="/create"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Create Mod
                </Link>
              </li>
              <li>
                <Link
                  to="/workshop"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Workshop
                </Link>
              </li>
            </ul>
          </div>

          {/* Games */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Games
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-muted-foreground">GTA V</span>
              </li>
              <li>
                <span className="text-muted-foreground">RDR2</span>
              </li>
              <li>
                <span className="text-muted-foreground">Cyberpunk 2077</span>
              </li>
              <li>
                <span className="text-muted-foreground">The Witcher 3</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          &copy; {currentYear}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
