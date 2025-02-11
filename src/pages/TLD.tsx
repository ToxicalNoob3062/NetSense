import useFilter from "../hooks/useFilter";
import Page from "./page";
import { useRouter } from "../contexts/routerContext";
import { useMarker } from "../hooks/useMarker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { topLinkQueries } from "../data/usage";
import { sendMessageToContentScript } from "../data/ipc";
import { TopLink } from "../data/query";

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
      }).catch(() => {});
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
    <Page<TopLink>
      data={filteredTlds}
      markKey="website"
      markObj={{ markings, checked, mainChecked }}
      columns={["Website", "Created", "Sublinks", "Explore"]}
      buttonHandler={(e) => setRoute(e.website)}
      populateExtraField={(e) => e.sublinks.length.toString()}
      isLoading={isLoading}
      title="Top Level Domains"
      subtitle="Whitelist origins (base) you want netsense to proctor."
      placeholder="Origin Name Only. eg: www.google.com"
      addMutation={addMutation}
      removeMutation={removeMutation}
      doFiltration={doFiltration}
    />
  );
}
