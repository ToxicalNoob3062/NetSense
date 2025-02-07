import { useState, useEffect } from "react";
import { useOverlay } from "../contexts/overLayContext";
import { settingsQueries } from "../data/usage";

export default function Credentials({
  setAuth,
}: {
  setAuth: (auth: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailPresent, setIsEmailPresent] = useState(false);
  const { setOverlay } = useOverlay();

  useEffect(() => {
    const checkEmail = async () => {
      const emailSetting = await settingsQueries.get("email");
      setIsEmailPresent(!!emailSetting);
    };

    checkEmail();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    //set the email and password in settings if you didn't find them
    const emailSetting = await settingsQueries.get("email");
    if (!emailSetting) {
      await settingsQueries.set("email", email);
      await settingsQueries.set("password", password);
      setAuth(true);
      setOverlay(null);
    } else {
      if (emailSetting.value !== email) {
        alert("Invalid email");
      } else {
        const passSetting = await settingsQueries.get("password");
        if (passSetting.value !== password) {
          alert("Invalid password");
        } else {
          setAuth(true);
          setOverlay(null);
        }
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-64 h-64 p-8 bg-e_black border-2 border-e_ash rounded-lg flex flex-col justify-evenly items-center"
    >
      <input
        className="w-40 p-2 text-md bg-black border border-e_ash rounded-md"
        type="email"
        name="email"
        id="email"
        value={email}
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-40 p-2 text-md bg-black border border-e_ash rounded-md"
        type="password"
        name="pass"
        id="pass"
        value={password}
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        type="submit"
        className="w-20 h-10 mx-auto flex justify-center items-center rounded-md bg-white text-black"
      >
        {isEmailPresent ? "Verify" : "Create"}
      </button>
    </form>
  );
}
