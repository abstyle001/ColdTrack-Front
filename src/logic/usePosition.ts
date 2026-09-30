import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { Position } from "../utils/types";
import {
  fetchPositionPageRequest,
  fetchPositionCountRequest,
  createPositionRequest,
  updatePositionRequest,
  deletePositionRequest,
} from "../api/userApi";

export function usePosition() {
  const positionList = ref<Position[]>([]);
  const loading = ref(true);
  const page = ref(1);
  const pageSize = ref(10);
  const positionCount = ref(0);

  const toast = useToast();
  const { t } = useI18n();

  async function fetchPositions(pageNumber: number = 1) {
    loading.value = true;
    const [pageData, countData] = await Promise.all([
      fetchPositionPageRequest(pageNumber, pageSize.value),
      fetchPositionCountRequest(),
    ]);
    if (pageData) positionList.value = pageData;
    if (countData !== null) positionCount.value = countData;
    page.value = pageNumber;
    loading.value = false;
  }

  async function createPosition(payload: Partial<Position>) {
    const { err, data } = await createPositionRequest(payload);
    if (err) {
      toast.add({
        title: t("position.toast.createFailed"),
        description: typeof err === "string" ? err : t("api.serverError"),
        icon: "i-material-symbols:error-circle-rounded-outline-sharp",
        color: "error",
      });
      return null;
    }
    toast.add({
      title: t("position.toast.createSuccess"),
      description: t("position.toast.created", { name: data?.name }),
      icon: "i-material-symbols:check-circle-outline",
      color: "success",
    });
    await fetchPositions(page.value);
    return data;
  }

  async function updatePosition(payload: Partial<Position>) {
    const { err, data } = await updatePositionRequest(payload);
    if (err) {
      toast.add({
        title: t("position.toast.updateFailed"),
        description: typeof err === "string" ? err : t("api.serverError"),
        icon: "i-material-symbols:error-circle-rounded-outline-sharp",
        color: "error",
      });
      return null;
    }
    toast.add({
      title: t("position.toast.updateSuccess"),
      description: t("position.toast.updated", { name: data?.name }),
      icon: "i-material-symbols:check-circle-outline",
      color: "success",
    });
    await fetchPositions(page.value);
    return data;
  }

  async function deletePosition(id: number) {
    const err = await deletePositionRequest(id);
    if (err) {
      toast.add({
        title: t("position.toast.deleteFailed"),
        description: typeof err === "string" ? err : t("api.serverError"),
        icon: "i-material-symbols:error-circle-rounded-outline-sharp",
        color: "error",
      });
      return false;
    }
    toast.add({
      title: t("position.toast.deleteSuccess"),
      description: t("position.toast.deleted"),
      icon: "i-material-symbols:check-circle-outline",
      color: "success",
    });
    await fetchPositions(page.value);
    return true;
  }

  onMounted(fetchPositions);

  return {
    positionList,
    loading,
    page,
    pageSize,
    positionCount,
    fetchPositions,
    createPosition,
    updatePosition,
    deletePosition,
  };
}
