import { useEffect, useRef } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import App from "../App";

export function IndexRoute() {
  const navigate = useNavigate({ from: "/" });
  const { selectedDate, selectedStartDate, selectedEndDate } = useSearch({
    from: "/",
    select: (s) => ({
      selectedDate: s.selectedDate,
      selectedStartDate: s.selectedStartDate,
      selectedEndDate: s.selectedEndDate,
    }),
  });
  const hasClearedInitialDateSearchRef = useRef(false);

  useEffect(() => {
    if (hasClearedInitialDateSearchRef.current) return;
    hasClearedInitialDateSearchRef.current = true;
    if (!selectedDate && !selectedStartDate && !selectedEndDate) return;

    void navigate({
      search: (prev) => ({
        ...prev,
        selectedDate: undefined,
        selectedStartDate: undefined,
        selectedEndDate: undefined,
      }),
      replace: true,
    });
  }, [navigate, selectedDate, selectedStartDate, selectedEndDate]);

  return <App />;
}
