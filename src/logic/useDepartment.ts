import { onMounted, ref } from "vue";
import type { Department } from "../utils/types";
import {
  fetchDepartmentListRequest,
  fetchDepartmentTreeRequest,
  createDepartmentRequest,
  updateDepartmentRequest,
  deleteDepartmentRequest,
} from "../api/userApi";

export function useDepartment() {
  const departmentList = ref<Department[]>([]);
  const departmentTree = ref<Department[]>([]);
  const loading = ref(true);

  const toast = useToast();

  async function fetchDepartments() {
    loading.value = true;
    const [list, tree] = await Promise.all([
      fetchDepartmentListRequest(),
      fetchDepartmentTreeRequest(),
    ]);
    if (list) departmentList.value = list;
    if (tree) departmentTree.value = tree as Department[];
    loading.value = false;
  }

  async function createDepartment(payload: Partial<Department>) {
    const { err, data } = await createDepartmentRequest(payload);
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
      description: `部门「${data?.name}」已创建`,
      icon: "i-material-symbols:check-circle-outline",
      color: "success",
    });
    await fetchDepartments();
    return data;
  }

  async function updateDepartment(payload: Partial<Department>) {
    const { err, data } = await updateDepartmentRequest(payload);
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
      description: `部门「${data?.name}」已更新`,
      icon: "i-material-symbols:check-circle-outline",
      color: "success",
    });
    await fetchDepartments();
    return data;
  }

  async function deleteDepartment(id: string) {
    const err = await deleteDepartmentRequest(id);
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
      description: "部门及其子树已删除",
      icon: "i-material-symbols:check-circle-outline",
      color: "success",
    });
    await fetchDepartments();
    return true;
  }

  onMounted(fetchDepartments);

  return {
    departmentList,
    departmentTree,
    loading,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}
