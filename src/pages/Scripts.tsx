import React from "react";
import { useRouter } from "../contexts/routerContext";
import { Pheader } from "../components/Pheader";
import { Lform } from "../components/Lform";
import { useOverlay } from "../contexts/overLayContext";
import { set } from "mongoose";

export default function Scripts({
  setScript,
}: {
  setScript: (s: string) => void;
}) {
  const { setOverlay } = useOverlay();
  const scripts = ["com", "org", "net", "gov", "edu"];
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
      return checked ? new Set(scripts) : new Set();
    });
  };

  return (
    <div className="flex-grow w-full flex flex-col gap-4 p-2">
      <Pheader
        title="Javascript Files"
        subtitle="Make small js snippets to react on certain network events."
      />
      <Lform
        placeholder="File Name. eg: script.js"
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
                  checked={scripts.every((item) => markings.has(item))} // If all items are marked, check this
                  className="w-4 h-4"
                  type="checkbox"
                />
              </th>
              <th className="p-2 text-left w-5/12">File</th>
              <th className="p-2 text-left w-2/12">Created</th>
              <th className="p-2 text-center w-2/12">Size</th>
              <th className="p-2 text-center w-2/12">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-e_ash">
            {scripts.map((e) => (
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
                <td className="p-2 text-center w-2/12">5kb</td>
                <td className="p-2 text-center w-2/12">
                  <button
                    onClick={() => {
                      setOverlay("editor");
                      setScript(e);
                    }}
                    className="w-12 mx-auto flex justify-center items-center rounded-md bg-white text-black"
                  >
                    {"🧠"}
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
