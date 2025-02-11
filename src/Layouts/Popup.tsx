import Header from "../components/Header";
import Footer from "../components/Footer";
import TLD from "../pages/TLD";
import SUB from "../pages/SUB";
import Credentials from "../components/Cred";
import Overlay from "../components/Overlay";
import Endpoints from "../pages/Endpoints";
import Selection from "../components/Selection";
import { useRouter } from "../contexts/routerContext";
import { useOverlay } from "../contexts/overLayContext";
import { settingsQueries } from "../data/usage";
import { useEffect, useState } from "react";

export default function Popup() {
  const { route } = useRouter();
  const { overlay, setOverlay } = useOverlay();
  const [auth, setAuth] = useState(false);
  const [sub, setSub] = useState("");
  const [omChecked, setOmChecked] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchOmSetting = async () => {
      const omSetting = await settingsQueries.get("OM");
      setOmChecked(omSetting.value === "true");
    };

    fetchOmSetting();
  }, []);

  useEffect(() => {
    if (!auth && omChecked === true) {
      setOverlay("login");
    }
  }, [auth, omChecked]);

  // if (omChecked === null) {
  //   return <div>Loading...</div>; // Show a loading state while fetching the setting
  // }

  return (
    <div className="w-full bg-e_black border border-e_ash text-white font-sans min-h-screen p-4 flex flex-col z-10">
      <Header />
      {route === "tld" ? (
        <TLD />
      ) : route === "endpoints" ? (
        <Endpoints />
      ) : (
        <SUB setSub={setSub} />
      )}
      <Footer />
      {overlay && (
        <Overlay lock={overlay === "login"}>
          {overlay === "login" && <Credentials setAuth={setAuth} />}
          {overlay === "selection" && <Selection composite={sub} />}
        </Overlay>
      )}
    </div>
  );
}
