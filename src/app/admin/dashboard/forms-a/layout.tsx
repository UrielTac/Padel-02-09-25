'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { FormProvider } from '@/contexts/FormContext';
import { useInitialForm } from '@/hooks/forms/use-initial-form';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface FormsLayoutProps {
  children: React.ReactNode;
}

// Componente de seguridad para asegurar la autenticación
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-sm text-gray-500">Verificando autenticación...</p>
      </div>
    );
  }

  if (!user) {
    router.push('/admin/login');
    return null;
  }

  // Verificar si el usuario tiene el rol de admin
  if (user.role !== 'admin') {
    router.push('/unauthorized');
    return null;
  }

  return <>{children}</>;
}

// Componente envoltorio para usar hooks
function WrappedFormProvider({ children }: { children: React.ReactNode }) {
  const { initialForm, isLoading, error } = useInitialForm();
  const router = useRouter();

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-sm text-gray-500">Cargando formulario...</p>
      </div>
    );
  }

  // Mostrar error si existe
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-600">{error.message}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/dashboard')}
        >
          Volver al Dashboard
        </Button>
      </div>
    );
  }

  // Si no hay formulario inicial después de la carga, mostrar error
  if (!initialForm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-600">No se pudo inicializar el formulario</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/dashboard')}
        >
          Volver al Dashboard
        </Button>
      </div>
    );
  }

  console.log('✅ Renderizando FormProvider con initialForm:', initialForm);

  return (
    <FormProvider initialForm={initialForm}>
      {children}
    </FormProvider>
  );
}

// Componente principal del layout
export default function FormsLayout({ children }: FormsLayoutProps) {
  return (
    <AuthProvider>
      <AuthGuard>
        <div className="forms-layout">
          <OrganizationProvider>
            <WrappedFormProvider>
              {children}
            </WrappedFormProvider>
          </OrganizationProvider>
        </div>
      </AuthGuard>
    </AuthProvider>
  );
} 