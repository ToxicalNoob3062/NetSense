import { useRouter } from "../contexts/routerContext";
import { useOverlay } from "../contexts/overLayContext";
import { useMarker } from "../hooks/useMarker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sublinkQueries, topLinkQueries } from "../data/usage";
import { sendMessageToContentScript } from "../data/ipc";
import { Sublink } from "../data/query";
import Page from "./page";
import useFilter from "../hooks/useFilter";

export default function SUB({ setSub }: { setSub: (sub: string) => void }) {
  const { route: site } = useRouter();
  const { setOverlay } = useOverlay();
  const queryClient = useQueryClient();
  const { markings, checked, mainChecked } = useMarker();

  //query the tld
  const { data: tld } = useQuery({
    queryKey: ["tld/" + site],
    queryFn: async () => await topLinkQueries.get(site),
  });

  //queries for sublinks
  const { data: sublinks, isLoading } = useQuery({
    queryKey: ["sublinks/" + site],
    queryFn: async () => await sublinkQueries.getAll(site, tld?.sublinks || []),
    enabled: !!tld,
  });

  //mutation for adding sublinks
  const addMutation = useMutation({
    mutationFn: async (input: string) => {
      if (tld) return await sublinkQueries.add(tld, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sublinks/" + site] });
      sendMessageToContentScript({
        from: "popup",
        query: "reload",
        params: [site],
      }).catch(() => {});
    },
    onError: (error) => {
      alert("Addition failed:\n\n" + (error as Error).message);
    },
  });

  //mutation for removing sublinks
  const removeMutation = useMutation({
    mutationFn: async (input: string) => {
      if (tld) return await sublinkQueries.remove(tld, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sublinks/" + site] });
    },
  });

  //filter out the sublinks that are not in the whitelist
  const [filteredSublinks, doFiltration] = useFilter(sublinks || [], "url");

  return (
    <Page<Sublink>
      data={filteredSublinks}
      markKey="url"
      markObj={{ markings, checked, mainChecked }}
      columns={["URL", "Created", "Endpoints", "Edit"]}
      buttonHandler={(e) => {
        setOverlay("selection");
        setSub(e.composite);
      }}
      populateExtraField={(e) => e.endpoints.length.toString()}
      isLoading={isLoading}
      title={site}
      subtitle="Whitelist urls or url prefixes that you want to track under this origin."
      placeholder="URL Name. eg: https://www.example.com"
      addMutation={addMutation}
      removeMutation={removeMutation}
      doFiltration={doFiltration}
    />
  );
}
