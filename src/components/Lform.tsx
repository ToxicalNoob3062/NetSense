import React from "react";

interface FormProps {
  placeholder: string;
  showRemoveButton?: boolean;
  onAdd: (e: string) => void;
  onRemove: () => void;
}

export const Lform: React.FC<FormProps> = ({
  placeholder,
  showRemoveButton,
  onAdd,
  onRemove,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <form className="flex w-full gap-6 h-8">
      <input
        ref={inputRef}
        className="w-96 p-4 bg-black border border-e_ash rounded-md placeholder:text-gray-400"
        type="text"
        placeholder={placeholder}
      />
      <button
        type="button"
        className="bg-white text-black w-20 flex justify-center items-center rounded-md text-md"
        onClick={() => {
          onAdd(inputRef.current?.value.trim() || "");
          inputRef.current!.value = "";
        }}
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
};
