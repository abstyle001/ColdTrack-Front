import {
  onMounted,
  ref,
} from "vue";
import type { User } from "../utils/types";
import request from "../utils/request";
import { token } from "../utils/useStorage";
import { fetchUserPageRequest } from "../api/userApi";
import type { AcceptableValue } from "@nuxt/ui";
import { deleteUserBatchRequest } from "../api/userApi";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function usePerson(tableRef: any) {
  const userList = ref<User[]>([]);
  const originalUserList = ref<User[]>([]);
  const userCount = ref<number>(0);
  const pageSize = ref<number>(10);
  const loading = ref<boolean>(true);

  const toast = useToast();
  const open = ref(false);

  async function fetchUserCount() {
    const [err, data] = await request<number>("/user/count", "GET", {
      token: token.value,
    });
    if (!err && data) {
      userCount.value = data;
    }
  }

  function updatePage(newPage: number) {
    fetchUserListPage(newPage);
  }

  async function fetchUserListPage(number: number = 1) {
    loading.value = true;
    const data = await fetchUserPageRequest(number, pageSize.value);
    if (data) {
      userList.value = data;
      originalUserList.value = data;
      loading.value = false;
    }
  }

  function filter(payload: AcceptableValue) {
    if (!payload) {
      userList.value = originalUserList.value;
      return;
    }
    userList.value = originalUserList.value.filter(
      (user) =>
        user.nickName.includes(payload as string) ||
        user.email.includes(payload as string)
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
    const selectedIds: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectedRows.forEach((row: any) => {
      selectedIds.push(row.original.id);
    });
    const err = await deleteUserBatchRequest(selectedIds);
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
    userList.value = userList.value.filter(
      (user) => !selectedIds.includes(user.id)
    );
    originalUserList.value = originalUserList.value.filter(
      (user) => !selectedIds.includes(user.id)
    );
    tableRef.value?.tableApi.resetRowSelection();
  }

  onMounted(async () => {
    fetchUserCount();
    fetchUserListPage();
  });

  return {
    userList,
    originalUserList,
    loading,
    userCount,
    open,
    fetchUserCount,
    updatePage,
    fetchUserListPage,
    filter,
    deleteBatch,
  };
}