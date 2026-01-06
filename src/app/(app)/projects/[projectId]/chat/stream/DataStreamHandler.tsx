"use client";

import { useEffect } from "react";
import { useDataStream } from "./DataStreamProvider";

export function DataStreamHandler() {
  const { dataStream, setDataStream } = useDataStream();

  useEffect(() => {
    if (!dataStream?.length) return;
    // Drain and ignore for now (placeholder for future artifact streaming)
    setDataStream([]);
  }, [dataStream, setDataStream]);

  return null;
}


