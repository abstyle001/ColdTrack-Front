import { onMounted, ref } from "vue";
import type { Task, User, Tag } from "../utils/types";
import type { AcceptableValue } from "@nuxt/ui";
import {
  fetchTaskPageRequest,
  fetchTaskCountRequest,
  deleteTaskBatchRequest,
  updateTaskStatusBatchRequest,
  fetchUserListRequest,
  fetchTagListRequest,
} from "../api/userApi";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useTask(tableRef: any, assigneeId?: string) {
  const taskList = ref<Task[]>([]);
  const originalTaskList = ref<Task[]>([]);
  const taskCount = ref<number>(0);
  const pageSize = ref<number>(10);
  const loading = ref<boolean>(true);
  const toast = useToast();
  const open = ref(false);

  const statusFilter = ref<string>("");
  const priorityFilter = ref<string>("");
  const tagFilter = ref<string>("");

  const userList = ref<User[]>([]);
  const tagList = ref<Tag[]>([]);

  async function fetchUsers() {
    const data = await fetchUserListRequest();
    if (data) userList.value = data;
  }

  async function fetchTags() {
    const data = await fetchTagListRequest();
    if (data) tagList.value = data;
  }

  async function fetchCount() {
    const data = await fetchTaskCountRequest(
      assigneeId || undefined,
      statusFilter.value || undefined,
      priorityFilter.value || undefined,
      tagFilter.value || undefined
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
      assigneeId || undefined,
      statusFilter.value || undefined,
      priorityFilter.value || undefined,
      tagFilter.value || undefined
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
    tagFilter.value = "";
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

  function getSelectedIds(): number[] | null {
    const selectedRows = tableRef.value?.tableApi.getSelectedRowModel().rows;
    if (selectedRows === undefined || selectedRows.length === 0) {
      toast.add({
        title: "提示",
        description: "请至少选择一条记录",
        icon: "i-material-symbols:error-circle-rounded-outline-sharp",
        color: "error",
      });
      return null;
    }

    const selectedIds: number[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectedRows.forEach((row: any) => {
      selectedIds.push(row.original.id);
    });
    return selectedIds;
  }

  async function deleteBatch() {
    const selectedIds = getSelectedIds();
    if (!selectedIds) return;

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
    originalTaskList.value = originalTaskList.value.filter(
      (t) => !selectedIds.includes(t.id)
    );
    tableRef.value?.tableApi.resetRowSelection();
  }

  async function batchUpdateStatus(status: string) {
    const selectedIds = getSelectedIds();
    if (!selectedIds) return;

    const result = await updateTaskStatusBatchRequest(selectedIds, status);
    if (result.err) {
      toast.add({
        title: "状态更新失败",
        description: result.err,
        icon: "i-material-symbols:error-circle-rounded-outline-sharp",
        color: "error",
      });
      return;
    }

    const updatedIds = new Set((result.data ?? []).map((t) => t.id));
    const nextStatus = status;
    taskList.value = taskList.value.map((task) =>
      updatedIds.has(task.id) ? { ...task, status: nextStatus as Task["status"] } : task
    );
    originalTaskList.value = originalTaskList.value.map((task) =>
      updatedIds.has(task.id) ? { ...task, status: nextStatus as Task["status"] } : task
    );

    toast.add({
      title: "状态更新成功",
      description: `已更新${updatedIds.size}条任务`,
      icon: "i-material-symbols:check-circle-outline",
      color: "success",
    });
    tableRef.value?.tableApi.resetRowSelection();
    await fetchCount();
  }

  onMounted(async () => {
    await fetchUsers();
    await fetchTags();
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
    tagFilter,
    userList,
    tagList,
    fetchTags,
    fetchCount,
    updatePage,
    fetchList,
    applyFilter,
    clearFilter,
    filter,
    deleteBatch,
    batchUpdateStatus,
  };
}
