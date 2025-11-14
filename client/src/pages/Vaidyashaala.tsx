import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Vaidyashaala = () => {
  const navigate = useNavigate();

  const handleVaidyashaalClick = () => {
    navigate("/home");
  };
  const handledrclick=()=>{
    navigate("/doctor");
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-100 via-amber-50 to-red-100">
      {/* Subtle background radial gradients */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(251,146,60,0.2)_0%,transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(239,68,68,0.15)_0%,transparent_60%)]"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between min-h-screen">
        {/* Left Side - Huge Logo */}
        <div className="flex-1 flex justify-center items-center">
          {/* <div className="relative group"> */}
          <div className="absolute -inset-8 bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 rounded-full blur-3xl opacity-30"></div>
          <div className="relative w-full h-[95vh] flex justify-center items-center">
            <img
              src="/icon2.png"
              alt="Therapy Icon"
              className="max-w-[95vw] max-h-[90vh] object-contain drop-shadow-2xl"
            />
          </div>

          {/* </div> */}
        </div>

        {/* Right Side - Button with Description */}
        <div className="flex-1 flex flex-col justify-center items-center mt-10 md:mt-0 space-y-8">
        

          {/* आयुर-सेतु Button */}
          <Button
            onClick={handleVaidyashaalClick}
            className="bg-gradient-to-r from-orange-600 via-red-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white text-4xl px-16 py-10 rounded-full font-bold shadow-2xl transform hover:scale-105 transition duration-300 w-[300px] text-center"
          >
            आयुर-सेतु
          </Button>

          {/* Descriptive Text */}
          <div className="text-center max-w-md">
            <p className="text-gray-700 text-2xl font-semibold flex items-center justify-center space-x-2">
              <span>पारंपरिक चिकित्सा, आधुनिक प्रबंधन</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vaidyashaala;
