import React from "react";

interface FormProps {
  placeholder: string;
  showRemoveButton?: boolean;
  onAdd: () => void;
  onRemove?: () => void;
}

export const Lform: React.FC<FormProps> = ({
  placeholder,
  showRemoveButton,
  onAdd,
  onRemove,
}) => (
  <form className="flex w-full gap-6 h-8">
    <input
      className="w-96 p-4 bg-black border border-e_ash rounded-md placeholder:text-gray-400"
      type="text"
      placeholder={placeholder}
    />
    <button
      type="button"
      className="bg-white text-black w-20 flex justify-center items-center rounded-md text-md"
      onClick={onAdd}
    >
      Add
    </button>
    {showRemoveButton && (
      <button
        type="button"
        className="bg-white text-black w-20 flex justify-center items-center rounded-md text-md"
        onClick={onRemove}
      >
        Remove
      </button>
    )}
  </form>
);
