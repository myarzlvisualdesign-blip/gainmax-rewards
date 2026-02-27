import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground px-4 py-12 text-background/80">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div>
            <h4 className="text-xl font-extrabold text-background">
              Gain<span className="text-primary">Max</span>
            </h4>
            <p className="mt-1 text-sm font-light">Platform cashback & affiliate terpercaya.</p>
          </div>
          <div className="flex gap-6 text-sm font-medium">
            <Link to="/login" className="transition-colors hover:text-background">Login</Link>
            <Link to="/register" className="transition-colors hover:text-background">Daftar</Link>
          </div>
        </div>
        <div className="border-t border-background/10 pt-6 text-center text-xs font-light">
          © {new Date().getFullYear()} GainMax. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
