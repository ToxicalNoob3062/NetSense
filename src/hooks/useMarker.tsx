import React from "react";

export function useMarker() {
  const [markings, setMarkings] = React.useState(new Set<string>());
  const checked = (value: string, checked: boolean) => {
    setMarkings((prev) => {
      const newMarkings = new Set(prev);
      if (checked) {
        newMarkings.add(value);
      } else {
        newMarkings.delete(value);
      }
      return newMarkings;
    });
  };
  const mainChecked = (values: string[], checked: boolean) => {
    setMarkings(() => {
      return checked ? new Set(values) : new Set();
    });
  };
  return { markings, checked, mainChecked };
}
