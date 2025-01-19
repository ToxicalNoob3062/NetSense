import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TLD from "../pages/TLD";
import SUB from "../pages/SUB";
import { useRouter } from "../contexts/routerContext";

export default function () {
  let [auth, setAuth] = useState(false);
  const { route, setRoute } = useRouter();
  useEffect(() => {
    console.log("Hello from the popup!");
  }, []);
  return (
    <div className="w-full bg-e_black border border-e_ash text-white font-sans min-h-screen p-4 flex flex-col">
      <Header />
      {route === "tld" ? <TLD /> : <SUB />}
      <Footer />
    </div>
  );
}
