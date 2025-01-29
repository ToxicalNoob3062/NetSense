import { useState, useEffect } from "react";
import AceEditor from "react-ace";
import ace from "ace-builds/src-noconflict/ace";

// Import desired modes and themes
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { scriptQueries } from "../data/usage";
import Spinner from "./Spinner";

// Set the base path for Ace assets
ace.config.set("basePath", "/node_modules/ace-builds/src-noconflict/");

export default function Editor({ file }: { file: string }) {
  const defaultContent = `console.log('hello')`;
  const [content, setContent] = useState(defaultContent);
  const queryClient = useQueryClient();

  // Get content
  const { data: script, isLoading } = useQuery({
    queryKey: ["script" + file],
    queryFn: async () => await scriptQueries.get(file),
  });

  // Update content when script data changes
  useEffect(() => {
    if (script?.content) {
      setContent(script.content);
    }
  }, [script]);

  // Mutable content
  const updateMutation = useMutation({
    mutationFn: async () => await scriptQueries.update(file, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["script" + file] });
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
      alert("Saved!");
    },
  });

  return (
    <div className="w-[32rem] h-[25rem] p-4 bg-e_black border-2 border-e_ash rounded-lg flex flex-col gap-4">
      <div className="h-10 flex justify-between">
        <h2 className="text-lg font-semibold">{file}.js</h2>
        <button
          type="button"
          onClick={() => {
            updateMutation.mutate();
          }}
          className="bg-white text-black w-20 h-8 flex justify-center items-center rounded-md text-md"
        >
          Save
        </button>
      </div>
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="flex-grow border border-e_ash rounded-md">
          <AceEditor
            mode="javascript"
            theme="monokai"
            name="editor"
            value={content}
            onChange={(newValue) => setContent(newValue)}
            fontSize={14}
            width="100%"
            height="100%"
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: true,
              showLineNumbers: true,
              tabSize: 2,
            }}
          />
        </div>
      )}
    </div>
  );
}
