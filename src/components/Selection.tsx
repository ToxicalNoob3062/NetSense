import React from "react";

export default function Selection({ url }: { url: string }) {
  const files = ["com", "org", "net", "gov", "edu"];
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
      return checked ? new Set(files) : new Set();
    });
  };
  return (
    <div className="w-[32rem] h-[25rem]  p-4 bg-e_black border-2 border-e_ash rounded-lg flex flex-col justify-center items-center gap-4">
      <h1 className="mx-auto text-xl mb-4">{url + " " + "(7" + "scripts)"}</h1>
      <div className="flex gap-6">
        <input
          className="p-2 bg-black border border-e_ash rounded-md placeholder:text-gray-400"
          type="text"
          placeholder={"Search for snippets by name..."}
        />
        <div className="flex items-center gap-2">
          <label htmlFor="log">Log Requests</label>
          <input className="w-4 h-4" type="checkbox" name="" id="log" />
        </div>
      </div>
      <h2 className="mx-auto">Scripts</h2>
      <div className="w-full border-2 border-e_ash rounded-md overflow-auto max-h-[22rem] hidebars">
        <table className="table-auto w-full">
          <thead className="bg-gray-950 sticky top-0 z-10">
            <tr className="h-10 border-b-2 border-e_ash">
              <th className="p-2 text-left w-2/12">
                <input
                  onChange={(e) => handleMainCheckboxChange(e.target.checked)}
                  checked={files.every((item) => markings.has(item))} // If all items are marked, check this
                  className="w-4 h-4"
                  type="checkbox"
                />
              </th>
              <th className="p-2 text-left w-5/12">File</th>
              <th className="p-2 text-left w-5/12">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-e_ash">
            {files.map((e) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
