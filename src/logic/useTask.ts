import { onMounted, ref } from "vue";
import type { Task, User } from "../utils/types";
import type { AcceptableValue } from "@nuxt/ui";
import {
  fetchTaskPageRequest,
  fetchTaskCountRequest,
  deleteTaskBatchRequest,
  fetchUserListRequest,
} from "../api/userApi";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useTask(tableRef: any) {
  const taskList = ref<Task[]>([]);
  const originalTaskList = ref<Task[]>([]);
  const taskCount = ref<number>(0);
  const pageSize = ref<number>(10);
  const loading = ref<boolean>(true);
  const toast = useToast();
  const open = ref(false);

  const statusFilter = ref<string>("");
  const priorityFilter = ref<string>("");

  const userList = ref<User[]>([]);

  async function fetchUsers() {
    const data = await fetchUserListRequest();
    if (data) userList.value = data;
  }

  async function fetchCount() {
    const data = await fetchTaskCountRequest(
      statusFilter.value || undefined,
      priorityFilter.value || undefined
    );
    if (data !== null) {
      taskCount.value = data;
    }
  }

  function updatePage(newPage: number) {
    fetchList(newPage);
  }

  async function fetchList(number: number = 1) {
    loading.value = true;
    const data = await fetchTaskPageRequest(
      number,
      pageSize.value,
      statusFilter.value || undefined,
      priorityFilter.value || undefined
    );
    if (data) {
      taskList.value = data;
      originalTaskList.value = data;
    }
    loading.value = false;
  }

  async function applyFilter() {
    await fetchCount();
    await fetchList(1);
  }

  async function clearFilter() {
    statusFilter.value = "";
    priorityFilter.value = "";
    await fetchCount();
    await fetchList(1);
  }

  function filter(payload: AcceptableValue) {
    if (!payload) {
      taskList.value = originalTaskList.value;
      return;
    }
    const keyword = (payload as string).toLowerCase();
    taskList.value = originalTaskList.value.filter(
      (t) =>
        t.title.toLowerCase().includes(keyword) ||
        (t.description && t.description.toLowerCase().includes(keyword))
    );
  }

  async function deleteBatch() {
    const selectedRows = tableRef.value?.tableApi.getSelectedRowModel().rows;
    if (selectedRows === undefined || selectedRows.length === 0) {
      toast.add({
        title: "提示",
        description: "请至少选择一条记录",
        icon: "i-material-symbols:error-circle-rounded-outline-sharp",
        color: "error",
      });
      return;
    }
    const selectedIds: number[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectedRows.forEach((row: any) => {
      selectedIds.push(row.original.id);
    });
    const err = await deleteTaskBatchRequest(selectedIds);
    if (err) {
      toast.add({
        title: "删除失败",
        description: err,
        icon: "i-material-symbols:error-circle-rounded-outline-sharp",
        color: "error",
      });
      return;
    }
    toast.add({
      title: "删除成功",
      description: `成功删除${selectedIds.length}条记录`,
      icon: "i-material-symbols:check-circle-outline",
      color: "success",
    });
    open.value = false;
    taskList.value = taskList.value.filter((t) => !selectedIds.includes(t.id));
    originalTaskList.value = originalTaskList.value.filter((t) => !selectedIds.includes(t.id));
    tableRef.value?.tableApi.resetRowSelection();
  }

  onMounted(async () => {
    await fetchUsers();
    await fetchCount();
    await fetchList();
  });

  return {
    taskList,
    originalTaskList,
    loading,
    taskCount,
    open,
    statusFilter,
    priorityFilter,
    userList,
    fetchCount,
    updatePage,
    fetchList,
    applyFilter,
    clearFilter,
    filter,
    deleteBatch,
  };
}