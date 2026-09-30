import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { Project, CreateProjectPayload, UpdateProjectPayload } from "../utils/types";
import {
  fetchProjectListRequest,
  createProjectRequest,
  updateProjectRequest,
  deleteProjectRequest,
} from "../api/userApi";

export function useProject() {
  const { t } = useI18n();
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
        title: t("project.toast.createFailed"),
        description: typeof err === "string" ? err : t("project.toast.serverError"),
        icon: "i-material-symbols:error-circle-rounded-outline-sharp",
        color: "error",
      });
      return null;
    }
    toast.add({
      title: t("project.toast.createSuccess"),
      description: t("project.toast.created", { name: data?.name }),
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
        title: t("project.toast.updateFailed"),
        description: typeof err === "string" ? err : t("project.toast.serverError"),
        icon: "i-material-symbols:error-circle-rounded-outline-sharp",
        color: "error",
      });
      return null;
    }
    toast.add({
      title: t("project.toast.updateSuccess"),
      description: t("project.toast.updated", { name: data?.name }),
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
        title: t("project.toast.deleteFailed"),
        description: typeof err === "string" ? err : t("project.toast.serverError"),
        icon: "i-material-symbols:error-circle-rounded-outline-sharp",
        color: "error",
      });
      return false;
    }
    toast.add({
      title: t("project.toast.deleteSuccess"),
      description: t("project.toast.deleted"),
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
