import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  const handleGoToVaidyashaala = () => {
    navigate("/vaidyashaala");
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center space-y-6">
      <h1 className="text-4xl font-bold text-red-600">403 - Unauthorized</h1>
      <p className="text-gray-600 text-lg">You do not have access to this page.</p>

      <Button
        onClick={handleGoToVaidyashaala}
        className="bg-red-500 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300"
      >
        Back
      </Button>
    </div>
  );
};