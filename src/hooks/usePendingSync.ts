import { useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import appApi from "../lib/appApi";
import Toast from "react-native-toast-message";
import {
  getPending as getResultPending,
  removePending as removeResultPending,
} from "../lib/resultsDraft";
import {
  getPending as getExamPending,
  removePending as removeExamPending,
} from "../lib/examDraft";

export function usePendingSync() {
  const syncing = useRef(false);

  const runSync = async () => {
    if (syncing.current) return;
    syncing.current = true;

    try {
      // Results
      const results = await getResultPending();
      for (const entry of results) {
        try {
          await appApi.post("/results", {
            class: entry.className,
            term: entry.term,
            session: entry.session,
            results: entry.results,
          });
          await removeResultPending(entry.id);
        } catch (err: any) {
          if (err?.response?.status >= 400 && err?.response?.status < 500) {
            await removeResultPending(entry.id);
          }
        }
      }

      // Exams
      const exams = await getExamPending();
      for (const entry of exams) {
        try {
          await appApi.post("/exams", {
            ...entry.data,
            submit: entry.submit,
          });
          await removeExamPending(entry.id);
        } catch (err: any) {
          if (err?.response?.status >= 400 && err?.response?.status < 500) {
            await removeExamPending(entry.id);
          }
        }
      }

      const stillPending =
        (await getResultPending()).length + (await getExamPending()).length;
      if (stillPending === 0 && results.length + exams.length > 0) {
        Toast.show({ type: "success", text1: "Pending uploads synced" });
      }
    } finally {
      syncing.current = false;
    }
  };

  useEffect(() => {
    runSync();
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) runSync();
    });
    return () => unsubscribe();
  }, []);
}
