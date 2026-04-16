import React from "react";

interface ButtonType {
  title: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disable?: boolean;
}

const CustomButton = ({
  title,
  onClick,
  className,
  type,
  disable = false,
}: ButtonType) => {
  return (
    <button
      type={type ? type : "button"}
      onClick={onClick}
      disabled={disable}
      className={`rounded-xl px-6 py-3 text-base transition ${
        disable
          ? "cursor-default opacity-40"
          : "cursor-pointer shadow-lg hover:scale-105"
      } ${className ? className : "bg-linear-to-r from-orange-400 to-orange-600 font-semibold text-white"}`}
    >
      {title}
    </button>
  );
};

export default CustomButton;
