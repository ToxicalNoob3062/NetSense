import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TLD from "../pages/TLD";
import SUB from "../pages/SUB";
import Password from "../components/Password";
import Overlay from "../components/Overlay";
import Script from "../pages/Scripts";
import Selection from "../components/Selection";
import Editor from "../components/Editor";
import { useRouter } from "../contexts/routerContext";
import { useOverlay } from "../contexts/overLayContext";

export default function () {
  let [auth, setAuth] = useState(false);
  const { route } = useRouter();
  const { overlay, setOverlay } = useOverlay();
  let [sub, setSub] = useState("");
  let [script, setScript] = useState("");
  useEffect(() => {
    if (!auth) {
      setOverlay("login");
    }
  }, []);
  return (
    <div className="w-full bg-e_black border border-e_ash text-white font-sans min-h-screen p-4 flex flex-col z-10">
      <Header />
      {route === "tld" ? (
        <TLD />
      ) : route === "scripts" ? (
        <Script setScript={setScript} />
      ) : (
        <SUB setSub={setSub} />
      )}
      <Footer />
      {overlay && (
        <Overlay>
          {overlay === "login" && <Password />}
          {overlay === "selection" && <Selection url={sub} />}
          {overlay === "editor" && <Editor file={script} />}
        </Overlay>
      )}
    </div>
  );
}
