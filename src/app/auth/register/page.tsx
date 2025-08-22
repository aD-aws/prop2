import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/RegisterForm';

function RegisterPageContent() {
  return <RegisterForm />;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}