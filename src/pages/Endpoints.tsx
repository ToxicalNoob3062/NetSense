import { useMarker } from "../hooks/useMarker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endpointQueries } from "../data/usage";
import { useEffect, useState } from "react";
import { Endpoint } from "../data/query";
import useFilter from "../hooks/useFilter";
import Page from "./page";

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
      alert("Addition failed:\n\n" + (error as Error).message);
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
    <Page<Endpoint>
      data={filteredEndpoints}
      markKey="name"
      markObj={{ markings, checked, mainChecked }}
      columns={["Endpoint", "Created", "Status", "Reload"]}
      buttonHandler={(e) => fetchStatus(e.name)}
      populateExtraField={(e) => statuses[e.name] || "Loading..."}
      isLoading={isLoading}
      title="Api Endpoints"
      subtitle="Add a valid post endpoint to receive NetSense data."
      placeholder="Endpoint URL: http://api.example.com"
      addMutation={addMutation}
      removeMutation={removeMutation}
      doFiltration={doFiltration}
    />
  );
}
