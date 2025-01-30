import { Pheader } from "../components/Pheader";
import { Lform } from "../components/Lform";
import { useOverlay } from "../contexts/overLayContext";
import { useMarker } from "../hooks/useMarker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { scriptQueries } from "../data/usage";
import Spinner from "../components/Spinner";
import useFilter from "../hooks/useFilter";

export default function Scripts({
  setScript,
}: {
  setScript: (s: string) => void;
}) {
  const { setOverlay } = useOverlay();
  const { markings, checked, mainChecked } = useMarker();
  const queryClient = useQueryClient();

  //queries for scripts
  const { data: scripts, isLoading } = useQuery({
    queryKey: ["scripts"],
    queryFn: async () => await scriptQueries.getAll(),
  });

  //add script mutation
  const addMutation = useMutation({
    mutationFn: async (input: string) => await scriptQueries.add(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
    onError: (error) => {
      alert("Addition failed:\n\n" + error);
    },
  });

  //remove script mutation
  const removeMutation = useMutation({
    mutationFn: async (input: string) => await scriptQueries.remove(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });

  //filteration
  const [filteredScripts, doFiltration] = useFilter(scripts || [], "name");

  return (
    <div className="flex-grow w-full flex flex-col gap-4 p-2">
      <Pheader
        title="Javascript Files"
        subtitle="Make small js snippets to react on certain network events."
      />
      <Lform
        placeholder="File Name. eg: script.js"
        showRemoveButton={markings.size > 0}
        onAdd={(input) => {
          addMutation.mutate(input);
        }}
        onRemove={() => {
          markings.forEach((value) => {
            removeMutation.mutate(value);
            checked(value, false);
          });
        }}
        onInputChange={(input: string) => {
          doFiltration(input);
        }}
      />
      {/* Constrain table height */}
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="border-2 border-e_ash rounded-md overflow-auto max-h-[22rem] hidebars">
          <table className="table-auto w-full">
            <thead className="bg-gray-950 sticky top-0 z-10">
              <tr className="h-10 border-b-2 border-e_ash">
                <th className="p-2 text-left w-1/12">
                  <input
                    onChange={(e) =>
                      mainChecked(
                        filteredScripts?.map((e) => e.name) || [],
                        e.target.checked
                      )
                    }
                    checked={
                      filteredScripts?.every((item) =>
                        markings.has(item.name)
                      ) && filteredScripts.length > 0
                    }
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
              {filteredScripts?.map((e) => (
                <tr key={e.name} className="h-10">
                  <td className="p-2 text-left w-1/12">
                    <input
                      onChange={(t) => checked(e.name, t.target.checked)}
                      checked={markings.has(e.name)} // Check if the individual item is marked
                      className="w-4 h-4"
                      type="checkbox"
                    />
                  </td>
                  <td className="p-2 text-left w-5/12">{e.name}.js</td>
                  <td className="p-2 text-left w-2/12">
                    {e.created.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "numeric",
                      year: "2-digit",
                    })}
                  </td>
                  <td className="p-2 text-center w-2/12">
                    {e.content.length / 1000} kb
                  </td>
                  <td className="p-2 text-center w-2/12">
                    <button
                      onClick={() => {
                        setOverlay("editor");
                        setScript(e.name);
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
      )}
    </div>
  );
}
