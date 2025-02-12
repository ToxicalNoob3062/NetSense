import React, { useEffect } from "react";
import { useRouter } from "../contexts/routerContext";
import { sendMessageToContentScript } from "../data/ipc";
import { settingsQueries } from "../data/usage";

export default function Header() {
  const { route, setRoute } = useRouter();
  const [checked, setChecked] = React.useState(false);
  const [omChecked, setOmChecked] = React.useState(false);

  useEffect(() => {
    //get the value of logging from the content script
    sendMessageToContentScript({
      from: "popup",
      query: "logging:get",
    })
      .then((response) => {
        setChecked(response as boolean);
      })
      .catch(() => {});

    //for OM mode get the value from the indexedDB
    (async () => {
      const omSetting = await settingsQueries.get("OM");
      setOmChecked(omSetting.value === "true");
    })();
  }, []);

  // handle the logging checkbox change
  const handleOmChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked ? "true" : "false";
    setOmChecked(e.target.checked);
    await settingsQueries.set("OM", newValue);
  };

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
      <div className="flex gap-2 items-center">
        {route === "tld" && (
          <>
            <div className="flex justify-center items-center">
              <input
                onChange={(e) => {
                  sendMessageToContentScript({
                    from: "popup",
                    query: "logging:set",
                    params: [e.target.checked],
                  }).catch(() => {});
                  setChecked(e.target.checked);
                }}
                checked={checked}
                type="checkbox"
                className="w-4 h-4"
              />
              <span className="ml-2">GL</span>
            </div>
            <div className="flex justify-center items-center">
              <input
                onChange={handleOmChange}
                checked={omChecked}
                type="checkbox"
                className="w-4 h-4"
              />
              <span className="ml-2">OM</span>
            </div>
          </>
        )}
        {route !== "endpoints" && (
          <button
            onClick={() => {
              setRoute("endpoints");
            }}
            className="bg-white text-black w-20 h-10 flex justify-center items-center rounded-md text-md"
          >
            EPoints
          </button>
        )}
      </div>
    </header>
  );
}
