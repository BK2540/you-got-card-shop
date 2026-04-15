import React from "react";

interface ButtonType {
  title: string;
  onClick: () => void;
  className?: string;
}

const CustomButton = ({ title, onClick, className }: ButtonType) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-6 py-3 rounded-xl  shadow-lg hover:scale-105 transition text-base cursor-pointer ${className ? className : "bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold"}`}
    >
      {title}
    </button>
  );
};

export default CustomButton;
