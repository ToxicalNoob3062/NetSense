import { Pheader } from "../components/Pheader";
import { Lform } from "../components/Lform";
import Spinner from "../components/Spinner";
import DataTable, {
  DataTableProps,
  DataWithCreated,
} from "../components/DataTable";
import { UseMutationResult } from "@tanstack/react-query";

export type PageProps<T extends DataWithCreated> = DataTableProps<T> & {
  // Add any additional properties for PageProps here
  title: string;
  subtitle: string;
  isLoading: boolean;
  placeholder: string;
  addMutation: UseMutationResult<any, Error, string, unknown>;
  removeMutation: UseMutationResult<any, Error, string, unknown>;
  doFiltration: (keyword: string) => void;
};

export default function Page<T extends DataWithCreated>({
  data,
  markKey,
  markObj,
  columns,
  buttonHandler,
  populateExtraField,
  isLoading,
  title,
  subtitle,
  placeholder,
  addMutation,
  removeMutation,
  doFiltration,
}: PageProps<T>) {
  const { markings, checked, mainChecked } = markObj;
  return (
    <div className="flex-grow w-full flex flex-col gap-4 p-2">
      <Pheader title={title} subtitle={subtitle} />
      {/* //add a check box for global logging */}
      <Lform
        placeholder={placeholder}
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
        <DataTable
          data={data}
          markKey={markKey}
          columns={columns}
          markObj={{ markings, checked, mainChecked }}
          buttonHandler={buttonHandler}
          populateExtraField={populateExtraField}
        />
      )}
    </div>
  );
}
