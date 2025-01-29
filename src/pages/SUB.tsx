import React from "react";
import { useRouter } from "../contexts/routerContext";
import { Pheader } from "../components/Pheader";
import { Lform } from "../components/Lform";
import { useOverlay } from "../contexts/overLayContext";
import { useMarker } from "../hooks/useMarker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sublinkQueries, topLinkQueries } from "../data/usage";
import Spinner from "../components/Spinner";

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
    queryKey: ["sublinks/", site],
    queryFn: async () => await sublinkQueries.getAll(site, tld?.sublinks || []),
    enabled: !!tld,
  });

  //mutation for adding sublinks
  const addMutation = useMutation({
    mutationFn: async (input: string) => {
      if (tld) return await sublinkQueries.add(tld, input);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sublinks/", site] });
    },
    onError: (error) => {
      alert("Addition failed:\n\n" + error);
    },
  });

  //mutation for removing sublinks
  const removeMutation = useMutation({
    mutationFn: async (input: string) => {
      if (tld) return await sublinkQueries.remove(tld, input);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sublinks/", site] });
    },
  });

  return (
    <div className="flex-grow w-full flex flex-col gap-4 p-2">
      <Pheader
        title={site}
        subtitle="Whitelist urls that you want to track under this site from network tab."
      />
      <Lform
        placeholder="URL Name. eg: www.example.com"
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
                        sublinks?.map((e) => e.url) || [],
                        e.target.checked
                      )
                    }
                    checked={
                      sublinks?.every((e) => markings.has(e.url)) &&
                      sublinks.length > 0
                    }
                    className="w-4 h-4"
                    type="checkbox"
                  />
                </th>
                <th className="p-2 text-left w-5/12">URL</th>
                <th className="p-2 text-left w-2/12">Created</th>
                <th className="p-2 text-center w-2/12">Scripts</th>
                <th className="p-2 text-center w-2/12">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-e_ash">
              {sublinks?.map((e) => (
                <tr key={e.composite} className="h-10">
                  <td className="p-2 text-left w-1/12">
                    <input
                      onChange={(t) => checked(e.url, t.target.checked)}
                      checked={markings.has(e.url)} // Check if the individual item is marked
                      className="w-4 h-4"
                      type="checkbox"
                    />
                  </td>
                  <td className="p-2 text-left w-5/12">{e.url}</td>
                  <td className="p-2 text-left w-2/12">
                    {e.created.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "numeric",
                      year: "2-digit",
                    })}
                  </td>
                  <td className="p-2 text-center w-2/12">{e.scripts.length}</td>
                  <td className="p-2 text-center w-2/12">
                    <button
                      onClick={() => {
                        setOverlay("selection");
                        setSub(e.composite);
                      }}
                      className="w-12 mx-auto flex justify-center items-center rounded-md bg-white text-black"
                    >
                      {"👁️‍🗨️"}
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
