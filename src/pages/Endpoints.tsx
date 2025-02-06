import { Pheader } from "../components/Pheader";
import { Lform } from "../components/Lform";
import { useMarker } from "../hooks/useMarker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endpointQueries } from "../data/usage";
import Spinner from "../components/Spinner";
import useFilter from "../hooks/useFilter";
import { useEffect, useState } from "react";

export default function Endpoints() {
  const { markings, checked, mainChecked } = useMarker();
  const queryClient = useQueryClient();

  // State to store the status of each endpoint
  const [statuses, setStatuses] = useState<{ [key: string]: string }>({});

  //queries for endpoints
  const { data: endpoints, isLoading } = useQuery({
    queryKey: ["endpoints"],
    queryFn: async () => await endpointQueries.getAll(),
  });

  //add endpoint mutation
  const addMutation = useMutation({
    mutationFn: async (input: string) => await endpointQueries.add(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["endpoints"] });
    },
    onError: (error) => {
      alert("Addition failed:\n\n" + error);
    },
  });

  //remove endpoint mutation
  const removeMutation = useMutation({
    mutationFn: async (input: string) => await endpointQueries.remove(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["endpoints"] });
    },
  });

  //filteration
  const [filteredEndpoints, doFiltration] = useFilter(endpoints || [], "name");

  // Fetch the status of each endpoint
  const fetchStatus = async (endpointName: string) => {
    try {
      const response = await fetch(endpointName, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: "http://dummy.netsense.com",
          method: "GET",
          reqHeaders: {
            "Content-Type": "application/json",
          },
          reqBody: {},
          resHeaders: {
            "Content-Type": "application/json",
          },
          resBody: {
            text: "Testing your endpoint@ netsense",
          },
        }),
      });
      setStatuses((prevStatuses) => ({
        ...prevStatuses,
        [endpointName]: response.ok ? "OK" : `Error: ${response.status}`,
      }));
    } catch (error) {
      setStatuses((prevStatuses) => ({
        ...prevStatuses,
        [endpointName]: `Error`,
      }));
    }
  };

  useEffect(() => {
    if (filteredEndpoints) {
      filteredEndpoints.forEach((endpoint) => {
        fetchStatus(endpoint.name);
      });
    }
  }, [filteredEndpoints]);

  return (
    <div className="flex-grow w-full flex flex-col gap-4 p-2">
      <Pheader
        title="Api Endpoints"
        subtitle="Add a valid post endpoint to receive NetSense data."
      />
      <Lform
        placeholder="Endpoint URL: http://api.example.com"
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
                        filteredEndpoints?.map((e) => e.name) || [],
                        e.target.checked
                      )
                    }
                    checked={
                      filteredEndpoints?.every((item) =>
                        markings.has(item.name)
                      ) && filteredEndpoints.length > 0
                    }
                    className="w-4 h-4"
                    type="checkbox"
                  />
                </th>
                <th className="p-2 text-left w-5/12">URL</th>
                <th className="p-2 text-left w-2/12">Created</th>
                <th className="p-2 text-center w-2/12">Status</th>
                <th className="p-2 text-center w-2/12">Reload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-e_ash">
              {filteredEndpoints?.map((e) => (
                <tr key={e.name} className="h-10">
                  <td className="p-2 text-left w-1/12">
                    <input
                      onChange={(t) => checked(e.name, t.target.checked)}
                      checked={markings.has(e.name)} // Check if the individual item is marked
                      className="w-4 h-4"
                      type="checkbox"
                    />
                  </td>
                  <td className="p-2 text-left w-5/12">{e.name}</td>
                  <td className="p-2 text-left w-2/12">
                    {new Date(e.created).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "numeric",
                      year: "2-digit",
                    })}
                  </td>
                  <td className="p-2 text-center w-2/12">
                    {statuses[e.name] || "Loading..."}
                  </td>
                  <td className="p-2 text-center w-2/12">
                    <button
                      onClick={() => fetchStatus(e.name)}
                      className="w-12 mx-auto flex justify-center items-center rounded-md bg-white text-black"
                    >
                      {"🔄"}
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
