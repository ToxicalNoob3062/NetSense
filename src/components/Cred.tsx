import { useRef, useState, useEffect } from "react";
import { useOverlay } from "../contexts/overLayContext";
import { settingsQueries } from "../data/usage";

const hashData = async (data: string) => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
};

export default function Credentials({
  setAuth,
}: {
  setAuth: (auth: boolean) => void;
}) {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [isEmailPresent, setIsEmailPresent] = useState(false);
  const { setOverlay } = useOverlay();

  useEffect(() => {
    (async () => {
      const emailSetting = await settingsQueries.db.getUserEmail();
      setIsEmailPresent(!!emailSetting);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailRef.current?.value || "";
    const password = passwordRef.current?.value || "";
    const savedEmail = await settingsQueries.db.getUserEmail();

    // Set the email and password in settings if you didn't find them
    if (!savedEmail) {
      // Hash the email and password
      const hashedPassword = await hashData(password);
      await settingsQueries.db.populateUserEmail(email);
      await settingsQueries.set("password", hashedPassword);
      setAuth(true);
      setOverlay(null);
    } else {
      if (email !== savedEmail) {
        alert("Invalid email");
      } else {
        const passSetting = await settingsQueries.get("password");
        const hashedPassword = await hashData(password);
        if (hashedPassword !== passSetting.value) {
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
        ref={emailRef}
        className="w-40 p-2 text-md bg-black border border-e_ash rounded-md"
        type="email"
        name="email"
        id="email"
        placeholder="Email"
      />
      <input
        ref={passwordRef}
        className="w-40 p-2 text-md bg-black border border-e_ash rounded-md"
        type="password"
        name="pass"
        id="pass"
        placeholder="Password"
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
