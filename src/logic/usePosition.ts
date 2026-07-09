import { onMounted, ref } from "vue";
import type { Position } from "../utils/types";
import {
  fetchPositionListRequest,
  createPositionRequest,
  updatePositionRequest,
  deletePositionRequest,
} from "../api/userApi";

export function usePosition() {
  const positionList = ref<Position[]>([]);
  const loading = ref(true);

  const toast = useToast();

  async function fetchPositions() {
    loading.value = true;
    const data = await fetchPositionListRequest();
    if (data) positionList.value = data;
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
    await fetchPositions();
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
    await fetchPositions();
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
    await fetchPositions();
    return true;
  }

  onMounted(fetchPositions);

  return {
    positionList,
    loading,
    fetchPositions,
    createPosition,
    updatePosition,
    deletePosition,
  };
}
