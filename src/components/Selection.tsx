import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endpointQueries, sublinkQueries } from "../data/usage";
import Spinner from "./Spinner";
import useFilter from "../hooks/useFilter";

export default function Selection({ composite }: { composite: string }) {
  const cm = composite.split("_");
  const site = cm[0];
  const url = cm[1];
  const queryClient = useQueryClient();

  //get the sublink only
  const { data: sublink } = useQuery({
    queryKey: [composite],
    queryFn: async () => await sublinkQueries.get(composite),
  });

  //get all scripts
  const { data: endpoints, isLoading } = useQuery({
    queryKey: ["scripts"],
    queryFn: async () => await endpointQueries.getAll(),
  });

  //associate endpoints
  const assoMutate = useMutation({
    mutationFn: async (input: string) => {
      return sublink ? await sublinkQueries.associate(sublink, input) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sublinks/" + site] });
      queryClient.invalidateQueries({ queryKey: ["endpoints/" + site] });
    },
    onError: (error) => {
      alert("Mutation failed:\n\n" + error);
    },
  });

  //disassociate endpoints
  const disassoMutate = useMutation({
    mutationFn: async (input: string) => {
      return sublink ? await sublinkQueries.disassociate(sublink, input) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [composite] });
      queryClient.invalidateQueries({ queryKey: ["endpoints/" + site] });
    },
    onError: (error) => {
      alert("Mutation failed:\n\n" + error);
    },
  });

  //activate logging
  const logMutate = useMutation({
    mutationFn: async (input: boolean) => {
      return sublink
        ? await sublinkQueries.changeLogging(sublink, input)
        : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [composite] });
    },
    onError: (error) => {
      alert("Mutation failed:\n\n" + error);
    },
  });

  //filter endpoints
  const [filteredEndpoints, doFiltration] = useFilter(endpoints || [], "name");

  return (
    <div className="w-[32rem] h-[25rem]  p-2 bg-e_black border-2 border-e_ash rounded-lg flex flex-col justify-center items-center gap-2">
      <h1 className="mx-auto text-xl mb-2">{url}</h1>
      <h4 className="mx-auto text-md mb-2">
        {sublink?.endpoints?.length} endpoints associated
      </h4>
      <div className="flex gap-6">
        <input
          className="p-2 bg-black border border-e_ash rounded-md placeholder:text-gray-400"
          type="text"
          placeholder={"Search for snippets by name..."}
          onKeyDown={(e) => {
            if (e.key === " ") {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            doFiltration(e.target.value);
          }}
        />
        <div className="flex items-center gap-2">
          <label htmlFor="log">Log Requests</label>
          <input
            className="w-4 h-4"
            type="checkbox"
            onChange={(e) => {
              if (e.target.checked) {
                logMutate.mutate(e.target.checked);
              } else {
                logMutate.mutate(e.target.checked);
              }
            }}
            checked={sublink?.logging}
            name=""
            id="log"
          />
        </div>
      </div>
      <h2 className="mx-auto">Scripts</h2>
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="w-full border-2 border-e_ash rounded-md overflow-auto max-h-[22rem] hidebars">
          <table className="table-auto w-full">
            <thead className="bg-gray-950 sticky top-0 z-10">
              <tr className="h-10 border-b-2 border-e_ash">
                <th className="p-2 text-left w-2/12"></th>
                <th className="p-2 text-left w-5/12">File</th>
                <th className="p-2 text-left w-5/12">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-e_ash">
              {filteredEndpoints?.map((e) => (
                <tr key={e.name} className="h-10">
                  <td className="p-2 text-left w-1/12">
                    <input
                      className="w-4 h-4"
                      type="checkbox"
                      checked={sublink?.endpoints?.includes(e.name)}
                      onChange={(i) => {
                        if (i.target.checked) {
                          assoMutate.mutate(e.name);
                        } else {
                          disassoMutate.mutate(e.name);
                        }
                      }}
                    />
                  </td>
                  <td className="p-2 text-left w-5/12">{e.name}</td>
                  <td className="p-2 text-left w-2/12">
                    {e.created.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "numeric",
                      year: "2-digit",
                    })}
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
