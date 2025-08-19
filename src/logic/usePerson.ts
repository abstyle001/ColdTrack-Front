import {
  onMounted,
  ref,
  type Ref,
  type ShallowRef,
  type ShallowUnwrapRef,
} from "vue";
import type { User } from "../utils/types";
import request from "../utils/request";
import { token } from "../utils/useStorage";
import { fetchUserPageRequest } from "../api/userApi";
import type { AcceptableValue } from "@nuxt/ui";
import { deleteUserBatchRequest } from "../api/userApi";
import type { Table } from "@tanstack/table-core";

export function usePerson(
  tableRef: Readonly<
    ShallowRef<ShallowUnwrapRef<{
      tableRef: Ref<HTMLTableElement | null, HTMLTableElement | null>;
      tableApi: Table<User>;
    }> | null>
  >
) {
  const userList = ref<User[]>([]);
  // 原始的用户列表数据，用于筛选后清空筛选条件
  const originalUserList = ref<User[]>([]);
  // 用户总数量
  const userCount = ref<number>(0);
  // 每页显示条目个数，默认为10
  const pageSize = ref<number>(10);
  const loading = ref<boolean>(true);

  const toast = useToast();
  // 批量删除确认框
  const open = ref(false);

  // 获取用户总数量
  async function fetchUserCount() {
    const [err, data] = await request<number>("/user/count", "GET", {
      token: token.value,
    });
    if (!err && data) {
      userCount.value = data;
    }
  }

  // 更新页码
  function updatePage(newPage: number) {
    fetchUserListPage(newPage);
  }

  // 根据页码获取用户列表，不传入默认为1
  async function fetchUserListPage(number: number = 1) {
    loading.value = true;
    const data = await fetchUserPageRequest(number, pageSize.value);
    if (data) {
      userList.value = data;
      originalUserList.value = data;
      loading.value = false;
    }
  }
  // 筛选用户列表
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

  // 批量删除
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
    // 被选中的用户ID列表
    const selectedIds: string[] = [];
    selectedRows.forEach((row) => {
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
    // 更新userList和originalUserList，使界面显示最新数据
    userList.value = userList.value.filter(
      (user) => !selectedIds.includes(user.id)
    );
    originalUserList.value = originalUserList.value.filter(
      (user) => !selectedIds.includes(user.id)
    );
    tableRef.value?.tableApi.resetRowSelection(); // 清空表格选中状态
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
