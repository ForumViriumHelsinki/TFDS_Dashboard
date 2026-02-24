import { useEffect, useRef } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import App from "../App";
import { getDefaultDateRange } from "../utils/time";

export function IndexRoute() {
  const navigate = useNavigate({ from: "/" });
  const {
    selectedDate,
    selectedStartDate,
    selectedEndDate,
    selectedDateMode,
  } = useSearch({
    from: "/",
    select: (s) => ({
      selectedDate: s.selectedDate,
      selectedStartDate: s.selectedStartDate,
      selectedEndDate: s.selectedEndDate,
      selectedDateMode: s.selectedDateMode,
    }),
  });
  const hasInitializedDateSearchRef = useRef(false);

  useEffect(() => {
    if (hasInitializedDateSearchRef.current) return;
    hasInitializedDateSearchRef.current = true;
    const { start, end } = getDefaultDateRange();

    void navigate({
      search: (prev) => ({
        ...prev,
        selectedDate: end,
        selectedStartDate: start,
        selectedEndDate: end,
        selectedDateMode: "live",
      }),
      replace: true,
    });
  }, [
    navigate,
    selectedDate,
    selectedStartDate,
    selectedEndDate,
    selectedDateMode,
  ]);

  useEffect(() => {
    if (selectedDateMode !== "live") return undefined;

    const tick = () => {
      const { start, end } = getDefaultDateRange();
      void navigate({
        search: (prev) => {
          const current = prev as {
            selectedDate?: Date;
            selectedStartDate?: Date;
            selectedEndDate?: Date;
            selectedDateMode?: "live" | "manual";
          };
          if (current.selectedDateMode !== "live") return current;
          const same =
            current.selectedDate?.getTime() === end.getTime() &&
            current.selectedEndDate?.getTime() === end.getTime() &&
            current.selectedStartDate?.getTime() === start.getTime();
          if (same) return current;
          return {
            ...current,
            selectedDate: end,
            selectedStartDate: start,
            selectedEndDate: end,
          };
        },
        replace: true,
      });
    };

    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [navigate, selectedDateMode]);

  return <App />;
}
