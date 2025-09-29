import { useSelector, useDispatch } from "react-redux";
import Slice from "./reducer";
import config from "./config.json";

export const proxy = config.backend;
const useStore = (): useStoreTypes => {
  const G = useSelector((state: StoreType) => state);
  const dispatch = useDispatch();
  const update = (payload: { [key: string]: any }) =>
    dispatch(Slice.actions.update(payload));

  const call = async (
    url: string,
    params?: any,
    headerParams?: any
  ): Promise<ServerResponse | null> => {
    try {
      const result = await fetch(proxy + url, {
        method: "POST",
        headers: { "content-type": "application/json", ...headerParams },
        body: params ? JSON.stringify(params) : null,
      });
      if (result.status === 403) {
        update({ logined: false });
        return null;
      }
      return await result.json();
    } catch (error) {
      // showToast("error");
    }
    return null;
  };
  return { ...G, update, call };
};

export default useStore;
