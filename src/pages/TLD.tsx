import { useRouter } from "../contexts/routerContext";
import { Pheader } from "../components/Pheader";
import { Lform } from "../components/Lform";
import { useMarker } from "../hooks/useMarker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { topLinkQueries } from "../data/usage";
import Spinner from "../components/Spinner";
import useFilter from "../hooks/useFilter";
import { sendMessageToContentScript } from "../data/ipc";

export default function TLD() {
  const { setRoute } = useRouter();
  const { markings, checked, mainChecked } = useMarker();
  const queryClient = useQueryClient();

  //queries for tlds
  const { data: tlds, isLoading } = useQuery({
    queryKey: ["tlds"],
    queryFn: async () => await topLinkQueries.getAll(),
  });

  const addMutation = useMutation({
    mutationFn: async (input: string) => await topLinkQueries.add(input),
    onSuccess: async (_, value) => {
      queryClient.invalidateQueries({ queryKey: ["tlds"] });
      sendMessageToContentScript({
        from: "popup",
        query: "reload",
        params: [value],
      });
    },
    onError: (error) => {
      alert("Addition failed:\n\n" + (error as Error).message);
    },
  });
  const removeMutation = useMutation({
    mutationFn: async (input: string) => await topLinkQueries.remove(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tlds"] });
    },
  });

  // Filtered tlds based on keyword
  const [filteredTlds, doFiltration] = useFilter(tlds || [], "website");

  return (
    <div className="flex-grow w-full flex flex-col gap-4 p-2">
      <Pheader
        title="Top Level Domains"
        subtitle="Whitelist origins (base) you want netsense to proctor."
      />
      {/* //add a check box for global logging */}
      <Lform
        placeholder="Origin Name Only. eg: www.google.com"
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
                        filteredTlds?.map((e) => e.website) || [],
                        e.target.checked
                      )
                    }
                    checked={
                      filteredTlds?.every((item) =>
                        markings.has(item.website)
                      ) && filteredTlds.length > 0
                    } // If all items are marked, check this
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
              {filteredTlds?.map((e) => (
                <tr key={e.website} className="h-10">
                  <td className="p-2 text-left w-1/12">
                    <input
                      onChange={(t) => checked(e.website, t.target.checked)}
                      checked={markings.has(e.website)} // Check if the individual item is marked
                      className="w-4 h-4"
                      type="checkbox"
                    />
                  </td>
                  <td className="p-2 text-left w-5/12">{e.website}</td>
                  <td className="p-2 text-left w-2/12">
                    {e.created.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "numeric",
                      year: "2-digit",
                    })}
                  </td>
                  <td className="p-2 text-center w-2/12">
                    {e.sublinks.length}
                  </td>
                  <td className="p-2 text-center w-2/12">
                    <button
                      onClick={() => {
                        setRoute(e.website);
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
      )}
    </div>
  );
}
