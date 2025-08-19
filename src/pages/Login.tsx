import { LoginForm } from "@/components/auth/LoginForm";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleLoginSuccess = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="absolute inset-0 bg-grid-slate-100/50" />
      <div className="relative z-10 w-full max-w-sm sm:max-w-md">
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
}