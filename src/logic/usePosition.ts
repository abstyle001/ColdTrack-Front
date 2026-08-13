import { onMounted, ref } from "vue";
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
        title: "创建失败",
        description: typeof err === "string" ? err : "服务器错误",
        icon: "i-material-symbols:error-circle-rounded-outline-sharp",
        color: "error",
      });
      return null;
    }
    toast.add({
      title: "创建成功",
      description: `职位「${data?.name}」已创建`,
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
        title: "更新失败",
        description: typeof err === "string" ? err : "服务器错误",
        icon: "i-material-symbols:error-circle-rounded-outline-sharp",
        color: "error",
      });
      return null;
    }
    toast.add({
      title: "更新成功",
      description: `职位「${data?.name}」已更新`,
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
        title: "删除失败",
        description: typeof err === "string" ? err : "服务器错误",
        icon: "i-material-symbols:error-circle-rounded-outline-sharp",
        color: "error",
      });
      return false;
    }
    toast.add({
      title: "删除成功",
      description: "职位已删除",
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
