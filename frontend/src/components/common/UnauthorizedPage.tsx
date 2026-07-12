import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6 p-8 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shadow-glow-sm">
        <ShieldAlert className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          You do not have the required permissions or role privileges to view this page. Please contact your administrator if you think this is a mistake.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          id="back-btn"
          variant="outline"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
        <Button asChild className="gap-2">
          <Link to={ROUTES.DASHBOARD}>
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
