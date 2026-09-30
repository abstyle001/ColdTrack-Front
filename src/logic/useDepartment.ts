import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { Department } from "../utils/types";
import {
  fetchDepartmentListRequest,
  fetchDepartmentPageRequest,
  fetchDepartmentCountRequest,
  createDepartmentRequest,
  updateDepartmentRequest,
  deleteDepartmentRequest,
} from "../api/userApi";

export function useDepartment() {
  // 当前页（用于表格构建树）
  const departmentList = ref<Department[]>([]);
  // 全部部门（用于新建/编辑的父部门下拉，不受分页影响）
  const allDepartments = ref<Department[]>([]);
  const loading = ref(true);
  const page = ref(1);
  const pageSize = ref(10);
  const departmentCount = ref(0);

  const toast = useToast();
  const { t } = useI18n();

  async function fetchDepartments(pageNumber: number = 1) {
    loading.value = true;
    const [pageData, countData, allData] = await Promise.all([
      fetchDepartmentPageRequest(pageNumber, pageSize.value),
      fetchDepartmentCountRequest(),
      fetchDepartmentListRequest(),
    ]);
    if (pageData) departmentList.value = pageData;
    if (countData !== null) departmentCount.value = countData;
    if (allData) allDepartments.value = allData;
    page.value = pageNumber;
    loading.value = false;
  }

  async function createDepartment(payload: Partial<Department>) {
    const { err, data } = await createDepartmentRequest(payload);
    if (err) {
      toast.add({
        title: t("department.toast.createFailed"),
        description: typeof err === "string" ? err : t("api.serverError"),
        icon: "i-material-symbols:error-circle-rounded-outline-sharp",
        color: "error",
      });
      return null;
    }
    toast.add({
      title: t("department.toast.createSuccess"),
      description: t("department.toast.created", { name: data?.name }),
      icon: "i-material-symbols:check-circle-outline",
      color: "success",
    });
    await fetchDepartments(page.value);
    return data;
  }

  async function updateDepartment(payload: Partial<Department>) {
    const { err, data } = await updateDepartmentRequest(payload);
    if (err) {
      toast.add({
        title: t("department.toast.updateFailed"),
        description: typeof err === "string" ? err : t("api.serverError"),
        icon: "i-material-symbols:error-circle-rounded-outline-sharp",
        color: "error",
      });
      return null;
    }
    toast.add({
      title: t("department.toast.updateSuccess"),
      description: t("department.toast.updated", { name: data?.name }),
      icon: "i-material-symbols:check-circle-outline",
      color: "success",
    });
    await fetchDepartments(page.value);
    return data;
  }

  async function deleteDepartment(id: string) {
    const err = await deleteDepartmentRequest(id);
    if (err) {
      toast.add({
        title: t("department.toast.deleteFailed"),
        description: typeof err === "string" ? err : t("api.serverError"),
        icon: "i-material-symbols:error-circle-rounded-outline-sharp",
        color: "error",
      });
      return false;
    }
    toast.add({
      title: t("department.toast.deleteSuccess"),
      description: t("department.toast.deleted"),
      icon: "i-material-symbols:check-circle-outline",
      color: "success",
    });
    await fetchDepartments(page.value);
    return true;
  }

  onMounted(fetchDepartments);

  return {
    departmentList,
    allDepartments,
    loading,
    page,
    pageSize,
    departmentCount,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}
