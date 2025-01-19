import React from "react";
import { useRouter } from "../contexts/routerContext";
import { Pheader } from "../components/Pheader";
import { Lform } from "../components/Lform";

export default function TLD() {
  const { setRoute } = useRouter();
  const tld = ["com", "org", "net", "gov", "edu"];
  const [markings, setMarkings] = React.useState(new Set<string>()); // Use React state

  const handleCheckboxChange = (value: string, checked: boolean) => {
    setMarkings((prev) => {
      const newMarkings = new Set(prev);
      if (checked) {
        newMarkings.add(value);
      } else {
        newMarkings.delete(value);
      }
      return newMarkings;
    });
  };

  const handleMainCheckboxChange = (checked: boolean) => {
    setMarkings(() => {
      return checked ? new Set(tld) : new Set();
    });
  };

  return (
    <div className="flex-grow w-full flex flex-col gap-4 p-2">
      <Pheader
        title="Top Level Domains"
        subtitle="Whitelist sites you want netsense to proctor."
      />
      <Lform
        placeholder="Website Name. eg: www.google.com"
        showRemoveButton={markings.size > 0}
        onAdd={() => {}}
        onRemove={() => setMarkings(new Set())}
      />
      {/* Constrain table height */}
      <div className="border-2 border-e_ash rounded-md overflow-auto max-h-[22rem] hidebars">
        <table className="table-auto w-full">
          <thead className="bg-gray-950 sticky top-0 z-10">
            <tr className="h-10 border-b-2 border-e_ash">
              <th className="p-2 text-left w-1/12">
                <input
                  onChange={(e) => handleMainCheckboxChange(e.target.checked)}
                  checked={tld.every((item) => markings.has(item))} // If all items are marked, check this
                  className="w-4 h-4"
                  type="checkbox"
                />
              </th>
              <th className="p-2 text-left w-5/12">Website</th>
              <th className="p-2 text-left w-2/12">Created</th>
              <th className="p-2 text-center w-2/12">SubLinks</th>
              <th className="p-2 text-center w-2/12">Explore</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-e_ash">
            {tld.map((e) => (
              <tr key={e} className="h-10">
                <td className="p-2 text-left w-1/12">
                  <input
                    onChange={(t) => handleCheckboxChange(e, t.target.checked)}
                    checked={markings.has(e)} // Check if the individual item is marked
                    className="w-4 h-4"
                    type="checkbox"
                  />
                </td>
                <td className="p-2 text-left w-5/12">{e}</td>
                <td className="p-2 text-left w-2/12">2025-01-01</td>
                <td className="p-2 text-center w-2/12">5</td>
                <td className="p-2 text-center w-2/12">
                  <button
                    onClick={() => {
                      setRoute(e);
                    }}
                    className="w-12 font-bold mx-auto flex justify-center items-center rounded-md bg-white text-black"
                  >
                    {"🎉"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
