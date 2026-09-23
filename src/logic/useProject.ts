import { computed, onMounted, ref } from "vue";
import type { Project, CreateProjectPayload, UpdateProjectPayload } from "../utils/types";
import {
  fetchProjectListRequest,
  createProjectRequest,
  updateProjectRequest,
  deleteProjectRequest,
} from "../api/userApi";

export function useProject() {
  const projectList = ref<Project[]>([]);
  const loading = ref(true);
  const keyword = ref("");
  const statusFilter = ref("");

  const toast = useToast();

  // 项目量级小，关键字在客户端筛选；状态筛选走后端接口
  const filteredProjects = computed(() => {
    const kw = keyword.value.trim().toLowerCase();
    if (!kw) return projectList.value;
    return projectList.value.filter(
      (p) =>
        p.name.toLowerCase().includes(kw) ||
        (p.description && p.description.toLowerCase().includes(kw))
    );
  });

  async function fetchProjects() {
    loading.value = true;
    const data = await fetchProjectListRequest({
      status: statusFilter.value || undefined,
    });
    if (data) projectList.value = data;
    loading.value = false;
  }

  async function createProject(payload: CreateProjectPayload) {
    const { err, data } = await createProjectRequest(payload);
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
      description: `项目「${data?.name}」已创建`,
      icon: "i-material-symbols:check-circle-outline",
      color: "success",
    });
    await fetchProjects();
    return data;
  }

  async function updateProject(id: number, payload: UpdateProjectPayload) {
    const { err, data } = await updateProjectRequest(id, payload);
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
      description: `项目「${data?.name}」已更新`,
      icon: "i-material-symbols:check-circle-outline",
      color: "success",
    });
    await fetchProjects();
    return data;
  }

  async function deleteProject(id: number) {
    const err = await deleteProjectRequest(id);
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
      description: "项目已删除",
      icon: "i-material-symbols:check-circle-outline",
      color: "success",
    });
    await fetchProjects();
    return true;
  }

  onMounted(fetchProjects);

  return {
    projectList,
    filteredProjects,
    loading,
    keyword,
    statusFilter,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}
