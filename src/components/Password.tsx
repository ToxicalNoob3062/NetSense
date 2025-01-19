import React from "react";

export default function Password() {
  return (
    <form className="w-52 h-52 p-8 bg-e_black border-2 border-e_ash rounded-lg flex flex-col justify-center items-center gap-4">
      <label className="text-lg font-semibold tracking-wide" htmlFor="pass">
        Password
      </label>
      <input
        className="w-40 p-2 text-md bg-black border border-e_ash rounded-md"
        type="password"
        name="pass"
        id="pass"
      />
      <button
        onClick={(e) => {
          e.preventDefault();
        }}
        className="w-20 h-10 mx-auto flex justify-center items-center rounded-md bg-white text-black"
      >
        Verify
      </button>
    </form>
  );
}
