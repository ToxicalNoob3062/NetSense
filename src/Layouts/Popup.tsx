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
import Spinner from "../components/Spinner";

export default function Popup() {
  const { route } = useRouter();
  const { overlay, setOverlay } = useOverlay();
  const [auth, setAuth] = useState(false);
  const [sub, setSub] = useState("");
  const [omChecked, setOmChecked] = useState<boolean | null>(null);
  const [isCountPresent, setIsCountPresent] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const tampered = await settingsQueries.db.hasUserModified();
      setIsCountPresent(!tampered);
      if (!tampered) {
        const omSetting = await settingsQueries.get("OM");
        setOmChecked(omSetting.value === "true");
      }
    })();
  }, []);

  useEffect(() => {
    if (!auth && omChecked === true) {
      setOverlay("login");
    }
  }, [auth, omChecked]);

  if (isCountPresent == null) {
    return (
      <div className="bg-black min-h-screen flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  if (!isCountPresent) {
    return (
      <div className="bg-black min-h-screen text-white text-center flex items-center">
        Data has been tampered with. You are guilty. Please contact with your
        owner immediately for resolving current issue. Netsense has already
        mailed this scenario to the owner with resolving solutions.
      </div>
    );
  }

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
