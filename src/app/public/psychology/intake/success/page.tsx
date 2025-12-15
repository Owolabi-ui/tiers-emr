import { CheckCircle2 } from 'lucide-react';

export default function IntakeSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
        <p className="text-lg text-gray-700 mb-4">
          Your intake form has been submitted successfully.
        </p>
        <p className="text-gray-600 mb-6">
          Your psychologist will review this information before your first session. You should receive confirmation of your appointment time shortly.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>What's next?</strong>
            <br />
            • Wait for appointment confirmation
            <br />
            • Prepare any questions you'd like to discuss
            <br />
            • Arrive a few minutes early on the day
          </p>
        </div>
        <p className="text-sm text-gray-500">
          You may now close this window.
        </p>
      </div>
    </div>
  );
}
