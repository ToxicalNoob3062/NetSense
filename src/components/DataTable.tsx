export interface DataWithCreated {
  [key: string]: any;
  created: Date;
}

export type DataTableProps<T extends DataWithCreated> = {
  data: T[];
  markKey: keyof T;
  markObj: {
    markings: Set<string>;
    checked: (value: string, checked: boolean) => void;
    mainChecked: (values: string[], checked: boolean) => void;
  };
  columns: string[];
  buttonHandler: (e: T) => void;
  populateExtraField: (e: T) => string;
};

export default function DataTable<T extends DataWithCreated>({
  data,
  markKey,
  markObj,
  columns,
  buttonHandler,
  populateExtraField,
}: DataTableProps<T>) {
  const { markings, checked, mainChecked } = markObj;
  return (
    <div className="border-2 border-e_ash rounded-md overflow-auto max-h-[22rem] hidebars">
      <table className="table-auto w-full">
        <thead className="bg-gray-950 sticky top-0 z-10">
          <tr className="h-10 border-b-2 border-e_ash">
            <th className="p-2 text-left w-1/12">
              <input
                onChange={(e) =>
                  mainChecked(
                    data?.map((e) => e[markKey] as string) || [],
                    e.target.checked
                  )
                }
                checked={
                  data?.every((e) => markings.has(e[markKey] as string)) &&
                  data.length > 0
                }
                className="w-4 h-4"
                type="checkbox"
              />
            </th>
            {columns.map((column, i) => (
              <th
                key={column}
                className={`p-2 ${i > 1 ? "text-center" : "text-left"} ${
                  i == 0 ? "w-5/12" : "w-2/12"
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-e_ash">
          {data?.map((e) => (
            <tr key={e[markKey] as string} className="h-10">
              <td className="p-2 text-left w-1/12">
                <input
                  onChange={(t) =>
                    checked(e[markKey] as string, t.target.checked)
                  }
                  checked={markings.has(e[markKey] as string)} // Check if the individual item is marked
                  className="w-4 h-4"
                  type="checkbox"
                />
              </td>
              <td className="p-2 text-left w-5/12">{e[markKey] as string}</td>
              <td className="p-2 text-left w-2/12">
                {e.created.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "numeric",
                  year: "2-digit",
                })}
              </td>
              <td className="p-2 text-center w-2/12">
                {populateExtraField(e)}
              </td>
              <td className="p-2 w-2/12">
                <button
                  onClick={() => buttonHandler(e)}
                  className="w-12 font-bold mx-auto flex justify-center items-center rounded-md border-2 border-white"
                >
                  {"✨"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
