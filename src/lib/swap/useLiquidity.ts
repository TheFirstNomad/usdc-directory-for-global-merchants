import { useState, useCallback } from "react";

export function useLiquidity() {
  const [state, setState] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const addLiquidity = useCallback(async () => {
    setState("adding");
    try {
      // Placeholder - just to make the page load
      console.log("Add liquidity called");
      setState("success");
    } catch (err) {
      setState("error");
      setErrorMessage("Liquidity failed");
    }
  }, []);

  return {
    state,
    errorMessage,
    addLiquidity,
  };
}
