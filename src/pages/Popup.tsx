import { useEffect } from "react";

export default function () {
  useEffect(() => {
    console.log("Hello from the popup!");
  }, []);

  return (
    <div className="bg-red-500 min-w-96 min-h-96 p-8">
      <img src="/icon/32.png" />
      <h1>vite-plugin-web-extension</h1>
      <p>
        Template: <code>react-ts j</code>
      </p>
    </div>
  );
}
