import { useState } from "react";
import AceEditor from "react-ace";
import ace from "ace-builds/src-noconflict/ace";

// Import desired modes and themes
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";

// Set the base path for Ace assets
ace.config.set("basePath", "/node_modules/ace-builds/src-noconflict/");

export default function Editor({ file }: { file: string }) {
  const [content, setContent] = useState("console.log('hello')"); // Set the initial content

  return (
    <div className="w-[32rem] h-[25rem] p-4 bg-e_black border-2 border-e_ash rounded-lg flex flex-col gap-4">
      <div className="h-10 flex justify-between">
        <input
          className="w-96 p-4 bg-black border border-e_ash rounded-md placeholder:text-gray-400"
          type="text"
          defaultValue={file}
        />
        <button
          type="button"
          onClick={() => {
            console.log("Saved Code:", content);
            // Perform additional save actions if necessary
          }}
          className="bg-white text-black w-20 h-8 flex justify-center items-center rounded-md text-md"
        >
          Save
        </button>
      </div>
      <div className="flex-grow border border-e_ash rounded-md">
        <AceEditor
          mode="javascript"
          theme="monokai"
          name="UNIQUE_ID_OF_DIV"
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
    </div>
  );
}
