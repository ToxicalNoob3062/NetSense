import React from "react";
import { useRouter } from "../contexts/routerContext";

export default function Header() {
  const { route, setRoute } = useRouter();
  return (
    <header className="flex justify-between items-center gap-4 pb-2">
      <button
        onClick={() => {
          setRoute("tld");
        }}
        className={`w-6 h-6 rounded-full flex justify-center items-center text-md text-black bg-white ${
          route == "tld" ? "opacity-0" : ""
        }`}
      >
        {"<"}
      </button>
      <div className="flex gap-2 items-center">
        <img src="/icon/32.png" />
        <h1 className="text-2xl tracking-wide font-medium">NetSense</h1>
      </div>
      <button className="bg-white text-black w-20 h-10 flex justify-center items-center rounded-md text-md">
        Scripts
      </button>
    </header>
  );
}
