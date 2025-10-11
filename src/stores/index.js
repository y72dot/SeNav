// Pinia
import useSetDataStore from "@/stores/setData";
import useSiteDataStore from "@/stores/siteData";
import useStatusDataStore from "@/stores/statusData";
import { useWindowManagerStore } from "@/stores/windowManager";

export const setStore = () => useSetDataStore();
export const siteStore = () => useSiteDataStore();
export const statusStore = () => useStatusDataStore();
export const windowManagerStore = () => useWindowManagerStore();
