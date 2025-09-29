import React from "react";
import { useReducer, useMemo } from "react";
import { createContext, useContext } from "react";

const INIT_STATE: InitStateObject = {
  chartWidth: window.innerHeight - 350,
};

const GlobalContext = createContext<any>({});
const reducer = (state: InitStateObject, { type, payload }: ReducerObject) => {
  return { ...state, [type]: payload };
};

function useGlobalContext() {
  return useContext(GlobalContext);
}

const Provider = ({ children }: any) => {
  const [state, dispatch] = useReducer(reducer, INIT_STATE);

  return (
    <GlobalContext.Provider
      value={useMemo(() => [state, { dispatch }], [state])}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export { useGlobalContext, Provider };
