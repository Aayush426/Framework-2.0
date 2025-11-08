import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const RestrictedPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const reason = user.restriction_reason || 'unspecified report';
  const message =
    user.message ||
    `You are restricted to access your profile by admin until further notice for "${reason}".`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-center p-6">
      <div className="max-w-md bg-white shadow-md rounded-2xl border border-red-200 p-8">
        <h1 className="text-2xl font-bold text-red-700 mb-3">Access Restricted</h1>
        <p className="text-gray-700">{message}</p>
        <p className="mt-4 text-gray-600">
          Please contact support or wait until your restriction is lifted.
        </p>
        <Button
          className="mt-6"
          onClick={() => {
            localStorage.clear();
            navigate('/login');
          }}
        >
          Log Out
        </Button>
      </div>
    </div>
  );
};

export default RestrictedPage;
