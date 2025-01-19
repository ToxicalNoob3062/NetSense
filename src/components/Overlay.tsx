import React from "react";
import { useOverlay } from "../contexts/overLayContext";

export default function Overlay({
  children,
  lock,
}: {
  children: React.ReactNode;
  lock?: boolean;
}) {
  const { setOverlay } = useOverlay();
  return (
    <div className="w-full h-full bg-black bg-opacity-90 fixed top-0 left-0 flex justify-center items-center z-20">
      {children}
      {!lock && (
        <button
          onClick={() => setOverlay(null)}
          className="w-8 h-8 bg-white text-black text-lg font-bold rounded-full flex justify-center items-center absolute top-6 right-6"
        >
          x
        </button>
      )}
    </div>
  );
}
